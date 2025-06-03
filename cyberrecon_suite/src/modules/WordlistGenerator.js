import React, { useState, useRef } from "react";
import TableDisplay from "../components/TableDisplay";
import Modal from "../components/Modal";

/**
 * Helper: read file as text for uploads.
 */
function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    if (!file) reject("No file given");
    const reader = new window.FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Parse HTML or JS text to plain tokenized words for keyword extraction.
 * - Removes HTML tags/comments
 * - Removes JS comments/strings (best-effort, lightweight)
 * - Returns array of lower-cased alphanumeric words
 */
function parseTextToTokens(raw) {
  if (!raw) return [];
  // Remove HTML tags/comments
  let text = raw
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  // Remove JS comments
  text = text
    .replace(/\/\/.*$/gm, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
  // Remove quoted strings (simple, will skip some tokens)
  text = text.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, " ");
  // Replace non-word with space, split to words
  return text
    .replace(/[^a-zA-Z0-9_\-$]+/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t && t.length > 2 && !/^[0-9]+$/.test(t)); // filter very short/numeric
}

/**
 * Lightweight TF-IDF implementation for a single document
 * Returns: [{keyword, count, tf, idf (always 1), tfidf}]
 */
function extractKeywordsTfIdf(tokens) {
  if (!tokens || !tokens.length) return [];
  const freqMap = {};
  tokens.forEach(t => { freqMap[t] = (freqMap[t] || 0) + 1; });
  const maxFreq = Math.max(...Object.values(freqMap));
  // IDF is always 1 in single-document (TF ranking only, but structure is compatible)
  return Object.entries(freqMap).map(([word, count]) => ({
    keyword: word,
    count,
    tf: count / tokens.length,
    idf: 1,
    tfidf: (count / tokens.length), // can be improved if multi source
    score: (count / tokens.length)
      * (word.length >= 7 ? 1.3 : 1.0) // boost for longer tokens
      * (/[\_\-\$]/.test(word) ? 1.12 : 1.0) // boost for code-like
      * (/[a-z]/.test(word) && /[A-Z]/i.test(word) ? 1.08 : 1.0)
  }));
}

/**
 * PUBLIC_INTERFACE
 * Main Wordlist Generator component
 */
