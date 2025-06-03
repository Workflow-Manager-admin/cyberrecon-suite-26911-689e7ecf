import React, { useEffect, useRef } from "react";

/**
 * Premium-styled GraphDisplay for recon results/data.
 * Features:
 * - Displays interactive bar/column (for count/group) or network style (if data provided) charts
 * - Modern look, dark theme, responsive
 * - Uses Chart.js if present, else fallback to SVG with props
 * 
 * Props:
 *  - type: 'bar' | 'network'
 *  - data: chart data model
 *  - options: chart options
 *  - style: container style overrides
 */
function GraphDisplay({ type = "bar", data = {}, options = {}, style = {}, ...rest }) {
  const canvasRef = useRef();
  useEffect(() => {
    if (type === "bar" && window.Chart) {
      // Chart.js available
      const ctx = canvasRef.current.getContext("2d");
      const chartObj = new window.Chart(ctx, {
        type: "bar",
        data,
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: "#ffad42", font: { size: 15 } } },
            tooltip: { enabled: true },
            title: {
              display: !!options?.title,
              text: options?.title,
              color: "#ffad42"
            }
          },
          scales: {
            x: { ticks: { color: "#fafbfc" }, grid: { color: "#22242c" } },
            y: { ticks: { color: "#fafbfc" }, grid: { color: "#22242c" }, beginAtZero: true }
          },
          backgroundColor: "rgba(255,168,64,0.25)",
          ...options
        }
      });
      return () => {
        chartObj.destroy();
      };
    }
    // No Chart.js - fallback handled in render
  }, [type, data, options]);

  // Fallback SVG bar chart
  function renderFallbackBarChart() {
    const dlabels = data.labels || [];
    const dvals = (data.datasets?.[0]?.data || []);
    const h = 172, w = Math.max(320, 52 * dlabels.length), barW = 34;
    const max = Math.max(...dvals, 1);
    return (
      <svg width={w} height={h} style={{ background: "#23252a", borderRadius: 10, padding: 8 }}>
        {dvals.map((v, i) => (
          <g key={i}>
            <rect
              x={22 + i * (barW + 16)}
              y={h - 12 - (v / max) * (h - 46)}
              width={barW}
              height={(v / max) * (h - 46)}
              fill="url(#barGrad)"
              rx={7}
            />
            <text x={38 + i * (barW + 16)} y={h - 16} textAnchor="middle"
              fontSize="12" fill="#c7cbce">{dlabels[i]}</text>
            <text x={38 + i * (barW + 16)} y={h - 24 - (v / max) * (h - 46)}
              textAnchor="middle"
              fontSize="13"
              fill="#ffad42"
              fontWeight={600}
              >{v}</text>
          </g>
        ))}
        <defs>
          <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff9800" />
            <stop offset="99%" stopColor="#23272e" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (type === "network") {
    // Simple SVG node graph for fallback demo
    const nodes = data?.nodes || [];
    const links = data?.links || [];
    const R = 22, H = 180, W = Math.max(nodes.length * 65 + 30, 360);
    // Arrange nodes in a circle
    const centerX = W / 2, centerY = H / 2, r = Math.min(centerX, centerY) - 32;
    const n = nodes.length;
    const nodeLoc = i => [
      centerX + r * Math.cos(2 * Math.PI * i / n - Math.PI / 2),
      centerY + r * Math.sin(2 * Math.PI * i / n - Math.PI / 2)
    ];
    // Map node id to coord
    const coords = nodes.map((n, idx) => nodeLoc(idx));
    return (
      <svg width={W} height={H} style={{ background: "#22242a", borderRadius: 13, boxShadow: "0 2px 16px 0 #181b1f" }}>
        {links.map((l, idx) => {
          const a = coords[nodes.findIndex(nd => nd.id === l.source)];
          const b = coords[nodes.findIndex(nd => nd.id === l.target)];
          if (!a || !b) return null;
          return <line key={idx} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
            stroke="#ff9800" strokeWidth={2} opacity={0.33} />;
        })}
        {nodes.map((node, idx) => {
          const [x, y] = coords[idx];
          return (
            <g key={node.id}>
              <circle cx={x} cy={y} r={R}
                fill="url(#nodeGrad)" stroke="#e77205" strokeWidth={2} />
              <text x={x} y={y + 7} textAnchor="middle"
                fontSize="13.5" fontWeight={700} fill="#fafbfc">
                {node.label}
              </text>
            </g>
          );
        })}
        <defs>
          <radialGradient id="nodeGrad" r="75%">
            <stop offset="10%" stopColor="#ff9800" />
            <stop offset="90%" stopColor="#191b22" />
          </radialGradient>
        </defs>
      </svg>
    );
  }

  // Render bar chart (default)
  return (
    <div
      style={{
        borderRadius: 12,
        background: "var(--secondary)",
        padding: 20,
        boxShadow: "0 2.5px 12px rgba(0,0,0,0.11)",
        ...style
      }}
      {...rest}
    >
      <div style={{ fontWeight: 600, color: "var(--base-accent)", fontSize: 16, marginBottom: 7 }}>
        {options.title || "Results Overview"}
      </div>
      {window.Chart
        ? (
          <canvas
            ref={canvasRef}
            width={Math.max(360, (data?.labels || []).length * 54)}
            height={180}
            aria-label="Result Graph"
          />
        )
        : renderFallbackBarChart()
      }
      <div style={{ fontSize: 11.7, color: "var(--text-tertiary)", marginTop: 4 }}>
        {window.Chart
          ? "Interactive (Chart.js)"
          : "Static SVG fallback (install Chart.js for full interactivity)"}
      </div>
    </div>
  );
}

export default GraphDisplay;
