/**
 * Hand-rolled inline SVG bar chart — no recharts/chart library (see
 * PROJECT_STATE.md stack pivot). Enough for the dashboard/report bar charts
 * this app needs; not meant to be a general-purpose charting engine.
 */
export default function BarChart({ data, height = 200, formatValue = (v) => v, color = 'var(--color-primary)' }) {
  if (!data || data.length === 0) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>No data yet</div>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, overflow: 'visible' }}>
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (height - 30);
          const x = i * barWidth + barWidth * 0.2;
          const width = barWidth * 0.6;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={height - 24 - barHeight}
                width={width}
                height={barHeight}
                rx="1.5"
                fill={color}
                opacity="0.9"
              >
                <title>{`${d.label}: ${formatValue(d.value)}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', marginTop: 6 }}>
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1, textAlign: 'center', fontSize: 10.5, color: 'var(--color-text-muted)' }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
