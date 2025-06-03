import React, { useState, useRef } from "react";

// PUBLIC_INTERFACE
/**
 * SmartFooter displays a minimal, auto-hiding footer that is always accessible via tab and keyboard navigation.
 * - Visible when hovered or focused (tab key).
 * - Hides/minimizes when not hovered/focused for distraction-free UI.
 * - Always reachable by keyboard for accessibility.
 */
function SmartFooter() {
  const [visible, setVisible] = useState(false);
  const footerRef = useRef();

  // Show on hover/focus, hide on blur/mouseleave
  const showFooter = () => setVisible(true);
  const hideFooter = (e) => {
    // Don't hide on blur if the new active element is inside the footer
    if (
      e &&
      e.relatedTarget &&
      footerRef.current &&
      footerRef.current.contains(e.relatedTarget)
    ) {
      return;
    }
    setVisible(false);
  };

  return (
    <footer
      className={visible ? "smart-footer smart-footer--visible" : "smart-footer"}
      ref={footerRef}
      tabIndex={0}
      aria-label="Created by Cyberhash"
      onFocus={showFooter}
      onBlur={hideFooter}
      onMouseEnter={showFooter}
      onMouseLeave={hideFooter}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100vw",
        zIndex: 60,
        outline: "none",
        pointerEvents: "all",
        transition: "transform 0.18s cubic-bezier(.23,1.36,.62,1), opacity 0.20s",
        transform: visible
          ? "translateY(0)"
          : "translateY(67%)", // slide off bottom when hidden, preserve accessibility
        opacity: visible ? 1 : 0.72,
        background:
          "linear-gradient(90deg, rgba(30,32,40,0.85) 70%, rgba(0,0,0,0.89) 100%)",
        color: "var(--base-accent, #ff9800)",
        fontSize: "15px",
        fontWeight: 700,
        letterSpacing: ".023em",
        // Slight glass effect
        backdropFilter: "blur(7px)",
        WebkitBackdropFilter: "blur(7px)",
        borderTop: "1.6px solid var(--border-color, #fff2)",
        boxShadow:
          "0 -9px 34px -12px #1a1a1a90, 0 -1.3px 11px -2px #ff980033, 0 -1px 7px 0 #25253a40",
        padding: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: visible ? 38 : 19, // small strip when hidden
        cursor: "pointer",
        userSelect: "none",
        outlineColor: visible ? "var(--focus-visible-ring,#ffb85c)" : "none",
      }}
      tabIndex={0} // Always tabbable for accessibility
      role="contentinfo"
      onKeyDown={e => {
        // Dismiss on Escape key
        if (e.key === "Escape" || e.keyCode === 27) setVisible(false);
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          opacity: visible ? 1 : 0.64,
          fontSize: visible ? 15 : 0,
          minHeight: 18,
          transition: "font-size .19s, opacity .13s",
        }}
      >
        <svg
          aria-hidden="true"
          width={22}
          height={22}
          viewBox="0 0 26 26"
          style={{
            marginRight: 7,
            verticalAlign: "middle",
            display: visible ? "inline" : "none",
            filter: "drop-shadow(0 2px 9px #ff980066)"
          }}
        >
          <defs>
            <radialGradient id="cyhbrand" cx="70%" cy="30%" r="90%">
              <stop offset="0%" stopColor="#ffad42" />
              <stop offset="100%" stopColor="#ff9800" />
            </radialGradient>
          </defs>
          <circle cx="13" cy="13" r="11.5"
            fill="url(#cyhbrand)" stroke="#432304" strokeWidth="1.7"
          />
          <path
            d="M7.33 12.6Q10.3 12 13 19.3 15.75 12 18.7 12.55 17 9 13 8.8q-4 0.19-5.67 3.8z"
            fill="#fff"
            fillOpacity=".86"
          />
          <circle cx="13" cy="13.05" r="7.2" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth=".65" />
        </svg>
        <span style={{
          fontSize: "inherit",
          color: "inherit",
          fontWeight: "bold",
          userSelect: "none",
          textShadow: visible ? "0 1.3px 10px #ffb94381": "unset"
        }}>
          Created by Cyberhash
        </span>
      </span>
      {/* Minimized pill when hidden, for discoverability, but not intrusive */}
      {!visible && (
        <span
          aria-hidden="true"
          style={{
            height: 4, width: 58,
            borderRadius: 5, background: "var(--border-color, #fff3)",
            margin: "0 auto",
            position: "absolute", left: "calc(50% - 29px)", bottom: 7,
            opacity: 0.4,
            pointerEvents: "none",
          }}
        />
      )}
    </footer>
  );
}

export default SmartFooter;
