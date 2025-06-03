import React from "react";

// PUBLIC_INTERFACE
function Sidebar({ modules, activeModule, onModuleSelect }) {
  /**
   * Renders the persistent sidebar for module navigation.
   * Uses ARIA attributes for better accessibility and
   * keyboard navigation support.
   */
  return (
    <nav
      className="sidebar"
      aria-label="Main module navigation"
      tabIndex={0}
      role="navigation"
      style={{
        width: 70,
        background: "var(--base-dark)",
        borderRight: "1px solid var(--border-color)",
        color: "var(--text-secondary)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 32,
        minHeight: "100vh"
      }}
    >
      {modules.map(mod => (
        <button
          key={mod.id}
          className={`sidebar-btn${activeModule === mod.id ? " active" : ""}`}
          aria-label={mod.label}
          aria-current={activeModule === mod.id ? "page" : undefined}
          tabIndex={0}
          style={{
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            margin: "12px 0",
            outline: "none",
            padding: 0
          }}
          onClick={() => onModuleSelect(mod.id)}
        >
          <span
            aria-hidden="true"
            style={{ display: "block", fontSize: 24, marginBottom: 4 }}
          >
            {mod.icon}
          </span>
          <span
            style={{
              fontSize: 10,
              color: activeModule === mod.id ? "var(--base-light)" : "var(--text-secondary)",
              fontWeight: activeModule === mod.id ? 600 : 400
            }}
          >
            {mod.short}
          </span>
        </button>
      ))}
    </nav>
  );
}

export default Sidebar;
