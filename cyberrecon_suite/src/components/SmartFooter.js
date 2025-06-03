import React, { useEffect, useRef, useState } from "react";

// PUBLIC_INTERFACE
/**
 * SmartFooter - Always accessible to keyboard, auto-hides except on hover/focus/tab.
 * Appears as a minimal bar at the bottom, overlays all app content.
 * - True black/dark premium theme, gold/orange accent.
 * - Accessible: focusable by tab, visible on :focus-visible.
 * - Responsive for both mouse and keyboard users.
 * - No pointer event block when hidden.
 */
function SmartFooter() {
  const [visible, setVisible] = useState(false);
  const footerRef = useRef();

  // Keyboard/tab focus detection (for accessibility)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Tab" || e.key === "Shift") {
        // If footer element is focused via tab key
        if (document.activeElement === footerRef.current) setVisible(true);
      }
    }
    function handleMouseMove() {
      setVisible(true);
      // Hide after x seconds if not focused.
      if (footerRef.current && !footerRef.current.contains(document.activeElement)) {
        clearTimeout(footerRef.current.__hideTimeout);
        footerRef.current.__hideTimeout = setTimeout(() => setVisible(false), 2200);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Handle hover/focus/blur/mouse leave: always show on focus/hover, hide when unfocused
  function showFooter() {
    setVisible(true);
    clearTimeout(footerRef.current?.__hideTimeout);
  }
  function hideFooter() {
    // Only hide if not focused (keyboard user should keep it visible)
    setTimeout(() => {
      if (
        footerRef.current &&
        document.activeElement !== footerRef.current
      ) {
        setVisible(false);
      }
    }, 350); // brief delay for keyboard users to engage focus
  }

  // Touch support: tap to show briefly
  useEffect(() => {
    function handleTouchStart() {
      showFooter();
      clearTimeout(footerRef.current?.__hideTimeout);
      footerRef.current.__hideTimeout = setTimeout(() => setVisible(false), 2200);
    }
    window.addEventListener("touchstart", handleTouchStart);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);

  // CSS class logic for auto-hide
  const cls =
    "smart-footer" +
    (visible ? " smart-footer--visible" : "");

  return (
    <footer
      ref={footerRef}
      className={cls}
      tabIndex={0}
      aria-label="Footer"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        zIndex: 9999,
        opacity: visible ? 1 : 0.85,
        pointerEvents: "all",
        transform: visible ? "translateY(0)" : "translateY(60%)",
        transition:
          "transform 0.18s cubic-bezier(.23,1.36,.62,1), opacity 0.2s, min-height .17s",
        outline: visible ? "2.5px solid var(--focus-visible-ring,#ffb85c)" : "none",
        background:
          "linear-gradient(90deg,rgba(30,32,40,0.93) 72%,rgba(0,0,0,0.98) 100%)",
        color: "var(--base-accent,#ff9800)",
        fontSize: "15px",
        minHeight: visible ? 38 : 16,
        fontWeight: 630,
        letterSpacing: ".024em",
        fontFamily: "var(--font-main, 'Inter', 'Roboto', 'Segoe UI', Arial, sans-serif)",
        borderTop: "1.5px solid var(--border-color,#fff2)",
        boxShadow:
          "0 -9px 34px -12px #1a1a1a90, 0 -1.3px 11px -2px #ff980033, 0 -1px 7px 0 #25253a40",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        outlineOffset: 0,
        userSelect: "none",
        willChange: "transform,opacity",
        padding: visible ? "8px 0" : "1.5px 0",
      }}
      onMouseEnter={showFooter}
      onMouseLeave={hideFooter}
      onFocus={showFooter}
      onBlur={hideFooter}
      onClick={showFooter}
      onTouchStart={showFooter}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: visible ? "15px" : "13px",
          opacity: visible ? 1 : 0.82,
          fontWeight: 680,
          gap: 7,
          letterSpacing: ".023em",
          textShadow:
            visible
              ? "0 2.5px 20px #ff980029, 0 1.2px 8px #19191a"
              : "none",
          transition: "opacity .18s, font-size .18s",
        }}
      >
        <span
          className="cyberhash-icon"
          aria-hidden="true"
          style={{
            display: "inline-block",
            verticalAlign: "middle",
            marginRight: "8px",
            width: "1.28em",
            height: "1.28em",
            filter: "drop-shadow(0 2px 11px #ff980066)",
            fontSize: visible ? "1.59em" : "1.11em",
          }}
        >
          {/* Gold/Orange Lock SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            style={{
              display: "block",
              width: "1em",
              height: "1em",
              verticalAlign: "middle",
            }}
          >
            <rect
              x="6"
              y="10"
              width="10"
              height="7"
              rx="2.4"
              fill="url(#footerGoldGrad1)"
              stroke="#ff9800"
              strokeWidth="1.1"
            />
            <path
              d="M11 3.8c2.49 0 4.5 2.01 4.5 4.5v1.8"
              stroke="#ffad42"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <circle
              cx="11"
              cy="14"
              r="1.18"
              fill="#fff1b6"
              stroke="#ffad42"
              strokeWidth="0.6"
            />
            <defs>
              <linearGradient
                id="footerGoldGrad1"
                x1="6"
                y1="10"
                x2="16"
                y2="17"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#ff9800" />
                <stop offset="1" stopColor="#201a12" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span>
          Created by <b style={{
            color: "#ffd580",
            fontWeight: 900,
            textShadow: "0 1.2px 11px #ffad4279",
            letterSpacing: ".018em"
          }}>
            Cyberhash
          </b>
        </span>
      </span>
    </footer>
  );
}

export default SmartFooter;
