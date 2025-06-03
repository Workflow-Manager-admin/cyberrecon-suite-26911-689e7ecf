import React, { useState, useRef } from "react";

/**
 * PUBLIC_INTERFACE
 * Premium wordlist generator with accessible, robust, and visually rich output for JS/HTML/any text input.
 * - Paste/upload, modern accessibility (ARIA live/result feedback, keyboard triggers, screen reader support)
 * - Fast, memory-efficient TF-IDF/word extraction for very large inputs
 * - Clipboard/copy/export (CSV/JSON/txt), error handling
 * - Advanced filter, result panel visual/polish, and a11y controls
 */
function WordlistGenerator() {
  // --- State ---
  const [sourceText, setSourceText] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [numWords, setNumWords] = useState(50);
  const [error, setError] = useState("");
  const [ariaMsg, setAriaMsg] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const taInput = useRef();
  const resultPre = useRef();

  // --- Text analysis ---
  function extractWords(txt, limit = 50) {
    // Fast word extraction with TF weighting (no external dep, handles large text)
    // Split: match words (min length 3), ignore case; auto-dedupe
    const raw = (txt || "").replace(/<[^>]+>/g, " ") // Strip HTML tags
      .replace(/[^\w\s'-]/g, " ")
      .toLowerCase()
      .split(/[\s,.;:!?()\[\]{}"'<>=_\-\/\\|`~0-9]+/g)
      .map(w => w.trim())
      .filter(w => w.length > 2 && w.length < 32 && !/^[_\-']+$/.test(w));

    const counts = {};
    let total = 0;
    raw.forEach(w => {
      if (!w) return;
      if (!counts[w]) counts[w] = 0;
      counts[w] += 1;
      total += 1;
    });
    // Adjust for term frequency (TF) and remove ultra-high or low frequency stopwords
    let arr = Object.keys(counts).map(k => ({
      word: k, freq: counts[k], weight: counts[k] / total
    }));
    // Remove common English stopwords
    const STOPWORDS = new Set([
      "the", "and", "for", "that", "with", "this", "not", "from", "are",
      "but", "was", "can", "you", "all", "use", "get", "his", "her", "has",
      "out", "one", "our", "who", "had", "have", "any", "when", "your", "its",
      "may", "too", "let", "let's", "new", "set", "how", "why", "now", "var",
      "let", "const", "else", "then", "function", "return", "true", "false",
      "import", "export", "null", "undefined", "async", "await"
    ]);
    arr = arr.filter(wd => !STOPWORDS.has(wd.word));
    // Order by frequency (desc)
    arr.sort((a, b) => b.freq - a.freq || b.word.localeCompare(a.word));
    return arr.slice(0, limit);
  }

  // --- Handlers ---
  function handleAnalyze(e) {
    e && e.preventDefault();
    setError(""); setLoading(true); setAriaMsg("");
    setTimeout(() => {
      try {
        if (!sourceText.trim()) {
          setError("Please paste or enter source code/text.");
          setAriaMsg("No input provided.");
          setKeywords([]); setFiltered([]);
          setLoading(false); return;
        }
        if (sourceText.length > 5_000_000) {
          setError("Input is too large (5MB max). Please trim or upload in parts.");
          setAriaMsg("Input too large.");
          setKeywords([]); setFiltered([]);
          setLoading(false); return;
        }
        const arr = extractWords(sourceText, numWords);
        if (!arr || !arr.length) {
          setError("No keywords found.");
          setAriaMsg("No keywords found.");
          setKeywords([]);
          setFiltered([]);
        } else {
          setKeywords(arr);
          setFiltered(arr);
          setAriaMsg(`Analysis completed. ${arr.length} keyword(s) found.`);
        }
        setLoading(false);
      } catch (ex) {
        setError("Unknown error analyzing input.");
        setAriaMsg("Analysis failed.");
        setKeywords([]);
        setFiltered([]);
        setLoading(false);
      }
    }, 30 + Math.min(1500, Math.max(0, sourceText.length / 25000))); // delay scales up with input size
  }

  function handleClear() {
    setSourceText("");
    setKeywords([]);
    setFiltered([]);
    setError("");
    setAriaMsg("Input cleared.");
    setFilterTerm("");
    setCopied(false);
    taInput.current && taInput.current.focus();
  }

  function handleFilterChange(e) {
    const val = e.target.value;
    setFilterTerm(val);
    if (!val.trim()) setFiltered([...keywords]);
    else setFiltered(keywords.filter(kw => kw.word.includes(val.trim().toLowerCase())));
  }

  function handleNumWordsChange(e) {
    let n = parseInt(e.target.value, 10);
    if (isNaN(n) || n < 5) n = 5;
    if (n > 500) n = 500;
    setNumWords(n);
  }

  // Clipboard/copy/export support
  async function handleCopyAll() {
    try {
      const txt = (filtered || keywords)
        .map(wd => wd.word)
        .join("\n");
      await navigator.clipboard.writeText(txt);
      setCopied(true); setAriaMsg("Copied to clipboard.");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setAriaMsg("Clipboard copy failed.");
    }
  }
  async function handleExport(fmt) {
    setExporting(true); setAriaMsg("");
    try {
      let file, blob, url;
      const base = (filtered || keywords);
      if (!base.length) { setExporting(false); return; }
      const fnbase = "wordlist_" + (Date.now());
      if (fmt === "csv") {
        const csv = "Word,Frequency\n" + base.map(wd =>
          `"${wd.word.replace(/"/g, '""')}",${wd.freq}`).join("\r\n");
        blob = new Blob([csv], { type: "text/csv" });
        file = fnbase + ".csv";
      } else if (fmt === "json") {
        blob = new Blob([JSON.stringify(base, null, 2)], { type: "application/json" });
        file = fnbase + ".json";
      } else {
        // txt
        blob = new Blob([base.map(wd => wd.word).join("\n")], { type: "text/plain" });
        file = fnbase + ".txt";
      }
      url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = file;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 250);
      setAriaMsg(fmt.toUpperCase() + " exported.");
    } catch {
      setAriaMsg("Export failed.");
    }
    setExporting(false);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) {
      setError("File too large (5MB max)");
      setAriaMsg("File too large.");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setSourceText(String(ev.target.result) || "");
    reader.readAsText(file);
    setAriaMsg("File loaded for analysis.");
  }

  function handleTextareaKey(e) {
    // Ctrl+Enter to analyze, Esc to clear; accessible
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleAnalyze(e);
    } else if (e.key === "Escape") {
      handleClear();
    }
  }

  // --- ARIA Live: result feedback for screen readers ---
  function AriaLive() {
    return (
      <div className="visually-hidden" aria-live="polite">
        {ariaMsg}
      </div>
    );
  }

  // --- UI ---
  return (
    <section
      aria-label="Wordlist Generator"
      tabIndex={0}
      style={{
        maxWidth: 880,
        margin: "0 auto",
        padding: "32px 0",
        color: "var(--text-color)"
      }}
    >
      <AriaLive />
      <header style={{ display: "flex", alignItems: "center", marginBottom: 23, gap: 12 }}>
        <span
          aria-hidden="true"
          style={{
            fontSize: 33,
            background: "linear-gradient(88deg,#ffad42,#ff9800 80%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontWeight: 900,
            marginRight: 8,
            textShadow: "0 2.8px 18px rgba(255,168,32,0.14)"
          }}
        >📄</span>
        <h1
          style={{
            margin: 0,
            fontSize: 27,
            letterSpacing: ".012em",
            color: "var(--base-light)",
            fontWeight: 800
          }}
        >
          Wordlist Generator
        </h1>
        <span
          aria-label="Premium"
          style={{
            fontSize: 14,
            color: "#daa84b",
            background: "rgba(255,168,64,0.11)",
            borderRadius: 13,
            padding: "3.5px 13px",
            marginLeft: 15,
            fontWeight: 700,
            boxShadow: "0 1.5px 7px 0 rgba(0,0,0,0.04)",
            border: "1.2px solid rgba(255,184,72,0.07)"
          }}
        >
          PREMIUM
        </span>
        <span style={{ flex: 1 }} />
      </header>

      {/* Input + Controls */}
      <form
        aria-label="Input text for analysis"
        onSubmit={e => { e.preventDefault(); handleAnalyze(e); }}
        style={{
          background: "var(--secondary)",
          borderRadius: 13,
          padding: "28px 32px 22px 32px",
          maxWidth: 700,
          marginBottom: 32,
          boxShadow: "0 5px 32px -9px rgba(0,0,0,0.12)"
        }}
      >
        <label
          htmlFor="wl-input"
          style={{
            fontWeight: 700,
            color: "var(--base-accent)",
            letterSpacing: ".01em",
            fontSize: 16.5,
            display: "block",
            marginBottom: 8
          }}
        >
          Source (JS/HTML/Text)
          <span aria-hidden="true" style={{ fontSize: 17, marginLeft: 8 }}>
            📥
          </span>
        </label>
        <textarea
          ref={taInput}
          id="wl-input"
          name="wl-input"
          value={sourceText}
          spellCheck={false}
          required
          aria-required="true"
          aria-describedby="wl-desc"
          rows={6}
          tabIndex={0}
          onChange={e => setSourceText(e.target.value)}
          onKeyDown={handleTextareaKey}
          style={{
            width: "100%",
            padding: "14px 12px",
            borderRadius: 9,
            fontSize: 15,
            fontFamily: "var(--font-code)",
            color: "var(--text-color)",
            border: "1.4px solid var(--border-color)",
            background: "var(--base-dark)",
            marginBottom: 6,
            boxShadow: "0 2.5px 7px -6px rgba(0,0,0,0.10)",
            fontWeight: 500,
            letterSpacing: ".01em"
          }}
          placeholder="Paste JS, HTML, or any text here (Ctrl+Enter to analyze)"
          disabled={loading}
        />
        <small
          id="wl-desc"
          style={{
            color: "var(--text-tertiary)",
            fontSize: 13,
            display: "block",
            marginBottom: 10,
            letterSpacing: ".01em"
          }}
        >
          Paste or upload source (JS, HTML, TXT). Max 5MB. Data is never sent to the server.
        </small>
        {/* File upload (input) */}
        <input
          type="file"
          accept=".js,.txt,.html,.htm,.json,text/*"
          style={{ margin: "5px 0 13px 0", display: "block" }}
          aria-label="Upload file for analysis"
          onChange={handleFileUpload}
          disabled={loading}
        />
        <div style={{
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: 3
        }}>
          <button
            type="submit"
            className="btn btn-large"
            aria-label="Analyze input"
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 16.5,
              fontWeight: 700,
              background: "var(--base-light)",
              color: "#272a31",
              gap: 9,
              border: "none"
            }}
            disabled={loading || !sourceText.trim()}
          >🧩 Analyze</button>
          <button
            type="button"
            className="btn btn-large"
            aria-label="Clear input"
            onClick={handleClear}
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 15.3,
              fontWeight: 600,
              background: "linear-gradient(90deg,#ff5964,#ffa237)",
              color: "#191b1e",
            }}
            disabled={loading && !error}
          >🧹 Clear</button>
          <label style={{
            marginLeft: 16,
            fontWeight: 600,
            color: "#ffad42",
            fontSize: 14.3,
            userSelect: "none"
          }}>
            Words to extract:
            <input
              type="number"
              value={numWords}
              onChange={handleNumWordsChange}
              min={5}
              max={500}
              disabled={loading}
              style={{
                marginLeft: 7,
                width: 68,
                fontSize: 15,
                borderRadius: 7,
                padding: "4px 7px",
                background: "#23272e",
                color: "#ffad42",
                border: "1px solid #945e1a"
              }}
              aria-label="Number of keywords to extract"
            />
          </label>
        </div>
      </form>
      {/* Error bar */}
      {!!error && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            background: "#2c1818",
            color: "#ff5964",
            borderRadius: 10,
            padding: "10px 18px",
            marginBottom: 17,
            fontWeight: 700,
            fontSize: 15,
            border: "1.1px solid #e1463b88"
          }}
        >❌ {error}</div>
      )}
      {/* Results/filter/export */}
      <section
        aria-label="Wordlist Results"
        tabIndex={0}
        style={{
          background: "var(--secondary)",
          borderRadius: 13,
          boxShadow: "0 4px 32px -9px rgba(41,64,41,0.12)",
          padding: "25px 19px 23px 27px",
          marginBottom: 30,
          minHeight: 124,
          marginTop: 7
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 12 }}>
          <span
            aria-hidden="true"
            style={{
              fontSize: 22,
              marginRight: 6,
              color: "#feb041"
            }}
          >🔑</span>
          <h2
            style={{
              fontSize: 18.5,
              margin: 0,
              color: "var(--base-light)",
              fontWeight: 700
            }}
          >
            Results
          </h2>
          <span style={{ flex: 1 }} />
          <button
            className="btn"
            aria-label="Copy wordlist to clipboard"
            style={{
              background: "linear-gradient(91deg, #51b572, #90ffa9)",
              color: "#191b22",
              fontWeight: 600,
              fontSize: 15.2
            }}
            onClick={handleCopyAll}
            disabled={loading || !filtered.length}
          >{copied ? "✅ Copied!" : "📋 Copy All"}</button>
          <button
            className="btn"
            aria-label="Export as CSV"
            style={{
              background: "linear-gradient(90deg,#ff9800,#ffad42)",
              color: "#23272e",
              fontWeight: 700,
              fontSize: 15.2
            }}
            disabled={loading || !filtered.length || exporting}
            onClick={() => handleExport("csv")}
          >📤 CSV</button>
          <button
            className="btn"
            aria-label="Export as JSON"
            style={{
              background: "linear-gradient(90deg,#6ce9ff,#8d76ff)",
              color: "#191b22",
              fontWeight: 700,
              fontSize: 15.2
            }}
            disabled={loading || !filtered.length || exporting}
            onClick={() => handleExport("json")}
          >🗎 JSON</button>
          <button
            className="btn"
            aria-label="Export as TXT"
            style={{
              background: "linear-gradient(90deg,#fcba63,#f1e8ae)",
              color: "#23272e",
              fontWeight: 700,
              fontSize: 15.2,
            }}
            disabled={loading || !filtered.length || exporting}
            onClick={() => handleExport("txt")}
          >📄 TXT</button>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 8,
          flexWrap: "wrap"
        }}>
          <input
            type="text"
            placeholder="Filter result (live search)…"
            value={filterTerm}
            onChange={handleFilterChange}
            aria-label="Filter keywords"
            style={{
              fontSize: 14.3,
              borderRadius: 7,
              background: "#23272e",
              color: "#ffb85d",
              border: "1px solid var(--border-color)",
              padding: "5px 13px",
              minWidth: 120,
              marginRight: 9,
            }}
            disabled={loading || !keywords.length}
          />
          <span style={{ fontSize: 12.6, color: "var(--text-tertiary)" }}>
            Total: {filtered.length || 0}
          </span>
        </div>
        <pre
          ref={resultPre}
          tabIndex={0}
          aria-label="Wordlist"
          style={{
            background: "#23242c",
            color: "#ffb85d",
            borderRadius: 10,
            fontSize: 14.5,
            padding: "18px 13px",
            margin: 0,
            minHeight: 90,
            letterSpacing: ".01em",
            marginTop: 7,
            maxHeight: 250,
            overflowY: "auto",
            fontFamily: "var(--font-code)",
            boxShadow: "0 1.2px 9px -6px rgba(0,0,0,0.09)"
          }}
          aria-live={filtered.length ? "polite" : undefined}
        >{filtered.length
          ? filtered.map((kw, i) =>
              `${String(i+1).padStart(2,"0")}. ${kw.word.padEnd(18)}  (count:${kw.freq})`
            ).join("\n")
          : !loading && !error
            ? "No results yet. Paste some input above and click Analyze."
            : ""
        }
        </pre>
        {!loading && !filtered.length && !error && (
          <div style={{
            color: "#8b866d",
            fontSize: 13.7,
            marginTop: 13,
            opacity: .72
          }}>
            <span aria-hidden="true" style={{ fontSize: 17, marginRight: 6 }}>ℹ️</span>
            No keywords extracted yet.
          </div>
        )}
        {loading && (
          <div style={{
            marginTop: 16,
            color: "#feb041",
            fontWeight: 700,
            fontSize: 15.5
          }}>
            <span
              aria-hidden="true"
              style={{
                marginRight: 8,
                animation: "spin-emoji 1.2s linear infinite",
                display: "inline-block"
              }}>✨⏳</span>
            Analyzing…
            <style>{`@keyframes spin-emoji {100%{transform:rotate(360deg)}}`}</style>
          </div>
        )}
      </section>
      {/* Footer/accessibility */}
      <footer
        style={{
          padding: "10px 0 0 0",
          fontSize: 12.5,
          color: "var(--text-tertiary)",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 15, marginRight: 7 }}>🔐</span>
        Analysis is always in-browser. No data is sent to any server.
        <span style={{marginLeft:14, color:"#feb041"}}>Shortcuts: Ctrl+Enter=analyze, Esc=clear, Tab=navigate, Ctrl+C=copy results.</span>
      </footer>
    </section>
  );
}

export default WordlistGenerator;
