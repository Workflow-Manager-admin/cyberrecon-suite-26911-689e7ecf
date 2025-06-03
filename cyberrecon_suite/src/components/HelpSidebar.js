import React from "react";

/**
 * Premium-styled HelpSidebar overlay component, toggled by floating help button.
 * Accepts summary/usage/description as props (JSX or string).
 * Props:
 *  - summary: page/module summary text
 *  - usage: typical usage/tips JSX
 *  - description: detailed help/guide JSX
 *  - placement: "inline" | "fixed" | "overlay"
 *  - style: style overrides (applied to the overlay sidebar content)
 *  - buttonAriaLabel: accessible label for the floating help button
 */
// PUBLIC_INTERFACE
function HelpSidebar({
  summary = "Page Guide",
  usage,
  description,
  placement = "fixed",
  style = {},
  buttonAriaLabel = "Open help panel"
}) {
  const [open, setOpen] = React.useState(false);

  // Only "inline" mode skips overlay/floating button
  if (placement === "inline") {
    return (
      <aside
        className="help-sidebar"
        tabIndex={0}
        aria-label="Help and Guide"
        style={{
          background: "var(--sidebar-dark)",
          borderRadius: 12,
          boxShadow: "0 7px 29px -8px #25263a80",
          padding: "27px 24px",
          marginBottom: 26,
          color: "var(--text-color)",
          ...style
        }}
      >
        <header style={{
          fontWeight: 830,
          color: "var(--base-accent)",
          fontSize: 19,
          marginBottom: 9
        }}>
          <span style={{ marginRight: 8 }}>❓</span>
          {summary}
        </header>
        {usage && (
          <aside style={{
            color: "#aafacf",
            fontSize: 15.2,
            marginBottom: 8,
            marginTop: 1,
            fontWeight: 600
          }}>
            <span style={{ marginRight: 7 }}>💡</span>
            {usage}
          </aside>
        )}
        <div style={{ fontSize: 14.3, color: "var(--text-secondary)", lineHeight: 1.61 }}>
          {description}
        </div>
      </aside>
    );
  }

  // Floating help button (always present in overlay/fixed)
  // Uses ARIA label and a premium modern UI, floats at top-right
  return (
    <>
      <button
        type="button"
        className="help-fab"
        aria-label={buttonAriaLabel || "Open help panel"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        style={{
          position: "fixed",
          top: 28,
          right: 34,
          zIndex: 1065,
          width: 46,
          height: 46,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 63% 23%, #22272e 56%, #000 104%)",
          border: "2.5px solid var(--base-accent, #ff9800)",
          color: "var(--base-accent, #ff9800)",
          fontSize: 23,
          fontWeight: 800,
          boxShadow: "0 3.3px 29px -5px #381f0e1f, 0 1.4px 7px #1612154a",
          outline: open
            ? "2.5px solid var(--base-light, #ffad42)"
            : "none",
          cursor: "pointer",
          transition: "box-shadow 0.19s, background 0.13s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        }}
        tabIndex={0}
      >
        <span aria-hidden="true">❓</span>
      </button>

      {open && (
        <aside
          className="help-sidebar-overlay"
          role="dialog"
          tabIndex={-1}
          aria-modal="true"
          aria-label="Page Help and Guide"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2001,
            background: "rgba(0,0,0,0.66)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            pointerEvents: "auto"
          }}
          onClick={e => {
            // Click on backdrop closes
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <section
            tabIndex={0}
            style={{
              marginTop: 44,
              marginRight: 32,
              background: "#000", // OLED true black
              color: "var(--text-color)",
              borderRadius: 21,
              width: 352,
              maxWidth: "94vw",
              minHeight: 180,
              boxShadow: "0 18px 93px -4px #000e, 0 6px 26px 0 #ff980022",
              border: "2.9px solid var(--base-light, #ffad42)",
              transition: "opacity 0.18s cubic-bezier(.22,.7,.43,1), box-shadow 0.12s",
              padding: "38px 34px 32px 36px",
              position: "relative",
              outline: "none",
              fontFamily: "var(--font-main, 'Inter', sans-serif)",
              ...style
            }}
            aria-labelledby="help-sidebar-title"
          >
            <button
              type="button"
              className="close-help-btn"
              onClick={() => setOpen(false)}
              aria-label="Close help panel"
              style={{
                position: "absolute",
                top: 10,
                right: 12,
                background: "none",
                border: "none",
                color: "#babbbe",
                fontSize: 28,
                fontWeight: 500,
                cursor: "pointer",
                opacity: 0.92
              }}
            >×</button>
            <header id="help-sidebar-title" style={{
              fontWeight: 990,
              color: "var(--base-accent)",
              fontSize: 22,
              marginBottom: 11,
              letterSpacing: ".018em",
              display: "flex",
              alignItems: "center"
            }}>
              <span aria-hidden="true" style={{
                fontSize: 27,
                marginRight: 9,
                color: "#ffad42"
              }}>❓</span>
              {summary}
            </header>
            {usage && (
              <aside style={{
                color: "#aafacf",
                fontSize: 15.6,
                marginBottom: 7,
                marginTop: 1,
                fontWeight: 700
              }}>
                <span style={{ marginRight: 8 }}>💡</span>
                {usage}
              </aside>
            )}
            <div style={{ fontSize: 15.1, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              {description}
            </div>
          </section>
        </aside>
      )}
    </>
  );
}

export default HelpSidebar;
