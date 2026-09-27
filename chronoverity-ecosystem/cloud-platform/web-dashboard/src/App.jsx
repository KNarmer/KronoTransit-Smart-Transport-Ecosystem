/**
 * App.jsx — ChronoVerity clinician/courier live dashboard shell
 * ---------------------------------------------------------------------
 * Connects to cloud-platform/api's /ws/fleet/{role} WebSocket stream and
 * renders the live fleet table + PQI trend. Role-based views (courier vs.
 * pathologist) are requested by URL param (?role=pathologist), matching
 * the RBAC split implemented server-side in cloud-platform/api/main.py.
 *
 * Kept dependency-light (React + recharts only) so the module is easy to
 * fold into a larger Next.js app later without dragging in a component
 * library the rest of the hospital-facing product may not want.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import CarrierMap from "./components/CarrierMap.jsx";
import "./styles.css";

const API_WS_BASE = import.meta.env.VITE_CV_API_WS_BASE || "ws://localhost:8080";

function statusTone(status) {
  switch (status) {
    case "VIABLE":
      return "tone-viable";
    case "WARNING":
    case "ATTENTION_NEEDED":
      return "tone-warning";
    case "BREACHED":
      return "tone-breached";
    default:
      return "tone-unknown";
  }
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const role = params.get("role") === "pathologist" ? "pathologist" : "courier";

  const [fleet, setFleet] = useState([]);
  const [pqiHistory, setPqiHistory] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket(`${API_WS_BASE}/ws/fleet/${role}`);
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      setFleet(payload.fleet);

      if (role === "pathologist") {
        setPqiHistory((prev) => {
          const meanPqi =
            payload.fleet.reduce((sum, c) => sum + (c.running_pqi ?? 1), 0) /
            Math.max(payload.fleet.length, 1);
          const next = [...prev, { time: new Date(payload.timestamp * 1000).toLocaleTimeString(), meanPqi }];
          return next.slice(-30); // keep a rolling 5-minute window at 10s cadence
        });
      }
    };

    return () => socket.close();
  }, [role]);

  const attentionCount = useMemo(
    () => fleet.filter((c) => c.status !== "VIABLE" && c.status !== "OK").length,
    [fleet]
  );

  return (
    <div className="cv-app">
      <header className="cv-header">
        <div>
          <h1>ChronoVerity Fleet</h1>
          <p className="cv-subtitle">
            {role === "pathologist" ? "Pathologist view — full PQI detail" : "Courier view — routing & alerts only"}
          </p>
        </div>
        <div className={`cv-connection-pill ${connected ? "connected" : "disconnected"}`}>
          {connected ? "Live" : "Reconnecting…"}
        </div>
      </header>

      <section className="cv-summary-row">
        <SummaryCard label="Carriers tracked" value={fleet.length} />
        <SummaryCard label="Needs attention" value={attentionCount} emphasize={attentionCount > 0} />
      </section>

      <section className="cv-main-grid">
        <div className="cv-panel">
          <h2>Fleet map</h2>
          <CarrierMap carriers={fleet} />
        </div>

        <div className="cv-panel">
          <h2>Carrier status</h2>
          <table className="cv-table">
            <thead>
              <tr>
                <th>Carrier</th>
                <th>Battery</th>
                {role === "pathologist" && <th>PQI</th>}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fleet.map((c) => (
                <tr key={c.carrier_id}>
                  <td>{c.carrier_id}</td>
                  <td>{Math.round(c.battery_pct)}%</td>
                  {role === "pathologist" && <td>{c.running_pqi?.toFixed(2)}</td>}
                  <td>
                    <span className={`cv-status-badge ${statusTone(c.status)}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {role === "pathologist" && (
          <div className="cv-panel cv-panel-wide">
            <h2>Fleet-mean PQI, last 5 minutes</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={pqiHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3441" />
                <XAxis dataKey="time" stroke="#7f8ea3" fontSize={12} />
                <YAxis domain={[0, 1]} stroke="#7f8ea3" fontSize={12} />
                <Tooltip contentStyle={{ background: "#141a22", border: "1px solid #2a3441" }} />
                <Line type="monotone" dataKey="meanPqi" stroke="#5fb0a8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, emphasize }) {
  return (
    <div className={`cv-summary-card ${emphasize ? "emphasize" : ""}`}>
      <span className="cv-summary-value">{value}</span>
      <span className="cv-summary-label">{label}</span>
    </div>
  );
}
