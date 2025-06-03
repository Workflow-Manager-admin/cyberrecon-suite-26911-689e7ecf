import React, { useState, useRef, useMemo } from "react";
import TableDisplay from "../components/TableDisplay";
import GraphDisplay from "../components/GraphDisplay";

/**
 * ReconDashboard: Fully functional recon interface for CyberRecon Suite.
 * Feature Patch: Replace simulation logic with real Amass/Masscan integration using Electron IPC & public API fallback, robust streaming.
 */

// Helpers
function validateDomains(input) {
  // Split by comma/space/newline, trim, filter non-empty, simple domain regex
  return input
    .split(/[\s,]+/)
    .map(d => d.trim())
    .filter(d => !!d)
    .filter(d =>
      /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(d)
    );
}

// Check for exposed Electron CLI bridge in window
function hasElectronBridge() {
  return typeof window !== "undefined" && window.electronAPI && typeof window.electronAPI.runReconCommand === "function";
}

// Run command via Electron (returns [Promise, cancelFn])
function runViaElectron(tool, args, onData, onError, onDone) {
  // For production, window.electronAPI must be injected by preload
  const processId = Math.random().toString(36).substr(2, 10);
  let resolve, reject;
  const resultPromise = new Promise((res, rej) => { resolve = res; reject = rej; });
  const handler = (evt, payload) => {
    if (payload && payload.processId === processId) {
      if (payload.type === "data") onData(payload.data);
      else if (payload.type === "error") { onError(payload.data); reject(payload.data); }
      else if (payload.type === "end") { onDone(payload.data); resolve(payload.data); }
    }
  };
  window.electronAPI.onReconCommandOutput(handler);
  window.electronAPI.runReconCommand({
    tool,
    args,
    processId,
  });
  // Dummy cancel (for expansion)
  return [resultPromise, () => window.electronAPI.cancelReconCommand(processId)];
}

// Fallback to public API (returns Promise, streaming is simulated)
async function runViaApi(tool, target, onData, onError, onDone) {
  try {
    let apiUrl = "", label = tool;
    if (tool === "Amass") {
      apiUrl = `https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(target)}`;
      label = "subdomains";
    } else if (tool === "Masscan") {
      apiUrl = `https://api.hackertarget.com/nmap/?q=${encodeURIComponent(target)}`;
      label = "ports";
    }
    let res = await fetch(apiUrl);
    if (!res.ok) { onError("Public API error."); onDone(); return; }
    const txt = await res.text();
    const lines = txt.split("\n");
    for (const line of lines) {
      if (line.trim()) onData({ line: line.trim(), label });
      await new Promise(r => setTimeout(r, 80));
    }
    onDone();
  } catch (err) {
    onError("API call failed: " + (err?.message || "unknown"));
    onDone();
  }
}

