import React from "react";
import "../App.css";

/**
 * Modern, bold headerbar for CyberRecon Suite.
 * Features:
 * - Visually striking SVG brand logo with a glassy glow OR sharp minimal fallback if SVG unsupported.
 * - Strong brand colors, clean left alignment, contrast title.
 * - Responsive: brand/logo stack on mobile, maintains full accessibility.
 * - Seamless visual continuity with sidebar (color, depth, shadow).
 * - "About" button styled in premium accent for click.
 */
// PUBLIC_INTERFACE
function HeaderBar({ onAboutClick }) {
  return (
    <header
      className="headerbar"
      style={{
        width: "100%",
        background: "var(--glass-overlay)",
        borderBottom: "2.3px solid var(--border-color)",
        boxShadow:
          "0 9px 39px -19px #000d, 0 2px 16px -2px #ff980032, 0 1.5px 9px 0 #26263e30",
        position: "sticky",
        top: 0,
        zIndex: 15,
        display: "flex",
        alignItems: "center",
        gap: 0,
        padding: "0 max(18px,2vw)",
        margin: 0,
        minHeight: 48,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        userSelect: "none",
      }}
      role="banner"
      aria-label="Application header"
      tabIndex={0}
      data-testid="headerbar"
    >
      {/* SVG App Logo with glass/minimal effects */}
      <span
        className="headerbar-logo"
        aria-label="CyberRecon Suite logo"
        tabIndex={-1}
        style={{
          display: "flex",
          alignItems: "center",
          fontWeight: 900,
          fontFamily: "var(--font-main)",
          fontSize: 26,
          letterSpacing: ".03em",
          color: "var(--base-light)",
          textShadow:
            "0 2.5px 22px #ffad429f, 0 1.2px 8px #1b2557",
          lineHeight: 1,
          marginRight: 15,
          transition: "font-size 0.13s",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 11,
          }}
        >
          {/* Visually bold SVG logo: radar/dish over accent arc-glow, premium icon */}
          <svg
            width="39"
            height="39"
            viewBox="0 0 39 39"
            style={{
              display: "block",
              filter: "drop-shadow(0 3px 17px #ffeeb305)",
            }}
            aria-hidden="true"
            focusable="false"
          >
            {/* Glassy arc background */}
            <ellipse
              cx="19.5"
              cy="19.5"
              rx="17.5"
              ry="17"
              fill="url(#logoGlassGrad)"
              stroke="#ffad42"
              strokeWidth="1.45"
              opacity="0.99"
            />
            {/* Radar dish stylized */}
            <g>
              <rect
                x="16"
                y="21.5"
                width="7"
                height="9"
                rx="3.5"
                fill="url(#dishGrad)"
                stroke="#ff9800"
                strokeWidth="1.1"
                opacity="0.91"
              />
              <ellipse
                cx="19.5"
                cy="21.5"
                rx="5.25"
                ry="1.75"
                fill="#ffad42"
                opacity="0.17"
              />
              <circle
                cx="19.5"
                cy="21.5"
                r="2"
                fill="#ffe88c"
                opacity="0.72"
                stroke="#ffd986"
                strokeWidth="0.8"
              />
              {/* Antenna */}
              <rect
                x="19"
                y="11"
                width="1"
                height="11"
                rx="0.5"
                fill="#ffe09a"
                opacity="0.91"
              />
              <circle
                cx="19.5"
                cy="10"
                r="2.2"
                fill="url(#ballGrad)"
                opacity="1"
                stroke="#f4be6b"
                strokeWidth="0.6"
              />
            </g>
            {/* Radar sweep lines */}
            <path
              d="M20 25 Q27 22, 30 10"
              stroke="#ff9800"
              strokeWidth="0.5"
              fill="none"
              opacity="0.41"
              strokeDasharray="3,3"
            />
            <path
              d="M19 25 Q13 20, 6 19"
              stroke="#f8c676"
              strokeWidth="0.48"
              fill="none"
              opacity="0.29"
              strokeDasharray="2,3"
            />

            <defs>
              <radialGradient id="logoGlassGrad">
                <stop offset="5%" stopColor="#ffad42" stopOpacity="1" />
                <stop offset="82%" stopColor="#16191e" stopOpacity="0.93" />
                <stop offset="100%" stopColor="#171921" stopOpacity="1" />
              </radialGradient>
              <linearGradient
                id="dishGrad"
                x1="0"
                x2="0"
                y1="1"
                y2="0"
                gradientUnits="objectBoundingBox"
              >
                <stop offset="0%" stopColor="#ffad42" />
                <stop offset="97%" stopColor="#171921" />
              </linearGradient>
              <radialGradient id="ballGrad">
                <stop offset="0%" stopColor="#ffffee" />
                <stop offset="55%" stopColor="#ffe88c" />
                <stop offset="100%" stopColor="#ff9800" />
              </radialGradient>
            </defs>
          </svg>
        </span>
        <span
          className="headerbar-title"
          style={{
            fontSize: 21,
            color: "var(--base-light)",
            fontWeight: 900,
            letterSpacing: ".028em",
            marginRight: 8,
            textShadow:
              "0 2px 20px #1a100c80, 0 1.5px 8px #ff9f2820",
            background:
              "linear-gradient(91deg, #ffe88c 10%, #ffad42 65%, #ff9800 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "inline-block",
            lineHeight: 1.15,
          }}
        >
          CyberRecon
        </span>
        <span
          style={{
            fontSize: 13,
            background:
              "linear-gradient(95deg,#181a30 30%,#ff9800 120%)",
            color: "#fafbfc",
            fontWeight: 800,
            borderRadius: 13,
            padding: "3.5px 11px",
            marginLeft: 3,
            letterSpacing: ".12em",
            opacity: 0.89,
            border: "1.1px solid #ffad4291",
            boxShadow: "0 3.5px 21px -6px #ffb84433",
            verticalAlign: "middle",
            lineHeight: 1.15,
            whiteSpace: "nowrap",
          }}
          aria-label="Suite"
        >
          SUITE
        </span>
      </span>
      {/* Spacer */}
      <span style={{ flex: 1, minWidth: 0 }} />
      {/* Optional: about/info, future settings area */}
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
          transition: "background .13s, color .12s",
        }}
        onClick={onAboutClick}
        tabIndex={0}
        aria-label="About CyberRecon Suite"
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") onAboutClick?.();
        }}
      >
        <span
          role="img"
          aria-hidden="true"
          style={{
            fontSize: 18,
            marginRight: 7,
            verticalAlign: "middle",
          }}
        >
          🛈
        </span>
        About
      </button>
    </header>
  );
}

export default HeaderBar;
