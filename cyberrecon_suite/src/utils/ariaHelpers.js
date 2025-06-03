/**
 * Utility: Focus management for accessibility.
 */
export function focusFirst(selector, root = document) {
  const el = root.querySelector(selector);
  if (el) el.focus();
}

export function announceLiveMsg(msg) {
  let el = document.getElementById("aria-live-msg");
  if (!el) {
    el = document.createElement("div");
    el.id = "aria-live-msg";
    el.setAttribute("aria-live", "polite");
    el.style.position = "absolute";
    el.style.height = 0;
    el.style.overflow = "hidden";
    document.body.appendChild(el);
  }
  el.textContent = msg;
}
