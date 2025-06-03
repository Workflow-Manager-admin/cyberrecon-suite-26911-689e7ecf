import React from "react";

// PUBLIC_INTERFACE
function Sidebar({ modules, activeModule, onModuleSelect }) {
  /**
   * Renders the premium, modern sidebar for module navigation.
   * Now features rich emoji/icons, sharper contrast, vibrant highlights,
   * and a more energetic dark visual hierarchy suitable for a "deep black" workflow.
   */
  return (
    <nav
      className="sidebar"
      aria-label="Main module navigation"
      tabIndex={0}
      role="navigation"
      style={{
        width: 82,
        background: "var(--sidebar-dark)",
        borderRight: "2px solid var(--border-color)",
        color: "var(--text-secondary)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "38px 0 0 0",
        minHeight: "100vh",
        boxShadow:
          "0 13px 40px -12px #000b, 1.5px 0 11px 1.5px #10110f1e",
        zIndex: 16,
        position: "relative",
      }}
    >
      {/* Logo area: strong brand, larger, with glow */}
      <div
        className="logo"
        aria-label="CyberRecon Suite"
        tabIndex={-1}
        style={{
          width: 52,
          marginBottom: 38,
          paddingBottom: 6,
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          gap: 0,
          userSelect: "none"
        }}
      >
        <span
          className="logo-symbol"
          aria-hidden="true"
          style={{
            fontSize: 34,
            textShadow:
              "0 2.5px 18px #ffad4247, 0 1.7px 16px #2d5257",
            color: "var(--base-light)",
            marginBottom: 4,
          }}
        >
          🛰️
        </span>
      </div>
      {/* Nav buttons */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          width: "100%",
          alignItems: "center",
        }}
      >
        {modules.map((mod, idx) => {
          // Choose extra accent color for active/hover state by position for vibrance
          const accentGlow =
            activeModule === mod.id
              ? (idx % 2
                ? "0px 0px 18px 3px #ff980040, 0 0 0 3px #39291d22"
                : "0px 0px 18px 2px #53d0f92a, 0 0 0 3px #39291d22")
              : "";

          return (
            <button
              key={mod.id}
              className={`sidebar-btn${activeModule === mod.id ? " active" : ""}`}
              aria-label={mod.label}
              aria-current={activeModule === mod.id ? "page" : undefined}
              tabIndex={0}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: "100%",
                width: "100%",
                background: activeModule === mod.id
                  ? "linear-gradient(93deg,#191a1f 75%,#23242c 100%)"
                  : "none",
                border: "none",
                borderRight: activeModule === mod.id ? "4.5px solid var(--base-light)" : "none",
                color: activeModule === mod.id
                  ? "var(--base-light)"
                  : "var(--text-secondary)",
                fontWeight: activeModule === mod.id ? 800 : 500,
                fontSize: 13,
                cursor: "pointer",
                borderRadius: "0 13px 13px 0",
                outline: "none",
                margin: "9px 0",
                padding: "16px 0 8px 0",
                position: "relative",
                boxShadow: accentGlow,
                transition:
                  "background 0.13s, color 0.14s, box-shadow 0.16s, border-color 0.11s",
                letterSpacing: ".02em"
              }}
              onClick={() => onModuleSelect(mod.id)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") onModuleSelect(mod.id);
              }}
              onFocus={e => {
                if (e.target) e.target.style.background = "linear-gradient(89deg,#0b0c0f 61%,#272a31 100%)";
              }}
              onBlur={e => {
                if (e.target && activeModule !== mod.id) e.target.style.background = "none";
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  fontSize: 27,
                  marginBottom: 8,
                  filter: activeModule === mod.id ? "drop-shadow(0 0 11px #ff980077)" : "none",
                  textShadow: activeModule === mod.id
                    ? "0 2px 13px #000a, 0 1px 4px #ffad4292"
                    : "0 1.2px 7px #10152918"
                }}
              >
                {mod.icon}
              </span>
              <span
                style={{
                  fontSize: 11,
                  marginTop: -4,
                  color: activeModule === mod.id
                    ? "var(--base-light)"
                    : "var(--text-secondary)",
                  fontWeight: activeModule === mod.id ? 700 : 400,
                  letterSpacing: ".04em"
                }}
              >
                {mod.short}
              </span>
            </button>
          );
        })}
      </div>
      {/* Elegant divider at the bottom */}
      <div
        aria-hidden="true"
        style={{
          marginTop: "auto",
          width: "80%",
          height: 1.7,
          background: "linear-gradient(90deg,#1a1a1a 9%,#ffad4235 51%,#181a1f 100%)",
          opacity: 0.18,
          borderRadius: 6,
          marginBottom: 24
        }}
      />
      {/* Footer control (optional future: settings/help) */}
    </nav>
  );
}

export default Sidebar;
