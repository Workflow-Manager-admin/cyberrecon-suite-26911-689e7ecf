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

/** ====================== Recon History / Export ========================= */
/**
 * Add recon scan history row(s), IPC/Electron or local browser fallback.
 * @param {Array|Object} rows
 */
export async function addReconHistory(rows) {
  if (isElectron && window.electronAPI.addReconHistory) {
    await window.electronAPI.addReconHistory(rows);
    return;
  }
  // Browser fallback: store in localStorage (append)
  try {
    let arr = [];
    const prev = window.localStorage.getItem("cyberrecon:reconHistory");
    if (prev) arr = JSON.parse(prev);
    if (!Array.isArray(arr)) arr = [];
    const norm = Array.isArray(rows) ? rows : [rows];
    arr = [...norm, ...arr].slice(0, 100); // keep max 100
    window.localStorage.setItem("cyberrecon:reconHistory", JSON.stringify(arr));
  } catch {}
}

/**
 * Fetch recon history (browser or Electron)
 */
export async function fetchReconHistory() {
  if (isElectron && window.electronAPI.getReconHistory) {
    return (await window.electronAPI.getReconHistory()) || [];
  }
  try {
    const arr = window.localStorage.getItem("cyberrecon:reconHistory");
    if (!arr) return [];
    return JSON.parse(arr);
  } catch {
    return [];
  }
}

/**
 * Export recon results (call Electron or trigger download).
 * @param {string} format "csv"|"json"
 */
export async function exportReconResults(format) {
  if (isElectron && window.electronAPI.exportReconResults) {
    return await window.electronAPI.exportReconResults(format);
  }
  // Browser fallback: dump file from local history
  try {
    const rows = await fetchReconHistory();
    if (!rows.length) return { ok: false, error: "No data" };
    const fn = `recon_results.${format || "csv"}`;
    let data = "";
    if (format === "csv") {
      const headers = Object.keys(rows[0]);
      const lines = [headers.map(h => `"${h}"`).join(",")];
      for (const row of rows) {
        lines.push(headers.map(h => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`).join(","));
      }
      data = lines.join("\r\n");
    } else {
      data = JSON.stringify(rows, null, 2);
    }
    const blob = new Blob([data], { type: format === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fn;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Browser export error" };
  }
}

// Fallback settings API for when Electron API is not present
if (typeof window !== "undefined" && !isElectron) {
  window.electronAPI = window.electronAPI || {};
  window.electronAPI.getSettings = getSecureSettings;
  window.electronAPI.saveSettings = saveSecureSettings;
  window.electronAPI.addReconHistory = addReconHistory;
  window.electronAPI.getReconHistory = fetchReconHistory;
  window.electronAPI.exportReconResults = exportReconResults;
}
