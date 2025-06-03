import React from "react";

/**
 * Modern, bold HeaderBar: premium glassy style with strong branding, logo area, and visual pop.
 * - Glass/blur/frosted overlay blends into true-black theme.
 * - Logo placeholder is left-aligned, bold, and sized to support a future SVG or PNG logo (or integrates brand emoji for now).
 * - Typography: Ultra-bold, high-contrast orange/gold accent.
 * - Complements Sidebar and Dashboard (sharp minimal, premium visual hierarchy).
 * - Responsive for future logo/icon integration.
 *
 * Props:
 *   - onAboutClick: function to trigger About modal.
 */
// PUBLIC_INTERFACE
function HeaderBar({ onAboutClick }) {
  return (
    <header
      className="headerbar"
      role="banner"
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        background: "var(--glass-overlay, linear-gradient(90deg,rgba(13,14,18,0.92) 44%,rgba(21,22,29,0.82) 100%))",
        borderBottom: "2.3px solid var(--border-color)",
        boxShadow:
          "0 9px 39px -19px #000d, 0 2px 16px -2px #ff980032, 0 1.5px 9px 0 #26263e30",
        minHeight: 54,
        position: "sticky",
        top: 0,
        zIndex: 15,
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        padding: "0 max(18px,2vw)",
        gap: 0,
        width: "100%",
        fontFamily: "var(--font-main)",
      }}
    >
      {/* Logo spot (app icon or SVG to be added in next step) */}
      <span
        className="headerbar-logo"
        aria-label="CyberRecon Suite Logo"
        tabIndex={-1}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 46,
          height: 46,
          minWidth: 46,
          minHeight: 46,
          marginRight: 17,
          borderRadius: 13,
          background: "linear-gradient(90deg,#23232e 60%,#191a1d 100%)",
          boxShadow: "0 5px 24px -9px #221c2999",
          border: "1.8px solid var(--border-color)",
          fontWeight: 900,
          fontSize: 32,
          color: "var(--base-light)",
          textShadow: "0 4px 17px #ffad4286, 0 1.7px 8px #1b2557cc",
          transition: "background .16s",
          overflow: "hidden",
        }}
      >
        {/* Place for app logo SVG; fallback to emoji */}
        <span
          aria-label="Logo"
          style={{
            fontSize: 34,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "90%",
            height: "90%",
            filter: "drop-shadow(0 0 7px #ffad4296)",
          }}
        >
          🛰️
        </span>
      </span>
      {/* App Title */}
      <span
        className="headerbar-title"
        aria-label="CyberRecon Suite"
        style={{
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: ".035em",
          color: "var(--base-light)",
          lineHeight: 1,
          textShadow: "0 2.5px 22px #ffad429f, 0 1.2px 8px #1b2557",
          marginRight: 9,
        }}
      >
        CyberRecon Suite
      </span>
      {/* Modern Beta/Premium badge, optional */}
      <span
        style={{
          background:
            "linear-gradient(90deg,#251a09 40%,#ffad4250 100%)",
          color: "#ffbe55",
          fontWeight: 850,
          letterSpacing: ".07em",
          fontSize: 13.5,
          borderRadius: 12,
          padding: "6px 17px",
          marginLeft: 2,
          marginRight: 10,
          opacity: 0.88,
          border: "1.5px solid #ffbe4290",
          boxShadow: "0 1.5px 9px -5px #ffae420a",
          display: "inline-flex",
          alignItems: "center",
          textShadow: "0 1.2px 8px #ffad4290",
        }}
        aria-label="Premium UI"
      >
        PREMIUM
      </span>
      {/* Spacer */}
      <span style={{ flex: 1 }} />
      <button
        type="button"
        className="headerbar-about-btn"
        aria-label="About"
        tabIndex={0}
        onClick={onAboutClick}
        style={{
          background: "rgba(255,152,0,0.15)",
          color: "var(--base-accent)",
          fontWeight: 800,
          fontSize: 17,
          borderRadius: 8,
          border: "none",
          padding: "10px 27px",
          marginLeft: 9,
          marginRight: -4,
          boxShadow: "0 2px 11px -2px #361c0251",
          cursor: "pointer",
          outline: "none",
          letterSpacing: ".01em",
          transition: "background .13s, color .12s",
          whiteSpace: "nowrap"
        }}
        onMouseOver={e => (e.target.style.background = "var(--base-accent)")}
        onFocus={e => (e.target.style.background = "var(--base-accent)")}
        onMouseOut={e => (e.target.style.background = "rgba(255,152,0,0.15)")}
        onBlur={e => (e.target.style.background = "rgba(255,152,0,0.15)")}
      >
        About
      </button>
    </header>
  );
}

export default HeaderBar;
