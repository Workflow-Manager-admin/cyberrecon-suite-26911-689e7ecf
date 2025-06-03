import React, { useState, useRef, useEffect } from "react";
import TableDisplay from "../components/TableDisplay";
import GraphDisplay from "../components/GraphDisplay";
import { fetchReconHistory, addReconHistory, exportReconResults } from "../utils/storage";
import {
  getJobs,
  addJob,
  updateJob,
  removeJob,
  getNextRunTime,
  getPrevRunTime
} from "../utils/scheduler";

// PUBLIC_INTERFACE
function ScheduleForm({ onJobAdded, errorState, editingJob }) {
  const [jobDomains, setJobDomains] = React.useState(editingJob?.targets?.join(", ") || "");
  const [tool, setTool] = React.useState(editingJob?.tool || "Amass");
  const [schedType, setSchedType] = React.useState(editingJob?.schedule?.type || "interval");
  const [intervalMins, setIntervalMins] = React.useState(editingJob?.schedule?.intervalMinutes || 60);
  const [timeHour, setTimeHour] = React.useState(
    editingJob?.schedule?.hour !== undefined ? editingJob?.schedule?.hour : 1
  );
  const [timeMin, setTimeMin] = React.useState(
    editingJob?.schedule?.minute !== undefined ? editingJob?.schedule?.minute : 0
  );
  const [dayOfWeek, setDayOfWeek] = React.useState(
    editingJob?.schedule?.dow !== undefined ? editingJob?.schedule?.dow : null
  );
  const [oneTimeDate, setOneTimeDate] = React.useState(""); // e.g. "2024-06-30T20:00"
  const [formError, setFormError] = errorState || React.useState("");
  const [savingJob, setSavingJob] = React.useState(false);

  function handleSchedTypeChange(e) {
    setSchedType(e.target.value);
  }

  async function handleJobSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSavingJob(true);
    const doms = validateDomains(jobDomains);
    if (!doms.length) {
      setFormError("Enter at least one valid domain for this schedule.");
      setSavingJob(false);
      return;
    }
    let schedule;
    if (schedType === "interval") {
      const mins = parseInt(intervalMins);
      if (!mins || mins < 1) {
        setFormError("Interval must be at least 1 minute.");
        setSavingJob(false);
        return;
      }
      schedule = { type: "interval", intervalMinutes: mins };
    } else if (schedType === "cron") {
      schedule = { type:"cron", hour: Number(timeHour), minute: Number(timeMin) };
      if (dayOfWeek !== null && dayOfWeek !== "" && dayOfWeek !== "any") {
        schedule.dow = Number(dayOfWeek);
      }
    } else if (schedType === "once") {
      if (!oneTimeDate) {
        setFormError("Set a valid date/time for one-time schedule.");
        setSavingJob(false);
        return;
      }
      schedule = { type: "once", runAt: new Date(oneTimeDate).getTime() };
    } else if (schedType === "daily") {
      schedule = "daily";
    } else if (schedType === "weekly") {
      schedule = "weekly";
    }
    const job = {
      tool,
      targets: doms,
      schedule,
      enabled: true
    };
    try {
      await addJob(job);
      setFormError("");
      setJobDomains("");
      onJobAdded && onJobAdded(job);
    } catch (ex) {
      setFormError("Failed to save job: " + (ex?.message || "unknown"));
    }
    setSavingJob(false);
  }

  // JSX for the form
  return (
    <form
      aria-label="Schedule scan form"
      onSubmit={handleJobSubmit}
      style={{
        background: "rgba(41,64,41,0.10)",
        borderRadius: 11,
        padding: "16px 19px 7px 19px",
        marginBottom: 18,
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "flex-end"
      }}
    >
      <div style={{ flex: "1 0 175px", minWidth: 154 }}>
        <label style={{ fontWeight: 700, color: "#95ffd8", fontSize: 13.5 }}>
          Domain(s)
          <input
            type="text"
            placeholder="example.com, site.org"
            value={jobDomains}
            onChange={e => setJobDomains(e.target.value)}
            required
            spellCheck={false}
            style={{
              width: "100%",
              padding: "6px 6px",
              marginTop: 2,
              borderRadius: 7,
              fontSize: 14.3,
              background: "#222d26",
              color: "#caf9ed",
              border: "1px solid #2d4e32",
              outline: "none",
              fontFamily: "var(--font-code)"
            }}
          />
        </label>
      </div>
      <div>
        <label style={{ fontWeight: 700, color: "#95ffd8", fontSize: 13.5 }}>
          Tool
          <select
            style={{
              display: "block",
              background: "#222d26",
              color: "#caf9ed",
              marginTop: 2,
              borderRadius: 7,
              fontSize: 14.3,
              border: "1px solid #2d4e32",
              padding: "6px 7px"
            }}
            value={tool}
            onChange={e => setTool(e.target.value)}
          >
            <option value="Amass">Amass</option>
            <option value="Masscan">Masscan</option>
          </select>
        </label>
      </div>
      <div>
        <label style={{ fontWeight: 700, color: "#95ffd8", fontSize: 13.5 }}>
          Schedule Type
          <select
            value={schedType}
            onChange={handleSchedTypeChange}
            style={{
              marginTop: 2,
              padding: "6px 8px",
              borderRadius: 7,
              background: "#222d26",
              color: "#caf9ed",
              fontSize: 14.3,
              border: "1px solid #2d4e32"
            }}
          >
            <option value="interval">Every X min</option>
            <option value="cron">Daily/Weekly</option>
            <option value="once">One time</option>
            <option value="daily">Daily (auto)</option>
            <option value="weekly">Weekly (auto)</option>
          </select>
        </label>
      </div>
      {/* Interval inputs */}
      {schedType === "interval" && (
        <div>
          <label style={{ fontWeight: 700, color: "#95ffd8", fontSize: 13.5 }}>
            Interval (min)
            <input
              type="number"
              min={1}
              value={intervalMins}
              onChange={e => setIntervalMins(e.target.value)}
              required
              style={{
                width: 66,
                marginTop: 2,
                padding: "6px 7px",
                borderRadius: 7,
                background: "#222d26",
                color: "#caf9ed",
                border: "1px solid #2d4e32",
                fontSize: 14.2
              }}
            />
          </label>
        </div>
      )}
      {/* Cron style input */}
      {schedType === "cron" && (
        <>
          <div>
            <label style={{ fontWeight: 700, color: "#95ffd8", fontSize: 13.5 }}>
              Time (24h)
              <input
                type="number"
                min={0}
                max={23}
                value={timeHour}
                onChange={e => setTimeHour(Number(e.target.value))}
                style={{
                  width: 52,
                  marginRight: 6,
                  marginTop: 2,
                  borderRadius: 7,
                  background: "#222d26",
                  color: "#caf9ed",
                  border: "1px solid #2d4e32",
                  fontSize: 14.2
                }}
              />
              <span style={{marginRight:2}}>:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={timeMin}
                onChange={e => setTimeMin(Number(e.target.value))}
                style={{
                  width: 52,
                  marginTop: 2,
                  borderRadius: 7,
                  background: "#222d26",
                  color: "#caf9ed",
                  border: "1px solid #2d4e32",
                  fontSize: 14.2
                }}
              />
            </label>
          </div>
          <div>
            <label style={{ fontWeight: 700, color: "#95ffd8", fontSize: 13.5 }}>
              Day of Week
              <select
                value={dayOfWeek===null?"any":String(dayOfWeek)}
                onChange={e => setDayOfWeek(e.target.value==="any"?null:Number(e.target.value))}
                style={{
                  marginTop: 2,
                  padding: "6px 8px",
                  borderRadius: 7,
                  background: "#222d26",
                  color: "#caf9ed",
                  fontSize: 14.2,
                  border: "1px solid #2d4e32"
                }}>
                <option value="any">Any</option>
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d,i)=>
                  <option value={i} key={d}>{d}</option>
                )}
              </select>
            </label>
          </div>
        </>
      )}
      {/* Once */}
      {schedType === "once" && (
        <div>
          <label style={{ fontWeight: 700, color: "#95ffd8", fontSize: 13.5 }}>
            Run at
            <input
              type="datetime-local"
              value={oneTimeDate}
              onChange={e => setOneTimeDate(e.target.value)}
              style={{
                marginTop: 2,
                padding: "6px 8px",
                borderRadius: 7,
                background: "#222d26",
                color: "#caf9ed",
                border: "1px solid #2d4e32",
                fontSize: 14.2
              }}
            />
          </label>
        </div>
      )}
      <button
        type="submit"
        className="btn"
        style={{
          background: "linear-gradient(91deg,#41b572,#90ffa9)",
          color: "#191b22",
          fontWeight: 700,
          fontSize: 15,
          borderRadius: 7,
          marginLeft: 8,
          minWidth: 72
        }}
        disabled={savingJob}
      >
        {editingJob ? "Update" : "Add"} Job
      </button>
      {formError && (
        <div style={{
          color: "#ff5964",
          fontWeight: 700,
          fontSize: 13.5,
          marginLeft: 18
        }}>{formError}</div>
      )}
    </form>
  );
}

