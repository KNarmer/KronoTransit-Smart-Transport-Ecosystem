"""
gnn_route_model.py
-------------------------------------------------------------------------
Fleet-scale route degradation analysis, per the README's "Potential for
Computational Scaling" section. Not part of the Conrad Challenge MVP —
this is the Phase-III cloud analytics layer that only becomes meaningful
once there are enough carriers in the field to generate route-level
statistics.

Models the hospital's transport network as a graph:
  - Nodes: hospital suites, collection centers, elevator banks, central
    accessioning (physical waypoints a carrier passes through).
  - Edges: transport paths (courier vans, walking porters, pneumatic tube
    lines), weighted/labeled with aggregated degradation statistics from
    every carrier that has traversed them.

Uses a small Graph Attention Network (GAT) over node/edge features to
predict a "route risk score" per edge, so operations staff can be
warned ("Pneumatic Tube Branch 4 generates excessive kinetic impact
spikes >12G") before routing a new time-critical specimen through it.

This module is written to run standalone against a CSV export of
historical transit records; wiring it to a live feed is left to
cloud-platform/api's ingestion pipeline.
"""

from dataclasses import dataclass
from typing import Dict, List, Tuple

import networkx as nx
import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from torch_geometric.data import Data
from torch_geometric.nn import GATConv


@dataclass
class TransitRecord:
    origin_node: str
    destination_node: str
    transport_mode: str  # "pneumatic_tube" | "courier_van" | "porter_walk"
    max_g_force: float
    max_temp_excursion_c: float
    duration_s: float
    final_pqi: float


def build_transit_graph(records: List[TransitRecord]) -> nx.DiGraph:
    """Aggregates individual carrier transit records into a directed
    graph with per-edge statistics, the input the GNN model trains on."""
    graph = nx.DiGraph()

    edge_records: Dict[Tuple[str, str], List[TransitRecord]] = {}
    for r in records:
        graph.add_node(r.origin_node)
        graph.add_node(r.destination_node)
        edge_records.setdefault((r.origin_node, r.destination_node), []).append(r)

    for (origin, dest), recs in edge_records.items():
        graph.add_edge(
            origin, dest,
            transit_count=len(recs),
            mean_max_g=float(np.mean([r.max_g_force for r in recs])),
            p95_max_g=float(np.percentile([r.max_g_force for r in recs], 95)),
            mean_temp_excursion=float(np.mean([r.max_temp_excursion_c for r in recs])),
            mean_pqi=float(np.mean([r.final_pqi for r in recs])),
            dominant_mode=max(set(r.transport_mode for r in recs),
                               key=lambda m: sum(1 for r in recs if r.transport_mode == m)),
        )

    return graph


def graph_to_pyg_data(graph: nx.DiGraph) -> Tuple[Data, List[str]]:
    """Converts the aggregated NetworkX graph into a PyTorch Geometric
    Data object. Edge features are the per-edge statistics computed in
    build_transit_graph(); node features are currently just a degree
    encoding (a placeholder until richer node metadata — suite type,
    floor, distance to accessioning — is available from hospital
    facilities data)."""
    nodes = list(graph.nodes())
    node_index = {n: i for i, n in enumerate(nodes)}

    edge_index = []
    edge_attr = []
    for u, v, attrs in graph.edges(data=True):
        edge_index.append([node_index[u], node_index[v]])
        edge_attr.append([
            attrs["mean_max_g"],
            attrs["p95_max_g"],
            attrs["mean_temp_excursion"],
            attrs["transit_count"],
        ])

    node_features = [[graph.degree(n)] for n in nodes]

    data = Data(
        x=torch.tensor(node_features, dtype=torch.float),
        edge_index=torch.tensor(edge_index, dtype=torch.long).t().contiguous(),
        edge_attr=torch.tensor(edge_attr, dtype=torch.float),
    )
    return data, nodes


class RouteRiskGAT(torch.nn.Module):
    """Small 2-layer Graph Attention Network predicting a per-node risk
    embedding, later combined with edge statistics to flag high-risk
    routes. Deliberately small — this runs on a modest cloud instance,
    not on-device."""

    def __init__(self, in_channels: int = 1, hidden_channels: int = 16, out_channels: int = 8):
        super().__init__()
        self.conv1 = GATConv(in_channels, hidden_channels, heads=2, concat=True)
        self.conv2 = GATConv(hidden_channels * 2, out_channels, heads=1, concat=False)

    def forward(self, x, edge_index):
        x = F.elu(self.conv1(x, edge_index))
        x = self.conv2(x, edge_index)
        return x


def flag_high_risk_edges(graph: nx.DiGraph, g_force_threshold: float = 10.0,
                          temp_threshold_c: float = 5.0) -> List[str]:
    """Rule-based pre-filter that runs even before the GNN is trained,
    so operations staff get useful alerts from day one of fleet
    deployment rather than waiting for enough data to train the model."""
    flags = []
    for u, v, attrs in graph.edges(data=True):
        if attrs["p95_max_g"] > g_force_threshold:
            flags.append(
                f"{u} -> {v} ({attrs['dominant_mode']}): p95 impact "
                f"{attrs['p95_max_g']:.1f}G exceeds {g_force_threshold}G threshold "
                f"across {attrs['transit_count']} transits."
            )
        if attrs["mean_temp_excursion"] > temp_threshold_c:
            flags.append(
                f"{u} -> {v} ({attrs['dominant_mode']}): mean thermal excursion "
                f"{attrs['mean_temp_excursion']:.1f}C exceeds {temp_threshold_c}C threshold."
            )
    return flags


if __name__ == "__main__":
    # Minimal smoke test with synthetic records, so this module is
    # exercisable without a real fleet telemetry export.
    synthetic_records = [
        TransitRecord("OR-3", "PneumaticHub-B", "pneumatic_tube", 12.4, 1.2, 45, 0.81),
        TransitRecord("OR-3", "PneumaticHub-B", "pneumatic_tube", 14.1, 0.9, 40, 0.76),
        TransitRecord("Clinic-A", "CentralLab", "courier_van", 2.1, 0.4, 900, 0.95),
    ]
    g = build_transit_graph(synthetic_records)
    print("Rule-based flags:")
    for f in flag_high_risk_edges(g):
        print(" -", f)

    data, nodes = graph_to_pyg_data(g)
    model = RouteRiskGAT(in_channels=data.x.shape[1])
    embeddings = model(data.x, data.edge_index)
    print(f"\nComputed risk embeddings for {len(nodes)} nodes, shape {tuple(embeddings.shape)}")