function WordlistGenerator() {
  // Text input state
  const [inputText, setInputText] = useState("");
  const [tokens, setTokens] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [ariaMsg, setAriaMsg] = useState("");
  const [lastExport, setLastExport] = useState("");
  const textareaRef = useRef();

  // Handle paste/upload/event to populate inputText
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setFilename(file.name);
    readFileAsync(file)
      .then(raw => {
        setInputText(raw.slice(0, 500000)); // Max ~500KB
        setTimeout(() => {
          analyzeText(raw);
        }, 100);
      })
      .catch(() => setError("Failed to read file!"));
  }

  function handlePaste(e) {
    setError("");
    const data = (e.clipboardData?.getData("text/plain") || "");
    setInputText(data);
    setTimeout(() => analyzeText(data), 90);
  }

  function handleInput(e) {
    setInputText(e.target.value);
    setTimeout(() => analyzeText(e.target.value), 90);
  }

  // Analyze input text to extract keywords
  function analyzeText(txt = inputText) {
    const tokensArr = parseTextToTokens(txt);
    setTokens(tokensArr);
    const kws = extractKeywordsTfIdf(tokensArr)
      .filter(k => k.keyword.length >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 150);
    setKeywords(kws);
    setAriaMsg(kws.length ? `Found ${kws.length} keywords.` : "No keywords found.");
  }

  // CSV/JSON export
  function doExport(fmt = "csv") {
    let expData = [];
    let name = "wordlist";
    if (fmt === "csv") {
      expData = ["keyword,count,score"].concat(
        keywords.map(k => `${k.keyword},${k.count},${k.score.toFixed(4)}`)
      ).join("\r\n");
      name += ".csv";
    } else {
      expData = JSON.stringify(keywords, null, 2);
      name += ".json";
    }
    const blob = new Blob([expData], { type: fmt === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
    setLastExport(fmt.toUpperCase());
    setAriaMsg(`Exported as ${fmt.toUpperCase()}.`);
  }

  function clearAll() {
    setInputText(""); setTokens([]); setKeywords([]); setFilename(""); setError(""); setLastExport("");
    setTimeout(() => textareaRef.current?.focus(), 80);
  }

  // Render: modern, accessible UI
  return (
    <section
      aria-label="Wordlist Generator"
      tabIndex={0}
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "42px 0 36px 0",
        color: "var(--text-color)"
      }}
    >
      {/* Aria Live */}
      <div className="visually-hidden" aria-live="polite">{ariaMsg}</div>

      {/* Premium Heading */}
      <header style={{
        display: "flex", alignItems: "center", marginBottom: 23, gap: 14
      }}>
        <span aria-hidden="true" style={{
          fontSize: 29,
          background: "linear-gradient(88deg,#ffad42,#ff9800 80%)",
          WebkitBackgroundClip: "text",
          color: "transparent",
          fontWeight: 800,
          marginRight: 9,
          textShadow: "0 2.8px 18px rgba(255,168,32,0.18)"
        }}>📄</span>
        <h1 style={{
          margin: 0,
          fontSize: 25.5,
          letterSpacing: ".014em",
          color: "var(--base-light)",
          fontWeight: 800
        }}>
          Wordlist Generator
        </h1>
        <span style={{
          fontSize: 13,
          background: "rgba(255,168,64,0.07)",
          borderRadius: 14,
          padding: "4.5px 11px",
          marginLeft: 11,
          fontWeight: 600,
          color: "#aea65a",
          border: "1.1px solid #bdb76ba2"
        }}>
          PREMIUM
        </span>
        <span style={{ flex: 1 }} />
        <button
          className="btn"
          aria-label="Show module help"
          style={{
            color: "#7eeaff",
            background: "linear-gradient(118deg,#233b53 92%,#2082b1 130%)",
            fontWeight: 700,
            borderRadius: 8,
            marginLeft: 10
          }}
          onClick={() => setShowModal(true)}
        >
          Help
        </button>
      </header>

      {/* Paste/Upload Panel */}
      <form
        aria-label="Paste or upload JS/HTML"
        style={{
          background: "var(--secondary)",
          borderRadius: 12,
          padding: "28px 29px",
          marginBottom: 31,
          boxShadow: "0 5px 38px -10px rgba(0,0,0,0.16)"
        }}
        onSubmit={e => { e.preventDefault(); analyzeText(); }}
      >
        <label htmlFor="wl-input"
          style={{
            fontWeight: 700,
            color: "var(--base-accent)",
            fontSize: 16.7,
            display: "block",
            marginBottom: 9
          }}>
          Paste JS/HTML code or drop/upload a file
          <span aria-hidden="true" style={{ fontSize: 19, marginLeft: 10 }}>🗎</span>
        </label>
        <textarea
          id="wl-input"
          ref={textareaRef}
          className="premium-inp"
          value={inputText}
          autoComplete="off"
          spellCheck={false}
          aria-required="true"
          aria-label="Paste JS/HTML here"
          placeholder="Paste JavaScript or HTML code here..."
          onChange={handleInput}
          onPaste={handlePaste}
          rows={8}
          style={{
            width: "100%",
            padding: "14px 13px",
            borderRadius: 8,
            fontSize: 15.3,
            fontFamily: "var(--font-code)",
            color: "var(--text-color)",
            border: "1.3px solid var(--border-color)",
            background: "var(--base-dark)",
            marginBottom: 6,
            boxShadow: "0 2.5px 9px -6px rgba(0,0,0,0.12)"
          }}
          aria-describedby="wl-input-desc"
        />
        <small
          id="wl-input-desc"
          style={{
            color: "var(--text-tertiary)",
            fontSize: 13,
            display: "block",
            marginBottom: 8
          }}
        >
          Paste source, or
          <label style={{ color: "#b9ebff", fontWeight: 600, marginLeft: 6, cursor: "pointer" }}>
            upload
            <input
              type="file"
              accept=".js,.html,.htm,.txt"
              aria-label="Upload JS/HTML file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </label>
          {filename ? (
            <span style={{ color: "#c4f393", marginLeft: 8 }}>(Loaded: {filename})</span>
          ) : null}
        </small>
        {error && (
          <div
            role="alert"
            tabIndex={-1}
            style={{
              color: "#ff5964",
              background: "#2c1e1e",
              padding: "7px 12px",
              borderRadius: 6,
              fontWeight: 700,
              marginBottom: 10,
              marginTop: 2
            }}
          >{error}</div>
        )}
        <div style={{
          display: "flex", gap: 12, marginTop: 11,
          alignItems: "center"
        }}>
          <button
            type="submit"
            className="btn btn-large"
            aria-label="Extract keywords"
            style={{
              fontSize: 16.6,
              fontWeight: 700,
              background: "linear-gradient(90deg,#ff9800,#ffad42)",
              color: "#272a31"
            }}
            disabled={inputText.length === 0}
          >🚀 Generate</button>
          <button
            type="button"
            className="btn"
            aria-label="Clear all"
            onClick={clearAll}
            disabled={inputText.length === 0 && !tokens.length}
            style={{
              fontWeight: 600,
              fontSize: 15,
              background: "#232426",
              color: "#aee7ac"
            }}>
            🧹 Clear
          </button>
          <span style={{
            color: "#fbe278", fontSize: 13.5, marginLeft: 7, minWidth: 55
          }} aria-live="polite">
            {tokens.length ? `${tokens.length} tokens` : ""}
          </span>
        </div>
      </form>

      {/* Results Table */}
      <section
        aria-label="Keyword Results"
        style={{
          background: "var(--secondary)",
          borderRadius: 13,
          boxShadow: "0 4px 38px -12px #272a23a5",
          padding: 22,
          marginBottom: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 11 }}>
          <span aria-hidden="true" style={{ fontSize: 18, marginRight: 8 }}>🔑</span>
          <h2 style={{
            margin: 0,
            fontSize: 17.2,
            color: "#b38126",
            fontWeight: 800
          }}>
            Extracted Keywords
          </h2>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="btn"
            aria-label="Export as CSV"
            style={{
              marginRight: 10,
              background: "linear-gradient(90deg,#ff9800,#ffad42)",
              color: "#23272e",
              fontWeight: 700,
              fontSize: 15.5
            }}
            disabled={keywords.length === 0}
            onClick={() => doExport("csv")}
          >📤 Export CSV</button>
          <button
            type="button"
            className="btn"
            aria-label="Export as JSON"
            style={{
              background: "linear-gradient(90deg,#6ce9ff,#8d76ff)",
              color: "#191b22",
              fontWeight: 700,
              fontSize: 15.5
            }}
            disabled={keywords.length === 0}
            onClick={() => doExport("json")}
          >🗎 Export JSON</button>
        </div>
        <TableDisplay
          data={keywords}
          columns={[
            {
              label: "Keyword",
              field: "keyword",
              sortable: true,
              filter: true,
              bold: true
            },
            {
              label: "Count",
              field: "count",
              sortable: true,
              filter: false
            },
            {
              label: "Score",
              field: "score",
              sortable: true,
              filter: false,
              render: v => v?.toFixed(4)
            }
          ]}
          initialSortField="score"
          quickFields={[
            { field: "keyword", label: "Keyword" }
          ]}
          filterable={true}
          size="md"
          style={{ marginBottom: 13, minWidth: 300 }}
        />
        {keywords.length === 0 && (
          <div style={{
            textAlign: "center",
            color: "var(--text-tertiary)",
            fontSize: 15.2,
            margin: "23px 0 19px 0"
          }}>
            No keywords found. Paste JS/HTML and click Generate.
          </div>
        )}
        {keywords.length > 0 && (
          <div style={{
            color: "#aed7db",
            fontSize: 13,
            textAlign: "right"
          }}>
            {`Top ${keywords.length} keywords. Use Export for full list.`}
          </div>
        )}
        {lastExport && (
          <div
            tabIndex={-1}
            style={{
              color: "#97e0ad",
              fontWeight: 700,
              fontSize: 13.5,
              marginTop: 7,
              textAlign: "right"
            }}
            aria-live="polite"
          >Exported as {lastExport}.</div>
        )}
      </section>

      {/* Modal Help/Accessibility */}
      <Modal
        isOpen={showModal}
        title="Wordlist Generator — Help"
        onClose={() => setShowModal(false)}
      >
        <div style={{ fontSize: 15.1, lineHeight: 1.7 }}>
          <p>
            Paste JavaScript, HTML, or upload code to extract a prioritized, high-quality custom wordlist for security testing tasks (fuzzing, brute-forcing, recon, etc). This tool analyzes the code entirely in-browser for privacy.
          </p>
          <ol>
            <li>Paste or upload JS/HTML/text from target source code.</li>
            <li>Click <b>Generate</b> to extract keywords by in-browser TF-IDF algorithm.</li>
            <li>Filter/sort results, and export as CSV or JSON for use in attack tools.</li>
          </ol>
          <b>Tips:</b>
          <ul>
            <li>Supports files up to 500KB. Longer tokens and code-like patterns are prioritized.</li>
            <li>Fully accessible — all actions support keyboard and screen reader use.</li>
          </ul>
        </div>
      </Modal>
      {/* Accessible Footer */}
      <footer
        style={{
          padding: "12px 0 0 0",
          fontSize: 12.5,
          color: "var(--text-tertiary)",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 15, marginRight: 7 }}>🔒</span>
        All processing runs locally. No code is sent to remote servers.
      </footer>
    </section>
  );
}

export default WordlistGenerator;
