const { contextBridge, ipcRenderer } = require('electron');

// PUBLIC_INTERFACE
contextBridge.exposeInMainWorld('electronAPI', {
  // Recon history
  getReconHistory: () => ipcRenderer.invoke('recon:getHistory'),
  addReconHistory: (rows) => ipcRenderer.invoke('recon:addHistory', rows),

  // Export (CSV/JSON)
  exportReconResults: (format = 'csv') => ipcRenderer.invoke('recon:export', { format }),

  // For compatibility
  isElectron: true
});
