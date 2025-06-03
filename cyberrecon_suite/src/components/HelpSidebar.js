import React, { useState, useRef, useEffect } from "react";

/**
 * HelpSidebar (GuideSidebar)
 * A modern, accessible, optionally floating sidebar or panel for module help/guidance.
 * Features:
 * - Toggleable open/closed state with animation
 * - Accepts props for summary, usage, and detailed beginner guide
 * - Premium modern styling (dark theme)
 * - Focus trap, ARIA roles, keyboard-accessible
 * - Can be used on any main page, typically positioned at top right
 *
 * Props:
 *  - summary: string (brief summary)
 *  - usage: string|JSX (quick usage instructions; may include markup or lists)
 *  - description: string|JSX (beginner-friendly/detailed description)
 *  - defaultOpen: boolean (optional; default false)
 *  - placement: 'fixed' | 'inline' (optional; default 'fixed')
 */
 // PUBLIC_INTERFACE
function HelpSidebar({
  summary,
  usage,
  description,
  defaultOpen = false,
  placement = "fixed",
  style: styleProp,
  ...rest
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelRef = useRef();
  const btnRef = useRef();

  // Trap focus inside sidebar if open
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll(
      "a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex='-1'])"
    );
    const first = focusable[0], last = focusable[focusable.length - 1];
    function handleKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current && btnRef.current.focus();
      }
      if (e.key === "Tab") {
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    panelRef.current.addEventListener("keydown", handleKey, true);
    return () => panelRef.current && panelRef.current.removeEventListener("keydown", handleKey, true);
  }, [open]);

  // Animate sidebar in/out
  const sideStyles = {
    position: placement === "fixed" ? "fixed" : "absolute",
    top: 28,
    right: 36,
    zIndex: 1040,
    minWidth: 320,
    maxWidth: 410,
    background: "var(--secondary, #22242c)",
    color: "var(--text-color, #fafbfc)",
    borderRadius: 15,
    boxShadow: "0 6px 32px 0 rgba(0,0,0,0.35)",
    padding: "28px 26px 20px 28px",
    border: "1.7px solid var(--border-color, #3d3c36)",
    fontFamily: "var(--font-main)",
    fontSize: "15.2px",
    lineHeight: 1.68,
    transition: "transform 0.27s cubic-bezier(.26,1.14,.66,1.01), opacity 0.21s",
    transform: open ? "translateY(0px) scale(1)" : "translateY(-14px) scale(0.99)",
    opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none",
    outline: "none",
    ...styleProp
  };

  const floatingBtnStyles = {
    position: placement === "fixed" ? "fixed" : "absolute",
    top: 38,
    right: 34,
    zIndex: 1041,
    background: "linear-gradient(88deg,#ffad42,#ff9800 80%)",
    color: "#181824",
    border: "none",
    borderRadius: "0 13px 13px 0",
    boxShadow: "0 3.5px 14px 1.5px rgba(41,41,48,0.09)",
    padding: "7px 17px 9px 12px",
    fontWeight: 800,
    fontSize: "16.8px",
    cursor: "pointer",
    display: open ? "none" : "flex",
    alignItems: "center",
    transition: "opacity 0.18s, background 0.18s",
    outline: "none"
  };

  // Accessible region label
  const regionLabel = "Page Guide / Help Panel";
  return (
    <>
      <button
        ref={btnRef}
        tabIndex={0}
        aria-label={open ? "Hide Help Panel" : "Show Help Panel"}
        aria-expanded={open}
        style={floatingBtnStyles}
        onClick={() => setOpen(true)}
        className="help-sidebar-toggle-btn"
      >
        <span aria-hidden="true" style={{ fontSize: 22, marginRight: 7 }}>❓</span>
        Help
      </button>
      <aside
        ref={panelRef}
        className="help-sidebar-main"
        style={sideStyles}
        role="complementary"
        aria-label={regionLabel}
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        {...rest}
      >
        {/* Close Button */}
        <button
          aria-label="Close Help Panel"
          onClick={() => setOpen(false)}
          style={{
            position: "absolute",
            top: 11,
            right: 11,
            fontSize: "21px",
            background: "none",
            border: "none",
            color: "#ffad42",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >×</button>
        {/* Icon/Title */}
        <header style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <span aria-hidden="true" style={{ fontSize: 27, color: "#ffad42", marginRight: 13 }}>👋</span>
          <span style={{
            fontSize: 18.7,
            fontWeight: 800,
            color: "var(--base-light,#ff9800)",
            letterSpacing: ".03em"
          }}>
            Guide & Help
          </span>
        </header>
        {/* Summary */}
        {summary && (
          <div style={{
            fontSize: 16,
            marginBottom: 13,
            color: "#ffad42",
            fontWeight: 650,
            letterSpacing: ".02em"
          }}>
            {summary}
          </div>
        )}

        {/* Usage/Instructions */}
        {usage && (
          <section style={{ marginBottom: 12 }}>
            <div style={{
              fontWeight: 700,
              color: "#fbe278",
              marginBottom: 2,
              fontSize: 14.2,
              textShadow: "0 1.5px 8px #23242c7a"
            }}>
              How to use this page:
            </div>
            <div style={{ color: "#fbf6e0", fontSize: 14.7, lineHeight: 1.61, fontWeight: 500 }}>
              {typeof usage === "string"
                ? <div style={{ whiteSpace: "pre-line" }}>{usage}</div>
                : usage}
            </div>
          </section>
        )}

        {/* Description/Beginner Guide */}
        {description && (
          <section>
            <div style={{
              fontWeight: 700,
              color: "#fae6cc",
              marginBottom: 4,
              fontSize: 14.1,
              letterSpacing: ".01em"
            }}>
              Beginner's Overview:
            </div>
            <div style={{ color: "#ffe5b1", fontSize: 14.4, lineHeight: 1.7, fontWeight: 480 }}>
              {typeof description === "string"
                ? <div style={{ whiteSpace: "pre-line" }}>{description}</div>
                : description}
            </div>
          </section>
        )}

        {/* Visual affordance (drag handle, if desired) */}
        <div aria-hidden="true" style={{
          marginTop: 19, marginBottom: -6, textAlign: "center", fontSize: 12, color: "#86640094"
        }}>UK-style sidebar. Press <b>Esc</b> to close.</div>
      </aside>
    </>
  );
}

export default HelpSidebar;
