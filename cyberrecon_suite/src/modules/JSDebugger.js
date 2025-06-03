import React, { useRef, useState } from "react";
import TableDisplay from "../components/TableDisplay";
import Modal from "../components/Modal";

// Regex patterns for extraction
const regexRules = [
  // Keywords
  {
    label: "Keyword",
    field: "keyword",
    type: "keyword",
    // Simple identifiers/variable assignments (including camelCase, snake_case, configs)
    regex: /(?:var|let|const|function|class|enum|interface)\s+([a-zA-Z_]\w+)|([a-zA-Z_]\w+)\s*=/g
  },
  // Secrets: API keys, tokens, JWTs, basic auth, etc.
  {
    label: "Secret",
    field: "secret",
    type: "secret",
    // API KEY (Google, AWS, generic), JWT, random long tokens
    // Google API: AIza..., AWS: AKIA..., JWT: [header].[payload].[sig], Bearer, anything that looks like secret=...
    regex: /\b(AIza[0-9A-Za-z-_]{30,35}|AKIA[0-9A-Z]{16}|eyJ[\w=-]+\.[\w=-]+\.[\w=-]+|secret[^\s:="'`<>]{4,32}|token\W{0,6}[a-zA-Z0-9_\-=]{8,}|\bBearer\s+[A-Za-z0-9\-_\.=]+\b|sk_live_[a-zA-Z0-9]{24,})\b/gi
  },
  // Endpoints/URLs (excluding obvious assets/css/js/image, favor API, .php, etc.)
  {
    label: "Endpoint",
    field: "endpoint",
    type: "endpoint",
    // Looks for /api/... or /v1/v2..., .php, .asp, .jsp, .aspx, .cgi endpoint paths, http URLs, websocket URLs
    regex: /\b(https?:\/\/[^\s"'`<>]+|wss?:\/\/[^\s"'`<>]+|\/[a-zA-Z0-9_\-\/\.]*(?:api|api\/v\d+|admin|login|register|users|reset|auth)[^\s"'`<>]*|\b\/[a-zA-Z0-9\/_.-]+\.php\b|\b\/[a-zA-Z0-9\/_.-]+\.as(px)?\b|\b\/[a-zA-Z0-9\/_.-]+\.jsp\b|\b\/[a-zA-Z0-9\/_.-]+\.cgi\b)/gi
  }
];

// Column defs for premium table
const TABLE_COLS = [
  {
    label: "Type",
    field: "type",
    emojiMap: { keyword: "🔑", secret: "🧪", endpoint: "🌐" },
    sortable: true,
    filter: true,
    colored: true,
    colorMap: { keyword: "#ffad42", secret: "#ff5964", endpoint: "#51b57f" },
    bold: true
  },
  {
    label: "Match",
    field: "value",
    emoji: "🔍",
    sortable: true,
    filter: true,
    bold: true
  },
  {
    label: "Context",
    field: "context",
    sortable: false,
    filter: false
  },
  {
    label: "Line",
    field: "lineNumber",
    sortable: true,
    filter: false
  }
];

// PUBLIC_INTERFACE
/**
 * Premium JS Debugger module:
 * - Paste/upload JS/HTML, live regex extraction (secrets, endpoints, keywords)
 * - Results in modern, filterable table.
 * - Accessible, dark-themed, premium UI.
 */
function JSDebugger() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [fileName, setFileName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef();
  const textareaRef = useRef();

  // Main extraction logic
  function extractMatches(src) {
    if (!src) return [];
    let res = [];
    const lines = src.split(/\r?\n/);
    lines.forEach((line, idx) => {
      regexRules.forEach(({ label, field, type, regex }) => {
        let match;
        // Reset regex lastIndex; avoid global state bleed across calls
        let re = new RegExp(regex.source, regex.flags);
        while ((match = re.exec(line)) !== null) {
          let val =
            (match[1] ??
              match[2] ??
              match[0] ??
              (typeof match === "string" ? match : null));
          // Avoid weird empty
          if (!val || String(val).length < 2) continue;
          // De-duplicate by value, type, line
          if (
            !res.some(
              (r) =>
                r.value === val &&
                r.type === type &&
                r.lineNumber === idx + 1
            )
          ) {
            let context = line.length > 200
              ? line.slice(0, 100) + "..." + line.slice(-60)
              : line;
            res.push({
              type,
              value: val,
              context,
              lineNumber: idx + 1
            });
          }
        }
      });
    });
    return res;
  }

  // Handle paste, textarea input, file upload
  function handleInputChange(e) {
    let val = e?.target?.value ?? "";
    setInput(val);
    setFileName("");
    const matches = extractMatches(val);
    setResults(matches);
    setLastUpdated(Date.now());
  }

  // Handle paste event to support right-click/paste in browser/electron
  function handlePasteEvent(e) {
    let pasted = e.clipboardData?.getData("Text");
    if (pasted) {
      setInput(pasted);
      setFileName("");
      const matches = extractMatches(pasted);
      setResults(matches);
      setLastUpdated(Date.now());
    }
  }

  // File upload: read as text, update input/results
  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = function (loadEvt) {
      setInput(loadEvt.target.result);
      const matches = extractMatches(loadEvt.target.result);
      setResults(matches);
      setLastUpdated(Date.now());
    };
    reader.readAsText(file);
  }

  // Drag-and-drop upload
  function handleDrop(e) {
    e.preventDefault();
    let file = e.dataTransfer?.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = function (loadEvt) {
        setInput(loadEvt.target.result);
        const matches = extractMatches(loadEvt.target.result);
        setResults(matches);
        setLastUpdated(Date.now());
      };
      reader.readAsText(file);
    }
  }
  function handleDragOver(e) {
    e.preventDefault();
  }

  // Export results as CSV/JSON
  function exportCSV() {
    if (!results.length) return;
    const header = TABLE_COLS.map((c) => c.field).join(",");
    const rows = results.map((r) =>
      TABLE_COLS.map((c) => `"${(r[c.field] || "").toString().replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([header + "\r\n" + rows.join("\r\n")], { type: "text/csv" });
    downloadBlob(blob, fileName ? fileName.replace(/\.(js|html?)$/i, "_matches.csv") : "jsdebug-matches.csv");
  }
  function exportJSON() {
    if (!results.length) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    downloadBlob(blob, fileName ? fileName.replace(/\.(js|html?)$/i, "_matches.json") : "jsdebug-matches.json");
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  // Accessible modal explaining regex/fields
  function HelpModal() {
    return (
      <Modal isOpen={showModal} title="About Extraction & Regex" onClose={() => setShowModal(false)}>
        <div>
          <b>Extraction Rules:</b>
          <ul>
            <li><b>Keyword:</b> Top-level identifiers (var/let/const/class/function names), useful for wordlists or endpoint guessing.</li>
            <li><b>Secret:</b> Strings matching API key/JWT/token patterns (ex: <code>AIza...</code>, <code>eyJ...</code>, <code>AKIA...</code>, <code>Bearer ...</code>).</li>
            <li><b>Endpoint:</b> URLs or API routes (<code>/api/... /admin</code>, <code>.php</code>, <code>.jsp</code>, <code>.aspx</code>).</li>
          </ul>
          <p><b>Tips:</b></p>
          <ul>
            <li>For large files, use Table search/filter to isolate secrets/endpoints.</li>
            <li>This extraction is purely <b>regex-based</b>; no deobfuscation or minified code expansion.</li>
          </ul>
        </div>
      </Modal>
    );
  }

  // Render premium, modern, accessible UI
  return (
    <section
      aria-label="JS Debugger"
      tabIndex={0}
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "32px 0",
        color: "var(--text-color)"
      }}
    >
      <HelpModal />
      <header
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 24,
          gap: 14
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: 32,
            background: "linear-gradient(94deg,#a9ffcf 10%,#ffad42 85%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontWeight: 900,
            marginRight: 8,
            textShadow: "0 2.2px 8px rgba(255,168,32,0.12)"
          }}
        >
          🧩
        </span>
        <h1 style={{
          margin: 0,
          fontSize: 26.5,
          letterSpacing: ".012em",
          color: "var(--base-light)",
          fontWeight: 800
        }}>
          JS Debugger
        </h1>
        <span
          aria-label="Premium"
          style={{
            fontSize: 13.4,
            color: "#b3b55f",
            background: "rgba(255,168,64,0.11)",
            borderRadius: 12,
            padding: "3.5px 11px",
            marginLeft: 13,
            fontWeight: 700,
            boxShadow: "0 1.5px 7px 0 rgba(0,0,0,0.035)",
            border: "1.1px solid rgba(255,184,72,0.09)"
          }}>
          PREMIUM
        </span>
        <span style={{ flex: 1 }} />
        <button
          className="btn"
          style={{
            background: "linear-gradient(97deg,#41b572 60%,#a7ffed)",
            color: "#191b22",
            fontWeight: 700,
            fontSize: 15,
            borderRadius: 7,
            marginRight: 7
          }}
          onClick={() => setShowModal(true)}
          aria-label="Show help for extraction rules"
        >
          ℹ️ Help
        </button>
      </header>
      {/* Paste/Upload Area */}
      <form
        aria-label="Paste or upload JS/HTML"
        onSubmit={e => e.preventDefault()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          background: "var(--secondary)",
          borderRadius: 13,
          padding: "22px 29px",
          maxWidth: 710,
          marginBottom: 26,
          boxShadow: "0 6px 24px -8px rgba(0,0,0,0.13)",
          position: "relative"
        }}
      >
        <label
          htmlFor="jsdebugger-input"
          style={{
            fontWeight: 700,
            color: "#ffad42",
            letterSpacing: ".01em",
            fontSize: 16.2,
            display: "block",
            marginBottom: 7
          }}>
          Paste or Drag a JS/HTML source file
          <span aria-hidden="true" style={{ marginLeft: 8, fontSize: 17 }}>📋</span>
        </label>
        <textarea
          ref={textareaRef}
          id="jsdebugger-input"
          name="debugtxt"
          value={input}
          spellCheck={false}
          aria-required="true"
          aria-describedby="jsdebugger-desc"
          rows={6}
          placeholder="Paste or drag/drop your JavaScript or HTML code here for secret/token/endpoint extraction."
          onChange={handleInputChange}
          onPaste={handlePasteEvent}
          tabIndex={0}
          style={{
            width: "100%",
            padding: "14px 12px",
            borderRadius: 8,
            fontSize: 15.3,
            fontFamily: "var(--font-code)",
            border: "1.5px solid var(--border-color)",
            background: "var(--base-dark)",
            marginBottom: 7,
            color: "var(--text-color)",
            resize: "vertical",
            boxShadow: "0 2.5px 9px -7px rgba(0,0,0,0.13)",
            fontWeight: 500,
            minHeight: 96,
            letterSpacing: ".01em"
          }}
        />
        <small
          id="jsdebugger-desc"
          style={{
            color: "var(--text-tertiary)",
            fontSize: 13.5,
            display: "block",
            marginBottom: 8,
            letterSpacing: ".01em"
          }}
        >
          Supports paste, drag-and-drop, or file upload. {fileName && <b>File: <code>{fileName}</code></b>}
        </small>
        <div style={{
          display: "flex",
          gap: 15,
          marginTop: 1,
          marginBottom: 10,
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".js,.jsx,.html,.htm,.txt"
            style={{ display: "none" }}
            onChange={handleFileUpload}
            aria-label="Upload JS or HTML file"
          />
          <button
            type="button"
            className="btn"
            style={{
              fontWeight: 700,
              background: "linear-gradient(90deg,#ff9800,#ffad42)",
              color: "#23272e",
              borderRadius: 7,
              fontSize: 15.2
            }}
            aria-label="Upload a file"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >📤 Upload File</button>
          <button
            type="button"
            className="btn"
            style={{
              fontWeight: 600,
              background: "linear-gradient(90deg,#51b57f,#90ffa9)",
              color: "#191b22",
              borderRadius: 7,
              fontSize: 15.2
            }}
            aria-label="Clear input"
            onClick={() => { setInput(""); setFileName(""); setResults([]); textareaRef.current && textareaRef.current.focus(); }}
          >🧹 Clear</button>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="btn"
            style={{
              background: "linear-gradient(90deg,#6ce9ff,#8d76ff)",
              color: "#191b22",
              fontWeight: 700,
              borderRadius: 7,
              fontSize: 14.7
            }}
            aria-label="Export as CSV"
            onClick={exportCSV}
          >📤 Export CSV</button>
          <button
            type="button"
            className="btn"
            style={{
              background: "linear-gradient(90deg,#f0f97f,#4ecfff)",
              color: "#413222",
              fontWeight: 700,
              borderRadius: 7,
              fontSize: 14.7
            }}
            aria-label="Export as JSON"
            onClick={exportJSON}
          >🗎 Export JSON</button>
        </div>
      </form>
      {/* Result Table */}
      <section
        aria-label="Extraction Results"
        style={{
          background: "var(--secondary)",
          borderRadius: 13,
          padding: "17px 19px",
          marginBottom: 17,
          boxShadow: "0 3px 19px 0 rgba(0,0,0,0.10)"
        }}
      >
        <div style={{
          fontWeight: 700,
          color: "#ffad42",
          fontSize: 17.5,
          marginBottom: 8
        }}>Extraction Results</div>
        {results.length === 0 && (
          <div style={{
            minHeight: 98,
            textAlign: "center",
            color: "#948672",
            opacity: 0.75,
            padding: "42px 0 18px 0",
            fontWeight: 500,
            letterSpacing: ".04em",
            fontSize: 18
          }}>
            <span aria-hidden="true" style={{ fontSize: 24 }}>🧐</span>
            <br />
            No matches found.
          </div>
        )}
        <TableDisplay
          data={results}
          columns={TABLE_COLS}
          initialSortField="type"
          filterable={true}
          size="lg"
          quickFields={[
            {
              field: "type",
              label: "Type",
              options: ["keyword", "secret", "endpoint"]
            }
          ]}
          style={{ marginTop: 3, marginBottom: 3 }}
        />
      </section>
      {/* Premium footer */}
      <footer style={{
        padding: "11px 0 0 0",
        fontSize: 12.5,
        color: "var(--text-tertiary)",
        display: "flex",
        alignItems: "center",
        gap: 9
      }}>
        <span aria-hidden="true" style={{ fontSize: 14, marginRight: 7 }}>
          🚦
        </span>
        Results are never sent externally. All extraction is local. For advanced static/dynamic analysis, consider standalone tools.
      </footer>
    </section>
  );
}

export default JSDebugger;
