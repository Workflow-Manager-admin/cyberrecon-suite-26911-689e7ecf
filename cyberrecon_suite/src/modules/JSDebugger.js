import React, { useRef, useState, useCallback } from "react";
import TableDisplay from "../components/TableDisplay";
import Modal from "../components/Modal";

// == REGEX EXTRACT PATTERNS == //
const REGEXES = [
  {
    label: "JWT Token",
    field: "jwt",
    emoji: "🔑",
    regex: /\beyJ[a-zA-Z0-9._-]{20,}\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/g,
    desc: "JSON Web Token (JWT)"
  },
  {
    label: "Bearer Token",
    field: "bearer",
    emoji: "🪪",
    regex: /\bBearer\s+([\w-]{8,}\.[\w-]{8,}\.[\w-]{8,})/gi,
    desc: "Bearer OAuth/JWT Token"
  },
  {
    label: "API Key",
    field: "apikey",
    emoji: "🔑",
    // Common API key, Azure, Google, GitHub etc patterns
    regex: /\b(?:(?:AIza[0-9A-Za-z-_]{35})|(?:sk_live_[0-9a-zA-Z]{24,})|(?:ghp_[0-9a-zA-Z]{36,})|(?:[a-zA-Z0-9]{32,45}[_-]?(?:api|key|secret)[a-zA-Z0-9]*)|(?:[A-Za-z0-9_\-]{30,})\b)/g,
    desc: "Common API/Secret Key"
  },
  {
    label: "Endpoint (HTTP[S])",
    field: "endpoint",
    emoji: "🌐",
    regex: /(https?:\/\/[a-zA-Z0-9\-._~:/?#@!$&'()*+,;=%]+(?:[a-zA-Z0-9/_-]{2,}))/g,
    desc: "HTTP(S) Endpoints"
  },
  {
    label: "AWS Access Key",
    field: "awskey",
    emoji: "🪪",
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    desc: "AWS Access Key"
  },
  {
    label: "Google OAuth Refresh",
    field: "googleoauth",
    emoji: "🔑",
    regex: /\b1\/[A-Za-z0-9\-_]{43}\b/g,
    desc: "Google OAuth Token"
  },
  {
    label: "ID/Secret Pattern",
    field: "idsecret",
    emoji: "🧬",
    regex: /\b(?:client(?:Id|Secret)|api(?:Key|Secret)|access(?:Key|Secret)|secret[_-]key)\s*[:=]\s*['"`]{0,1}([a-zA-Z0-9\-_]{12,})['"`]{0,1}/gi,
    desc: "Client/API ID or Secret"
  }
];

function getDefaultColumns() {
  return [
    {
      label: "Type",
      field: "type",
      emojiMap: Object.fromEntries(REGEXES.map(r => [r.field, r.emoji])),
      sortable: true,
      filter: true,
      colored: true,
      colorMap: {
        jwt: "#ff9800",
        bearer: "#ffad42",
        apikey: "#5ac8fa",
        endpoint: "#41b57f",
        awskey: "#ffd700",
        googleoauth: "#fa81ff",
        idsecret: "#ff5964"
      }
    },
    {
      label: "Value",
      field: "value",
      bold: true,
      sortable: false,
      filter: true
    },
    {
      label: "Line #",
      field: "line",
      sortable: true,
      filter: false
    },
    {
      label: "Context",
      field: "context",
      sortable: false,
      filter: false
    }
  ];
}

// Helper: Extract findings per regex
function extractFindings(text = "") {
  let findings = [];
  // Each line, for easier context
  const lines = text.split("\n");
  REGEXES.forEach(({ regex, field, label }) => {
    let r = new RegExp(regex); // Fresh instance per use
    lines.forEach((line, idx) => {
      let match;
      while ((match = r.exec(line)) !== null) {
        findings.push({
          type: field,
          value: match[0],
          line: idx + 1,
          context: line.trim().slice(0, 160)
        });
        // Prevent infinite loop if 0-width match
        if (!match[0] || r.lastIndex === match.index)
          r.lastIndex++;
      }
      r.lastIndex = 0;
    });
  });
  return findings;
}

function sanitizeInput(src = "") {
  // Remove null bytes, compress whitespace
  return src.replace(/\0/g, "").replace(/\r\n/g, "\n");
}

// PUBLIC_INTERFACE
/**
 * JS Debugger module: Paste/upload JS or HTML, extract secrets/endpoints/tokens via regex,
 * display in a premium filterable/sortable table. Supports drag-drop, clipboard paste,
 * modern accessible UI.
 */
function JSDebugger() {
  const [input, setInput] = useState("");
  const [findings, setFindings] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const fileInputRef = useRef();

  // Live update findings as input changes
  React.useEffect(() => {
    if (!input || !input.trim()) {
      setFindings([]);
      return;
    }
    setFindings(extractFindings(input));
  }, [input]);

  // Drag-drop support
  const handleDrop = useCallback(e => {
    e.preventDefault();
    setDragActive(false);
    setError("");
    // Accept only the first file
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (!/(javascript|html|text|plain)/i.test(f.type) && !/\.(js|html)$/i.test(f.name)) {
        setError("Unsupported file type. Please upload JS/HTML/text files.");
        return;
      }
      const reader = new FileReader();
      reader.onload = evt => setInput(sanitizeInput(evt.target.result));
      reader.onerror = () => setError("File read failed.");
      reader.readAsText(f, "utf-8");
    }
  }, []);

  // Clipboard paste support
  const handlePaste = useCallback(e => {
    let pasted = e.clipboardData?.getData("text/plain");
    if (pasted) {
      setInput(sanitizeInput(pasted));
      e.preventDefault();
    }
  }, []);

  // Upload via file browse
  const handleFileChange = e => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    if (!/(javascript|html|text|plain)/i.test(file.type) && !/\.(js|html)$/i.test(file.name)) {
      setError("Unsupported file type. Please upload JS/HTML/text files.");
      return;
    }
    const reader = new FileReader();
    reader.onload = evt => setInput(sanitizeInput(evt.target.result));
    reader.onerror = () => setError("File read failed.");
    reader.readAsText(file, "utf-8");
  };

  // Result table columns
  const columns = getDefaultColumns();

  // Result table quick filter fields
  const quickFields = [
    {
      field: "type",
      label: "Type",
      options: REGEXES.map(r => r.field)
    }
  ];

  // Show detail modal for a finding
  function openFindingDetail(f) {
    setSelectedFinding(f);
    setShowResultModal(true);
  }

  function closeModal() {
    setShowResultModal(false);
    setSelectedFinding(null);
  }

  // Example file for download (sample.js)
  const SAMPLE_JS = [
    "// Sample JS/HTML for Premium JS Debugger Extraction Demo",
    "<script>",
    "const token = 'eyJhbGciOi...';",
    "fetch('https://api.example.com/v2/users?key=AIzaSy...')",
    "let clientId = 'my_client_secret_123456789012';",
    "const url = 'https://mysite.io/api/user';",
    "</script>"
  ].join("\n");

  // UI
  return (
    <section
      aria-label="JS Debugger Extractor"
      tabIndex={0}
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "38px 0",
        color: "var(--text-color)"
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 27,
          gap: 17
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: 32,
            background: "linear-gradient(95deg,#ff9800,#ffad42 96%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontWeight: 900,
            marginRight: 9,
            textShadow: "0 2.2px 12px rgba(255,168,32,0.16)"
          }}
        >
          🧩
        </span>
        <h1
          style={{
            margin: 0,
            fontSize: 27,
            letterSpacing: ".012em",
            color: "var(--base-light)",
            fontWeight: 800
          }}
        >
          JS Debugger
        </h1>
        <span
          aria-label="Premium"
          style={{
            fontSize: 14,
            color: "#daa84b",
            background: "rgba(255,168,64,0.09)",
            borderRadius: 13,
            padding: "3.5px 12px",
            marginLeft: 13,
            fontWeight: 700,
            boxShadow: "0 1.5px 7px 0 rgba(0,0,0,0.04)",
            border: "1.2px solid rgba(255,184,72,0.13)"
          }}
        >
          PREMIUM
        </span>
        <span style={{ flex: 1 }} />
      </header>

      {/* Input Panel: Paste/drag/upload */}
      <div
        aria-label="Paste/Upload Zone"
        tabIndex={0}
        role="region"
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
        onPaste={handlePaste}
        style={{
          minHeight: 140,
          padding: "32px 27px",
          background: dragActive
            ? "linear-gradient(90deg,#ff980077,#ffd27c13)"
            : "var(--secondary)",
          border: dragActive
            ? "2.7px dashed #ffad42"
            : "2.3px dashed var(--border-color)",
          borderRadius: 11,
          marginBottom: 24,
          boxShadow: "0 2.5px 18px -8px rgba(0,0,0,0.11)",
          position: "relative",
          transition: "background 0.17s, border-color 0.2s"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <b style={{ fontSize: 16.5, color: "var(--base-accent)" }}>
            Paste or Upload JS / HTML
          </b>
          <span aria-hidden="true" style={{ fontSize: 19, marginLeft: 10 }}>
            📋
          </span>
          <span style={{ flex: 1 }} />
          <button
            className="btn"
            aria-label="Upload file"
            type="button"
            style={{
              background: "linear-gradient(90deg,#41b57f,#90ffa9)",
              color: "#191b22",
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 7
            }}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            📤 Upload File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".js,.html,text/javascript,text/html,text/plain"
            onChange={handleFileChange}
            aria-label="Upload JS or HTML file"
            style={{ display: "none" }}
            tabIndex={-1}
          />
          <button
            className="btn"
            aria-label="Paste from Clipboard"
            type="button"
            style={{
              marginLeft: 10,
              fontWeight: 600,
              fontSize: 14,
              background: "linear-gradient(90deg,#6ce9ff,#8d76ff)",
              color: "#191b22"
            }}
            onClick={async () => {
              try {
                const txt = await navigator.clipboard.readText();
                if (txt) setInput(sanitizeInput(txt));
              } catch {
                setError("Clipboard read failed - try ctrl+v or browser permissions.");
              }
            }}
          >
            📋 Paste
          </button>
          <button
            className="btn"
            aria-label="Reset input"
            style={{
              marginLeft: 7,
              fontSize: 13,
              fontWeight: 600
            }}
            onClick={() => { setInput(""); setFindings([]); }}
            type="button"
          >
            🧹 Clear
          </button>
          <button
            className="btn"
            aria-label="Download Example"
            style={{
              marginLeft: 7,
              fontSize: 13,
              fontWeight: 600,
              background: "linear-gradient(90deg,#ff9800,#ffad42)",
              color: "#23272e"
            }}
            type="button"
            onClick={() => {
              const blob = new Blob([SAMPLE_JS], { type: "text/javascript" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "sample.js";
              document.body.appendChild(a);
              a.click();
              setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }, 250);
            }}
          >⬇️ Example</button>
        </div>
        <textarea
          value={input}
          spellCheck={false}
          rows={Math.min(22, Math.max(7, (input.match(/\n/g) || []).length + 3))}
          onChange={e => setInput(sanitizeInput(e.target.value))}
          onPaste={handlePaste}
          aria-label="Paste JS or HTML content here"
          style={{
            width: "100%",
            minHeight: 88,
            maxHeight: 430,
            fontSize: 15.7,
            borderRadius: 8,
            fontFamily: "var(--font-code)",
            color: "var(--text-color)",
            border: "1.1px solid var(--border-color)",
            background: "var(--base-dark)",
            marginBottom: 3,
            fontWeight: 500,
            padding: "13px 11px",
            resize: "vertical"
          }}
          placeholder={
            "Paste (ctrl+v/cmd+v), drag & drop, or upload JS/HTML here.\n" +
            "Secrets/tokens/endpoints will be extracted in real-time."
          }
        ></textarea>
        {error && (
          <div
            style={{
              color: "#ff5964",
              fontWeight: 700,
              marginTop: 8,
              fontSize: 13.7
            }}
            role="alert"
            aria-live="polite"
          >
            ❌ {error}
          </div>
        )}
        <div
          style={{
            fontSize: 12.5,
            marginTop: 6,
            color: "var(--text-tertiary)"
          }}
        >
          <b>Tip:</b> Drag and drop a file, or ctrl+v to capture clipboard!
        </div>
        {dragActive && (
          <div
            aria-live="polite"
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(255,168,32,0.10)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffad42",
              fontWeight: 800,
              fontSize: 23,
              pointerEvents: "none"
            }}
          >
            Drop file to extract secrets/tokens from JS or HTML!
          </div>
        )}
      </div>

      {/* Live Results Table */}
      <div
        aria-label="Extracted Secrets/Endpoints"
        style={{
          minHeight: 250,
          marginBottom: 33,
          background: "var(--secondary)",
          borderRadius: 14,
          boxShadow: "0 2.5px 20px -9px rgba(0,0,0,0.13)",
          padding: 22
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <span aria-hidden="true" style={{ fontSize: 19, marginRight: 7 }}>🔎</span>
          <h2 style={{
            margin: 0,
            fontSize: 18.5,
            fontWeight: 800,
            color: "var(--base-light)",
            letterSpacing: 0.012
          }}>
            Extracted Findings
          </h2>
          <span style={{ flex: 1 }} />
          <span style={{
            color: "#bbaa77",
            fontWeight: 700,
            fontSize: 15.2
          }}>
            {findings.length ? `${findings.length} found` : "No results"}
          </span>
        </div>
        <TableDisplay
          data={findings}
          columns={columns}
          filterable={true}
          size="md"
          quickFields={quickFields}
          style={{ marginTop: 7, marginBottom: 14 }}
          onRowClick={row => openFindingDetail(row)}
          onExportCSV={() => {
            // Export current findings as CSV
            if (!findings.length) return;
            const colsToExport = columns.map((c) => c.label);
            const rows = [colsToExport.join(",")].concat(
              findings.map((f) =>
                columns
                  .map((c) => `"${(f[c.field] ?? "").toString().replace(/"/g, '""')}"`)
                  .join(",")
              )
            );
            const blob = new Blob([rows.join("\r\n")], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "jsdebugger_results.csv";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 300);
          }}
          onExportJSON={() => {
            if (!findings.length) return;
            const blob = new Blob([JSON.stringify(findings, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "jsdebugger_results.json";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 300);
          }}
        />
        <div style={{ display: "flex", alignItems: "center", fontSize: 12.3, color: "var(--text-tertiary)", gap: 10 }}>
          <span>Click a row for more context and one-click copy.</span>
          {findings.length > 0 && (
            <button
              className="btn"
              aria-label="Clear all filters"
              type="button"
              style={{
                fontSize: 13.5,
                marginLeft: 8,
                background: "linear-gradient(90deg,#6ce9ff,#8d76ff)",
                color: "#191b22"
              }}
              onClick={() => {
                // Clear filters by triggering clear in TableDisplay via re-mount (minimal way)
                setInput(input); // resets tablestate due to remount
              }}
            >🧹 Clear Filters</button>
          )}
        </div>
      </div>

      {/* Modal: Finding detail/copy */}
      <Modal
        isOpen={showResultModal}
        title={selectedFinding ? "Finding Details" : ""}
        onClose={closeModal}
      >
        {selectedFinding && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 17.2, marginBottom: 7 }}>
              {REGEXES.find(r => r.field === selectedFinding.type)?.label || selectedFinding.type}
              <span aria-hidden="true" style={{ marginLeft: 9 }}>
                {REGEXES.find(r => r.field === selectedFinding.type)?.emoji}
              </span>
            </div>
            <div style={{
              fontSize: 15.7,
              fontFamily: "var(--font-code)",
              background: "#23242c",
              color: "#ffad42",
              borderRadius: 7,
              padding: "13px 10px",
              marginBottom: 7
            }}>
              {selectedFinding.value}
            </div>
            <div style={{ marginBottom: 6, fontSize: 14.2, color: "#cbd2ff" }}>
              <b>Line:</b> {selectedFinding.line}
            </div>
            <div style={{
              marginBottom: 3,
              fontWeight: 600,
              color: "#b48c41"
            }}>
              Context:
            </div>
            <div style={{
              fontSize: 14.4,
              background: "#212126",
              borderRadius: 6,
              padding: "7px 10px",
              marginBottom: 7,
              color: "#d5e4f7"
            }}>
              <code>{selectedFinding.context}</code>
            </div>
            <button
              className="btn"
              style={{
                marginTop: 7,
                background: "#284ca7",
                color: "#f3ecbb",
                fontWeight: 700,
                borderRadius: 7,
                fontSize: 14.2
              }}
              onClick={() => {
                try {
                  navigator.clipboard.writeText(selectedFinding.value);
                } catch {}
              }}
            >
              Copy Value to Clipboard
            </button>
          </div>
        )}
      </Modal>

      {/* Footer */}
      <footer
        style={{
          fontSize: 12.5,
          color: "var(--text-tertiary)",
          marginTop: 13,
          padding: "12px 0 0 0",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
        <span aria-hidden="true" style={{ fontSize: 16, marginRight: 7 }}>🧬</span>
        No JS/HTML is sent to any server – all processing is 100% local/offline.
      </footer>
    </section>
  );
}

export default JSDebugger;
