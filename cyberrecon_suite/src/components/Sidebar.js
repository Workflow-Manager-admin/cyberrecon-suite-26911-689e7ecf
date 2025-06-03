import React from "react";
import logo from "../assets/cyberrecon-logo.svg";

/**
 * Sidebar: Compact, premium, modern navigation for CyberRecon Suite.
 * Sleek by default: reduced width, dark glass, crisp icons, pill buttons, perfect a11y/tab order.
 * Accepts:
 *   - isOpen: boolean
 *   - onClose: function (optional)
 *   - width: number (optional)
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
  // More compact, premium width by default
  // NOTE: Keep in sync with App.js
  const SIDEBAR_WIDTH = width || 76;

  // Inline styles for glass/premium effect
  const sidebarPalette = {
    background: "linear-gradient(98deg,#181921 86%,#191c22 100%)",
    borderRight: isOpen ? "2.3px solid var(--border-color,#232226)" : "none",
    color: "var(--text-secondary)",
    width: SIDEBAR_WIDTH,
    minWidth: SIDEBAR_WIDTH,
    maxWidth: SIDEBAR_WIDTH,
    boxShadow: isOpen
      ? "0 10px 38px -17px #000a, 2px 0 23px 2px #18181c44"
      : "none",
    zIndex: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: isOpen ? "21px 0 0 0" : "0",
    position: "relative",
    transform: isOpen ? `translateX(0)` : `translateX(-${SIDEBAR_WIDTH + 24}px)`,
    opacity: isOpen ? 1 : 0,
    transition:
      "transform .25s cubic-bezier(.42,1.41,.44,1), opacity 0.19s cubic-bezier(.64,1.18,.52,1)",
    minHeight: "100vh",
    pointerEvents: isOpen ? "auto" : "none",
    willChange: "transform,opacity"
  };

  // Close button hover/focus styling
  const closeBtnStyle = {
    position: "absolute",
    top: 12,
    right: 7,
    background: "rgba(40,38,22,0.91)",
    color: "#ffad42",
    border: "none",
    borderRadius: "9px",
    width: 29,
    height: 29,
    fontSize: 18,
    fontWeight: 800,
    boxShadow: "0 0px 5px #ff980055",
    cursor: "pointer",
    zIndex: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
    transition: "background .13s,color .13s"
  };

  // Modern premium nav button styling
  function navBtnStyle(selected) {
    return {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "60px",
      height: "62px",
      margin: "0 0 0 0",
      padding: "0",
      borderRadius: "13px",
      background: selected
        ? "linear-gradient(98deg,#1c1b23 55%,#181a23 99%)"
        : "rgba(28,28,37,0.687)",
      border: selected
        ? "2.7px solid var(--base-accent,#ff9800)"
        : "2px solid transparent",
      outline: selected ? "2.5px solid #ffbb4eb0" : "none",
      color: selected ? "var(--base-accent,#ff9800)" : "var(--text-secondary)",
      boxShadow: selected
        ? "0 2.5px 18px -4px #ff980045, 0 1.5px 10px #ffad4233"
        : "0 4px 9px -7px #191c2230",
      cursor: "pointer",
      marginBottom: 8,
      fontWeight: 750,
      fontSize: 15,
      letterSpacing: ".05em",
      transition: "background .13s,box-shadow .18s, border-color .13s, outline .13s"
    };
  }

  // Logo area: ultra compact, centered icon only
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
        >
          <span aria-hidden="true" style={{fontSize: 20}}>×</span>
        </button>
      )}

      {/* Ultra-compact logo at the top */}
      <div
        className="sidebar-logo"
        aria-label="CyberRecon Suite"
        tabIndex={-1}
        style={{
          width: 49,
          height: 49,
          marginBottom: 23,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "15px",
          background: "rgba(37,37,49,0.77)",
          border: "1.5px solid var(--border-color,#24222e)",
          boxShadow: "0 5px 22px -7px #ffad4216",
          opacity: isOpen ? 1 : 0,
          transition: "opacity .17s"
        }}
      >
        <img
          src={logo}
          alt="CyberRecon Suite Logo"
          width="37"
          height="37"
          style={{
            display: "block",
            maxHeight: 39,
            maxWidth: 39,
            filter: "drop-shadow(0 2.8px 19px #ffad42a7)"
          }}
          draggable={false}
        />
      </div>
      {/* Premium icon-only navigation */}
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
              onFocus={e => { e.target.style.background = "linear-gradient(97deg,#201c29 65%,#1e1938 100%)"; }}
              onBlur={e => { e.target.style.background = selected ? "linear-gradient(98deg,#1c1b23 55%,#181a23 99%)" : "rgba(28,28,37,0.687)"; }}
              role="menuitem"
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 28,
                  marginBottom: 1,
                  filter: selected ? "drop-shadow(0 0 8px #ff980099)" : "none",
                  textShadow: selected
                    ? "0 2px 12px #ff980042, 0 1.5px 7px #ffad4264"
                    : "0 1px 10px #11142822",
                  transition: "all .16s cubic-bezier(.22,.8,.43,1)"
                }}
              >
                {mod.icon}
              </span>
              <span
                style={{
                  fontSize: 11.7,
                  marginTop: 3,
                  letterSpacing: ".09em",
                  color: selected ? "var(--base-accent)" : "var(--text-tertiary)",
                  fontWeight: selected ? 850 : 510,
                  opacity: 0.84
                }}
                aria-hidden="true"
              >
                {mod.short}
              </span>
            </button>
          );
        })}
      </div>
      {/* Bottom divider bar */}
      <div
        aria-hidden="true"
        style={{
          marginTop: "auto",
          width: "77%",
          height: 2,
          background: "linear-gradient(86deg,#1a1a1a 7%,#ffbb4e8a 62%,#181a1f 100%)",
          opacity: isOpen ? 0.38 : 0,
          borderRadius: 8,
          marginBottom: 17,
          marginTop: 16,
          transition: "opacity .14s"
        }} />
      {/* Sidebar help/settings reserved icons can be added here for future UX */}
    </nav>
  );
}

export default Sidebar;