// PUBLIC_INTERFACE
// Helper: Validate possible domains
function validateDomains(input) {
  return input
    .split(/[\s,]+/)
    .map(d => d.trim())
    .filter(Boolean)
    .filter(d => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(d));
}

function hasElectronBridge() {
  return (
    typeof window !== "undefined" &&
    window.electronAPI &&
    typeof window.electronAPI.runReconCommand === "function" &&
    typeof window.electronAPI.onReconCommandOutput === "function"
  );
}

// PUBLIC_INTERFACE
/** Run scan via Electron IPC; returns [promise, cancel]. */
function runViaElectron(tool, args, onData, onError, onDone) {
  const processId = Math.random().toString(36).substring(2, 12); // Unique per scan
  let isActive = true;
  let detached = false;
  let _onData = onData;
  let _onError = onError;
  let _onDone = onDone;

  function handler(_event, payload) {
    if (!payload || payload.processId !== processId || !isActive) return;
    if (payload.type === "data") {
      _onData && _onData(payload.data);
    } else if (payload.type === "error") {
      isActive = false;
      _onError && _onError(payload.data || "Scan error");
      _onDone && _onDone(payload.data);
      detach();
    } else if (payload.type === "end") {
      isActive = false;
      _onDone && _onDone(payload.data);
      detach();
    }
  }
  window.electronAPI.onReconCommandOutput(handler);

  window.electronAPI.runReconCommand({ tool, args, processId });

  function detach() {
    if (detached) return;
    detached = true;
    isActive = false;
    // Event handler removal would go here for a real backend.
  }
  function cancel() {
    isActive = false;
    detach();
    window.electronAPI.cancelReconCommand(processId);
  }
  return [
    new Promise((resolve, reject) => {
      _onDone = (data) => {
        isActive = false;
        detach();
        resolve(data);
      };
      _onError = (err) => {
        isActive = false;
        detach();
        reject(err);
      };
    }),
    cancel
  ];
}

