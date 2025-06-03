//
// Scheduler utility for recurring scans/jobs (Electron or browser)
// Provides: CRUD for jobs, calc next/prev run, timer/setInterval integration, and persistence abstraction.
//
const IS_ELECTRON = typeof window !== "undefined" && window.electronAPI && window.electronAPI.isElectron;

// Helper to parse "every X minutes" or cron-like or "daily" spec
function parseSchedule(schedule) {
  // { type: 'interval', intervalMinutes: 15 } OR
  // { type: 'cron', minutes, hours, dow, etc } OR
  // { type: 'once', runAt }
  // Accept "every 10m", "every 2h", "at 13:00", "daily", "weekly", as freeform
  if (!schedule) return null;
  if (schedule.type === "interval") {
    return t => new Date(t + (schedule.intervalMinutes || 60) * 60 * 1000); // next run time
  }
  if (schedule.type === "cron") {
    // Do not support true cron, but support "at hour:min", daily/weekly/etc.
    // Sample schedule: {type:'cron', minute:15, hour:14, dow:null}
    return function (t) {
      // Next daily execution for given hour/minute (dow optional)
      let next = new Date(t);
      next.setSeconds(0, 0);
      next.setMinutes(schedule.minute || 0);
      next.setHours(schedule.hour || 0);
      if (schedule.dow !== undefined && schedule.dow !== null) {
        // Find next date with that weekday
        const day = next.getDay();
        let add = (schedule.dow - day + 7) % 7;
        if (add === 0 && next < new Date(t)) add = 7;
        next.setDate(next.getDate() + add);
      } else {
        if (next <= new Date(t)) next.setDate(next.getDate() + 1);
      }
      return next;
    };
  }
  if (schedule.type === "once") {
    // {type:'once', runAt: timestamp}
    return _t => new Date(schedule.runAt);
  }
  // Fallback for "daily", "weekly", etc.
  if (typeof schedule === "string") {
    if (schedule === "daily") {
      return t => { const d = new Date(t); d.setDate(d.getDate() + 1); return d; };
    }
    if (schedule === "weekly") {
      return t => { const d = new Date(t); d.setDate(d.getDate() + 7); return d; };
    }
  }
  return null;
}

// Job format:
// { id, tool, targets, schedule: {...}, enabled, createdAt, lastRun, nextRun }

let inMemoryJobs = []; // browser
let _browserTimers = {}; // browser timers if using setTimeout for next jobs

// --- Persistence and Source of Truth ---

// PUBLIC_INTERFACE
async function getJobs() {
  if (IS_ELECTRON) {
    try {
      return await window.electronAPI.listScheduledJobs();
    } catch {
      return [];
    }
  } else {
    const str = localStorage.getItem("recon_schedules") || "[]";
    inMemoryJobs = JSON.parse(str);
    return inMemoryJobs.slice();
  }
}

// PUBLIC_INTERFACE
async function saveJobs(jobs) {
  if (IS_ELECTRON) {
    // Electron: do nothing (handled in main process via add/update/remove)
    return;
  } else {
    inMemoryJobs = jobs;
    localStorage.setItem("recon_schedules", JSON.stringify(jobs));
  }
}

// PUBLIC_INTERFACE
async function addJob(job) {
  job.id = job.id || "sched_" + Math.random().toString(36).slice(2, 11);
  job.createdAt = Date.now();
  job.enabled = true;
  job.lastRun = null;
  job.nextRun = getNextRunTime(job.schedule, Date.now());
  if (IS_ELECTRON) {
    return await window.electronAPI.addScheduledJob(job);
  }
  // browser
  const jobs = await getJobs();
  jobs.push(job);
  await saveJobs(jobs);
  setupJobTimer(job); // will auto-trigger job run
  return job;
}

// PUBLIC_INTERFACE
async function updateJob(id, newFields) {
  if (IS_ELECTRON) {
    return await window.electronAPI.updateScheduledJob(id, newFields);
  }
  const jobs = await getJobs();
  const index = jobs.findIndex(j => j.id === id);
  if (index === -1) return null;
  jobs[index] = { ...jobs[index], ...newFields };
  jobs[index].nextRun = getNextRunTime(jobs[index].schedule, Date.now());
  await saveJobs(jobs);
  setupJobTimer(jobs[index]);
  return jobs[index];
}

// PUBLIC_INTERFACE
async function removeJob(id) {
  if (IS_ELECTRON) {
    return await window.electronAPI.removeScheduledJob(id);
  }
  const jobs = await getJobs();
  const jobs2 = jobs.filter(j => j.id !== id);
  await saveJobs(jobs2);
  teardownJobTimer(id);
  return true;
}

// PUBLIC_INTERFACE
function getNextRunTime(schedule, fromTs) {
  const f = parseSchedule(schedule);
  if (!f) return null;
  return +f(fromTs || Date.now());
}

// PUBLIC_INTERFACE
function getPrevRunTime(job) {
  // Just use job.lastRun (may want to parse past schedule, or store history)
  return job.lastRun || null;
}

// --- Browser: setTimeout/Interval to trigger job execution and update timer

function setupJobTimer(job) {
  if (!job.enabled) return;
  teardownJobTimer(job.id);
  const now = Date.now();
  let next = getNextRunTime(job.schedule, now);
  if (!next || next <= now) {
    // If missed, schedule soon (1s in future)
    next = now + 1000;
  }
  const wait = next - now;
  _browserTimers[job.id] = setTimeout(async () => {
    // Simulate job run event
    // Here: you should trigger the scan trigger logic, e.g. callback/event
    if (typeof window !== "undefined" && window.onJobRun) {
      window.onJobRun(job);
    }
    // Update lastRun/nextRun in memory
    const jobs = await getJobs();
    const idx = jobs.findIndex(j => j.id === job.id);
    if (idx !== -1) {
      jobs[idx].lastRun = Date.now();
      jobs[idx].nextRun = getNextRunTime(jobs[idx].schedule, Date.now());
      await saveJobs(jobs);
      setupJobTimer(jobs[idx]); // Schedule next run
    }
  }, wait);
}

function teardownJobTimer(id) {
  if (_browserTimers[id]) {
    clearTimeout(_browserTimers[id]);
    delete _browserTimers[id];
  }
}

// On load/browser: restart timers for all enabled jobs
if (!IS_ELECTRON && typeof window !== "undefined") {
  getJobs().then(jobs => {
    jobs.forEach(job => { if (job.enabled) setupJobTimer(job); });
  });
}

// PUBLIC_INTERFACE
export {
  getJobs,
  addJob,
  updateJob,
  removeJob,
  getNextRunTime,
  getPrevRunTime,
  setupJobTimer,
  teardownJobTimer
};
