const isElectron = typeof window !== "undefined" && window.electronAPI && window.electronAPI.isElectron;

/*
 * Persistent Scheduled Job Management for Browser
 * - Provides CRUD: fetchJobs, saveJob, updateJob, deleteJob, listJobs
 * - Schedules recurring/one-off jobs with next/prev run info
 * - Runs background job triggers using setTimeout
 * - Used when not in Electron (Electron handles separately)
 */

const SCHEDULE_KEY = "recon_schedules";
let browserJobsCache = [];
let browserJobTimers = {};
let jobRunListenerKey = "__cyberrecon_job_run_cb"; // window[jobRunListenerKey] = function(job){...}

/**
 * SCHEDULE UTILITIES (BROWSER FALLBACK)
 */
function parseScheduleObj(schedule) {
  // Accepts:
  //   { type: 'interval', intervalMinutes }
  //   { type: 'cron', hour, minute, dow }
  //   { type: 'once', runAt }
  // or: "daily", "weekly"
  if (!schedule) return null;
  if (typeof schedule === "string") {
    if (schedule === "daily") {
      return t => { const dt = new Date(t); dt.setDate(dt.getDate() + 1); return dt; };
    }
    if (schedule === "weekly") {
      return t => { const dt = new Date(t); dt.setDate(dt.getDate() + 7); return dt; };
    }
    return null;
  }
  if (schedule.type === "interval") {
    return t => new Date(t + (schedule.intervalMinutes || 60) * 60 * 1000);
  }
  if (schedule.type === "cron") {
    return function (t) {
      let dt = new Date(t);
      dt.setSeconds(0,0);
      dt.setMinutes(schedule.minute || 0);
      dt.setHours(schedule.hour || 0);
      if (schedule.dow !== undefined && schedule.dow !== null) {
        const day = dt.getDay();
        let add = (schedule.dow - day + 7) % 7;
        if (add === 0 && dt < new Date(t)) add = 7;
        dt.setDate(dt.getDate() + add);
      } else {
        if (dt <= new Date(t)) dt.setDate(dt.getDate() + 1);
      }
      return dt;
    };
  }
  if (schedule.type === "once") {
    return _t => new Date(schedule.runAt);
  }
  return null;
}

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

// ===== SCHEDULED JOB PERSISTENCE & BACKGROUND LOGIC =====

// PUBLIC_INTERFACE
export async function fetchScheduledJobs() {
  if (isElectron) {
    try {
      const jobs = await window.electronAPI.listScheduledJobs();
      return Array.isArray(jobs) ? jobs : [];
    } catch { return []; }
  } else {
    let raw = localStorage.getItem(SCHEDULE_KEY);
    let arr = [];
    try { arr = JSON.parse(raw || "[]"); } catch { arr = []; }
    browserJobsCache = arr;
    return arr.slice();
  }
}

// PUBLIC_INTERFACE
export async function saveScheduledJobs(jobs) {
  // Save list of all jobs (browser only)
  if (isElectron) return;
  browserJobsCache = jobs;
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(jobs));
}

// PUBLIC_INTERFACE
export async function addScheduledJob(job) {
  job = { ...job };
  if (!job.id) job.id = "sched_" + Math.random().toString(36).slice(2, 11);
  if (!job.createdAt) job.createdAt = Date.now();
  job.enabled = job.enabled !== false;
  job.lastRun = null;
  job.nextRun = getScheduledNextRun(job.schedule, Date.now());
  if (isElectron) {
    return await window.electronAPI.addScheduledJob(job);
  } else {
    let jobs = await fetchScheduledJobs();
    jobs.push(job);
    await saveScheduledJobs(jobs);
    setupBrowserJobTimer(job);
    return job;
  }
}

// PUBLIC_INTERFACE
export async function updateScheduledJob(id, fields) {
  if (isElectron) {
    return await window.electronAPI.updateScheduledJob(id, fields);
  } else {
    let jobs = await fetchScheduledJobs();
    let idx = jobs.findIndex(j => j.id === id);
    if (idx === -1) return null;
    jobs[idx] = { ...jobs[idx], ...fields };
    jobs[idx].nextRun = getScheduledNextRun(jobs[idx].schedule, Date.now());
    await saveScheduledJobs(jobs);
    setupBrowserJobTimer(jobs[idx]);
    return jobs[idx];
  }
}

// PUBLIC_INTERFACE
export async function removeScheduledJob(id) {
  if (isElectron) {
    return await window.electronAPI.removeScheduledJob(id);
  } else {
    let jobs = await fetchScheduledJobs();
    jobs = jobs.filter(j => j.id !== id);
    await saveScheduledJobs(jobs);
    clearBrowserJobTimer(id);
    return true;
  }
}

// PUBLIC_INTERFACE
export async function listScheduledJobs() {
  return fetchScheduledJobs();
}

// PUBLIC_INTERFACE
export function getScheduledNextRun(schedule, fromTs) {
  const f = parseScheduleObj(schedule);
  if (!f) return null;
  return +f(fromTs || Date.now());
}

// PUBLIC_INTERFACE
export function getScheduledPrevRun(job) {
  // Use job.lastRun
  return job && job.lastRun ? job.lastRun : null;
}

/**
 * BACKGROUND SCHEDULER (BROWSER)
 * - Runs setTimeout for each enabled job, triggers on schedule (calls user callback if set)
 */
function setupBrowserJobTimer(job) {
  if (!job.enabled) return;
  clearBrowserJobTimer(job.id);
  const now = Date.now();
  let next = getScheduledNextRun(job.schedule, now);
  if (!next || next < now + 700) {
    // Missed or due soon: run in 1s
    next = now + 1000;
  }
  const delay = Math.max(1, next - now);
  browserJobTimers[job.id] = setTimeout(async () => {
    // Trigger job run event (user callback or window event)
    try {
      // Mark run
      let jobs = await fetchScheduledJobs();
      const idx = jobs.findIndex(j => j.id === job.id);
      if (idx !== -1) {
        jobs[idx].lastRun = Date.now();
        jobs[idx].nextRun = getScheduledNextRun(jobs[idx].schedule, Date.now());
        await saveScheduledJobs(jobs);
        setupBrowserJobTimer(jobs[idx]); // schedule next run if recurring
        // Notify UI or global handler of job run event
        if (typeof window !== "undefined" && typeof window[jobRunListenerKey] === "function") {
          window[jobRunListenerKey](jobs[idx]);
        }
      }
    } catch (_) {/* Fail silent */}
  }, delay);
}

function clearBrowserJobTimer(id) {
  if (browserJobTimers[id]) {
    clearTimeout(browserJobTimers[id]);
    delete browserJobTimers[id];
  }
}

// PUBLIC_INTERFACE
// Set global callback: window.setCyberreconJobRunHandler(cb)
if (typeof window !== "undefined") {
  window.setCyberreconJobRunHandler = function (cb) {
    window[jobRunListenerKey] = cb;
  };
  // On load: restore all scheduled job timers
  fetchScheduledJobs().then(jobs => {
    jobs.forEach(j => { if (j.enabled !== false) setupBrowserJobTimer(j); });
  });
}

