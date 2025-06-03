const isElectron = typeof window !== "undefined" && window.electronAPI && window.electronAPI.isElectron;

// PUBLIC_INTERFACE
/**
 * Retrieve settings object securely.
 */
export async function getSecureSettings() {
  if (isElectron && window.electronAPI.getSettings) {
    return await window.electronAPI.getSettings();
  }
  // Fallback: browser localStorage
  try {
    const data = window.localStorage.getItem("cyberrecon:settings") || "{}";
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// PUBLIC_INTERFACE
/**
 * Save settings object securely.
 */
export async function saveSecureSettings(settings) {
  if (isElectron && window.electronAPI.saveSettings) {
    await window.electronAPI.saveSettings(settings);
    return;
  }
  try {
    window.localStorage.setItem("cyberrecon:settings", JSON.stringify(settings));
  } catch (e) {
    // Ignore
  }
}

// Fallback settings API for when Electron API is not present
if (typeof window !== "undefined" && !isElectron) {
  window.electronAPI = window.electronAPI || {};
  window.electronAPI.getSettings = getSecureSettings;
  window.electronAPI.saveSettings = saveSecureSettings;
}