// Browser API fallback: simulate scan streaming with API fetch.
async function runViaApi(tool, target, onData, onError, onDone) {
  try {
    let apiUrl, label;
    if (tool === "Amass") {
      apiUrl = `https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(target)}`;
      label = "subdomains";
    } else if (tool === "Masscan") {
      apiUrl = `https://api.hackertarget.com/nmap/?q=${encodeURIComponent(target)}`;
      label = "ports";
    }
    let res = await fetch(apiUrl);
    if (!res.ok) {
      onError && onError("Public API error.");
      onDone && onDone();
      return;
    }
    const txt = await res.text();
    for (const line of txt.split("\n")) {
      if (line.trim()) onData({ line: line.trim(), label });
      await new Promise(r => setTimeout(r, 75));
    }
    onDone && onDone();
  } catch (err) {
    onError && onError("API call failed: " + (err?.message || "unknown"));
    onDone && onDone();
  }
}

// PUBLIC_INTERFACE
/** ReconDashboard module: Premium UI with Electron/IPC scan, live UI, browser fallback. */
function ReconDashboard() {
  // Scans/results state
  const [domainsInput, setDomainsInput] = useState("");
  const [domains, setDomains] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [results, setResults] = useState([]);
  const [resultBuf, setResultBuf] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [history, setHistory] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [cancelScan, setCancelScan] = useState(null);

  // Scheduling
  const [jobs, setJobs] = useState([]);
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [scheduleError, setScheduleError] = useState("");
  const [jobPending, setJobPending] = useState(false);

  const textareaRef = useRef();
  const [ariaMsg, setAriaMsg] = useState("");

  // Animate results in
  useEffect(() => {
    setShowResults(Array.isArray(results) && results.length > 0);
  }, [results]);

  // Load recon history on mount
  useEffect(() => {
    let ignore = false;
    async function fetchHistory() {
      try {
        const hist = await fetchReconHistory();
        if (!ignore) setHistory(Array.isArray(hist) ? hist : []);
      } catch (e) {
        if (!ignore) {
          setHistory([]);
          setError("⚠️ Failed to load recon history.");
          setAriaMsg("History loading failed.");
        }
      }
    }
    fetchHistory();
    return () => { ignore = true; };
  }, []);

  // Load scheduled jobs on mount and on demand
  useEffect(() => {
    let ignore = false;
    async function fetchJobs() {
      try {
        const arr = await getJobs();
        if (!ignore) setJobs(Array.isArray(arr) ? arr : []);
      } catch (e) {
        if (!ignore) setJobs([]);
      }
    }
    fetchJobs();
    // Don't need dependency on jobs itself; only reloads if schedule panel is toggled or jobs change
    return () => { ignore = true; };
  }, [showSchedulePanel, jobPending]);

  // Helper: Format schedule info for UI.
  function formatScheduleDescription(schedule) {
    if (!schedule) return "";
    if (typeof schedule === "string") {
      if (schedule === "daily") return "Daily";
      if (schedule === "weekly") return "Weekly";
      return schedule;
    }
    if (schedule.type === "interval") {
      return `Every ${schedule.intervalMinutes} minutes`;
    }
    if (schedule.type === "cron") {
      const hh = schedule.hour?.toString().padStart(2,"0");
      const mm = schedule.minute?.toString().padStart(2,"0");
      if (schedule.dow !== undefined && schedule.dow !== null)
        return `Every week on ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][schedule.dow]} at ${hh}:${mm}`;
      return `Daily at ${hh}:${mm}`;
    }
    if (schedule.type === "once") {
      return `Once at ${new Date(schedule.runAt).toLocaleString()}`;
    }
    return "[custom schedule]";
  }

  // Save results
  async function saveScanHistory(rows, status, errorMsg) {
    if (!rows || !rows.length) return;
    const histRows = rows.map(r => ({
      ...r,
      status: status || "completed",
      error: errorMsg || "",
      timestamp: Date.now()
    }));
    await addReconHistory(histRows);
    setHistory(prev => [...histRows, ...(prev || [])].slice(0, 120));
  }

  // PUBLIC_INTERFACE
  async function handleSubmitScan(tool) {
    setError("");
    setAriaMsg("");
    setResults([]);
    setResultBuf([]);
    setShowResults(false);
    setCancelScan(null);

    const inputDomains = validateDomains(domainsInput);
    if (!inputDomains.length) {
      setError("Please enter at least one valid domain. 🤚");
      setAriaMsg("Invalid domain input.");
      setResults([]);
      setShowResults(true);
      return;
    }
    setDomains(inputDomains);
    setLoading(`${tool} scan in progress... Please wait ${tool === "Amass" ? "🛰️" : "🖥️"}`);
    const isElectron = hasElectronBridge();
    let finishedCount = 0;
    let aborted = false;
    const cancels = [];
    let allResults = [];
    setResultBuf([]);
    setShowResults(false);

    async function finalizeAll() {
      if (aborted) {
        setResultBuf([]);
        setResults([]);
        setShowResults(true);
        setCancelScan(null);
        setAriaMsg("Scan cancelled.");
        return;
      }
      const buf = [...resultBuf];
      setResults(allResults.length ? [...allResults] : (buf.length ? buf : []));
      setShowResults(true);
      await saveScanHistory(allResults.length ? allResults : buf, "completed", "");
      setResultBuf([]);
      setCancelScan(null);
      setAriaMsg(`${tool} scan finished. Record(s) added to history.`);
    }

    inputDomains.forEach((domain) => {
      let perDomainResults = [];

      const handleData = (data) => {
        let entry;
        if (tool === "Amass") {
          if (typeof data === "string" && data.includes(",")) {
            const [sub, ip] = data.split(",", 2);
            entry = { domain, tool, result: `${sub} (${ip})`, time: new Date().toLocaleTimeString() };
          } else if (data?.line) {
            entry = { domain, tool, result: data.line, time: new Date().toLocaleTimeString() };
          } else {
            entry = { domain, tool, result: String(data), time: new Date().toLocaleTimeString() };
          }
        } else if (tool === "Masscan") {
          entry = { domain, tool, result: data?.line || String(data), time: new Date().toLocaleTimeString() };
        }
        setResultBuf(prev => [...prev, entry]);
        perDomainResults.push(entry);
        allResults.push(entry);
      };

      const handleError = (err) => {
        setError(`❌ ${typeof err === "string" ? err : "Unknown Error"} (${domain})`);
        setLoading("");
        setAriaMsg(`Error: ${err}`);
        saveScanHistory(
          perDomainResults.length ? perDomainResults : [{
            domain, tool, result: "Error: " + String(err), time: new Date().toLocaleTimeString()
          }],
          "failed",
          String(err)
        );
        finishedCount += 1;
        if (finishedCount >= inputDomains.length) {
          setLoading("");
          setShowResults(true);
          finalizeAll();
        }
      };

      const handleDone = () => {
        finishedCount += 1;
        if (finishedCount >= inputDomains.length) {
          setLoading("");
          setShowResults(true);
          finalizeAll();
        }
      };

      let scanCancel = null;
      if (isElectron) {
        let args = [];
        if (tool === "Amass") args = ["enum", "-d", domain];
        else if (tool === "Masscan") args = ["-p1-1000", "--rate=2000", domain];
        try {
          const [/*promise*/, cancelFn] = runViaElectron(
            tool, args, handleData, handleError, handleDone
          );
          scanCancel = cancelFn;
        } catch (err) {
          handleError(`Electron scan failed: ${(err && err.message) || "Unknown"}`);
        }
      } else {
        try {
          runViaApi(tool, domain, handleData, handleError, handleDone);
        } catch (err) {
          handleError(`API scan failed: ${(err && err.message) || "Unknown"}`);
        }
      }
      cancels.push(scanCancel);
    });

    setCancelScan(() => () => {
      aborted = true;
      cancels.forEach(fn => fn && fn());
      setLoading("");
      setCancelScan(null);
      setAriaMsg("Scan cancelled.");
      setError("Scan cancelled. 🚫");
      setResults([]);
      setShowResults(true);
    });
  }

  // PUBLIC_INTERFACE
  async function handleExport(fmt) {
    setExporting(true);
    setAriaMsg("");
    try {
      const res = await exportReconResults(fmt === "CSV" ? "csv" : "json");
      setExporting(false);
      if (res && res.ok) {
        setAriaMsg(`Results exported as ${fmt}.`);
      } else if (res && res.canceled) {
        setAriaMsg(`Export cancelled.`);
      } else {
        setAriaMsg(`Export failed: ${res && res.error ? res.error : "Unknown error"}`);
      }
    } catch (e) {
      setExporting(false);
      setAriaMsg(`Export error: ${(e && e.message) || "Unknown"}`);
    }
  }

  // PUBLIC_INTERFACE
  function handleTextareaKey(e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmitScan("Amass");
    } else if (e.key === "Escape") {
      textareaRef.current && textareaRef.current.blur();
    }
  }

  function AriaLive() {
    return (
      <div className="visually-hidden" aria-live="polite">
        {ariaMsg}
      </div>
    );
  }

  // UI COMPONENT
  return (
    <section
      aria-label="Recon Dashboard"
      tabIndex={0}
      style={{
        maxWidth: 880,
        margin: "0 auto",
        padding: "32px 0",
        color: "var(--text-color)"
      }}
    >
      <AriaLive />

      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 24,
        gap: 16
      }}>
        <span
          aria-hidden="true"
          style={{
            fontSize: 33,
            background: "linear-gradient(88deg,#ffad42,#ff9800 80%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontWeight: 900,
            marginRight: 9,
            textShadow: "0 2.8px 18px rgba(255,168,32,0.18)"
          }}
        >🛰️</span>
        <h1
          style={{
            margin: 0,
            fontSize: 29,
            letterSpacing: ".012em",
            color: "var(--base-light)",
            fontWeight: 800
          }}
        >Recon Dashboard</h1>
        <span
          aria-label="Beta"
          style={{
            fontSize: 14,
            color: "#daa84b",
            background: "rgba(255,168,64,0.09)",
            borderRadius: 13,
            padding: "3.5px 14px",
            marginLeft: 15,
            fontWeight: 700,
            boxShadow: "0 1.5px 7px 0 rgba(0,0,0,0.04)",
            letterSpacing: ".08em",
            border: "1.4px solid rgba(255,184,72,0.1)"
          }}
        >PREMIUM</span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="btn"
          aria-label="Open scheduling panel"
          style={{
            marginLeft: 12,
            padding: "8px 17px",
            fontWeight: 700,
            fontSize: 15,
            background: "linear-gradient(93deg, #41b572 60%, #a7ffed)",
            color: "#111a18",
            borderRadius: 7
          }}
          onClick={() => setShowSchedulePanel(v => !v)}
        >📅 Scheduling</button>
      </header>

      {/* Scheduling Panel */}
      {showSchedulePanel && (
        <section
          aria-label="Schedule Recurring Scans"
          style={{
            background: "var(--secondary)",
            borderRadius: 13,
            boxShadow: "0 8px 32px -8px rgba(41,64,41,0.14)",
            padding: "25px 29px",
            marginBottom: 36,
            marginTop: -9,
          }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 10
          }}>
            <span aria-hidden="true" style={{ fontSize: 23, marginRight: 6 }}>⏰</span>
            <strong style={{
              fontSize: 17,
              color: "#41b572",
              letterSpacing: ".04em",
              fontWeight: 800,
              marginRight: 5
            }}>
              Scheduled/Recurring Scans
            </strong>
            <span style={{
              background: "#23332b",
              color: "#6bf89f",
              borderRadius: 8,
              padding: "2.2px 8px",
              fontSize: 12,
              fontWeight: 650,
              marginLeft: 8,
              letterSpacing: ".05em"
            }}>{jobs.length} active</span>
            <span style={{ flex: 1 }} />
            <button
              type="button"
              aria-label="Close schedule panel"
              className="btn"
              style={{
                background: "#29312b",
                color: "#51b57f",
                fontSize: 13.8,
                fontWeight: 600,
                borderRadius: 6
              }}
              onClick={() => setShowSchedulePanel(false)}
            >Close</button>
          </div>
          <p style={{
            color: "var(--text-secondary)",
            fontSize: 13.5,
            margin: "5px 0 10px 0"
          }}>
            Schedule one-off or recurring scans for domains using Amass or Masscan. Jobs will run in the background and appear in history/results here.
          </p>
          {/* Add new schedule form */}
          <ScheduleForm
            onJobAdded={(job) => { setEditingJob(null); setJobPending(b => !b); }}
            errorState={[scheduleError, setScheduleError]}
            editingJob={editingJob}
          />

          {/* Job list table */}
          <TableDisplay
            data={jobs || []}
            columns={[
              {
                label: "Domain(s)",
                field: "targets",
                emoji: "🌐",
                sortable: true,
                filter: true,
                bold: true,
                render: v => Array.isArray(v) ? v.join(", ") : v
              },
              {
                label: "Tool",
                field: "tool",
                emojiMap: {Amass: "🛰️", Masscan: "🖥️"},
                sortable: true,
                filter: true,
                colored: true,
                colorMap: { Amass: "#ffa343", Masscan: "#3ec784" }
              },
              {
                label: "Schedule",
                field: "schedule",
                sortable: false,
                filter: false,
                render: v => formatScheduleDescription(v)
              },
              {
                label: "Next Run",
                field: "nextRun",
                sortable: true,
                render: (ts, row) =>
                  ts ? new Date(ts).toLocaleString() : (row.nextRun ? new Date(row.nextRun).toLocaleString() : "—")
              },
              {
                label: "Last Run",
                field: "lastRun",
                sortable: true,
                render: (ts, row) =>
                  ts ? new Date(ts).toLocaleString() : (row.lastRun ? new Date(row.lastRun).toLocaleString() : "—")
              },
              {
                label: "Enabled",
                field: "enabled",
                filter: true,
                sortable: true,
                render: value => value ? "✅" : "❌"
              }
            ]}
            initialSortField="nextRun"
            filterable={true}
            size="sm"
            style={{marginTop: 12, marginBottom: 12}}
          />
          <div style={{display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap"}}>
            <button
              type="button"
              className="btn"
              aria-label="Refresh schedule list"
              style={{background: "#222c18", color:"#9feaf8", fontWeight:700}}
              onClick={() => setJobPending(b=>!b)}
            >🔄 Refresh</button>
            {jobs.length > 0 && (
            <button
              type="button"
              className="btn"
              aria-label="Clear all jobs"
              style={{background: "#2c2122", color:"#ff5964", fontWeight:700}}
              onClick={async ()=> {
                for (const j of jobs) await removeJob(j.id);
                setJobPending(b=>!b);
              }}
            >🗑️ Clear All</button>
            )}
          </div>
        </section>
      )}

      {/* Input Panel */}
      <form
        aria-label="Domain input form"
        style={{
          background: "var(--secondary)",
          borderRadius: 13,
          padding: "30px 34px",
          maxWidth: 700,
          marginBottom: 34,
          boxShadow: "0 6px 32px -8px rgba(0,0,0,0.16)"
        }}
        onSubmit={e => { e.preventDefault(); handleSubmitScan("Amass"); }}>
        <label htmlFor="domain-input"
          style={{
            fontWeight: 700,
            color: "var(--base-accent)",
            letterSpacing: ".01em",
            fontSize: 17.5,
            display: "block",
            marginBottom: 8
          }}>
          Domains or Targets <span aria-hidden="true" style={{ fontSize: 20, marginLeft: 8 }}>🔍</span>
        </label>
        <textarea
          ref={textareaRef}
          id="domain-input"
          name="domains"
          value={domainsInput}
          spellCheck={false}
          required
          aria-required="true"
          aria-describedby="domain-desc"
          rows={3}
          onChange={e => setDomainsInput(e.target.value)}
          onKeyDown={handleTextareaKey}
          tabIndex={0}
          style={{
            width: "100%",
            padding: "14px 12px",
            borderRadius: 9,
            fontSize: 15.7,
            fontFamily: "var(--font-code)",
            color: "var(--text-color)",
            border: "1.4px solid var(--border-color)",
            background: "var(--base-dark)",
            marginBottom: 6,
            boxShadow: "0 2.5px 9px -6px rgba(0,0,0,0.13)",
            fontWeight: 500,
            letterSpacing: ".01em"
          }}
          placeholder="e.g. example.com\nor: domain1.com, domain2.com"
        />
        <small
          id="domain-desc"
          style={{
            color: "var(--text-tertiary)",
            fontSize: 13,
            display: "block",
            marginBottom: 8,
            letterSpacing: ".01em"
          }}
        >
          Enter one or more domains separated by comma, space, or new lines.
        </small>
        {error && (
          <div role="alert"
            style={{
              background: "rgba(255,59,64,0.065)",
              color: "var(--danger)",
              borderRadius: 6,
              padding: "8px 14px",
              fontWeight: 600,
              marginBottom: 14,
              fontSize: 14.5
            }}
          >
            <span aria-hidden="true" style={{ marginRight: 5 }}>❌</span>{error}
          </div>
        )}
        {/* Action Buttons */}
        <div style={{
          marginTop: 7,
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          <button
            type="submit"
            className="btn btn-large"
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 17.5,
              fontWeight: 700,
              background: "var(--base-light)",
              color: "#272a31",
              gap: 9,
              border: "none"
            }}
            aria-label="Run Amass Recon"
            disabled={!!loading}
          >🚀 Start Amass</button>
          <button
            type="button"
            className="btn btn-large"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(90deg,#51b57f,#90ffa9)",
              color: "#181b1e",
              fontWeight: 700,
              fontSize: 17.5
            }}
            aria-label="Run Masscan Network Scan"
            disabled={!!loading}
            onClick={() => handleSubmitScan("Masscan")}
          >🖥️ Run Masscan</button>
          <button
            type="button"
            className="btn"
            style={{
              marginLeft: 14,
              fontSize: 16,
              fontWeight: 600
            }}
            aria-label="Clear domains input"
            disabled={!!loading}
            onClick={() => { setDomainsInput(""); setDomains([]); setResults([]); setShowResults(false); setError(""); }}
          >🧹 Clear</button>
        </div>
        <div
          style={{
            marginTop: 7,
            fontSize: 13.1,
            color: "var(--text-secondary)"
          }}
        >
          Ctrl+Enter (or Cmd+Enter) to trigger Amass scan.
        </div>
      </form>

      {/* Loading Panel */}
      {loading && (
        <div
          style={{
            background: "linear-gradient(91deg,rgba(255,168,64,0.12),rgba(255,202,102,0.10))",
            color: "var(--base-accent)",
            borderRadius: 10,
            padding: "23px 27px",
            fontWeight: 700,
            marginBottom: 25,
            fontSize: 19,
            display: "flex",
            alignItems: "center",
            gap: 15,
            boxShadow: "0 4px 32px -7px #21242936",
            border: "1.3px solid var(--border-color)",
            position: "relative",
            minHeight: 63
          }}
          aria-live="assertive"
        >
          <span
            className="premium-loader"
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginRight: 10,
              fontSize: 26,
              animation: "spin-emoji 1.3s linear infinite"
            }}
          >✨<span role="img" aria-label="loading" style={{ marginLeft: 2 }}>⏳</span>
          </span>
          {loading}
          {cancelScan &&
            <button
              type="button"
              className="btn"
              aria-label="Cancel scan"
              style={{
                marginLeft: 18,
                fontSize: 15.5,
                background: "linear-gradient(90deg,#ff5964,#ffa237)",
                color: "#191b22",
                borderRadius: 8,
                fontWeight: 700,
                boxShadow: "0 1.5px 7px 0 rgba(0,0,0,0.05)"
              }}
              onClick={() => cancelScan && cancelScan()}
            >Cancel 🚫</button>
          }
          {/* Loader keyframes */}
          <style>{`
            @keyframes spin-emoji {
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Premium feedback for schedule/job panel */}
      {showSchedulePanel && (
        <div style={{
          background: "linear-gradient(96deg,#51b57f2a 30%,rgba(57,248,117,0.11) 80%)",
          color: "#41a83d",
          fontWeight: 650,
          borderRadius: 18,
          lineHeight: 1.33,
          padding: "8px 19px",
          margin: "10px 0 21px 0",
          fontSize: 13.9,
          boxShadow: "0 1.5px 10px -6px #121d1b48",
          border:"1px solid #223e2333"
        }}>
          <span aria-hidden="true" style={{fontSize:19, marginRight:8}}>💡</span>
          Scheduled jobs will trigger even if you close this window (if app stays running). You may pause, remove, or create multiple scan schedules as needed.
        </div>
      )}

      {/* Results Table & Graph */}
      <div
        style={{
          minHeight: 260,
          transition: "opacity 0.33s cubic-bezier(.22,.8,.62,1.12), box-shadow 0.21s",
          opacity: showResults ? 1 : 0,
          pointerEvents: showResults ? "all" : "none"
        }}
      >
        <section
          aria-label="Scan Results"
          style={{
            background: "var(--secondary)",
            borderRadius: 14,
            marginBottom: 25,
            padding: 24,
            boxShadow: showResults
              ? "0 4px 36px -10px rgba(0,0,0,0.13)"
              : "0 2px 16px -14px rgba(0,0,0,0.07)",
            filter: showResults
              ? "drop-shadow(0 0 12px #eebc5c0c)"
              : "unset"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: 13 }}>
            <span aria-hidden="true" style={{ fontSize: 22, marginRight: 8 }}>📊</span>
            <h2 style={{
              margin: 0,
              fontSize: 20.5,
              fontWeight: 800,
              color: "var(--base-light)",
              letterSpacing: 0.012
            }}>Results</h2>
            <span style={{ flex: 1 }} />
            <button
              className="btn"
              aria-label="Export results as CSV"
              style={{
                marginRight: 10,
                background: "linear-gradient(90deg,#ff9800,#ffad42)",
                color: "#23272e",
                fontWeight: 700,
                fontSize: 15.7
              }}
              disabled={exporting}
              onClick={() => handleExport("CSV")}
            >📤 Export CSV</button>
            <button
              className="btn"
              aria-label="Export results as JSON"
              style={{
                background: "linear-gradient(90deg,#6ce9ff,#8d76ff)",
                color: "#191b22",
                fontWeight: 700,
                fontSize: 15.7
              }}
              disabled={exporting}
              onClick={() => handleExport("JSON")}
            >🗎 Export JSON</button>
          </div>
          {!results.length && !error && (
            <div style={{
              opacity: 0.72,
              width: "100%",
              minHeight: 140,
              background: "linear-gradient(90deg,#22242c 68%,#232028 95%)",
              borderRadius: 11,
              margin: "15px 0 28px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#bba157",
              fontWeight: 600,
              fontSize: 19,
              letterSpacing: ".03em"
            }}>
              {loading
                ? <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span aria-hidden="true" style={{
                      fontSize: 18,
                      marginLeft: 8,
                      animation: "spin-emoji 1.1s linear infinite"
                    }}>🛠️</span>
                    Retrieving results...
                    <style>{`@keyframes spin-emoji { 100% { transform: rotate(360deg); } }`}</style>
                  </span>
                : <span style={{ opacity: 0.6 }}>No output yet.</span>
              }
            </div>
          )}
          {/* Premium Graph: Visualize findings by tool */}
          {results.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <GraphDisplay
                type="bar"
                data={(() => {
                  if (!results.length) return {labels: [], datasets: []};
                  const toolCounts = {};
                  results.forEach(r => {
                    toolCounts[r.tool] = (toolCounts[r.tool] || 0) + 1;
                  });
                  return {
                    labels: Object.keys(toolCounts),
                    datasets: [{
                      label: "Findings",
                      data: Object.values(toolCounts),
                      backgroundColor: "#ff9800"
                    }]
                  };
                })()}
                options={{
                  title: "Findings by Tool",
                  legend: {display: false}
                }}
                style={{marginBottom: 10, maxWidth: 550}}
              />
            </div>
          )}
          {/* Premium Table: Always show for visual stability */}
          <TableDisplay
            data={results}
            columns={[
              {
                label: "Domain",
                field: "domain",
                emoji: "🌐",
                sortable: true,
                filter: true,
                bold: true
              },
              {
                label: "Tool",
                field: "tool",
                emojiMap: {Amass: "🛰️", Masscan: "🖥️"},
                sortable: true,
                filter: true,
                colored: true,
                colorMap: { Amass: "#ffa343", Masscan: "#3ec784" }
              },
              {
                label: "Result",
                field: "result",
                emojiMap: {
                  "open": "🟢",
                  "closed": "🔴",
                  "filtered": "🟡",
                  "host": "🌎"
                },
                sortable: false,
                filter: true
              },
              {
                label: "Time",
                field: "time",
                emoji: "⏰",
                sortable: true,
                filter: false
              }
            ]}
            initialSortField="domain"
            size="md"
            filterable={true}
            style={{margin: "0 0 0 0"}}
          />
        </section>
      </div>

      {!!history.length && (
        <section
          aria-label="Recon History"
          style={{
            background: "var(--secondary)",
            borderRadius: 12,
            padding: 22,
            marginBottom: 18,
            boxShadow: "0 1.5px 8px 0 rgba(0,0,0,0.11)"
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 11
          }}>
            <span aria-hidden="true" style={{ fontSize: 18, marginRight: 8 }}>🕒</span>
            <h3 style={{
              margin: 0,
              fontSize: 17.2,
              color: "#b38126",
              fontWeight: 800
            }}>
              Recent Recon History
            </h3>
            <span style={{ flex: 1 }} />
          </div>
          {/* Mini graph: findings by domain */}
          <div style={{ maxWidth: 420, marginBottom: 12 }}>
            <GraphDisplay
              type="bar"
              data={(() => {
                const h = history.slice(-20);
                const byDomain = {};
                h.forEach(it => {
                  byDomain[it.domain] = (byDomain[it.domain] || 0) + 1;
                });
                return {
                  labels: Object.keys(byDomain),
                  datasets: [{
                    label: "Scans",
                    data: Object.values(byDomain),
                    backgroundColor: "#ffad42"
                  }]
                };
              })()}
              options={{
                title: "Scan count by Domain",
                legend: {display: false}
              }}
              style={{marginBottom: 8, maxWidth: 380}}
            />
          </div>
          <TableDisplay
            data={[...history.slice(-12)].reverse().map(h => ({
              ...h,
              time: h.time || (h.timestamp ? new Date(h.timestamp).toLocaleTimeString() : ""),
              status: h.status || "completed"
            }))}
            columns={[
              {
                label: "Domain",
                field: "domain",
                emoji: "🌐",
                sortable: true,
                filter: true,
                bold: true
              },
              {
                label: "Tool",
                field: "tool",
                emojiMap: {Amass: "🛰️", Masscan: "🖥️"},
                sortable: true,
                filter: true,
                colored: true,
                colorMap: { Amass: "#ffa343", Masscan: "#3ec784" }
              },
              {
                label: "Result",
                field: "result",
                emojiMap: {
                  "open": "🟢",
                  "closed": "🔴",
                  "filtered": "🟡",
                  "host": "🌎"
                },
                sortable: false,
                filter: true
              },
              {
                label: "Status",
                field: "status",
                emojiMap: { completed: "✅", failed: "❌", cancelled: "🚫" },
                sortable: true,
                filter: true,
                colored: true,
                colorMap: { completed: "#41b572", failed: "#e1463b", cancelled: "#cfc71f" }
              },
              {
                label: "Time",
                field: "time",
                emoji: "⏰",
                sortable: true,
                filter: false
              }
            ]}
            size="sm"
            filterable={true}
          />
        </section>
      )}

      {/* Exporting/Feedback */}
      {exporting && (
        <div
          style={{
            background: "linear-gradient(92deg,#222b4d22,#191b2425)",
            color: "#4fbaff",
            borderRadius: 11,
            padding: "13px 32px",
            fontWeight: 700,
            fontSize: 17.5,
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 14,
            border: "1.1px solid #405f89a5",
            boxShadow: "0 1.5px 8px 0 rgba(0,28,88,0.09)"
          }}
        >
          <span
            aria-hidden="true"
            style={{
              fontSize: 21,
              animation: "spin-emoji 1.25s linear infinite"
            }}>💾</span>
          Export in progress... Please wait
          <style>{`
            @keyframes spin-emoji {
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Accessible footer */}
      <footer style={{
        padding: "12px 0 0 0",
        fontSize: 12.5,
        color: "var(--text-tertiary)",
        display: "flex",
        alignItems: "center",
        gap: 12
      }}>
        <span aria-hidden="true" style={{ fontSize: 17, marginRight: 7 }}>🔑</span>
        Results are cached locally. For privacy, data is <b>never sent to remote servers</b>.
      </footer>
    </section>
  );
}

export default ReconDashboard;
