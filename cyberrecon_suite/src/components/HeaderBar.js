import React from "react";
import "../App.css";

/**
 * PUBLIC_INTERFACE
 * HeaderBar: Premium suite header for CyberRecon Suite, featuring
 * - Modern glass/blur/true-black look
 * - Prominent branding: CyberRecon Suite (primary) & Cyberhash (sub-brand)
 * - Integrated logo (SVG, styled and accessible)
 * - Responsive, sticky, bold, visually premium
 */
function HeaderBar({ onAboutClick }) {
  return (
    <header
      className="headerbar"
      style={{
        background: "var(--glass-overlay, linear-gradient(90deg,rgba(13,14,18,0.95) 44%,rgba(21,22,29,0.88) 100%))",
        borderBottom: "2.3px solid var(--border-color)",
        boxShadow: "0 9px 39px -19px #000d, 0 2px 16px -2px #ff980032, 0 1.5px 9px 0 #26263e30",
        position: "sticky",
        top: 0,
        zIndex: 15,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        minHeight: 48,
        gap: 0,
        padding: "0 max(18px,2vw)",
        margin: 0,
      }}
      tabIndex={0}
      role="banner"
      aria-label="Application header and branding"
    >
      {/* LOGO: SVG Cyber-themed (satellite or hexagon cyber grid badge) */}
      <span
        className="headerbar-logo"
        aria-label="App logo"
        style={{
          display: "flex",
          alignItems: "center",
          fontWeight: 900,
          fontFamily: "var(--font-main)",
          fontSize: 26,
          color: "var(--base-light)",
          marginRight: 17,
          lineHeight: 1,
          letterSpacing: ".03em",
          height: 39,
          width: 48,
          flexShrink: 0,
          filter: "drop-shadow(0 3px 16px #ffad4266)",
          userSelect: "none"
        }}
      >
        {/* SVG: Minimal, sharp hex/circuit + check/satellite hybrid (cyber visual cue) */}
        <svg
          viewBox="0 0 38 38"
          width="35"
          height="35"
          style={{marginRight: 7}}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable={false}
        >
          <defs>
            <radialGradient id="logoBg" cx="50%" cy="50%" r="60%">
              <stop offset="20%" stopColor="#ffb85c" />
              <stop offset="80%" stopColor="#ff9800" />
              <stop offset="100%" stopColor="#191a1f" />
            </radialGradient>
          </defs>
          <polygon
            points="19,2 36,11.5 36,27 19,36 2,27 2,11.5"
            fill="url(#logoBg)"
            stroke="#ffad42"
            strokeWidth="2"
            opacity="0.91"
          />
          {/* Inner cyberhash check/tick/circuit lines for "cyber-recon" reference */}
          <polyline
            points="10,18 18,27.4 28,12"
            fill="none"
            stroke="#fff8df"
            strokeWidth="2.7"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="drop-shadow(0 0 8px #ffbe4257)"
          />
          {/* Dot accent */}
          <circle cx="28" cy="12" r="2.1" fill="#ffad42" />
        </svg>
      </span>

      {/* MAIN BRAND SECTION */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          flex: 1
        }}
      >
        <div
          className="headerbar-title"
          aria-label="CyberRecon Suite branding"
          style={{
            fontSize: 21,
            color: "var(--base-light)",
            fontWeight: 900,
            letterSpacing: ".028em",
            marginRight: 8,
            textShadow: "0 4px 28px #ffad4283, 0 1.2px 8px #1b2557",
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center"
          }}
        >
          CyberRecon <span style={{
            color: "#fffbee",
            fontWeight: 800,
            fontSize: 19,
            marginLeft: 6,
            padding: "1px 12px 1px 9px",
            background: "linear-gradient(88deg,rgba(255,190,66,0.17) 47%,rgba(45,48,54,0.13) 100%)",
            borderRadius: 8,
            letterSpacing: ".019em",
            marginTop: -2,
            textShadow: "0 1.4px 9px #ffad4285"
            }}>
            Suite
          </span>
        </div>
        <div
          style={{
            fontSize: 13.7,
            color: "var(--text-secondary)",
            opacity: 0.72,
            marginTop: 2,
            marginLeft: 2,
            fontWeight: 600,
            letterSpacing: ".04em",
            textShadow: "0 1px 7px #1a232a99",
            textTransform: "uppercase",
            lineHeight: 1.0
          }}
        >
          Powered by <span style={{
            color: "#ffad42",
            fontWeight: 700,
            letterSpacing: ".06em",
            marginLeft: 2.5
          }}>
            Cyberhash
          </span>
        </div>
      </div>

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* Optionally add About or Help button; modern, accented */}
      <button
        className="headerbar-about-btn"
        style={{
          background: "rgba(255,152,0,0.15)",
          color: "var(--base-accent)",
          fontWeight: 800,
          fontSize: 17,
          borderRadius: "7.5px",
          border: "none",
          padding: "8px 25px",
          marginLeft: 9,
          boxShadow: "0 2px 11px -2px #361c0251",
          cursor: "pointer",
          outline: "none",
          letterSpacing: ".01em",
          transition: "background .13s, color .12s"
        }}
        onClick={onAboutClick}
        tabIndex={0}
        aria-label="About CyberRecon Suite"
      >
        About
      </button>
    </header>
  );
}

export default HeaderBar;
