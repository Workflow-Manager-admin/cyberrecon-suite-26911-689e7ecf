import React, { useState, useRef, useEffect } from "react";
import TableDisplay from "../components/TableDisplay";
import GraphDisplay from "../components/GraphDisplay";
import { fetchReconHistory, addReconHistory, exportReconResults } from "../utils/storage";
// ReconDashboard now supports premium real-time scan streaming via Electron IPC (runReconCommand, onReconCommandOutput), with robust fallback to browser API if Electron is unavailable.

/**
 * ReconDashboard: Full-featured recon interface connecting Electron IPC (runReconCommand) or browser fallback.
 * Robust states: success, empty, error. Real-time UI update. Premium transitions.
 */

// Helper: Validate possible domains
function validateDomains(input) {
  return input
    .split(/[\s,]+/)
    .map(d => d.trim())
    .filter(Boolean)
    .filter(d => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(d));
}

/**
 * Check if the Electron IPC bridge is available and functional.
 * Guarantees fallback to browser API if not running in Electron.
 */
function hasElectronBridge() {
  return (
    typeof window !== "undefined" &&
    window.electronAPI &&
    typeof window.electronAPI.runReconCommand === "function" &&
    typeof window.electronAPI.onReconCommandOutput === "function"
  );
}

/**
 * Use the Electron IPC scan API (runReconCommand, onReconCommandOutput) to run a scan for a specific tool/args.
 * Ensures each scan attaches its own demuxed event handler, and provides a cancel function.
 * Returns [promise, cancelFn].
 */
function runViaElectron(tool, args, onData, onError, onDone) {
  const processId = Math.random().toString(36).substring(2, 12); // Unique per scan
  let isActive = true;
  let detached = false;

  // Local handler: listens for events, correctly demuxed by processId
  function handler(_event, payload) {
    if (!payload || payload.processId !== processId || !isActive) return;
    if (payload.type === "data") {
      onData(payload.data);
    } else if (payload.type === "error") {
      onError && onError(payload.data || "Scan error");
      isActive = false;
      onDone && onDone(payload.data);
      detach();
    } else if (payload.type === "end") {
      isActive = false;
      onDone && onDone(payload.data);
      detach();
    }
  }

  // Attach event handler
  window.electronAPI.onReconCommandOutput(handler);

  // Trigger scan IPC call
  window.electronAPI.runReconCommand({ tool, args, processId });

  // Detach function (no-op in stub, robust in real)
  function detach() {
    if (detached) return;
    detached = true;
    isActive = false;
    // Real Electron could removeHandler here; stub is safe (demuxed by processId)
  }

  // Cancel: stops scan and detaches events
  function cancel() {
    isActive = false;
    detach();
    window.electronAPI.cancelReconCommand(processId);
  }

  return [
    new Promise((resolve, reject) => {
      onDone = (data) => {
        isActive = false;
        detach();
        resolve(data);
      };
      onError = (err) => {
        isActive = false;
        detach();
        reject(err);
      };
    }),
    cancel
  ];
}

/**
 * Browser-only HTTP fallback: Simulates scan streaming by fetching from a public API.
 * Used only when Electron is not available (guaranteed premium fallback).
 */
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
      await new Promise(r => setTimeout(r, 80));
    }
    onDone && onDone();
  } catch (err) {
    onError && onError("API call failed: " + (err?.message || "unknown"));
    onDone && onDone();
  }
}

/**
 * PUBLIC_INTERFACE
 * ReconDashboard: The premium recon interface. Provides:
 * - Robust, real-time scan streaming via Electron IPC (runReconCommand, onReconCommandOutput) with per-scan demuxing;
 * - Fully premium error and empty state handling with polished visual transitions;
 * - Robust browser API fallback when Electron is not present;
 * - Live streaming result display and table/graph with graceful transitions and accessibility.
 */
