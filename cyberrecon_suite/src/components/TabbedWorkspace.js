import React from "react";

// PUBLIC_INTERFACE
function TabbedWorkspace({
  tabs,
  activeTab,
  onTabSelect,
  onTabClose,
  children
}) {
  /**
   * Main area with tabbed navigation for active modules.
   * Supports basic ARIA and keyboard accessibility.
   */
  return (
    <section
      className="tabbed-workspace"
      aria-label="Workspace Tabs"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div
        className="tab-list"
        role="tablist"
        aria-label="Main workspace tabs"
        style={{
          display: "flex",
          background: "var(--secondary, #23272e)",
          borderBottom: "1px solid var(--border-color)",
          minHeight: 38
        }}
      >
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab${activeTab === tab.id ? " active" : ""}`}
            role="tab"
            tabIndex={0}
            aria-selected={activeTab === tab.id}
            aria-controls={`workspace-tabpanel-${tab.id}`}
            style={{
              padding: "8px 18px",
              background: activeTab === tab.id ? "var(--base-dark)" : "none",
              color: activeTab === tab.id ? "var(--base-light)" : "var(--text-color)",
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center"
            }}
            onClick={() => onTabSelect(tab.id)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                onTabSelect(tab.id);
              }
            }}
          >
            {tab.icon && (
              <span style={{ marginRight: 8 }} aria-hidden="true">
                {tab.icon}
              </span>
            )}
            {tab.title}
            {onTabClose && (
              <button
                tabIndex={0}
                aria-label={`Close ${tab.title}`}
                style={{
                  marginLeft: 10,
                  border: "none",
                  background: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer"
                }}
                onClick={e => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <div
        className="tab-content"
        role="tabpanel"
        id={`workspace-tabpanel-${activeTab}`}
        tabIndex={0}
        style={{ flex: 1, overflow: "auto" }}
      >
        {children}
      </div>
    </section>
  );
}

export default TabbedWorkspace;