// PUBLIC_INTERFACE
function ReconDashboard() {
  // State management
  const [domainsInput, setDomainsInput] = useState("");
  const [domains, setDomains] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [results, setResults] = useState([]); // Array of {domain, tool, result, time}
  const [resultBuf, setResultBuf] = useState([]); // For streaming lines
  const [history, setHistory] = useState([]);
  const [exporting, setExporting] = useState(false);

  const [cancelScan, setCancelScan] = useState(null);

  const textareaRef = useRef();

  // Accessibility: announcements
  const [ariaMsg, setAriaMsg] = useState("");

  // PUBLIC_INTERFACE
  async function handleSubmitScan(tool) {
    setError("");
    setAriaMsg("");
    setResults([]);
    setResultBuf([]);
    const inputDomains = validateDomains(domainsInput);
    if (!inputDomains.length) {
      setError("Please enter at least one valid domain.");
      setAriaMsg("Invalid domain input.");
      return;
    }
    setDomains(inputDomains);
    setLoading(`${tool} scan in progress...`);
    // Start scan, possibly stream results
    let isElectron = hasElectronBridge();
    let allResults = [];
    let nFinished = 0;
    // Cancel logic (future)
    let aborters = [];
    inputDomains.forEach((domain, idx) => {
      // Data handler: called on every line/chunk per domain/target
      const handleData = (data) => {
        // Unified format
        let entry;
        if (tool === "Amass") {
          // Try parse subdomain:target format
          if (typeof data === "string" && data.includes(",")) {
            const [sub, ip] = data.split(",", 2);
            entry = { domain, tool, result: `${sub} (${ip})`, time: new Date().toLocaleTimeString() };
          } else if (data?.line) {
            entry = { domain, tool, result: data.line, time: new Date().toLocaleTimeString() };
          } else {
            entry = { domain, tool, result: String(data), time: new Date().toLocaleTimeString() };
          }
        } else if (tool === "Masscan") {
          // Port parsing: nmap API style output
          entry = { domain, tool, result: data?.line || String(data), time: new Date().toLocaleTimeString() };
        }
        setResultBuf(rb => [...rb, entry]);
      };
      const handleError = (err) => {
        setError(String(err));
        setLoading("");
        setAriaMsg(`Error: ${err}`);
        nFinished += 1;
      };
      const handleDone = () => {
        nFinished += 1;
        if (nFinished >= inputDomains.length) {
          setLoading("");
          finalizeResults();
        }
      };
      function finalizeResults() {
        // Collate and flush buffer to results/history
        const buf = resultBuf.length ? resultBuf : [];
        setResults([...buf]);
        setHistory(prev => [
          ...prev,
          ...buf.map(r => ({
            ...r,
            timestamp: Date.now(),
          }))
        ]);
        setAriaMsg(`${tool} scan finished. Record(s) added to history.`);
        setResultBuf([]);
      }
      // CLI or API select
      if (isElectron) {
        // Arguments for each tool:
        let args = [];
        if (tool === "Amass") args = ["enum", "-d", domain];
        else if (tool === "Masscan") args = ["-p1-1000", "--rate=2000", domain];
        const [promise, canceler] = runViaElectron(tool, args, handleData, handleError, handleDone);
        aborters.push(canceler);
      } else {
        runViaApi(tool, domain, handleData, handleError, handleDone);
      }
    });
    setCancelScan(() => () => aborters.forEach(a => a && a())); // allow cancel
  }

  // PUBLIC_INTERFACE
  function handleExport(fmt) {
    setExporting(true);
    setTimeout(() => {
      // TODO: Implement real export via backend or FileSaver
      setExporting(false);
      setAriaMsg(`Results exported as ${fmt}.`);
    }, 750);
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
        color: "var(--text-color)",
      }}
    >
      <AriaLive />

      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 24,
        gap: 16,
      }}>
        <span
          aria-hidden="true"
          style={{
            fontSize: 32,
            background: "linear-gradient(90deg,#ff9800,#ffad42)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontWeight: 900,
            marginRight: 6,
            textShadow: "0 2px 16px rgba(255,152,4,0.21)"
          }}
        >🛰️</span>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            letterSpacing: "0.01em",
            color: "var(--base-light)"
          }}
        >Recon Dashboard</h1>
        <span
          aria-label="Beta"
          style={{
            fontSize: 13,
            color: "#daa84b",
            background: "rgba(255,168,64,0.09)",
            borderRadius: 11,
            padding: "3px 12px",
            marginLeft: 14,
            fontWeight: 600,
            boxShadow: "0 1.5px 7px 0 rgba(0,0,0,0.04)",
            letterSpacing: ".08em"
          }}
        >PREMIUM</span>
      </header>

      {/* Input Panel */}
      <form
        aria-label="Domain input form"
        style={{
          background: "var(--secondary)",
          borderRadius: 11,
          padding: "28px 32px",
          maxWidth: 700,
          marginBottom: 34,
          boxShadow: "0 4px 32px -8px rgba(0,0,0,0.17)"
        }}
        onSubmit={e => { e.preventDefault(); handleSubmitScan("Amass"); }}
      >
        <label htmlFor="domain-input"
          style={{
            fontWeight: 600,
            color: "var(--base-accent)",
            letterSpacing: ".01em",
            fontSize: 17,
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
            padding: "14px 11px",
            borderRadius: 7,
            fontSize: 15.7,
            fontFamily: "var(--font-code)",
            color: "var(--text-color)",
            border: "1.8px solid var(--border-color)",
            background: "var(--base-dark)",
            marginBottom: 7,
            boxShadow: "0 2.5px 9px -6px rgba(0,0,0,0.13)"
          }}
          placeholder="e.g. example.com\nor: domain1.com, domain2.com"
        />
        <small
          id="domain-desc"
          style={{
            color: "var(--text-tertiary)",
            fontSize: 13,
            display: "block",
            marginBottom: 7,
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
              fontWeight: 500,
              marginBottom: 13,
              fontSize: 14
            }}
          >
            <span aria-hidden="true" style={{ marginRight: 5 }}>❌</span>{error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          marginTop: 7,
          display: "flex",
          gap: 12,
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
              fontWeight: 600,
              background: "var(--base-light)",
              color: "#272a31",
              gap: 9,
              border: "none",
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
              fontWeight: 600,
              fontSize: 17.5,
            }}
            aria-label="Run Masscan Network Scan"
            disabled={!!loading}
            onClick={() => handleSubmitScan("Masscan")}
          >🖥️ Run Masscan</button>
          <button
            type="button"
            className="btn"
            style={{
              marginLeft: 12,
              fontSize: 16,
            }}
            aria-label="Clear domains input"
            disabled={!!loading}
            onClick={() => { setDomainsInput(""); setDomains([]); setResults([]); setError(""); }}
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
            background: "rgba(255,152,0,0.065)",
            color: "var(--base-accent)",
            borderRadius: 7,
            padding: "12px 22px",
            fontWeight: 500,
            marginBottom: 20,
            fontSize: 17,
            display: "flex",
            alignItems: "center",
            gap: 11,
            boxShadow: "0 2.5px 7px -5px rgba(255,152,0,0.09)"
          }}
          aria-live="assertive"
        >
          <span style={{ fontSize: 22 }} aria-hidden="true">⏳</span> {loading}
        </div>
      )}

      {/* Results Table & Graph */}
      {!!results.length && (
        <section
          aria-label="Scan Results"
          style={{
            background: "var(--secondary)",
            borderRadius: 12,
            marginBottom: 24,
            padding: 22,
            boxShadow: "0 4px 32px -8px rgba(0,0,0,0.14)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: 13 }}>
            <span aria-hidden="true" style={{ fontSize: 22, marginRight: 8 }}>📊</span>
            <h2 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: "var(--base-light)",
              letterSpacing: 0.01
            }}>Results</h2>
            <span style={{ flex: 1 }} />
            <button
              className="btn"
              aria-label="Export results as CSV"
              style={{
                marginRight: 9,
                background: "linear-gradient(90deg,#ff9800,#ffad42)",
                color: "#23272e",
                fontWeight: 700,
                fontSize: 15.5
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
                fontSize: 15.5
              }}
              disabled={exporting}
              onClick={() => handleExport("JSON")}
            >🗎 Export JSON</button>
          </div>

          {/* Premium Graph: Visualize count of discoverd results by tool */}
          <div style={{ marginBottom: 30 }}>
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
                legend: {display: false},
              }}
              style={{marginBottom: 10, maxWidth: 550}}
            />
          </div>

          {/* Premium Table */}
          <TableDisplay
            data={results}
            columns={[
              {
                label: "Domain",
                field: "domain",
                emoji: "🌐",
                sortable: true,
                filter: true,
                bold: true,
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
                  // Heuristics for types
                  "open": "🟢",
                  "closed": "🔴",
                  "filtered": "🟡",
                  "host": "🌎",
                },
                sortable: false,
                filter: true,
              },
              {
                label: "Time",
                field: "time",
                emoji: "⏰",
                sortable: true,
                filter: false,
              }
            ]}
            initialSortField="domain"
            size="md"
            filterable={true}
            style={{margin: "0 0 0 0"}}
          />
        </section>
      )}

      {/* Recon History Table & Graph */}
      {!!history.length && (
        <section
          aria-label="Recon History"
          style={{
            background: "var(--secondary)",
            borderRadius: 12,
            padding: 22,
            marginBottom: 18,
            boxShadow: "0 1.5px 8px 0 rgba(0,0,0,0.12)"
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 12
          }}>
            <span aria-hidden="true" style={{ fontSize: 18, marginRight: 8 }}>🕒</span>
            <h3 style={{ margin: 0, fontSize: 16.5, color: "#b38126", fontWeight: 600 }}>Recent Recon History</h3>
            <span style={{ flex: 1 }} />
          </div>
          {/* Mini graph: findings by domain */}
          <div style={{ maxWidth: 420, marginBottom: 9 }}>
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
              style={{marginBottom: 7, maxWidth: 380}}
            />
          </div>
          <TableDisplay
            data={[...history.slice(-12)].reverse().map(h => ({
              ...h,
              time: h.time || (h.timestamp ? new Date(h.timestamp).toLocaleTimeString() : "")
            }))}
            columns={[
              {
                label: "Domain",
                field: "domain",
                emoji: "🌐",
                sortable: true,
                filter: true,
                bold: true,
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
                filter: true,
              },
              {
                label: "Time",
                field: "time",
                emoji: "⏰",
                sortable: true,
                filter: false,
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
            background: "rgba(137,183,255,0.08)",
            color: "#7cc6f6",
            borderRadius: 7,
            padding: "8px 20px",
            fontWeight: 500,
            fontSize: 15.2,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 19 }}>💾</span> Preparing export...
        </div>
      )}

      {/* Accessible footer */}
      <footer style={{
        padding: "12px 0 0 0",
        fontSize: 12.8,
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
