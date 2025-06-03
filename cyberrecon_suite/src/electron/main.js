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

/** ----------------------------------------
 *   SCHEDULER: Scheduled Job Management + Background Runner
 * -----------------------------------------
 * Persistent job storage, schedule, trigger background scans, and IPC
 */
const JOBS_PATH = path.join(app.getPath('userData'), 'scheduler_jobs.json');
let jobsState = [];
let jobTimers = {};

/** Read jobs from file (persistent storage) */
function readJobs() {
  try {
    if (fs.existsSync(JOBS_PATH)) {
      const arr = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8'));
      jobsState = Array.isArray(arr) ? arr : [];
    } else {
      jobsState = [];
    }
  } catch {
    jobsState = [];
  }
}

/** Write jobs to file (persistent storage) */
function writeJobs() {
  try { fs.writeFileSync(JOBS_PATH, JSON.stringify(jobsState, null, 2), 'utf-8'); } catch {}
}

/** Compute next run time from schedule object (interval/cron/once/daily/weekly) */
function getNextRunTime(schedule, from = Date.now()) {
  if (!schedule) return null;
  if (typeof schedule === 'string') {
    if (schedule === 'daily') {
      const dt = new Date(from); dt.setDate(dt.getDate() + 1); return +dt;
    }
    if (schedule === 'weekly') {
      const dt = new Date(from); dt.setDate(dt.getDate() + 7); return +dt;
    }
  }
  if (schedule.type === 'interval') {
    return from + ((schedule.intervalMinutes || 60) * 60 * 1000);
  }
  if (schedule.type === 'cron') {
    let dt = new Date(from);
    dt.setSeconds(0, 0);
    dt.setMinutes(schedule.minute || 0);
    dt.setHours(schedule.hour || 0);
    if (schedule.dow !== undefined && schedule.dow !== null) {
      // Weekly, next date of the week
      let add = (schedule.dow - dt.getDay() + 7) % 7;
      if (add === 0 && dt < new Date(from)) add = 7;
      dt.setDate(dt.getDate() + add);
    } else {
      if (dt <= new Date(from)) dt.setDate(dt.getDate() + 1);
    }
    return +dt;
  }
  if (schedule.type === 'once') {
    return +schedule.runAt || null;
  }
  return null;
}

/** Stop/clear all scheduled timers */
function clearAllJobTimers() { Object.values(jobTimers).forEach(tid => clearTimeout(tid)); jobTimers = {}; }

/** Setup job timer for a single job; triggers a scan when due */
function setupJobTimer(job) {
  if (!job.enabled) return;
  clearJobTimer(job.id);
  const now = Date.now(), nextRun = getNextRunTime(job.schedule, now);
  if (!nextRun || nextRun < now + 1000) return; // Don't schedule past runs
  const delay = Math.max(1, nextRun - now);
  jobTimers[job.id] = setTimeout(async () => {
    // Trigger scan for job.targets using job.tool via event bus
    scanEmitter.emit('scheduled-job-run', { job });
    job.lastRun = Date.now();
    job.nextRun = getNextRunTime(job.schedule, job.lastRun);
    writeJobs();
    setupJobTimer(job);
  }, delay);
}
function clearJobTimer(id) { if (jobTimers[id]) { clearTimeout(jobTimers[id]); delete jobTimers[id]; } }
/** Setup all job timers on load */
function setupAllJobTimers() {
  clearAllJobTimers();
  jobsState.forEach(j => j.enabled !== false && setupJobTimer(j));
}

// On app startup, read persistent scheduled jobs & setup timers
readJobs();
setupAllJobTimers();

// --- IPC interface for job CRUD ---
ipcMain.handle('scheduler:listJobs', () => {
  readJobs(); // Always re-read to support edits from multiple windows
  return jobsState.map(j => Object.assign({}, j));
});
ipcMain.handle('scheduler:addJob', (e, job) => {
  const jobCopy = Object.assign({}, job);
  jobCopy.id = jobCopy.id || "sched_" + Math.random().toString(36).slice(2, 11);
  jobCopy.createdAt = jobCopy.createdAt || Date.now();
  jobCopy.enabled = true;
  jobCopy.lastRun = null;
  jobCopy.nextRun = getNextRunTime(jobCopy.schedule, Date.now());
  jobsState.push(jobCopy);
  writeJobs();
  setupJobTimer(jobCopy);
  return jobCopy;
});
ipcMain.handle('scheduler:updateJob', (e, id, newFields) => {
  readJobs();
  let idx = jobsState.findIndex(j => j.id === id);
  if (idx === -1) return null;
  jobsState[idx] = Object.assign({}, jobsState[idx], newFields);
  jobsState[idx].nextRun = getNextRunTime(jobsState[idx].schedule, Date.now());
  writeJobs();
  setupJobTimer(jobsState[idx]);
  return jobsState[idx];
});
ipcMain.handle('scheduler:removeJob', (e, id) => {
  readJobs();
  jobsState = jobsState.filter(j => j.id !== id);
  writeJobs();
  clearJobTimer(id);
  return true;
});

// When app starts, watch for relevant events to refresh timers when jobs file changes from outside (multi-window support)
// Not implemented: For now, always readJobs in each IPC call.

ipcMain.handle('scheduler:getNextRun', (e, schedule) => getNextRunTime(schedule, Date.now()));
ipcMain.handle('scheduler:getPrevRun', (e, job) => job.lastRun || null);

/** When a scheduled job arrives (timer fires), simulate running the appropriate scan for each domain/target */
scanEmitter.on('scheduled-job-run', async ({ job }) => {
  // For each target, trigger the simulated scan (like user-initiated)
  (job.targets || []).forEach(domain => {
    const processId = "auto_" + job.id + "_" + (Math.random() + '').slice(2, 8);
    simulateScan(job.tool, domain, processId);
    // Optionally record run in recon_history for traceability (omitted for now)
  });
});

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
