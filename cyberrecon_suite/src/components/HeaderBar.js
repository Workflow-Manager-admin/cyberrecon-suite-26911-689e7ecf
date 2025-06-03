import React from "react";
import "../App.css";

// PUBLIC_INTERFACE
/**
 * HeaderBar: Premium Modern Header for CyberRecon Suite.
 * - Glassy/blurred or sharply minimal look for OLED-true black theme.
 * - Bold brand/title, placeholder for new logo design.
 * - About/Info button for modal/dialog integrations.
 *
 * Props:
 *   - onAboutClick: function to open About modal.
 */
function HeaderBar({ onAboutClick }) {
  return (
    <header
      className="headerbar"
      role="banner"
      aria-label="Application header"
      style={{
        // The App.css .headerbar class covers most needed styles.
        // Inline styles only augment for current step (logo slot, height, etc.).
        minHeight: 58,
        height: 58,
        position: "sticky",
        top: 0,
        left: 0,
        width: "100vw",
        background:
          "linear-gradient(90deg,rgba(13,14,18,0.97) 44%,rgba(21,22,29,0.83) 100%)",
        borderBottom: "2.3px solid var(--border-color)",
        padding: "0 max(18px,2vw)",
        zIndex: 15,
        display: "flex",
        alignItems: "center",
        gap: 0,
        userSelect: "none",
        boxShadow:
          "0 9px 39px -19px #000d, 0 2px 16px -2px #ff980032, 0 1.5px 9px 0 #26263e30",
        backdropFilter: "blur(18px)"
      }}
    >
      {/* Logo area: SVG or placeholder for future logo */}
      <div
        className="headerbar-logo"
        style={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          height: 46,
          minWidth: 46,
          width: 54,
          justifyContent: "center",
          borderRadius: "14px",
          marginRight: 21,
          background: "linear-gradient(92deg,#181d1c 60%,#1b1e27 100%)",
          border: "1.2px solid var(--border-color)",
          boxShadow:
            "0 2.3px 18px #1f293744, 0 1.2px 7px #ffad4255",
          transition: "background .19s"
        }}
        aria-label="App logo"
        tabIndex={-1}
      >
        {/* TODO: Replace with final SVG logo asset */}
        <span
          aria-hidden="true"
          style={{
            fontSize: 29,
            color: "var(--base-light)",
            filter: "drop-shadow(0 0 12px #ffad4293)",
            fontWeight: 900,
            textShadow: "0 3.2px 19px #e87a4199"
          }}
        >
          🛰️
        </span>
      </div>

      {/* App Title and Tagline (strong contrast, premium) */}
      <div
        className="headerbar-title"
        style={{
          fontSize: 21,
          fontWeight: 900,
          letterSpacing: ".018em",
          color: "var(--base-light)",
          lineHeight: 1,
          marginRight: 14,
          textShadow:
            "0 2.5px 28px #ffad429a, 0 1.2px 8px #131324cc"
        }}
      >
        CyberRecon Suite
      </div>
      <div
        style={{
          fontSize: 15.5,
          color: "var(--text-secondary)",
          letterSpacing: ".011em",
          fontWeight: 600,
          marginTop: 2,
          opacity: 0.90,
          marginRight: 10,
          textShadow: "0 1.5px 7px #23285975"
        }}
        aria-label="Brand tagline"
      >
        Modular Recon • Scanning • Exploitation
      </div>
      {/* Premium badge */}
      <span
        style={{
          fontSize: 13.3,
          marginLeft: 7,
          color: "#ffb976",
          background:
            "linear-gradient(92deg,#21170f 25%,#ffad4233 95%)",
          borderRadius: 16,
          padding: "4px 17px",
          fontWeight: 870,
          opacity: 0.93,
          letterSpacing: ".1em",
          boxShadow: "0 3.5px 16px -2px #ffad4232",
          border: "1.2px solid #ffbe4280"
        }}
        aria-label="Premium version"
      >
        PREMIUM
      </span>
      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* About/Info Button */}
      <button
        className="headerbar-about-btn"
        type="button"
        aria-label="About"
        tabIndex={0}
        style={{
          marginLeft: 8,
          background: "rgba(255,152,0,0.15)",
          color: "var(--base-accent)",
          fontWeight: 800,
          fontSize: 17,
          borderRadius: 7.5,
          border: "none",
          padding: "8px 25px",
          boxShadow: "0 2px 11px -2px #361c0251",
          cursor: "pointer",
          outline: "none",
          letterSpacing: ".01em",
          transition: "background .13s, color .12s"
        }}
        onClick={onAboutClick}
      >
        <span aria-hidden="true" style={{ marginRight: 6, fontSize: 22, verticalAlign: "middle" }}>
          ℹ️
        </span>
        About
      </button>
    </header>
  );
}

export default HeaderBar;
