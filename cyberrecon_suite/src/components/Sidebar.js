import React from "react";
import logo from "../assets/cyberrecon-logo.svg";

/**
 * Sidebar: COMPACT, icon-focused, dark, premium navigation for CyberRecon Suite.
 * Visually tight, ~92px wide, sharp icons, subtle glass, animated, accessible focus/active nav.
 * Props:
 *   - isOpen: boolean (open/close state)
 *   - onClose: function (sidebar collapse)
 *   - width: number (optional, default 92)
 *   - modules, activeModule, onModuleSelect
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
  // Compact premium sidebar width: 92px (sync with App.js)
  const SIDEBAR_WIDTH = width || 92;

  // PALLETTE: Improved dark glass overlay with accent for focus/active
  const sidebarPalette = {
    background: "linear-gradient(102deg,#181a21 92%,#181b22 100%)",
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
    padding: isOpen ? "20px 0 0 0" : "0",
    position: "relative",
    minHeight: "100vh",
    pointerEvents: isOpen ? "auto" : "none",
    willChange: "transform,opacity",
    transform: isOpen ? `translateX(0)` : `translateX(-${SIDEBAR_WIDTH + 38}px)`,
    opacity: isOpen ? 1 : 0,
    transition:
      "transform .35s cubic-bezier(.62,1.52,.33,1), opacity 0.23s cubic-bezier(.64,1.18,.52,1)"
  };

  // CLOSE BUTTON: enlarged, crisp for a compact sidebar, strong focus outline
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

  // NAV BUTTON: compact, accessible, high contrast, sleek active/focus animation
  function navBtnStyle(selected) {
    return {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "72px",
      height: "70px",
      margin: "0 0 0 0",
      padding: 0,
      borderRadius: "18px",
      background: selected
        ? "linear-gradient(98deg,#262532 55%,#1c1c27 99%)"
        : "rgba(25,25,34,0.83)",
      border: selected
        ? "2.9px solid var(--base-accent,#ff9800)"
        : "2px solid transparent",
      outline: selected ? "2.5px solid #ffb959b0" : "none",
      color: selected ? "var(--base-accent,#ff9800)" : "var(--text-secondary)",
      boxShadow: selected
        ? "0 2.5px 12px -2px #ff980045, 0 1.5px 8px #ffad4266"
        : "0 3.5px 15px -9px #191c2233",
      cursor: "pointer",
      marginBottom: 5,
      fontWeight: 758,
      fontSize: 15,
      letterSpacing: ".04em",
      transition: "background .19s, box-shadow .22s, border-color .15s, outline .13s"
    };
  }

  // Visually compact logo at the top
  return (
    <nav
      className="sidebar"
      aria-label="Main module navigation"
      tabIndex={isOpen ? 0 : -1}
      role="navigation"
      aria-hidden={!isOpen}
      style={sidebarPalette}
    >
      {/* Slide-close toggle */}
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
          onFocus={e => (e.target.style.boxShadow = "0 0 0 3.5px #ff980077")}
          onBlur={e => (e.target.style.boxShadow = closeBtnStyle.boxShadow)}
        >
          <span aria-hidden="true" style={{ fontSize: 22, marginBottom: -2 }}>×</span>
        </button>
      )}

      {/* PREMIUM COMPACT LOGO */}
      <div
        className="sidebar-logo"
        aria-label="CyberRecon Suite"
        tabIndex={-1}
        style={{
          width: 53,
          height: 53,
          marginBottom: 31,
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
      {/* ICON NAVIGATION */}
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
      >
        {modules.map((mod, idx) => {
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
                e.target.style.background = "linear-gradient(96deg,#262434 64%,#262034 100%)";
                e.target.style.outline = "3px solid #ffb959";
              }}
              onBlur={e => {
                e.target.style.background = selected
                  ? "linear-gradient(98deg,#262532 55%,#1c1c27 99%)"
                  : "rgba(25,25,34,0.83)";
                e.target.style.outline = selected ? "2.5px solid #ffb959b0" : "none";
              }}
              role="menuitem"
              aria-pressed={selected}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 30,
                  marginBottom: 2,
                  filter: selected ? "drop-shadow(0 0 12px #ff9800b0)" : "none",
                  textShadow: selected
                    ? "0 2px 14px #ff980042, 0 1.5px 7px #ffad426c"
                    : "0 1px 8px #11142822",
                  transition: "all .22s cubic-bezier(.22,.8,.43,1)"
                }}
              >
                {mod.icon}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  marginTop: 5,
                  letterSpacing: ".11em",
                  color: selected ? "var(--base-accent)" : "var(--text-tertiary)",
                  fontWeight: selected ? 850 : 510,
                  opacity: 0.94,
                  textShadow: selected
                    ? "0 1.5px 9px #ffad4247"
                    : undefined,
                }}
                aria-hidden="true"
              >
                {mod.short}
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
          width: "83%",
          height: 2,
          background: "linear-gradient(86deg,#1a1a1a 7%,#ffbb4e8a 62%,#181a1f 100%)",
          opacity: isOpen ? 0.44 : 0,
          borderRadius: 8,
          marginBottom: 19,
          marginTop: 18,
          transition: "opacity .22s"
        }} />
      {/* Additional UX: future footer/help reserved here */}
    </nav>
  );
}

export default Sidebar;
