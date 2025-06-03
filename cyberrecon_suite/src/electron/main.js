const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
let db;

// Try to require sqlite (allow for fallback/first-run)
try {
  const Database = require('better-sqlite3'); // Preferred
  db = new Database(path.join(app.getPath('userData'), 'recon_history.sqlite'));
} catch (e) {
  try {
    // Fallback to sqlite3 package
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database(path.join(app.getPath('userData'), 'recon_history.sqlite'));
  } catch (err) {
    console.error('SQLite dependency not found!');
    db = null; // No db
  }
}

// Initialize DB if present
function ensureDbSchema() {
  if (!db) return;
  try {
    db.prepare?.(`CREATE TABLE IF NOT EXISTS recon_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL,
      tool TEXT NOT NULL,
      result TEXT,
      status TEXT,
      time TEXT,
      timestamp INTEGER,
      error TEXT
    );`).run?.();
  } catch (e) {
    // Fallback for sqlite3
    if (db.run) {
      db.run(`CREATE TABLE IF NOT EXISTS recon_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain TEXT NOT NULL,
        tool TEXT NOT NULL,
        result TEXT,
        status TEXT,
        time TEXT,
        timestamp INTEGER,
        error TEXT
      );`);
    }
  }
}
ensureDbSchema();

// IPC handlers
ipcMain.handle('recon:getHistory', async () => {
  if (!db) return [];
  let rows;
  try {
    rows = db.prepare
      ? db.prepare('SELECT * FROM recon_history ORDER BY timestamp DESC LIMIT 100').all()
      : await new Promise((resolve, reject) =>
          db.all('SELECT * FROM recon_history ORDER BY timestamp DESC LIMIT 100', (err, res) => err ? reject(err) : resolve(res))
        );
    return rows || [];
  } catch {
    return [];
  }
});

ipcMain.handle('recon:addHistory', async (e, historyRows) => {
  if (!db) return { ok: false, error: "Database Missing" };
  try {
    const ins = db.prepare
      ? db.prepare(`INSERT INTO recon_history(domain,tool,result,status,time,timestamp,error) 
      VALUES (@domain,@tool,@result,@status,@time,@timestamp,@error)`)
      : null;
    if (Array.isArray(historyRows)) {
      for (const row of historyRows) {
        if (ins) ins.run(row);
        else db.run(`INSERT INTO recon_history(domain,tool,result,status,time,timestamp,error) VALUES (?,?,?,?,?,?,?)`,
          row.domain, row.tool, row.result, row.status, row.time, row.timestamp, row.error || ''
        );
      }
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

function generateCSV(rows) {
  if (!rows || !rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(h => `"${h}"`).join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\r\n');
}

ipcMain.handle('recon:export', async (e, { format, onlyHistory }) => {
  if (!db) return { ok: false, error: "Database Missing" };
  try {
    let rows = db.prepare
      ? db.prepare('SELECT * FROM recon_history ORDER BY timestamp DESC LIMIT 500').all()
      : await new Promise((resolve, reject) =>
          db.all('SELECT * FROM recon_history ORDER BY timestamp DESC LIMIT 500', (err, res) => err ? reject(err) : resolve(res))
        );
    if (!rows) rows = [];
    let data = '';
    let ext = 'csv';
    if (format === 'csv') {
      data = generateCSV(rows);
      ext = 'csv';
    } else {
      data = JSON.stringify(rows, null, 2);
      ext = 'json';
    }
    // Ask for save location
    const result = await dialog.showSaveDialog({
      title: `Export Recon Results (${format.toUpperCase()})`,
      defaultPath: `recon_results.${ext}`,
      filters: [{ name: format.toUpperCase(), extensions: [ext] }]
    });
    if (result.canceled) return { ok: false, canceled: true };
    fs.writeFileSync(result.filePath, data, 'utf8');
    return { ok: true, filePath: result.filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

/**
 * [KAVIA PATCH] Simulated IPC+event scan streaming for recon commands
 * Enables the renderer to trigger a scan and stream fake recon results for Electron/IPC integration validation.
 */
const { ipcMain: _ipcMain } = require('electron');
const { EventEmitter } = require('events');
const scanEmitter = new EventEmitter();
const activeScans = Object.create(null);

// Helper: Simulate streaming results for Amass or Masscan (stub/fake for now)
function simulateScan(tool, domain, processId) {
  // Very basic example
  let step = 0;
  let results;
  if (tool === "Amass") {
    results = [
      `${domain},1.2.3.4`,
      `dev.${domain},1.2.3.5`,
      `test.${domain},1.2.3.6`
    ];
  } else if (tool === "Masscan") {
    results = [
      `Host: ${domain} ()  Ports: 80/open/tcp//http///, 443/open/tcp//https///`,
      `Host: ${domain} ()  Ports: 21/closed/tcp//ftp///, 8080/open/tcp//http-alt///`
    ];
  } else {
    results = ["Sample result"];
  }

  function emitNext() {
    if (!activeScans[processId]) return;
    if (step < results.length) {
      scanEmitter.emit('scan-data', {
        processId,
        type: "data",
        data: results[step]
      });
      step += 1;
      setTimeout(emitNext, 600);
    } else {
      scanEmitter.emit('scan-end', { processId, type: "end", data: "Scan complete." });
      activeScans[processId] = false;
    }
  }
  emitNext();
}

_ipcMain.handle("recon:runCommand", (event, { tool, args = [], processId }) => {
  // Accept tool, args, and processId. Start fake streaming.
  if (!tool || !processId) return { ok: false, error: "Missing tool or processId" };
  activeScans[processId] = true;
  // Args may include domain last, or just test domain
  const domain = (args && args.length) ? args[args.length - 1] : "example.com";
  simulateScan(tool, domain, processId);
  return { ok: true, processId };
});

// Cancel scan (dummy, just mark stop)
_ipcMain.handle("recon:cancelCommand", (event, processId) => {
  if (processId && activeScans[processId]) {
    activeScans[processId] = false;
    scanEmitter.emit('scan-end', { processId, type: "end", data: "Scan cancelled" });
  }
  return { ok: true };
});

/**
 * Event bridge for scan output: preload layer should subscribe to scanEmitter events and forward to the renderer.
 * We do NOT set up a global subscription here; this is handled in preload.js via contextBridge/events.
 */
module.exports = { scanEmitter };