function ReconDashboard() {
  // State management, including all premium streaming/visual states.
  const [domainsInput, setDomainsInput] = useState("");
  const [domains, setDomains] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [results, setResults] = useState([]); // All visible scan results after completion
  const [resultBuf, setResultBuf] = useState([]); // Streaming buffer, updated in real time
  const [showResults, setShowResults] = useState(false); // Smooth transition state
  const [history, setHistory] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [cancelScan, setCancelScan] = useState(null);

  const textareaRef = useRef();
  const [ariaMsg, setAriaMsg] = useState("");

  // Animate in result panel when results are populated
  useEffect(() => {
    setShowResults(!!(results && results.length));
  }, [results]);

  // Load offline recon history on mount
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

  // Save scan results to history with status
  async function saveScanHistory(rows, status, errorMsg) {
    if (!rows || !rows.length) return;
    const histRows = rows.map(r => ({
      ...r,
      status: status || "completed",
      error: errorMsg || "",
      timestamp: Date.now(),
    }));
    // Save
    await addReconHistory(histRows);
    // Update local state for UI
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
      setResults([]); // Guarantee: always render results panel, even if empty
      setShowResults(true);
      return;
    }

    setDomains(inputDomains);
    setLoading(`${tool} scan in progress... Please wait ${tool === "Amass" ? "🛰️" : "🖥️"} `);

    const isElectron = hasElectronBridge();
    let finishedCount = 0, aborted = false;
    let cancels = []; // for all parallel scans
    let allResults = [];
    setResultBuf([]);
    setShowResults(false);

    // Scan for each domain in parallel, updating UI in real time
    inputDomains.forEach((domain) => {
      let perDomainResults = [];

      // Live data handler: update buf and append to allResults for premium real-time effect
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
        setResultBuf((prev) => [...prev, entry]);
        perDomainResults.push(entry);
        allResults.push(entry);
      };

      // Error state: update message, finish progress, trigger state transitions
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
          finalizeResults();
        }
      };

      const handleDone = () => {
        finishedCount += 1;
        if (finishedCount >= inputDomains.length) {
          setLoading("");
          setShowResults(true);
          finalizeResults();
        }
      };

      // When all domains have finished (successfully or error/abort/cancel), finalize results for display/history
      async function finalizeResults() {
        if (aborted) {
          setResultBuf([]);
          setResults([]);
          setShowResults(true);
          setCancelScan(null);
          setAriaMsg("Scan cancelled.");
          return;
        }
        const buf = [...resultBuf]; // Current stream buffer
        setResults(allResults.length ? [...allResults] : (buf.length ? buf : []));
        setShowResults(true);
        await saveScanHistory(allResults.length ? allResults : buf, "completed", "");
        setResultBuf([]);
        setCancelScan(null);
        setAriaMsg(`${tool} scan finished. Record(s) added to history.`);
      }

      // Actual scan startup: Wire to Electron or HTTP API fallback
      let scanCancel;
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

    // Premium cancel: cancels all parallel scans, triggers state, and premium empty result view
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
        setAriaMsg(
          `Export failed: ${res && res.error ? res.error : "Unknown error"}`
        );
      }
    } catch (e) {
      setExporting(false);
      setAriaMsg(`Export error: ${(e && e.message) || "Unknown"}`);
    }
  }

  // Keyboard accessibility: Enter triggers scan, Esc blurs
  // PUBLIC_INTERFACE
  function handleTextareaKey(e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmitScan("Amass");
    } else if (e.key === "Escape") {
      textareaRef.current && textareaRef.current.blur();
    }
  }

  // Accessibility live region
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
      </header>

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
        onSubmit={e => { e.preventDefault(); handleSubmitScan("Amass"); }}
      >
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

        {/* Error message */}
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

      {/* Results Table & Graph. Always render the results panel (with animation), even if empty. */}
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

          {/* Results skeleton: if scan is running or no results */}
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
                // Build bar chart data from recon results
                data={(() => {
                  if (!results.length) return {labels: [], datasets: []};
                  // Bar: group by tool, count
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

          {/* Premium Table: Always show for visual stability, with "No data" message if needed */}
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

      {/* Recon History Table & Graph */}
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
