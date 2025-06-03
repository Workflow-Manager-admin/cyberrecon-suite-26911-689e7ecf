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
        flexDirection: "column",
        background: "transparent",
        position: "relative"
      }}
    >
      <div
        className="tab-list"
        role="tablist"
        aria-label="Main workspace tabs"
        style={{
          display: "flex",
          background: "var(--elevated)",
          borderBottom: "1.8px solid var(--border-color)",
          boxShadow: "0 5px 22px -13px #111a1f82",
          minHeight: 40,
          borderRadius: "0 0 14px 14px",
          margin: "0 16px",
          marginTop: 23,
          zIndex: 7,
          position: "relative"
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
              padding: "9px 26px",
              background: activeTab === tab.id
                ? "linear-gradient(97deg,#181a1c 85%,#1e1e29 100%)"
                : "none",
              color: activeTab === tab.id ? "var(--base-light)" : "var(--text-color)",
              border: activeTab === tab.id ? "2.5px solid var(--base-accent)" : "2.5px solid transparent",
              borderBottom: activeTab === tab.id ? "none" : undefined,
              borderRadius: activeTab === tab.id ? "14px 14px 0 0" : "10px 10px 0 0",
              boxShadow: activeTab === tab.id
                ? "0 4.5px 28px -12px #ff980024"
                : "none",
              cursor: "pointer",
              fontWeight: activeTab === tab.id ? 800 : 570,
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              fontSize: 16.3,
              marginRight: 2,
              position: "relative",
              zIndex: activeTab === tab.id ? 10 : 1,
              minHeight: 37,
              transition: "all .15s cubic-bezier(.22,.84,.43,1)"
            }}
            onClick={() => onTabSelect(tab.id)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                onTabSelect(tab.id);
              }
            }}
          >
            {tab.icon && (
              <span style={{
                marginRight: 8,
                fontSize: 22,
                filter: activeTab === tab.id ? "drop-shadow(0 0 11px #ff980099)" : "none"
              }} aria-hidden="true">
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
                  fontSize: 22,
                  cursor: "pointer",
                  borderRadius: "7px",
                  padding: 2,
                  transition: "background .15s"
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
        style={{
          flex: 1,
          overflow: "auto",
          margin: "0 22px 22px 22px",
          marginTop: -15,
          background: "linear-gradient(93deg,#101114 96%,#16171b 100%)",
          borderRadius: "17px",
          boxShadow:
            "0 13px 52px -18px #000c, 0 6px 26px -7px #221e29cc",
          padding: "32px 3vw 30px 3vw",
          minHeight: 380,
          border: "2.2px solid var(--border-color)",
          zIndex: 5
        }}
      >
        {children}
      </div>
    </section>
  );
}

export default TabbedWorkspace;
