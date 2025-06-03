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
/**
 * PUBLIC_INTERFACE
 * Exposes premium Electron APIs for renderer – recon history, scan, scheduler, and Nuclei CLI integration.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Recon history
  getReconHistory: () => ipcRenderer.invoke('recon:getHistory'),
  addReconHistory: (rows) => ipcRenderer.invoke('recon:addHistory', rows),

  // Settings storage
  /** 
   * PUBLIC_INTERFACE
   * Get application settings
   */
  getSettings: () => ipcRenderer.invoke('settings:get'),
  /** 
   * PUBLIC_INTERFACE
   * Save application settings
   */
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

  // Export (CSV/JSON)
  exportReconResults: (format = 'csv') => ipcRenderer.invoke('recon:export', { format }),

  // Recon scan IPCs
  runReconCommand: ({ tool, args, processId }) =>
    ipcRenderer.invoke('recon:runCommand', { tool, args, processId }),

  cancelReconCommand: (processId) => ipcRenderer.invoke('recon:cancelCommand', processId),

  /**
   * PUBLIC_INTERFACE
   * Listen for recon scan output events (data, end). Handler receives (event, payload).
   */
  onReconCommandOutput: (handler) => {
    if (scanEmitter && scanEmitter.on) {
      const localHandler = (evt) => handler(null, evt);
      scanEmitter.on('scan-data', localHandler);
      scanEmitter.on('scan-end', localHandler);
      scanListeners.add(localHandler);
      // Unsub handler not implemented in stub
    } else {
      // Fallback: add ipcRenderer.on here if main process emits events
    }
  },

  // ======= VULNERABILITY SCANNER: NUCLEI CLI/IPC INTEGRATION =======

  /**
   * PUBLIC_INTERFACE
   * Triggers a Nuclei scan via IPC.
   * @param {{targets: string|array, templates?: string|array, processId?: string, extraArgs?: array}} opts
   * @returns {Promise<{ok: boolean, processId: string, streaming?: boolean, simulated?: boolean}>}
   */
  runScanCommand: (opts) => ipcRenderer.invoke('vulnscan:runScanCommand', opts),

  /**
   * PUBLIC_INTERFACE
   * Cancels an active Nuclei scan.
   * @param {string} processId
   * @returns {Promise<{ok: boolean, cancelled: boolean}>}
   */
  cancelScanCommand: (processId) => ipcRenderer.invoke('vulnscan:cancelScanCommand', processId),

  /**
   * PUBLIC_INTERFACE
   * Subscribes to scan output/events for the running Nuclei scan.
   * Handler signature: (event, {processId, type, data, error, code}) => void
   * Supported event types: "scan-nuclei-data", "scan-nuclei-end", "scan-nuclei-error"
   */
  onScanCommandOutput: (handler) => {
    if (scanEmitter && scanEmitter.on) {
      const localHandler = (evt) => handler(null, evt);
      scanEmitter.on('scan-nuclei-data', localHandler);
      scanEmitter.on('scan-nuclei-end', localHandler);
      scanEmitter.on('scan-nuclei-error', localHandler);
      scanListeners.add(localHandler);
      // Unsubscribe not implemented in stub
    } else {
      // Fallback: listen via ipcRenderer (to be implemented for non-native/cross-window)
    }
  },

  // Scheduled jobs IPCs
  listScheduledJobs: () => ipcRenderer.invoke('scheduler:listJobs'),
  addScheduledJob: (job) => ipcRenderer.invoke('scheduler:addJob', job),
  updateScheduledJob: (id, fields) => ipcRenderer.invoke('scheduler:updateJob', id, fields),
  removeScheduledJob: (id) => ipcRenderer.invoke('scheduler:removeJob', id),
  getNextRunTime: (schedule) => ipcRenderer.invoke('scheduler:getNextRun', schedule),
  getPrevRunTime: (job) => ipcRenderer.invoke('scheduler:getPrevRun', job),

  // For renderer detection
  isElectron: true
});
