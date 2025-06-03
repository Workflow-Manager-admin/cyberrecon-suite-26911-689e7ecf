import React from "react";

/**
 * HeaderBar
 * The premium top header for CyberRecon Suite.
 * Features:
 *  - Modern, glassy (blur+gradient) or optionally sharp minimal style.
 *  - Strong branding and logo (left), About/placeholder(right).
 *  - True black/dark premium theme, shadow, and branded accent.
 *  - Designed for mobile/desktop, aligns visually with Sidebar/TabbedWorkspace.
 * 
 * Props:
 *   onAboutClick: optional handler for About/info button.
 *   logoSrc: optional logo image (SVG/PNG) (if not provided, fallback to emoji/lettermark).
 */
 // PUBLIC_INTERFACE
function HeaderBar({ onAboutClick, logoSrc }) {
  // Responsive: reduce logo size/font on mobile (<700px)
  // Uses backdrop-filter for glass effect if supported, else sharp minimal.
  // You can customize logoSrc by passing a prop or update the asset.
  return (
    <header
      className="headerbar"
      role="banner"
      style={{
        width: "100%",
        height: 61,
        minHeight: 48,
        display: "flex",
        alignItems: "center",
        gap: 0,
        background:
          "linear-gradient(90deg,rgba(13,14,18,0.92) 43%,rgba(21,22,29,0.85) 100%)",
        borderBottom: "2.3px solid var(--border-color)",
        boxShadow:
          "0 9px 39px -19px #000d, 0 2px 16px -2px #ff980032, 0 1.5px 9px 0 #26263e30",
        position: "sticky",
        top: 0,
        zIndex: 15,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        userSelect: "none",
        padding: "0 max(18px,2vw)",
        margin: 0
      }}
    >
      {/* App Logo & Name */}
      <span
        className="headerbar-logo"
        aria-label="CyberRecon Suite"
        style={{
          display: "flex",
          alignItems: "center",
          fontWeight: 900,
          fontFamily: "var(--font-main)",
          fontSize: 26,
          letterSpacing: ".03em",
          color: "var(--base-light)",
          textShadow: "0 2.5px 22px #ffad429f, 0 1.2px 8px #1b2557",
          lineHeight: 1,
        }}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="CyberRecon Suite logo"
            height={36}
            width={36}
            style={{
              display: "inline-block",
              marginRight: 13,
              verticalAlign: "middle",
              filter:
                "drop-shadow(0 0 26px #ff980035) drop-shadow(0 0 7px #444a)",
              borderRadius: 12,
              background: "#141419"
            }}
          />
        ) : (
          <span
            className="logo-symbol"
            aria-hidden="true"
            style={{
              fontSize: 29,
              marginRight: 13,
              textShadow:
                "0 2.5px 22px #ffad429a, 0 2px 9px #1b2557a1",
              color: "var(--base-light)"
            }}
          >
            🛰️
          </span>
        )}
        <span
          className="headerbar-title"
          style={{
            fontSize: 21,
            color: "var(--base-light)",
            fontWeight: 900,
            letterSpacing: ".028em",
            marginRight: 8
          }}
        >
          CyberRecon <span style={{
            color: "#ffad42",
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "-0.01em"
          }}>Suite</span>
        </span>
      </span>
      {/* Optional: Visual divider bar */}
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 1.7,
          height: 32,
          background: "linear-gradient(180deg,var(--base-accent),transparent)",
          marginLeft: 18,
          opacity: 0.42,
          borderRadius: 2,
          marginRight: 18
        }}
      ></span>
      {/* Placeholder for future: module/page name, search, etc. */}
      <span style={{ flex: 1 }} />
      {/* Action - About or User button */}
      <button
        className="headerbar-about-btn"
        aria-label="About CyberRecon Suite"
        onClick={onAboutClick}
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
        onMouseOver={e =>
          (e.currentTarget.style.background = "var(--base-accent)")
        }
        onMouseOut={e =>
          (e.currentTarget.style.background = "rgba(255,152,0,0.15)")
        }
      >
        About
      </button>
    </header>
  );
}

export default HeaderBar;
