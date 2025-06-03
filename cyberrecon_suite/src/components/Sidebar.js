import React from "react";
import logo from "../assets/cyberrecon-logo.svg";

/**
 * Dashboard/sidebar: Premium, wider, with optional slide-close (scaffolded for use)
 * Accepts new props:
 *   - isOpen: boolean
 *   - onClose: function (optional)
 * Always visually wider (wider than 88px: ~240-260px), with all content spaced accordingly.
 */
/**
 * Dashboard/sidebar: Premium, wider, with optional slide-close (scaffolded for use)
 * Accepts new props:
 *   - isOpen: boolean
 *   - onClose: function (optional)
 *   - width: number (optional, allows parent to control exact width)
 * Always visually wider (wider than 88px: ~240-320px for Burp Suite feel), with all content spaced accordingly.
 */
/**
 * Dashboard/sidebar: Premium, wider, with optional slide-close (scaffolded for use)
 * Accepts new props:
 *   - isOpen: boolean
 *   - onClose: function (optional)
 *   - width: number (optional, allows parent to control exact width)
 * Always visually wider (wider than 88px: ~240-340px for Burp Suite feel), with all content spaced accordingly.
 */
// PUBLIC_INTERFACE
function Sidebar({ modules, activeModule, onModuleSelect, isOpen = true, onClose, width }) {
  // Responsive width: wider, support parent-passed width (default now 340 for premium experience)
  const SIDEBAR_WIDTH = width || 340;

  // Premium slide-close: hide from left (use isOpen prop)
  return (
    <nav
      className="sidebar"
      aria-label="Main module navigation"
      tabIndex={0}
      role="navigation"
      style={{
        width: isOpen ? SIDEBAR_WIDTH : 0,
        minWidth: isOpen ? SIDEBAR_WIDTH : 0,
        maxWidth: SIDEBAR_WIDTH,
        transition: "width 0.23s cubic-bezier(.38,.71,.68,1), min-width 0.21s",
        overflow: "hidden",
        background: "linear-gradient(90deg,var(--base-black) 85%,#19191c 100%)",
        borderRight: isOpen ? "2.7px solid var(--border-color)" : "none",
        color: "var(--text-secondary)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: isOpen ? "42px 0 0 0" : "0",
        minHeight: "100vh",
        boxShadow: isOpen
          ? "0 22px 48px -16px #000b, 2px 0 36px 2.5px #18181c44"
          : "none",
        zIndex: 16,
        position: "relative",
      }}
    >
      {/* Slide-close button (scaffold for parent global control) */}
      {onClose && isOpen && (
        <button
          aria-label="Hide sidebar"
          className="sidebar-slide-close"
          style={{
            position: "absolute",
            top: 18,
            right: 12,
            background: "rgba(255,152,0,0.10)",
            color: "#ffad42",
            border: "none",
            borderRadius: "8px",
            width: 31,
            height: 31,
            fontSize: 23,
            fontWeight: 800,
            boxShadow: "0 0px 9px #ff980066",
            cursor: "pointer",
            zIndex: 28,
            transition: "background .14s,color .14s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => onClose?.()}
          tabIndex={0}
        >
          <span aria-hidden="true">←</span>
        </button>
      )}

      {/* Logo area: bigger width, maintain proportional look */}
      <div
        className="logo"
        aria-label="CyberRecon Suite"
        tabIndex={-1}
        style={{
          width: 74,
          marginBottom: 37,
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
            marginBottom: 3,
            marginTop: 5,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: 38,
            height: 38
          }}
        >
          <img
            src={logo}
            alt="CyberRecon Suite Logo"
            width={34}
            height={34}
            style={{
              display: "block",
              filter: "drop-shadow(0 2px 14px #ffad42ad)",
              maxHeight: 38,
              maxWidth: 38
            }}
            draggable={false}
          />
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
          // Enhanced: card shadow and strong accent highlight
          const accentGlow =
            activeModule === mod.id
              ? "0px 4px 26px 0 #ff980044,0 0px 22px 2px #ff980077"
              : "";
          const cardBg = activeModule === mod.id
            ? "linear-gradient(93deg,#111116 86%,#191a1d 100%)"
            : "linear-gradient(88deg,var(--sidebar-dark) 81%,#181a1f 99%)";
          return (
            <button
              key={mod.id}
              className={`sidebar-btn${activeModule === mod.id ? " active" : ""}`}
              aria-label={mod.label}
              aria-current={activeModule === mod.id ? "page" : undefined}
              tabIndex={0}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                minWidth: "100%",
                width: "96%", // Slight margin for shadow
                background: cardBg,
                border: "none",
                borderRight: activeModule === mod.id
                  ? "7px solid var(--base-accent)"
                  : "2px solid transparent",
                color: activeModule === mod.id
                  ? "var(--base-accent)"
                  : "var(--text-secondary)",
                fontWeight: activeModule === mod.id ? 900 : 570,
                fontSize: 16, // Bigger font for premium nav
                cursor: "pointer",
                borderRadius: "0 19px 19px 0",
                outline: "none",
                margin: "13px 0 11px 0",
                padding: "18px 0 12px 22px",
                gap: "13px",
                position: "relative",
                boxShadow: accentGlow + ",0 4px 14px -2px #000b",
                transition:
                  "background 0.14s, color 0.14s, box-shadow 0.19s, border-color 0.16s",
                letterSpacing: ".015em",
                justifyContent: "flex-start"
              }}
              onClick={() => onModuleSelect(mod.id)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") onModuleSelect(mod.id);
              }}
              onFocus={e => {
                if (e.target) e.target.style.background = "linear-gradient(94deg,#10121a 68%,#282b31 99%)";
              }}
              onBlur={e => {
                if (e.target && activeModule !== mod.id) e.target.style.background = cardBg;
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  fontSize: 36,
                  marginRight: 13,
                  marginBottom: 2,
                  filter: activeModule === mod.id ? "drop-shadow(0 0 18px #ff9800cc)" : "none",
                  textShadow: activeModule === mod.id
                    ? "0 2.8px 20px #000c, 0 2.2px 13px #ffad4264"
                    : "0 2.5px 14px #10152912",
                  transition: "all .18s cubic-bezier(.22,.84,.43,1)"
                }}
              >
                {mod.icon}
              </span>
              <span
                style={{
                  fontSize: 15,
                  marginTop: -2,
                  color: activeModule === mod.id
                    ? "var(--base-accent)"
                    : "var(--text-secondary)",
                  fontWeight: activeModule === mod.id ? 880 : 440,
                  letterSpacing: ".07em",
                  textShadow: activeModule === mod.id ? "0 2px 13px #ffbe4278" : "none"
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
          width: "92%",
          height: 3,
          background: "linear-gradient(87deg,#1a1a1a 7%,#ffbb4e9a 72%,#181a1f 100%)",
          opacity: 0.36,
          borderRadius: 9,
          marginBottom: 29
        }} />
      {/* Footer: future help/settings */}
    </nav>
  );
}

export default Sidebar;
