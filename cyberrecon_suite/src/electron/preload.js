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


  // === VULNERABILITY SCANNER: Nuclei CLI scan IPC API ===

  /** 
   * Triggers a Nuclei scan via IPC. 
   * @param {{targets: string|array, templates?: string|array, processId?: string, extraArgs?: array}} opts 
   * @returns {Promise<{ok:boolean, processId:string, streaming?:boolean, simulated?:boolean}>}
   */
  runScanCommand: (opts) => ipcRenderer.invoke('vulnscan:runScanCommand', opts),

  /**
   * Cancels an active Nuclei scan by processId.
   * @param {string} processId
   */
  cancelScanCommand: (processId) => ipcRenderer.invoke('vulnscan:cancelScanCommand', processId),

  /**
   * Stream scan output/events (data/end/error) for running scan(s).
   * Handler signature: (event, {processId, type, data|error|code}) => void
   */
  onScanCommandOutput: (handler) => {
    // Use main process emitter if available – more efficient, lower latency
    if (scanEmitter && scanEmitter.on) {
      const localHandler = (evt) => handler(null, evt);
      scanEmitter.on('scan-nuclei-data', localHandler);
      scanEmitter.on('scan-nuclei-end', localHandler);
      scanEmitter.on('scan-nuclei-error', localHandler);
      scanListeners.add(localHandler);
      // No-op for unsubscribe for now
    } else {
      // Fallback: listen via ipcRenderer (if main process broadcasts events there)
      // For a full implementation, add: ipcRenderer.on('scan-nuclei-data') etc.
    }
  },

  // SCHEDULED JOBS: JOB CRUD AND SCHEDULING IPC API
  listScheduledJobs: () => ipcRenderer.invoke('scheduler:listJobs'),
  addScheduledJob: (job) => ipcRenderer.invoke('scheduler:addJob', job),
  updateScheduledJob: (id, fields) => ipcRenderer.invoke('scheduler:updateJob', id, fields),
  removeScheduledJob: (id) => ipcRenderer.invoke('scheduler:removeJob', id),
  getNextRunTime: (schedule) => ipcRenderer.invoke('scheduler:getNextRun', schedule),
  getPrevRunTime: (job) => ipcRenderer.invoke('scheduler:getPrevRun', job),

  // For compatibility
  isElectron: true
});
