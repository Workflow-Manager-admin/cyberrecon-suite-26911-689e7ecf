import React from "react";
import logo from "../assets/cyberrecon-logo.svg";

/**
 * Sidebar: MODERN, polished, accessible navigation for CyberRecon Suite.
 * Each module/page appears as a clearly-labeled button with icon + name.
 * Wide click targets, strong focus/active, readable, visually distinct.
 * Props:
 *   - modules: [{id,label,icon,...}]
 *   - activeModule: current module id
 *   - onModuleSelect: function(id)
 *   - isOpen: sidebar expanded/collapsed
 *   - onClose: function()
 *   - width: sidebar width (default 92px)
 */
// PUBLIC_INTERFACE
function Sidebar({
  modules,
  activeModule,
  onModuleSelect,
  isOpen = true,
  onClose,
  width
}) {
  // Increased sidebar width for clarity and premium feel
  const SIDEBAR_WIDTH = width || 128;

  const sidebarPalette = {
    background: "linear-gradient(105deg,#181a21 92%,#181b22 100%)",
    borderRight: isOpen ? "2.5px solid var(--border-color,#29262a)" : "none",
    color: "var(--text-secondary)",
    width: SIDEBAR_WIDTH,
    minWidth: SIDEBAR_WIDTH,
    maxWidth: SIDEBAR_WIDTH,
    boxShadow: isOpen
      ? "4px 0 39px -12px #000c, 0 0 16px 0 #1e180333, 2px 0 14px #ff98001a"
      : "none",
    zIndex: 30,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: isOpen ? "18px 0 0 0" : "0",
    position: "relative",
    minHeight: "100vh",
    pointerEvents: isOpen ? "auto" : "none",
    willChange: "transform,opacity",
    transform: isOpen ? `translateX(0)` : `translateX(-${SIDEBAR_WIDTH + 38}px)`,
    opacity: isOpen ? 1 : 0,
    transition:
      "transform .35s cubic-bezier(.62,1.52,.33,1), opacity 0.23s cubic-bezier(.64,1.18,.52,1)"
  };

  const closeBtnStyle = {
    position: "absolute",
    top: 16,
    right: 9,
    background: "rgba(35,31,25,0.92)",
    color: "#ffb959",
    border: "none",
    borderRadius: 10,
    width: 34,
    height: 34,
    fontSize: 22,
    fontWeight: 900,
    boxShadow: "0 0 7px #ffad4277",
    cursor: "pointer",
    zIndex: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
    transition: "background .16s,color .16s"
  };

  // Modern label+icon nav, clear, accessible, premium look
  function navBtnStyle(selected) {
    return {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "118px",
      minWidth: "110px",
      maxWidth: "132px",
      height: "54px",
      margin: "0",
      padding: 0,
      borderRadius: "13px",
      background: selected
        ? "linear-gradient(93deg,#231e31 70%,#30251f 100%)"
        : "rgba(25,25,34,0.81)",
      border: selected
        ? "2.2px solid var(--base-accent,#ff9800)"
        : "2px solid transparent",
      outline: selected ? "2.9px solid #ffb959b2" : "none",
      color: selected ? "var(--base-accent,#ff9800)" : "var(--text-secondary)",
      boxShadow: selected
        ? "0 2.5px 12px -2px #ff980045, 0 1.5px 8px #ffad4266"
        : "0 1.5px 10px -5px #191c2240",
      cursor: "pointer",
      marginBottom: 7,
      fontWeight: selected ? 900 : 700,
      fontSize: 16.2,
      letterSpacing: ".045em",
      gap: 4, // new: allow icon-label space
      transition: "background .19s, box-shadow .22s, border-color .15s, outline .13s",
      position: "relative"
    };
  }

  return (
    <nav
      className="sidebar"
      aria-label="Main module navigation"
      tabIndex={isOpen ? 0 : -1}
      role="navigation"
      aria-hidden={!isOpen}
      style={sidebarPalette}
    >
      {/* Slide-close toggle, always accessible */}
      {onClose && isOpen && (
        <button
          aria-label="Hide sidebar"
          style={closeBtnStyle}
          onClick={() => onClose?.()}
          tabIndex={0}
          title="Collapse sidebar"
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") onClose();
          }}
          onFocus={e => (e.target.style.boxShadow = "0 0 0 3.5px #ff980088")}
          onBlur={e => (e.target.style.boxShadow = closeBtnStyle.boxShadow)}
        >
          <span aria-hidden="true" style={{ fontSize: 22, marginBottom: -2 }}>×</span>
        </button>
      )}

      {/* Brand Logo */}
      <div
        className="sidebar-logo"
        aria-label="CyberRecon Suite"
        tabIndex={-1}
        style={{
          width: 53,
          height: 53,
          marginBottom: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "15px",
          background: "rgba(38,38,56,0.87)",
          border: "1.5px solid var(--border-color,#24222e)",
          boxShadow: "0 5px 26px -7px #ffad4212",
          opacity: isOpen ? 1 : 0,
          transition: "opacity .13s"
        }}
      >
        <img
          src={logo}
          alt="CyberRecon Suite Logo"
          width="41"
          height="41"
          style={{
            display: "block",
            maxHeight: 41,
            maxWidth: 41,
            filter: "drop-shadow(0 2.8px 17px #ffad42a0)"
          }}
          draggable={false}
        />
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity .13s"
        }}
        role="menubar"
      >
        {modules.map((mod) => {
          const selected = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              className={`sidebar-btn${selected ? " active" : ""}`}
              style={navBtnStyle(selected)}
              aria-label={mod.label}
              aria-current={selected ? "page" : undefined}
              tabIndex={isOpen ? 0 : -1}
              onClick={() => isOpen && onModuleSelect(mod.id)}
              onKeyDown={e => {
                if ((e.key === "Enter" || e.key === " ") && isOpen)
                  onModuleSelect(mod.id);
              }}
              title={mod.label}
              onFocus={e => {
                e.target.style.background = "linear-gradient(96deg,#262434 68%,#1d1c29 100%)";
                e.target.style.outline = "3px solid #ffb959";
              }}
              onBlur={e => {
                e.target.style.background = selected
                  ? "linear-gradient(93deg,#231e31 70%,#30251f 100%)"
                  : "rgba(25,25,34,0.81)";
                e.target.style.outline = selected ? "2.9px solid #ffb959b2" : "none";
              }}
              role="menuitem"
              aria-pressed={selected}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 28,
                  marginLeft: 8,
                  marginRight: 10,
                  filter: selected ? "drop-shadow(0 0 13px #ff9800bd)" : "none",
                  textShadow: selected
                    ? "0 2px 16px #ff980055, 0 1.8px 7px #ffad4280"
                    : "0 1px 7px #1c1c2629",
                  transition: "all .22s cubic-bezier(.22,.8,.43,1)",
                  flexShrink: 0
                }}
              >
                {mod.icon}
              </span>
              <span
                style={{
                  fontSize: 15.5,
                  marginLeft: 0,
                  color: selected ? "var(--base-accent,#ff9800)" : "var(--text-color,#fdfeff)",
                  fontWeight: selected ? 900 : 700,
                  letterSpacing: ".009em",
                  flex: 1,
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  opacity: selected ? 1 : 0.93,
                  textShadow: selected
                    ? "0 1.5px 11px #ffad4240"
                    : undefined,
                }}
                aria-hidden="false"
              >
                {mod.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Bottom divider bar for visual polish */}
      <div
        aria-hidden="true"
        style={{
          marginTop: "auto",
          width: "82%",
          height: 2,
          background: "linear-gradient(86deg,#1a1a1a 7%,#ffbb4e8a 62%,#181a1f 100%)",
          opacity: isOpen ? 0.36 : 0,
          borderRadius: 8,
          marginBottom: 19,
          marginTop: 18,
          transition: "opacity .22s"
        }} />
    </nav>
  );
}

export default Sidebar;
