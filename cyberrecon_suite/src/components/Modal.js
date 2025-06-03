import React, { useEffect, useRef } from "react";

// PUBLIC_INTERFACE
function Modal({ isOpen, title, children, onClose, ...rest }) {
  /**
   * A11y-enhanced modal with ARIA roles, keyboard navigation,
   * and focus trap. Render nothing if not open.
   */
  const ref = useRef();

  // Trap focus & handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement;
    ref.current && ref.current.focus();

    function handleKey(e) {
      if (e.key === "Escape") {
        onClose && onClose();
      }
      if (e.key === "Tab") {
        // Simple focus loop logic
        const modal = ref.current;
        if (!modal) return;
        const focusables = modal.querySelectorAll(
          "a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex='-1'])"
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("keydown", handleKey, true);
      prev && prev.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      tabIndex={-1}
      style={{
        position: "fixed",
        zIndex: 1001,
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div
        className="modal-content"
        ref={ref}
        tabIndex={0}
        role="document"
        style={{
          background: "var(--secondary, #23272e)",
          color: "var(--text-color)",
          borderRadius: 8,
          padding: 32,
          minWidth: 320,
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.22)",
          outline: "none"
        }}
        {...rest}
      >
        <header style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <h2 id="modal-title" style={{ flex: 1, fontSize: 20, margin: 0 }}>
            {title}
          </h2>
          {onClose && (
            <button
              aria-label="Close modal"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: 22,
                color: "var(--text-secondary)",
                cursor: "pointer"
              }}
            >
              ×
            </button>
          )}
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
