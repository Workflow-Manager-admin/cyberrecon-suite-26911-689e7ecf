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

module.exports = {}; // For safety in Electron require chain
