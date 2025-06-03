import React, { useRef, useState, useEffect, useCallback } from "react";

// Utility for debounced processing (for large input)
function debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Utility for chunked processing: process very large strings in "pages"
async function chunkProcessLargeString(str, chunkSize = 50000, wordProcessor = x => x, onChunk, onDone) {
  let index = 0;
  const total = str.length;
  let allResults = [];
  while (index < total) {
    const chunk = str.slice(index, Math.min(index + chunkSize, total));
    let res = await wordProcessor(chunk); // allow async
    allResults = allResults.concat(res);
    if (typeof onChunk === "function") onChunk(res, index, total);
    index += chunkSize;
    // Yield control so UI can update (simulate async chunked)
    await new Promise(r => setTimeout(r, 0));
  }
  if (typeof onDone === "function") onDone(allResults);
  return allResults;
}

/**
 * PUBLIC_INTERFACE
 * Premium, accessible, animated, and performant wordlist generator for pentest/bugbounty use.
 * - Paste/upload JS/HTML, run TF-IDF style analysis, prioritize unique words/identifiers.
 * - Export/copy, animated notifications, fully ARIA/keyboard accessible.
 */
function WordlistGenerator() {
  // ==== STATE ====
  const [input, setInput] = useState("");
  const [result, setResult] = useState([]); // Output wordlist
  const [error, setError] = useState("");
  const [notif, setNotif] = useState({ show: false, msg: "", type: "info" });
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [lastExportType, setLastExportType] = useState(null);
  const [filter, setFilter] = useState("");
  const [ariaMsg, setAriaMsg] = useState("");
  const [liveId, setLiveId] = useState(0); // For ARIA live region updates
  const inputRef = useRef();
  const resultRef = useRef();
  const fileInputRef = useRef();
  const ariaLiveRef = useRef();
  const copyBtnRef = useRef();

  // Focus management for keyboard ARIA feedback
  const focusExportButton = () => {
    if (resultRef.current) {
      const btn = resultRef.current.querySelector('[aria-label="Export as file"]');
      if (btn) btn.focus();
    }
  };

  // Micro-animation helpers
  const triggerAnim = (ref, cls) => {
    if (!ref.current) return;
    ref.current.classList.remove(cls);
    void ref.current.offsetWidth; // force reflow
    ref.current.classList.add(cls);
    setTimeout(() => {
      if (ref.current) ref.current.classList.remove(cls);
    }, 650);
  };

  // Debounce input to avoid locking up on huge paste
  const debouncedParseInput = useCallback(
    debounce(text => {
      extractWordsHandler(text);
    }, 280),
    []
  );

  // Reset all input and state
  function resetAll() {
    setInput("");
    setResult([]);
    setFilter("");
    setError("");
    setNotif({ show: false, msg: "", type: "info" });
    setAriaMsg("Cleared form.");
    setLoading(false);
    setIsCopied(false);
    if (inputRef.current) inputRef.current.focus();
  }

  // Accessible ARIA live region: show relevant notif/error updates for keyboard/screen reader users
  useEffect(() => {
    let m = error || notif.msg;
    if (error) setLiveId(liveId => liveId + 1);
    setAriaMsg(m || "");
  }, [error, notif]);

  // Microanimation on notifications
  useEffect(() => {
    if (notif.show && ariaLiveRef.current) {
      triggerAnim(ariaLiveRef, "notif-flash");
    }
  }, [notif]);

  // Main premium word extraction logic
  async function extractWordsPremium(text) {
    // Accept HTML/JS/docs; perform modern unique extraction
    if (!text || typeof text !== "string") return [];
    // (1) Remove tags, comments, and scripts for HTML
    let cleaned = text
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "); // Remove HTML tags
    // (2) Extract words from text & JS variable patterns, underscores, kebab
    let words = cleaned.split(/[^a-zA-Z0-9_\-\/\\.]+/g)
      .map(w => w.trim())
      .filter(w => w.length > 2 && /^[a-zA-Z0-9_\-]+$/.test(w));
    // (3) Deduplicate and sort by frequency (TF-like)
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    let unique = Array.from(new Set(words));
    unique.sort((a, b) => freq[b] - freq[a]);
    return unique;
  }

  // Debounced/chunked extraction for performance on large input (>100k)
  function extractWordsHandler(text) {
    setLoading(true);
    setError("");
    if (!text || text.trim().length === 0) {
      setResult([]);
      setLoading(false);
      return;
    }
    if (text.length > 100_000) {
      // For large input, chunk process for UI responsiveness
      chunkProcessLargeString(
        text,
        65000,
        extractWordsPremium,
        null,
        all => {
          setResult([...new Set(all)]);
          setLoading(false);
          setNotif({ show: true, msg: `Parsed ${all.length} unique keywords from large input.`, type: "success" });
        }
      ).catch(err => {
        setError("Parsing failed: " + String(err));
        setLoading(false);
      });
    } else {
      // Fast processing for small-medium input
      extractWordsPremium(text)
        .then(words => {
          setResult(words);
          setNotif({ show: true, msg: `Found ${words.length} unique keywords.`, type: "success" });
        })
        .catch(err => {
          setError("Parsing failed: " + String(err));
        })
        .finally(() => setLoading(false));
    }
  }

  // Handles change in text input (debounced for large files)
  function handleInputChange(e) {
    setInput(e.target.value);
    setError("");
    setNotif({ show: false, msg: "", type: "info" });
    debouncedParseInput(e.target.value);
  }

  // Handle file upload (.js, .html, .txt)
  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    const reader = new FileReader();
    reader.onload = ev => {
      const txt = String(ev.target.result || "");
      setInput(txt);
      extractWordsHandler(txt);
      setLoading(false);
      fileInputRef.current.value = "";
      setNotif({ show: true, msg: "File loaded.", type: "info" });
      setAriaMsg("File processed.");
    };
    reader.onerror = () => {
      setLoading(false);
      setError("Failed to read file.");
      fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  }

  // Manual submit form (Enter/Btn): for fast/force parse
  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotif({ show: false, msg: "", type: "info" });
    setTimeout(() => {
      try {
        extractWordsHandler(input);
        setAriaMsg("Wordlist reprocessed.");
      } catch (err) {
        setError("Parsing error.");
        setNotif({ show: true, msg: "Parsing error.", type: "error" });
        setAriaMsg("Parsing error.");
      }
      setLoading(false);
    }, 100); // Fast feedback for manual triggers
  }

  // Export with ARIA feedback and animation
  function handleExport(type = "txt", keyboard = false) {
    setNotif({ show: false, msg: "", type: "info" });
    setError("");
    if (!result.length) {
      setNotif({ show: true, msg: "Nothing to export.", type: "error" });
      setAriaMsg("Nothing to export.");
      return;
    }
    let content = "";
    let mime = "text/plain";
    if (type === "csv") {
      content = result.join(",");
      mime = "text/csv";
    } else if (type === "json") {
      content = JSON.stringify(result, null, 2);
      mime = "application/json";
    } else {
      content = result.join("\n");
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wordlist." + type;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 400);
    setNotif({ show: true, msg: `Exported as ${type.toUpperCase()}.`, type: "success" });
    setLastExportType(type);
    setAriaMsg(`Exported as ${type.toUpperCase()}.`);
    triggerAnim(resultRef, "export-anim");
    if (keyboard) {
      setTimeout(focusExportButton, 190);
    }
  }

  async function handleCopy(keyboard = false) {
    if (!result.length) {
      setNotif({ show: true, msg: "Nothing to copy.", type: "error" });
      setAriaMsg("Nothing to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(result.join("\n"));
      setNotif({ show: true, msg: "Copied to clipboard!", type: "success" });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
      setAriaMsg("Copied to clipboard.");
      triggerAnim(copyBtnRef, "copy-anim");
      if (keyboard && copyBtnRef.current) {
        copyBtnRef.current.focus();
      }
    } catch (err) {
      setNotif({ show: true, msg: "Copy failed.", type: "error" });
      setAriaMsg("Copy failed.");
    }
  }

  function handleFilterChange(e) {
    setFilter(e.target.value);
    setTimeout(() => {
      if (resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  }

  function filteredResult() {
    if (!filter) return result;
    const f = filter.toLowerCase();
    return result.filter(w => w.toLowerCase().includes(f));
  }

  // Animated notification close/reset
  function closeNotif() {
    setNotif({ show: false, msg: "", type: "info" });
  }

  // === Accessibility: ARIA live region feedback ===
  function AriaLive() {
    return (
      <div
        className="visually-hidden"
        aria-live="polite"
        id="wordlist-aria-live"
        ref={ariaLiveRef}
        key={liveId}
      >
        {ariaMsg}
      </div>
    );
  }

  // MAIN PREMIUM UI RENDER
  return (
    <section
      aria-label="Wordlist Generator"
      tabIndex={0}
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: "36px 0",
        color: "var(--text-color)"
      }}
      onKeyDown={e => {
        if (e.ctrlKey && e.key.toLowerCase() === "e") {
          handleExport("txt", true);
        } else if (e.ctrlKey && e.key.toLowerCase() === "c") {
          handleCopy(true);
        }
      }}
    >
      <AriaLive />

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", marginBottom: 25, gap: 12 }}>
        <span aria-hidden="true" style={{
          fontSize: 32,
          background: "linear-gradient(87deg,#ff9800,#ffad42 80%)",
          WebkitBackgroundClip: "text",
          color: "transparent",
          fontWeight: 900,
          marginRight: 9,
          textShadow: "0 2.5px 14px rgba(255,168,32,0.16)"
        }}>
          📄
        </span>
        <h1 style={{
          margin: 0,
          fontSize: 27,
          letterSpacing: ".012em",
          color: "var(--base-light)",
          fontWeight: 800
        }}>
          Wordlist Generator
        </h1>
        <span style={{ flex: 1 }} />
      </header>

      {/* Input Panel */}
      <form
        aria-label="Paste/upload JS/HTML/Text"
        onSubmit={handleSubmit}
        style={{
          background: "var(--secondary)",
          borderRadius: 13,
          padding: "24px 24px 18px 24px",
          maxWidth: 600,
          marginBottom: 28,
          boxShadow: "0 5px 32px -9px rgba(0,0,0,0.13)"
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
          Input JS/HTML/Text
          <span aria-hidden="true" style={{ fontSize: 18, marginLeft: 7 }}>
            📝
          </span>
        </label>
        <textarea
          ref={inputRef}
          id="wl-input"
          name="wlinput"
          value={input}
          spellCheck={false}
          required
          aria-required="true"
          aria-describedby="wl-desc"
          rows={4}
          onChange={handleInputChange}
          tabIndex={0}
          style={{
            width: "100%",
            padding: "13px 11px",
            borderRadius: 9,
            fontSize: 15.1,
            fontFamily: "var(--font-code)",
            color: "var(--text-color)",
            border: "1.4px solid var(--border-color)",
            background: "var(--base-dark)",
            marginBottom: 6,
            boxShadow: "0 2.5px 7px -8px rgba(0,0,0,0.10)",
            fontWeight: 500,
            letterSpacing: ".01em"
          }}
          placeholder="Paste JS, HTML, or text containing keywords, endpoints, or variables"
          aria-label="Input field for code or text to extract keywords"
        />
        <small
          id="wl-desc"
          style={{
            color: "var(--text-tertiary)",
            fontSize: 13,
            display: "block",
            marginBottom: 7,
            letterSpacing: ".01em"
          }}
        >
          Any JS, HTML, or text accepted. Large files (>100k) are handled efficiently.
        </small>
        {error && (
          <div style={{ color: "#ff5964", fontWeight: 600, fontSize: 14.4, margin: "10px 0" }}>
            {error}
          </div>
        )}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 13,
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >
          <button
            type="submit"
            className="btn btn-large"
            style={{
              fontSize: 16.4,
              fontWeight: 700,
              background: "var(--base-light)",
              color: "#23272e"
            }}
            aria-label="Generate wordlist"
            disabled={loading}
          >
            🚀 Generate
          </button>
          <button
            type="button"
            className="btn"
            style={{
              marginLeft: 13,
              fontSize: 15.1,
              fontWeight: 600
            }}
            aria-label="Clear input"
            disabled={loading}
            onClick={resetAll}
          >
            🧹 Clear
          </button>
          <input
            type="file"
            accept=".js,.html,.txt"
            style={{
              display: "none"
            }}
            ref={fileInputRef}
            onChange={handleFileUpload}
            tabIndex={-1}
            aria-label="Upload a file for wordlist generation"
          />
          <button
            type="button"
            className="btn"
            style={{
              fontSize: 15.0,
              marginLeft: 13,
              fontWeight: 600,
              background: "#36498e",
              color: "#f6d99c"
            }}
            aria-label="Upload file"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={loading}
          >
            📁 Upload
          </button>
        </div>
        <div
          style={{
            marginTop: 7,
            fontSize: 13.1,
            color: "var(--text-secondary)"
          }}
        >
          Ctrl+E = Export (txt), Ctrl+C = Copy
        </div>
      </form>
      {/* Output Filter/Search */}
      {Boolean(result.length) && (
        <div
          style={{
            margin: "8px 0 13px 0",
            display: "flex",
            alignItems: "center",
            gap: 9
          }}
        >
          <input
            aria-label="Filter keywords"
            type="text"
            placeholder="Filter keywords…"
            style={{
              fontSize: 13.5,
              borderRadius: 6,
              background: "var(--base-dark)",
              color: "var(--text-color)",
              border: "1px solid var(--border-color)",
              padding: "5px 10px",
              minWidth: 106
            }}
            value={filter}
            onChange={handleFilterChange}
            tabIndex={0}
            autoComplete="off"
          />
          <span
            style={{
              color: "var(--text-tertiary)",
              fontSize: 12.5
            }}
          >
            {filteredResult().length} shown
          </span>
        </div>
      )}
      {/* Notifications */}
      {notif.show && (
        <div
          className={`notification-premium${notif.type === "success" ? " notif-success" : notif.type === "error" ? " notif-err" : ""}`}
          role={notif.type === "error" ? "alert" : "status"}
          aria-live={notif.type === "error" ? "assertive" : "polite"}
          style={{
            background:
              notif.type === "success"
                ? "linear-gradient(90deg,#51b57f,#90ffa9)"
                : notif.type === "error"
                ? "#3b2021"
                : "#23416a",
            color:
              notif.type === "success"
                ? "#172b18"
                : notif.type === "error"
                ? "#ffb1a2"
                : "#fff5be",
            fontWeight: 700,
            borderRadius: 8,
            padding: "11px 19px",
            margin: "10px 0",
            boxShadow: "0 3px 14px -6px #443f1a36",
            position: "relative"
          }}
          ref={ariaLiveRef}
          tabIndex={-1}
        >
          {notif.msg}
          <button
            aria-label="Close notification"
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              color: "#fefae1",
              float: "right",
              cursor: "pointer",
              marginLeft: 11
            }}
            onClick={closeNotif}
            tabIndex={0}
          >
            ×
          </button>
        </div>
      )}
      {/* Loading Spinner */}
      {loading && (
        <div
          style={{
            background: "linear-gradient(91deg,rgba(255,168,64,0.10),rgba(255,202,102,0.09))",
            color: "var(--base-accent)",
            borderRadius: 10,
            padding: "15px 19px",
            fontWeight: 600,
            marginBottom: 21,
            fontSize: 17,
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
          aria-live="assertive"
        >
          <span
            aria-hidden="true"
            style={{
              fontSize: 22,
              marginRight: 8,
              animation: "spin-emoji 1.1s linear infinite"
            }}
          >
            🔄
          </span>
          Processing...
          <style>{`@keyframes spin-emoji { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {/* Premium Keyword Results Panel */}
      <section
        aria-label="Keyword Results"
        ref={resultRef}
        tabIndex={0}
        style={{
          minHeight: 65,
          margin: "0 0 31px 0",
          background: "var(--secondary)",
          borderRadius: 11,
          boxShadow: "0 4px 22px -10px #232b3327",
          padding: result.length ? "18px 22px" : "8px 15px",
          opacity: result.length ? 1 : 0.8,
          pointerEvents: result.length ? "all" : "none",
          transition: "box-shadow 0.22s, background 0.19s, opacity 0.16s"
        }}
      >
        <div
          style={{
            marginBottom: result.length ? 15 : 0,
            display: "flex",
            alignItems: "center"
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 20, marginRight: 8 }}>
            🏷️
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: 15.7,
              fontWeight: 800,
              color: "var(--base-accent)",
              letterSpacing: 0.01
            }}
          >
            Keywords
          </h2>
          <span style={{ flex: 1 }} />
          {/* Copy/export panel */}
          <button
            className="btn"
            aria-label="Copy to clipboard"
            style={{
              fontSize: 14,
              fontWeight: 700,
              background: "#284ca7",
              color: "#fff7bc",
              borderRadius: 7,
              marginRight: 9,
              transition: "background 0.15s, color 0.11s, box-shadow 0.17s"
            }}
            onClick={() => handleCopy(false)}
            disabled={!result.length || loading}
            ref={copyBtnRef}
            tabIndex={0}
          >
            {isCopied ? "✅ Copied" : "📋 Copy"}
          </button>
          <button
            className="btn"
            aria-label="Export as file"
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginLeft: 3,
              background: "linear-gradient(90deg,#ff9800,#ffad42)",
              color: "#23272e",
              borderRadius: 7
            }}
            onClick={() => handleExport("txt")}
            tabIndex={0}
            disabled={!result.length || loading}
          >
            📤 Export .txt
          </button>
          <button
            className="btn"
            aria-label="Export as CSV"
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginLeft: 3,
              background: "linear-gradient(90deg,#ffeebb,#fbbb63)",
              color: "#9b371e",
              borderRadius: 7
            }}
            onClick={() => handleExport("csv")}
            tabIndex={0}
            disabled={!result.length || loading}
          >
            🗎 CSV
          </button>
          <button
            className="btn"
            aria-label="Export as JSON"
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginLeft: 3,
              background: "linear-gradient(90deg,#6ce9ff,#8d76ff)",
              color: "#191b22",
              borderRadius: 7
            }}
            onClick={() => handleExport("json")}
            tabIndex={0}
            disabled={!result.length || loading}
          >
            🗎 JSON
          </button>
        </div>
        {/* Keyword display */}
        <div
          role="list"
          aria-label="Generated keywords"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 9px",
            marginTop: 2,
            transition: "box-shadow 0.19s"
          }}
        >
          {filteredResult().length ? (
            filteredResult().slice(0, 330).map((w, i) => (
              <span
                key={w + i}
                role="listitem"
                tabIndex={0}
                aria-label={`Keyword: ${w}`}
                style={{
                  display: "inline-block",
                  background: "linear-gradient(98deg,#23272e,#312a1f)",
                  color: "#ffd087",
                  padding: "3.5px 11px",
                  borderRadius: 7,
                  fontWeight: 600,
                  fontSize: 13.2,
                  margin: "2px 0",
                  boxShadow: "0 1.1px 5px 0 #2b180611",
                  cursor: "copy",
                  outline: "none",
                  transition: "background 0.16s, box-shadow 0.12s"
                }}
                onClick={() => navigator.clipboard.writeText(w)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigator.clipboard.writeText(w);
                    setNotif({ show: true, msg: `Copied "${w}"`, type: "success" });
                    setAriaMsg(`Copied: ${w}`);
                  }
                }}
                onFocus={e => {
                  e.target.style.background = "#292d41";
                  e.target.style.boxShadow = "0 0 0 3px #ffb85c85";
                }}
                onBlur={e => {
                  e.target.style.background = "linear-gradient(98deg,#23272e,#312a1f)";
                  e.target.style.boxShadow = "none";
                }}
              >
                {w}
              </span>
            ))
          ) : (
            <span style={{ color: "#cbb588", fontWeight: 500, fontSize: 14 }}>
              No keywords found.
            </span>
          )}
        </div>
        {!!filteredResult().length && filteredResult().length > 330 && (
          <div style={{
            color: "#a7a2b8",
            fontSize: 13,
            marginTop: 11
          }}>
            (+{filteredResult().length - 330} more hidden)
          </div>
        )}
      </section>
      {/* Accessible footer */}
      <footer
        style={{
          padding: "12px 0 0 0",
          fontSize: 12.5,
          color: "var(--text-tertiary)",
          display: "flex",
          alignItems: "center",
          gap: 10
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 15, marginRight: 7 }}>
          🦠
        </span>
        Paste JS/HTML/HTTP responses to extract hidden wordlists for attacks. Copy or export for use in brute force/fuzzing.
      </footer>
      {/* Micro-UI Animations (css-in-js quick definitions) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .notif-flash {
          animation: notifFlashAnim 0.7s cubic-bezier(.6,-0.1,.92,1.2);
        }
        .export-anim {
          box-shadow: 0 0 12px 2px #fff78d66, 0 4px 28px -6px #eebc5c23 !important;
          animation: exportAnim 1.05s cubic-bezier(.34, .87, .41, 1.03);
        }
        .copy-anim {
          animation: copyAnim 1s cubic-bezier(.3,1, .2,1.03);
        }
        @keyframes notifFlashAnim {
          0% {    box-shadow: 0 0 0 0 #51b57f94;}
          70% {   box-shadow: 0 0 0 10px #ff980099;}
          100% {  box-shadow: 0 0 0 0 #51b57f24;}
        }
        @keyframes exportAnim {
          0% { box-shadow: 0 0 25px 7px #ffe88c50;}
          80% { box-shadow: 0 2px 25px 2px #6363bd33;}
          100% { box-shadow: unset;}
        }
        @keyframes copyAnim {
          0% { background: #ffe47a; }
          60% { background: #b0eb70; }
          100% { background: #284ca7;}
        }
      ` }} />
    </section>
  );
}

export default WordlistGenerator;
