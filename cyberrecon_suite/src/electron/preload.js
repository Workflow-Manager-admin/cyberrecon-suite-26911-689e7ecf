const { contextBridge, ipcRenderer } = require('electron');

// PUBLIC_INTERFACE
// KAVIA PATCH: Add recon scan triggers, output listeners, cancel support
const { scanEmitter } = (() => {
  try {
    return require('./main.js');
  } catch (_) {
    return { scanEmitter: null };
  }
})();

const scanListeners = new Set();

contextBridge.exposeInMainWorld('electronAPI', {
  // Recon history
  getReconHistory: () => ipcRenderer.invoke('recon:getHistory'),
  addReconHistory: (rows) => ipcRenderer.invoke('recon:addHistory', rows),

  // Export (CSV/JSON)
  exportReconResults: (format = 'csv') => ipcRenderer.invoke('recon:export', { format }),

  // Recon scan IPCs (added)
  runReconCommand: ({ tool, args, processId }) =>
    ipcRenderer.invoke('recon:runCommand', { tool, args, processId }),

  cancelReconCommand: (processId) => ipcRenderer.invoke('recon:cancelCommand', processId),

  // Listen for scan output via scanEmitter or ipcRenderer events
  onReconCommandOutput: (handler) => {
    // Use EventEmitter from main if possible (preferred)
    if (scanEmitter && scanEmitter.on) {
      const localHandler = (evt) => handler(null, evt);
      scanEmitter.on('scan-data', localHandler);
      scanEmitter.on('scan-end', localHandler);
      scanListeners.add(localHandler);
      // No-op for unsubscribe in this stub
    } else {
      // Fallback: listen via ipcRenderer (future setup)
      // Not implemented: for a real backend, you'd use ipcRenderer.on here.
    }
  },

  // For compatibility
  isElectron: true
});
