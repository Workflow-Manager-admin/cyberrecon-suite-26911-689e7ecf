import React, { useMemo, useState } from "react";

// PUBLIC_INTERFACE
/**
 * Premium TableDisplay component for results/history.
 * Features:
 * - Sortable and filterable columns, responsive design, dark theme
 * - Emoji/status column support
 * - CSV and JSON export hooks
 * - Styled for a modern security dashboard look
 */
function TableDisplay({
  data,                 // Array of objects
  columns,              // [{label, field, sortable, emojiMap?}]
  initialSortField,
  initialSortDir = "asc",
  filterable = true,
  onExportCSV,          // export callback (optional)
  onExportJSON,         // export callback (optional)
  size = "lg",          // "sm"|"md"|"lg"
  style = {},
  ...rest
}) {
  // State: sorting/filtering
  const [sortField, setSortField] = useState(initialSortField || (columns[0]?.field || ""));
  const [sortDir, setSortDir] = useState(initialSortDir);
  const [filters, setFilters] = useState({});

  // Filtering logic
  const filteredData = useMemo(() => {
    if (!filterable || !Object.keys(filters).length) return data;
    return data.filter(row =>
      Object.entries(filters).every(([k, val]) =>
        String(row[k] ?? "")
          .toLowerCase()
          .includes((val || "").toLowerCase())
      )
    );
  }, [data, filters, filterable]);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    const copy = [...filteredData];
    copy.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      } else if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return 0;
    });
    return copy;
  }, [filteredData, sortField, sortDir]);

  // CSV Export
  // PUBLIC_INTERFACE
  function handleExportCSV() {
    if (!onExportCSV) {
      // Basic CSV exporter
      const rows = [
        columns.map(col => `"${col.label}"`).join(","),
        ...sortedData.map(r =>
          columns.map(col => `"${(r[col.field] ?? "").replace(/"/g, '""')}"`).join(",")
        ),
      ];
      const csvContent = rows.join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "recon_results.csv");
    } else {
      onExportCSV(sortedData);
    }
  }
  // JSON Export
  // PUBLIC_INTERFACE
  function handleExportJSON() {
    if (!onExportJSON) {
      // Basic JSON exporter
      const blob = new Blob([JSON.stringify(sortedData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "recon_results.json");
    } else {
      onExportJSON(sortedData);
    }
  }

  function triggerDownload(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 222);
  }

  // Render
  return (
    <div
      tabIndex={0}
      style={{
        overflowX: "auto",
        borderRadius: 12,
        background: "var(--secondary)",
        boxShadow: "0 4px 32px -8px rgba(0,0,0,0.10)",
        ...style
      }}
      {...rest}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 18 }}>
        {filterable && (
          <div style={{ flex: 1, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {columns
              .filter(col => col.filter !== false)
              .map(col => (
                <input
                  key={col.field}
                  type="text"
                  aria-label={`Filter ${col.label}`}
                  placeholder={`Filter ${col.label}`}
                  style={{
                    fontSize: 13.7,
                    background: "var(--base-dark)",
                    color: "var(--text-color)",
                    border: "1.1px solid var(--border-color)",
                    borderRadius: 6,
                    padding: "4.5px 11px",
                    marginBottom: 2,
                    minWidth: 96
                  }}
                  value={filters[col.field] || ""}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      [col.field]: e.target.value
                    }))
                  }
                />
              ))}
          </div>
        )}
        <div style={{display:"flex",gap:7}}>
          <button
            className="btn"
            aria-label="Export as CSV"
            onClick={handleExportCSV}
            style={{
              background: "linear-gradient(90deg,#ff9800,#ffad42)",
              color: "#23272e",
              fontWeight: 700,
              fontSize: 15.5
            }}
          >📤 CSV</button>
          <button
            className="btn"
            aria-label="Export as JSON"
            onClick={handleExportJSON}
            style={{
              background: "linear-gradient(90deg,#6ce9ff,#8d76ff)",
              color: "#191b22",
              fontWeight: 700,
              fontSize: 15.5
            }}
          >🗎 JSON</button>
        </div>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 420,
          fontSize: size === "sm" ? 13.2 : size === "md" ? 15 : 16.2,
          background: "transparent",
        }}
      >
        <thead>
          <tr style={{ color: "var(--base-accent)", borderBottom: "1.45px solid var(--border-color)" }}>
            {columns.map((col, i) => (
              <th
                key={col.field}
                style={{
                  textAlign: "left",
                  padding: "8px 16px",
                  userSelect: "none",
                  cursor: col.sortable !== false ? "pointer" : undefined,
                  fontWeight: 700,
                  letterSpacing: ".04em"
                }}
                aria-sort={sortField === col.field ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                tabIndex={col.sortable !== false ? 0 : -1}
                onClick={() => {
                  if (col.sortable !== false) {
                    if (sortField === col.field) setSortDir(d => d === "asc" ? "desc" : "asc");
                    else setSortField(col.field);
                  }
                }}
                onKeyDown={e => {
                  if ((e.key === "Enter" || e.key === " ") && col.sortable !== false) {
                    if (sortField === col.field) setSortDir(d => d === "asc" ? "desc" : "asc");
                    else setSortField(col.field);
                  }
                }}
              >
                {col.emoji && <span aria-hidden="true" style={{marginRight:4}}>{col.emoji}</span>}
                {col.label}
                {col.sortable !== false && (
                  <span aria-hidden="true" style={{marginLeft:5,fontSize:"13px"}}>
                    {sortField === col.field ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length ? sortedData.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              style={{
                borderBottom: "1px solid var(--border-color)",
                background: rowIdx % 2 ? "rgba(33,33,44,0.10)" : "transparent"
              }}>
              {columns.map((col, colIdx) => (
                <td key={colIdx} style={{
                  padding: "8px 16px",
                  verticalAlign: "top",
                  minWidth: 40,
                  fontWeight: col.bold ? 600 : 400,
                  color: col.colored ? (col.colorMap?.[row[col.field]] || "var(--text-color)") : "inherit",
                  wordBreak: "break-word"
                }}>
                  {col.emojiMap
                    ? <span aria-hidden="true" title={row[col.field]} style={{marginRight:4}}>
                        {(col.emojiMap[row[col.field]] || "⁉️")}
                      </span>
                    : null}
                  {typeof row[col.field] === "boolean"
                      ? row[col.field] ? "✅" : "❌"
                      : row[col.field]}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length}
                  style={{textAlign:"center",color:"var(--text-tertiary)",padding:"24px 0"}}>
                <span aria-hidden="true" style={{fontSize:20}}>🕵️‍♂️</span> No data found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TableDisplay;
