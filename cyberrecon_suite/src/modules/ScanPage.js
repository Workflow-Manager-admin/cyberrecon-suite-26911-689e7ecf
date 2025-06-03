import React, { useState, useRef } from "react";
import TableDisplay from "../components/TableDisplay";
import Modal from "../components/Modal";
import HelpSidebar from "../components/HelpSidebar";

// PUBLIC_INTERFACE
/**
 * ScanPage module: Visually premium, accessible, modern scanning workflow.
 * Features:
 *  - Prominent scan button (animated, focusable, keyboard accessible)
 *  - Live animated progress bar + stepper indicator
 *  - Realtime feedback/status with error/success handling
 *  - Animated scan feedback and status icons
 *  - Result table with filter/sort (advanced)
 *  - User controls for inputs, reset, filter, export
 *  - Modern dark UI matching suite, full accessibility, keyboard navigation.
 *  - Simulates backend scan with mock data for demo/integration.
 */
function ScanPage() {
  const [input, setInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(0);
  const [filter, setFilter] = useState({});
  const scanIdRef = useRef();

  // -- Constants/Mock --
  const SCAN_STEPS = [
    { label: "Queued", icon: "⏳" },
    { label: "Scanning...", icon: "🔎" },
    { label: "Analyzing", icon: "💡" },
    { label: "Generating report", icon: "📄" },
    { label: "Complete", icon: "✅" }
  ];
  // Demo/mock scan result data
  const MOCK_RESULTS = [
    { id: 1, host: "testsite.com", type: "Web", port: 80, status: "open", banner: "nginx", severity: "low", details: "HTTP server detected" },
    { id: 2, host: "testsite.com", type: "Web", port: 443, status: "open", banner: "nginx", severity: "medium", details: "HTTPS enabled" },
    { id: 3, host: "vpn.testsite.com", type: "VPN", port: 1194, status: "open", banner: "OpenVPN", severity: "medium", details: "VPN found" },
    { id: 4, host: "admin.testsite.com", type: "Admin", port: 8080, status: "open", banner: "Tomcat", severity: "high", details: "Admin panel" },
    { id: 5, host: "old.testsite.com", type: "Web", port: 80, status: "closed", banner: "", severity: "info", details: "Legacy" }
  ];

  // Accessibility: text for current step
  const stepStatus = scanning && step < SCAN_STEPS.length
    ? `Step ${step + 1} of ${SCAN_STEPS.length}: ${SCAN_STEPS[step].label}`
    : "";

  // Automatically progress simulated scan (mock workflow)
  React.useEffect(() => {
    if (!scanning) return;
    if (step >= SCAN_STEPS.length) {
      // Scan complete
      setTimeout(() => {
        setScanning(false);
        setProgress(100);
        setStatus("done");
        setResults(
          MOCK_RESULTS.map(r => ({ ...r, id: Math.floor(Math.random() * 999999) }))
        );
      }, 700);
      return;
    }
    // Progress each step after timeout
    const stepTimeout = setTimeout(() => {
      setProgress(((step + 1) / SCAN_STEPS.length) * 100);
      setStep(step + 1);
      if (step === SCAN_STEPS.length - 1) setStatus("analyzing");
    }, 900 + Math.random() * 750);
    return () => clearTimeout(stepTimeout);
  }, [scanning, step]);

  function validateInput(str) {
    // Accept comma/space/newline separated host/domain
    return (str || "")
      .split(/[\s,]+/)
      .map(d => d.trim())
      .filter(Boolean)
      .filter(d => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/.test(d));
  }

  // PUBLIC_INTERFACE
  function startScan() {
    setError("");
    const targets = validateInput(input);
    if (!targets.length) {
      setError("Please enter at least one valid hostname/domain to scan.");
      return;
    }
    setScanning(true);
    setStep(0);
    setStatus("running");
    setProgress(2);
    setResults([]);
    scanIdRef.current = Math.random() + "";
    // If integrating backend, call scan start here
  }

  function resetScan() {
    setScanning(false);
    setProgress(0);
    setStep(0);
    setStatus("idle");
    setResults([]);
    setError("");
  }

  // Table columns
  const columns = [
    { label: "Host", field: "host", emoji: "🌐", sortable: true, bold: true, filter: true },
    { label: "Type", field: "type", emoji: "📰", sortable: true, filter: true },
    { label: "Port", field: "port", emoji: "🛡️", sortable: true, filter: true },
    { label: "Status", field: "status", emoji: "🔓", sortable: true, filter: true,
      colored: true, colorMap: { open: "#51b57f", closed: "#ff5964" } },
    { label: "Banner", field: "banner", emoji: "🏷️", sortable: true, filter: true },
    { label: "Severity", field: "severity", emoji: "⚠️", sortable: true, filter: true,
      colored: true, colorMap: { high: "#ff5964", medium: "#ff9800", low: "#ffc773", info: "#b7ebff" } },
    { label: "Details", field: "details", emoji: "🔍", sortable: false, filter: true }
  ];

  // Quick filter controls (premium)
  const quickFields = [
    { field: "type", label: "Type", options: ["Web", "VPN", "Admin"] },
    { field: "status", label: "Status", options: ["open", "closed"] },
    { field: "severity", label: "Severity", options: ["high", "medium", "low", "info"] }
  ];

  // Premium, visually striking scan button
  function ScanButton() {
    return (
      <button
        className="scan-btn"
        type="button"
        aria-label={scanning ? "Scanning in progress" : "Start Scan"}
        onClick={() => !scanning && startScan()}
        disabled={scanning}
        tabIndex={0}
        style={{
          background: scanning
            ? "linear-gradient(97deg,#545458 30%,#999 120%)"
            : "linear-gradient(87deg,#ff9800 53%,#ffad42 100%)",
          color: scanning ? "#23232e" : "#222",
          fontWeight: 900,
          fontSize: 24,
          borderRadius: 66,
          padding: scanning ? "20px 55px" : "24px 66px",
          border: scanning ? "4px solid #999" : "4px solid #ff9800",
          boxShadow: scanning
            ? "0 0 0 0 transparent"
            : "0 10px 34px #ff930027, 0 4px 21px #ffad4266",
          outline: "none",
          cursor: scanning ? "not-allowed" : "pointer",
          opacity: scanning ? 0.82 : 1,
          letterSpacing: ".02em",
          transition: "all 0.18s cubic-bezier(.24,.74,.38,1.32)"
        }}
      >
        <span aria-hidden="true" style={{
          fontSize: 31,
          marginRight: 15,
        }}>
          {scanning ? "🔎" : "▶️"}
        </span>
        {scanning ? "Scanning..." : "Start Scan"}
      </button>
    );
  }

  // Live animated progress UI and status stepper
  function ScanProgress() {
    return (
      <div
        aria-live="polite"
        aria-busy={scanning}
        style={{
          margin: "24px auto 13px auto",
          maxWidth: 540,
          minHeight: 56,
          display: scanning ? "block" : "none"
        }}
      >
        <div style={{ marginBottom: 8, color: "#aafacf", fontWeight: 700, fontSize: 15.9 }}>
          {stepStatus}
        </div>
        <div style={{
          background: "#22242e",
          padding: 7,
          borderRadius: 13,
          boxShadow: "0 2.5px 18px -8px #181b1c26",
          minHeight: 32,
          display: "flex",
          alignItems: "center"
        }}>
          {SCAN_STEPS.map((s, idx) => (
            <span key={s.label}
              aria-label={`${s.label}${step === idx ? ", current" : ""}`}
              style={{
                fontSize: step === idx ? 26 : 19,
                fontWeight: step === idx ? 900 : 600,
                color: step > idx
                  ? "#51b57f"
                  : (step === idx ? "#ff9800" : "#b7ebff"),
                background: step === idx
                  ? "linear-gradient(92deg,#ffad42 62%,#fff082 120%)"
                  : "none",
                borderRadius: 8,
                marginRight: 9,
                marginLeft: idx === 0 ? 0 : 5,
                padding: step === idx ? "3px 18px" : "2px 12px",
                boxShadow: step === idx
                  ? "0 3px 16px #ffd86533"
                  : "none",
                transition: "all .16s"
              }}>
              <span aria-hidden="true">
                {s.icon}
              </span>
              <span style={{
                fontSize: 13,
                fontWeight: 800,
                marginLeft: 9,
                color: "#aafacf"
              }}>{s.label}</span>
            </span>
          ))}
        </div>
        {/* Premium progress bar */}
        <div style={{
          marginTop: 12,
          height: 8,
          width: "100%",
          background: "#161a2b",
          borderRadius: 7,
          overflow: "hidden"
        }}>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: 8,
              width: `${progress}%`,
              background:
                "linear-gradient(90deg,#ff9800,#ffad42 70%,#51b57f 100%)",
              borderRadius: 7,
              transition: "width .22s cubic-bezier(.4,1.28,.31,1.09)",
              boxShadow: "0 0 6px #ffad4270"
            }}
          />
        </div>
      </div>
    );
  }

  // Feedback Box
  function ScanStatus() {
    if (error)
      return (
        <div role="alert"
          style={{
            color: "#ff5964",
            fontWeight: 800,
            fontSize: 16.6,
            background: "#43242844",
            borderRadius: 13,
            padding: "19px 25px",
            boxShadow: "0 1.8px 13px #561e1e17",
            marginBottom: 17
          }}>
          ❌ {error}
        </div>
      );
    if (status === "done")
      return (
        <div role="status"
          style={{
            color: "#51b57f",
            fontWeight: 800,
            fontSize: 16.7,
            background: "#182c18c4",
            borderRadius: 13,
            padding: "18px 25px",
            boxShadow: "0 2.5px 17px #2c422c0f",
            marginBottom: 15
          }}>
          ✅ Scan complete. {results.length} findings.
        </div>
      );
    // Animate "scanning" dots during running
    if (status === "running")
      return (
        <div
          aria-live="polite"
          style={{
            color: "#ffd865",
            fontWeight: 700,
            fontSize: 16.4,
            marginBottom: 13
          }}>
          <span>
            {SCAN_STEPS[step] && SCAN_STEPS[step].label}{" "}
            <span className="blink-dot" aria-hidden="true" style={{
              display: "inline-block",
              fontWeight: 800,
              fontSize: 22,
              animation: "blink 1s steps(1) infinite"
            }}>•</span>
          </span>
          <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>
        </div>
      );
    return null;
  }

  // Accessibility: Keyboard Enter triggers scan in input
  function handleInputKey(e) {
    if (e.key === "Enter" && !scanning) startScan();
  }

  // MAIN RENDER
  return (
    <section
      aria-label="Advance Scan Page"
      tabIndex={0}
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: "35px 0",
        color: "var(--text-color)"
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 22,
          gap: 19
        }}>
        <span aria-hidden="true"
          style={{
            fontSize: 36,
            background: "linear-gradient(90deg,#ff9800,#51b57f 105%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontWeight: 900,
            marginRight: 11,
            textShadow: "0 3px 19px rgba(255,168,64,0.23)"
          }}>
          🔎
        </span>
        <h1 style={{
          fontSize: 28,
          letterSpacing: ".012em",
          color: "#ffad42",
          fontWeight: 800,
          margin: 0
        }}>Scan</h1>
        <span
          aria-label="PREMIUM"
          style={{
            fontSize: 14,
            color: "#daa84b",
            background: "rgba(255,168,64,0.09)",
            borderRadius: 13,
            padding: "3.5px 12px",
            marginLeft: 12,
            fontWeight: 700,
            boxShadow: "0 1.5px 7px 0 rgba(0,0,0,0.02)",
            border: "1.2px solid rgba(255,184,72,0.11)"
          }}
        >PREMIUM</span>
        <span style={{ flex: 1 }} />
        <button
          className="btn"
          aria-label="Show scan workflow help"
          type="button"
          style={{
            background: "linear-gradient(90deg,#51b57f,#ff9800 80%)",
            color: "#23272e",
            fontWeight: 800,
            fontSize: 16,
            borderRadius: 8,
            marginLeft: 17
          }}
          onClick={() => setShowModal(true)}
        >❓ Help</button>
      </header>
      {/* Input panel */}
      <div
        aria-label="Scan Input Region"
        style={{
          marginBottom: 21,
          background: "linear-gradient(99deg,#1a1a1a 90%,#22242a 100%)",
          border: "2.2px solid var(--border-color)",
          borderRadius: 15,
          padding: "28px 35px 16px 35px",
          boxShadow: "0 2.7px 22px -5px rgba(0,0,0,0.08)",
          minWidth: 380
        }}
        tabIndex={0}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
          <label htmlFor="scan-input"
            style={{
              fontWeight: 700,
              color: "#ffad42",
              fontSize: 17.5,
              minWidth: 99
            }}
          >
            Target(s):
          </label>
          <input
            id="scan-input"
            type="text"
            aria-label="Enter comma or space separated domains/hosts"
            placeholder="e.g. example.com, vpn.example.com"
            value={input}
            disabled={scanning}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKey}
            style={{
              fontSize: 15.7,
              borderRadius: 8,
              background: "#191b22",
              color: "#ffd98f",
              border: "1.8px solid var(--border-color)",
              padding: "10px 16px",
              fontWeight: 600,
              flex: 1,
              outline: scanning ? "2.1px solid #979" : "none",
              transition: "box-shadow .09s"
            }}
            tabIndex={0}
          />
          <ScanButton />
          <button
            className="btn"
            onClick={resetScan}
            disabled={scanning && status !== "done"}
            style={{
              marginLeft: 17,
              background: "linear-gradient(90deg,#d69a40,#353945 92%)",
              color: "#f5f6f9",
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 7
            }}
            type="button"
            aria-label="Reset scan"
            tabIndex={0}
          >🧹 Reset</button>
        </div>
        <div style={{
          color: "#b7b7b7",
          fontSize: 13.7,
          marginTop: -6,
          marginBottom: 6
        }}>
          <b>Tip:</b> Enter a comma, space, or newline-separated list of targets (domains/hosts).
        </div>
      </div>
      {/* Scan feedback UI */}
      <ScanProgress />
      <ScanStatus />
      {/* Result Table */}
      <div style={{
        marginTop: 23,
        marginBottom: 41
      }}>
        <TableDisplay
          data={results}
          columns={columns}
          filterable={true}
          quickFields={quickFields}
          size="lg"
          advancedFilters={filter}
          onChangeAdvancedFilters={
            (field, value) => setFilter(f => ({ ...f, [field]: value }))
          }
          style={{
            minWidth: 550,
            border: "1.5px solid var(--border-color)",
            background: "var(--secondary)"
          }}
        />
      </div>
      {/* Accessibility live region for dynamic messages */}
      <div className="visually-hidden" aria-live="polite">
        {scanning ? stepStatus : ""}
        {error && `Error: ${error}`}
        {status === "done" && "Scan completed"}
      </div>
      {/* Modal for help */}
      <Modal isOpen={showModal} title="How to use Scan" onClose={() => setShowModal(false)}>
        <div style={{ fontSize: 15.1 }}>
          <ul>
            <li>Enter one or more domains/hosts to scan in the input box</li>
            <li>Click <b>Start Scan</b> (or press Enter with input focused)</li>
            <li>View live scan progress and step animation</li>
            <li>Filter, sort, or export results as CSV/JSON</li>
            <li>
              <b>Accessibility:</b> All controls are keyboard accessible and ARIA-enhanced.
            </li>
          </ul>
          <div style={{
            color: "#ffd865",
            fontSize: 13.2,
            marginTop: 7
          }}>
            Real scan integration can be enabled by connecting to the backend/Nuclei/CLI via API.
          </div>
        </div>
      </Modal>
      {/* Persistent help FAB in corner */}
      <HelpSidebar
        summary="Scan Module Guide"
        placement="fixed"
        buttonAriaLabel="Help for Scan module"
        usage={<>
          <b>Enter your targets</b> and start a scan.<br />
          Filter and sort results. Full keyboard navigation!
        </>}
        description={
          <ul>
            <li><b>Scan Button:</b> Keyboard and screen reader accessible, visually prominent.</li>
            <li><b>Live Progress:</b> View animated steps and feedback throughout the scan.</li>
            <li><b>Result Table:</b> Sort and filter by any field. Export as CSV/JSON. Accessibility built-in.</li>
            <li><b>Error Handling:</b> All errors render as premium UI alerts, with ARIA live updates.</li>
          </ul>
        }
      />
    </section>
  );
}

export default ScanPage;
