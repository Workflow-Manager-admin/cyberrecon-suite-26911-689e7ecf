const isElectron = typeof window !== "undefined" && window.electronAPI && window.electronAPI.isElectron;

// PUBLIC_INTERFACE
export async function fetchReconHistory() {
  if (isElectron) {
    try {
      const rows = await window.electronAPI.getReconHistory();
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      return [];
    }
  } else {
    const str = localStorage.getItem("recon_history") || "[]";
    return JSON.parse(str);
  }
}

// PUBLIC_INTERFACE
export async function addReconHistory(rows) {
  if (!rows || !rows.length) return;
  if (isElectron) {
    try { await window.electronAPI.addReconHistory(rows); } catch {}
  } else {
    let existing = await fetchReconHistory();
    let all = [...existing, ...rows];
    localStorage.setItem("recon_history", JSON.stringify(all.slice(-150)));
  }
}

// PUBLIC_INTERFACE
export async function exportReconResults(format = "csv") {
  if (isElectron) {
    try {
      let res = await window.electronAPI.exportReconResults(format);
      return res;
    } catch (e) {
      return { ok: false, error: e.message };
    }
  } else {
    const rows = await fetchReconHistory();
    if (!rows.length) return { ok: false, error: "No data to export" };
    if (format === "csv") {
      const headers = Object.keys(rows[0] || {});
      const lines = [
        headers.map(h => `"${h}"`).join(","),
        ...rows.map(r =>
          headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(",")
        ),
      ];
      const blob = new Blob([lines.join("\r\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "recon_results.csv");
      return { ok: true };
    } else {
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "recon_results.json");
      return { ok: true };
    }
  }
}

function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 222);
}
