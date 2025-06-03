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
  // Update width from ~130px → 200px+ (from 196px if present, to 210px here for clarity and padding)
  const SIDEBAR_WIDTH = width || 210; // Up from 196; more room for icons & labels

  const sidebarPalette = {
    background: "linear-gradient(105deg,#191b24 82%,#181b22 100%)",
    borderRight: isOpen ? "2.5px solid var(--border-color,#29262a)" : "none",
    color: "var(--text-secondary)",
    width: SIDEBAR_WIDTH,
    minWidth: SIDEBAR_WIDTH,
    maxWidth: SIDEBAR_WIDTH,
    boxShadow: isOpen
      ? "6px 0 45px -13px #000b, 0 0 17px 0 #1e180338, 2px 0 19px #ff98001c"
      : "none",
    zIndex: 30,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: isOpen ? "36px 0 0 0" : "0", // increased top padding for more vertical breathing room
    position: "relative",
    minHeight: "100vh",
    pointerEvents: isOpen ? "auto" : "none",
    willChange: "transform,opacity",
    transform: isOpen ? `translateX(0)` : `translateX(-${SIDEBAR_WIDTH + 40}px)`,
    opacity: isOpen ? 1 : 0,
    transition:
      "transform .35s cubic-bezier(.62,1.52,.33,1), opacity 0.23s cubic-bezier(.64,1.18,.52,1)"
  };

  const closeBtnStyle = {
    position: "absolute",
    top: 25,
    right: 19,
    background: "rgba(35,31,25,0.96)",
    color: "#ffb959",
    border: "none",
    borderRadius: 12,
    width: 40,
    height: 40,
    fontSize: 27,
    fontWeight: 900,
    boxShadow: "0 0 11px #ffad4279",
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
      width: "194px", // expanded from 178px to 194px
      minWidth: "170px",
      maxWidth: "208px",
      height: "62px", // taller for a more premium, comfortable button
      margin: "0",
      padding: "0 18px 0 14px", // more interior left/right padding
      borderRadius: "17px",
      background: selected
        ? "linear-gradient(93deg,#231e31 68%,#30251f 100%)"
        : "rgba(25,25,34,0.81)",
      border: selected
        ? "2.4px solid var(--base-accent,#ff9800)"
        : "2px solid transparent",
      outline: selected ? "3.2px solid #ffb959cf" : "none",
      color: selected ? "var(--base-accent,#ff9800)" : "var(--text-secondary)",
      boxShadow: selected
        ? "0 2.5px 16px -2px #ff98004b, 0 2.5px 10px #ffad42a7"
        : "0 1.5px 10px -5px #191c2240",
      cursor: "pointer",
      marginBottom: 16, // more space between buttons
      fontWeight: selected ? 950 : 700,
      fontSize: 18,
      letterSpacing: ".045em",
      gap: 20, // much wider icon-label gap for comfort
      transition: "background .21s, box-shadow .22s, border-color .17s, outline .16s",
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
          width: 80,
          height: 80,
          marginBottom: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "23px",
          background: "rgba(38,38,56,0.97)",
          border: "2.6px solid var(--border-color,#24222e)",
          boxShadow: "0 11px 38px -11px #ffad4217",
          opacity: isOpen ? 1 : 0,
          transition: "opacity .13s"
        }}
      >
        <img
          src={logo}
          alt="CyberRecon Suite Logo"
          width="64"
          height="64"
          style={{
            display: "block",
            maxHeight: 65,
            maxWidth: 65,
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
          maxWidth: 228,
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
                  fontSize: 42,        // Larger for easier touch/click, accentuates visual hierarchy
                  marginLeft: 22,      // Increased left margin to space icon and button left edge
                  marginRight: 24,     // Wider gap from icon to label
                  filter: selected ? "drop-shadow(0 0 17px #ff9800c5)" : "none",
                  textShadow: selected
                    ? "0 2px 19px #ff980055, 0 2.5px 10px #ffad42b1"
                    : "0 1.4px 7px #1c1c262e",
                  transition: "all .22s cubic-bezier(.22,.8,.43,1)",
                  flexShrink: 0,
                  lineHeight: 1.1
                }}
              >
                {mod.icon}
              </span>
              <span
                style={{
                  fontSize: 20,      // Bigger label text for clarity
                  marginLeft: 3,
                  color: selected ? "var(--base-accent,#ff9800)" : "var(--text-color,#fdfeff)",
                  fontWeight: selected ? 950 : 750,
                  letterSpacing: ".014em",
                  flex: 1,
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  opacity: selected ? 1 : 0.93,
                  textShadow: selected
                    ? "0 1.5px 13px #ffad4268"
                    : undefined,
                  lineHeight: 1.22,
                  paddingRight: 22, // Matches increased icon gap
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
          width: "97%",
          height: 3,
          background: "linear-gradient(86deg,#1a1a1a 7%,#ffbb4e8a 62%,#181a1f 100%)",
          opacity: isOpen ? 0.45 : 0,
          borderRadius: 11,
          marginBottom: 27,
          marginTop: 26,
          transition: "opacity .22s"
        }} />
    </nav>
  );
}

export default Sidebar;
