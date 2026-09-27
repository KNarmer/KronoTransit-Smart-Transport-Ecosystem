/**
 * CarrierMap.jsx
 * ---------------------------------------------------------------------
 * Minimal, dependency-free carrier position visualization: projects
 * lat/lng onto a simple SVG canvas scaled to the fleet's bounding box.
 * This intentionally avoids pulling in Mapbox GL JS (which needs an API
 * token and a build-time asset pipeline) so the dashboard scaffold runs
 * with zero external config out of the box.
 *
 * Swap this component for a real Mapbox GL / Leaflet layer per the
 * README's "Live WebSocket / gRPC Streaming" section once a basemap
 * provider and API key are configured for the deployment.
 */

const WIDTH = 480;
const HEIGHT = 320;
const PADDING = 24;

function project(carriers) {
  if (carriers.length === 0) return [];

  const lats = carriers.map((c) => c.latitude);
  const lngs = carriers.map((c) => c.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  return carriers.map((c) => ({
    ...c,
    x: PADDING + ((c.longitude - minLng) / lngRange) * (WIDTH - 2 * PADDING),
    // invert y so north is up
    y: HEIGHT - PADDING - ((c.latitude - minLat) / latRange) * (HEIGHT - 2 * PADDING),
  }));
}

function dotColor(status) {
  if (status === "VIABLE" || status === "OK") return "#5fb0a8";
  if (status === "WARNING" || status === "ATTENTION_NEEDED") return "#d9a441";
  if (status === "BREACHED") return "#d9615f";
  return "#7f8ea3";
}

export default function CarrierMap({ carriers }) {
  const points = project(carriers);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label="Live map of ChronoVerity carrier positions"
      style={{ background: "#0f1418", borderRadius: 8 }}
    >
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="none" stroke="#2a3441" />
      {points.map((p) => (
        <g key={p.carrier_id} transform={`translate(${p.x}, ${p.y})`}>
          <circle r={7} fill={dotColor(p.status)} opacity={0.25} />
          <circle r={4} fill={dotColor(p.status)} />
          <text x={8} y={4} fontSize={11} fill="#c7d0da">
            {p.carrier_id}
          </text>
        </g>
      ))}
      {points.length === 0 && (
        <text x={WIDTH / 2} y={HEIGHT / 2} textAnchor="middle" fontSize={13} fill="#7f8ea3">
          Waiting for fleet telemetry…
        </text>
      )}
    </svg>
  );
}
