import React, { useMemo, useState } from "react";

// PUBLIC_INTERFACE
/**
 * Premium TableDisplay component for results/history, now supporting advanced, accessible filters.
 *
 * Props:
 *  - data: Array of objects
 *  - columns: [{label, field, ...}]
 *  - advancedFilters: external filter values from parent (object: field -> string/array)
 *  - onChangeAdvancedFilters: callback when child internal (quick/advanced) filter changes (field, value)
 *  - filterable: enable filter controls
 *  - quickFields: array of {field, label, options} to render as quick chips/drop or multi-select; options optional for open text
 *  - advancedMode: show advanced UI (multi-field, regex, etc.)
 *  - ...rest: same as before
 */
function TableDisplay({
  data,
  columns,
  initialSortField,
  initialSortDir = "asc",
  filterable = true,
  advancedFilters,
  onChangeAdvancedFilters,
  quickFields = [],
  advancedMode: propAdvancedMode,
  onToggleAdvancedMode,
  onExportCSV,
  onExportJSON,
  size = "lg",
  style = {},
  ...rest
}) {
  // Sorting state
  const [sortField, setSortField] = useState(initialSortField || (columns[0]?.field || ""));
  const [sortDir, setSortDir] = useState(initialSortDir);

  // Filter state: internal unless externally controlled
  const [internalFilters, setInternalFilters] = useState({});
  const filters = advancedFilters !== undefined ? advancedFilters : internalFilters;
  // Advanced/quick toggle state
  const [advancedMode, setAdvancedMode] = useState(!!propAdvancedMode);

  // On filter change, propagate upward if handler present
  function setFilterField(field, val) {
    if (onChangeAdvancedFilters) {
      onChangeAdvancedFilters(field, val);
    } else {
      setInternalFilters((prev) => ({ ...prev, [field]: val }));
    }
  }

  // Filtering logic
  // Performs fast in-memory filtering for large lists (each field supports multi or single value, case-insensitive)
  const filteredData = useMemo(() => {
    if (!filterable || !filters || !Object.keys(filters).length)
      return data;
    return data.filter((row) => {
      return Object.entries(filters).every(([key, valRaw]) => {
        // valRaw may be: string or array or {value,mode}
        let valArr = (Array.isArray(valRaw) ? valRaw : (typeof valRaw === "string" ? [valRaw] : []))
          .filter((v) => typeof v === "string" && v.trim() !== "").map((v) => v.toLowerCase());
        if (!valArr.length) return true; // No filter for this field
        let cellValue = (row[key] ?? "").toString().toLowerCase();
        // If cellValue comma separated, split to support multi-tag match
        let cellVals = cellValue.split(/[,/;| ]/).map((s) => s.trim()).filter(Boolean);
        // If 'ALL' is present, always show
        if (valArr.includes("all")) return true;
        // Any value match sufficient
        return valArr.some((q) => (cellVals.some((cv) => cv.includes(q))));
      });
    });
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
  function handleExportCSV() {
    if (!onExportCSV) {
      const rows = [
        columns.map((col) => `"${col.label}"`).join(","),
        ...sortedData.map((r) =>
          columns.map((col) => `"${(r[col.field] ?? "").replace(/"/g, '""')}"`).join(",")
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
  function handleExportJSON() {
    if (!onExportJSON) {
      const blob = new Blob([JSON.stringify(sortedData, null, 2)], {
        type: "application/json",
      });
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

  // === Render premium filter/search UI ===
  // Avoid repetition: quickFields may specify: {field,label,options: [...], multi:bool}
  function renderPremiumFilters() {
    if (!filterable || !quickFields || quickFields.length === 0) return null;

    return (
      <section
        aria-label="Result quick filters"
        style={{
          background: "var(--secondary)",
          borderRadius: 9,
          marginBottom: 13,
          padding: "6px 8px 2px 8px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
        }}
        tabIndex={-1}
      >
        {quickFields.map((q) =>
          (q.options && Array.isArray(q.options) && q.options.length) ? (
            <label key={q.field} style={{ fontWeight: 700, color: "var(--base-accent)", fontSize: 13.6 }}>
              {q.label}
              <select
                aria-label={`Filter by ${q.label}`}
                value={filters[q.field] || ""}
                onChange={(e) => setFilterField(q.field, e.target.value)}
                style={{
                  marginLeft: 6,
                  fontSize: 14.3,
                  borderRadius: 6,
                  background: "var(--base-dark)",
                  color: "var(--text-color)",
                  border: "1.1px solid var(--border-color)",
                  padding: "4px 10px",
                  outline: "none",
                  minWidth: 77,
                }}
              >
                <option value="">All</option>
                {q.options.map((opt) =>
                  <option value={opt} key={opt}>{opt}</option>
                )}
              </select>
            </label>
          ) : (
            // Open input
            <input
              key={q.field}
              aria-label={`Filter by ${q.label}`}
              type="text"
              placeholder={`Filter ${q.label}`}
              style={{
                fontSize: 13.3,
                borderRadius: 6,
                background: "var(--base-dark)",
                color: "var(--text-color)",
                border: "1px solid var(--border-color)",
                padding: "5px 10px",
                marginLeft: 2,
                minWidth: 86,
              }}
              value={filters[q.field] || ""}
              onChange={(e) => setFilterField(q.field, e.target.value)}
              tabIndex={0}
            />
          )
        )}
        {onToggleAdvancedMode && (
          <button
            className="btn"
            aria-label="Show advanced filters"
            type="button"
            tabIndex={0}
            style={{
              marginLeft: 13, fontSize: 14, fontWeight: 600,
              color: "#b7ebff",
              background: "linear-gradient(92deg,#222c4d 10%,#2934a6 110%)"
            }}
            onClick={() => {
              setAdvancedMode((m) => !m);
              onToggleAdvancedMode(!advancedMode);
            }}
          >
            {advancedMode ? "Hide Advanced" : "Advanced Filters"}
          </button>
        )}
      </section>
    );
  }

  // Advanced filter bar (if advancedMode)
  function renderAdvancedFilterBar() {
    if (!filterable || !advancedMode) return null;
    // Render text input for each column
    return (
      <section
        aria-label="Advanced Filter Controls"
        style={{
          width: "100%",
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          marginBottom: 7,
          marginTop: -7,
        }}
        tabIndex={-1}
      >
        {columns
          .filter((col) => col.filter !== false)
          .map((col) => (
            <input
              key={col.field}
              type="text"
              aria-label={`Filter ${col.label}`}
              placeholder={`Filter ${col.label}`}
              style={{
                fontSize: 13.1,
                background: "var(--base-dark)",
                color: "var(--text-color)",
                border: "1.1px solid var(--border-color)",
                borderRadius: 6,
                padding: "4.5px 11px",
                marginBottom: 2,
                minWidth: 96,
              }}
              value={filters[col.field] || ""}
              onChange={(e) => setFilterField(col.field, e.target.value)}
            />
          ))}
        <span style={{ marginLeft: 9, color: "var(--text-tertiary)", fontSize: "12.8px" }}>
          (Regex accepted in advanced. Leave blank for no filter.)
        </span>
      </section>
    );
  }

  // MAIN RENDER
  return (
    <div
      tabIndex={0}
      style={{
        overflowX: "auto",
        borderRadius: 12,
        background: "var(--secondary)",
        boxShadow: "0 4px 32px -8px rgba(0,0,0,0.10)",
        ...style,
      }}
      {...rest}
    >
      {renderPremiumFilters()}
      {renderAdvancedFilterBar()}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 18 }}>
        {/* Export/group buttons */}
        <div style={{ display: "flex", gap: 7 }}>
          <button
            className="btn"
            aria-label="Export as CSV"
            onClick={handleExportCSV}
            style={{
              background: "linear-gradient(90deg,#ff9800,#ffad42)",
              color: "#23272e",
              fontWeight: 700,
              fontSize: 15.5,
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
              fontSize: 15.5,
            }}
          >🗎 JSON</button>
        </div>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 420,
          fontSize:
            size === "sm" ? 13.2 : size === "md" ? 15 : 16.2,
          background: "transparent",
        }}
        role="table"
        aria-label="Result Table"
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
                  letterSpacing: ".04em",
                }}
                aria-sort={
                  sortField === col.field
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
                tabIndex={col.sortable !== false ? 0 : -1}
                onClick={() => {
                  if (col.sortable !== false) {
                    if (sortField === col.field)
                      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    else setSortField(col.field);
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === " ") &&
                    col.sortable !== false
                  ) {
                    if (sortField === col.field)
                      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    else setSortField(col.field);
                  }
                }}
                scope="col"
                role="columnheader"
              >
                {col.emoji && (
                  <span aria-hidden="true" style={{ marginRight: 4 }}>
                    {col.emoji}
                  </span>
                )}
                {col.label}
                {col.sortable !== false && (
                  <span
                    aria-hidden="true"
                    style={{ marginLeft: 5, fontSize: "13px" }}
                  >
                    {sortField === col.field
                      ? sortDir === "asc"
                        ? "▲"
                        : "▼"
                      : "↕"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length ? (
            sortedData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                tabIndex={0}
                style={{
                  borderBottom: "1px solid var(--border-color)",
                  background:
                    rowIdx % 2 ? "rgba(33,33,44,0.10)" : "transparent",
                  cursor: typeof rest.onRowClick === "function" ? "pointer" : undefined,
                  outline: "none",
                }}
                role="row"
                aria-label={columns.map(col => row[col.field]).join(", ")}
                onClick={() => rest.onRowClick && rest.onRowClick(row, rowIdx)}
                onKeyDown={e => {
                  if ((e.key === "Enter" || e.key === " ") && typeof rest.onRowClick === "function") {
                    rest.onRowClick(row, rowIdx);
                  }
                }}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    style={{
                      padding: "8px 16px",
                      verticalAlign: "top",
                      minWidth: 40,
                      fontWeight: col.bold ? 600 : 400,
                      color: col.colored
                        ? col.colorMap?.[row[col.field]] || "var(--text-color)"
                        : "inherit",
                      wordBreak: "break-word",
                    }}
                    role="cell"
                  >
                    {col.emojiMap ? (
                      <span
                        aria-hidden="true"
                        title={row[col.field]}
                        style={{ marginRight: 4 }}
                      >
                        {col.emojiMap[row[col.field]] || "⁉️"}
                      </span>
                    ) : null}
                    {typeof row[col.field] === "boolean"
                      ? row[col.field]
                        ? "✅"
                        : "❌"
                      : row[col.field]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  textAlign: "center",
                  color: "var(--text-tertiary)",
                  padding: "24px 0",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 20 }}>
                  🕵️‍♂️
                </span>{" "}
                No data found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TableDisplay;
