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
        width: 88,
        // Deeper black for sidebar, edge-glow left
        background: "linear-gradient(90deg,var(--base-black) 93%,#19191c 100%)",
        borderRight: "2px solid var(--border-color)",
        color: "var(--text-secondary)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "38px 0 0 0",
        minHeight: "100vh",
        boxShadow:
          "0 20px 42px -16px #000b, 2px 0 21px 1.5px #10110f28",
        zIndex: 16,
        position: "relative",
      }}
    >
      {/* Logo area: strong brand, larger, crisp card-chip, dark shadow */}
      <div
        className="logo"
        aria-label="CyberRecon Suite"
        tabIndex={-1}
        style={{
          width: 54,
          marginBottom: 35,
          padding: 0,
          background: "linear-gradient(90deg,#23232e,#18191f 97%)",
          borderRadius: "16px",
          border: "1.7px solid var(--border-color)",
          boxShadow: "0 8px 38px -10px #000a",
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
            fontSize: 38,
            textShadow:
              "0 2.5px 22px #ffad429a, 0 2px 12px #1b525745",
            color: "var(--base-light)",
            marginBottom: 3,
            marginTop: 5
          }}
        >
          🛰️
        </span>
      </div>
      {/* Nav buttons as crisp, modular sidebar cards */}
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
          // Enhanced: card shadow and stronger accent highlight
          const accentGlow =
            activeModule === mod.id
              ? "0px 4px 26px 0 #ff980044,0 0px 22px 2px #ff980077"
              : "";
          const cardBg = activeModule === mod.id
            ? "linear-gradient(93deg,#111116 85%,#191a1d 100%)"
            : "linear-gradient(89deg,var(--sidebar-dark) 65%,#181a1f 97%)";
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
                background: cardBg,
                border: "none",
                borderRight: activeModule === mod.id
                  ? "5px solid var(--base-accent)"
                  : "2px solid transparent",
                color: activeModule === mod.id
                  ? "var(--base-accent)"
                  : "var(--text-secondary)",
                fontWeight: activeModule === mod.id ? 900 : 570,
                fontSize: 14,
                cursor: "pointer",
                borderRadius: "0 15px 15px 0",
                outline: "none",
                margin: "13px 0 10px 0",
                padding: "17px 0 9px 0",
                position: "relative",
                boxShadow: accentGlow + ",0 4px 14px -2px #000b",
                transition:
                  "background 0.14s, color 0.14s, box-shadow 0.19s, border-color 0.16s",
                letterSpacing: ".013em"
              }}
              onClick={() => onModuleSelect(mod.id)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") onModuleSelect(mod.id);
              }}
              onFocus={e => {
                if (e.target) e.target.style.background = "linear-gradient(95deg,#000002 65%,#292c33 100%)";
              }}
              onBlur={e => {
                if (e.target && activeModule !== mod.id) e.target.style.background = cardBg;
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  fontSize: 30,
                  marginBottom: 9,
                  filter: activeModule === mod.id ? "drop-shadow(0 0 17px #ff9800cc)" : "none",
                  textShadow: activeModule === mod.id
                    ? "0 2.5px 20px #000b, 0 2.2px 12px #ffad4244"
                    : "0 2.5px 13px #10152912",
                  transition: "all .18s cubic-bezier(.22,.84,.43,1)"
                }}
              >
                {mod.icon}
              </span>
              <span
                style={{
                  fontSize: 12,
                  marginTop: -2,
                  color: activeModule === mod.id
                    ? "var(--base-accent)"
                    : "var(--text-secondary)",
                  fontWeight: activeModule === mod.id ? 800 : 420,
                  letterSpacing: ".05em",
                  textShadow: activeModule === mod.id ? "0 1.9px 8px #ffbe4278" : "none"
                }}
              >
                {mod.short}
              </span>
            </button>
          );
        })}
      </div>
      {/* Elegant divider at bottom */}
      <div
        aria-hidden="true"
        style={{
          marginTop: "auto",
          width: "77%",
          height: 2.7,
          background: "linear-gradient(90deg,#1a1a1a 5%,#ffad4299 55%,#181a1f 100%)",
          opacity: 0.26,
          borderRadius: 8,
          marginBottom: 28
        }}
      />
      {/* Footer: future help/settings */}
    </nav>
  );
}

export default Sidebar;
