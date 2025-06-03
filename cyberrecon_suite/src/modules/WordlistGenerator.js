import React, { useState, useRef } from "react";
import TableDisplay from "../components/TableDisplay";
import Modal from "../components/Modal";

// PUBLIC_INTERFACE
/**
 * WordlistGenerator: In-browser TF-IDF keyword extractor.
 * - JS/HTML file or text input (paste/upload)
 * - Accessible, premium UI; CSV/JSON export of extracted keywords
 * - Highlight high-priority terms; modern accessibility
 */
function WordlistGenerator() {
  // State for UI/logic
  const [inputText, setInputText] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const fileInputRef = useRef();

  // For accessibility
  const ariaStatusId = "aria-wordlist-status";

  // PUBLIC_INTERFACE
  function handleTextChange(e) {
    setInputText(e.target.value);
    setFileName("");
    setError("");
    setKeywords([]);
  }

  // PUBLIC_INTERFACE
  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!/\.js$|\.html?$|\.txt$/i.test(file.name)) {
      setError("Only .js, .html, or .txt files are supported.");
      setKeywords([]);
      setFileName("");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = evt => {
      setInputText(evt.target.result);
      setError("");
      setKeywords([]);
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
  }

  // PUBLIC_INTERFACE
  function handleDrop(e) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: [e.dataTransfer.files[0]] } });
    }
  }

  // PUBLIC_INTERFACE
  function handlePaste(e) {
    if (e.clipboardData && e.clipboardData.getData) {
      setInputText(e.clipboardData.getData("Text"));
      setFileName("");
      setError("");
      setKeywords([]);
      e.preventDefault();
    }
  }

  // PUBLIC_INTERFACE
  function runTfidfAnalysis() {
    setProcessing(true);
    setError("");
    setTimeout(() => {
      try {
        let text = inputText || "";
        // Strip HTML if present
        text = text.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
                   .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
                   .replace(/<[^>]+>/g, " ");
        // Split by line for simple doc "chunks" (simulate multi-source)
        let documents = text.split(/\r?\n{2,}/).filter(Boolean);
        if (documents.length < 2) documents = [text];
        const results = computeTfidfKeywords(documents, 40);
        setKeywords(results);
        setModalMsg("");
      } catch (e) {
        setError("TF-IDF analysis failed: " + (e.message || "Unknown error"));
        setKeywords([]);
      }
      setProcessing(false);
    }, 240);
  }

  // --- TF-IDF Analysis (simple) ---
  // PUBLIC_INTERFACE
  function computeTfidfKeywords(docs, maxCount = 36) {
    const STOPWORDS = new Set([
      "the","to","and","of","for","in","on","at","a","is","it","be","with","var","const","let","from","by","or","this","as","if","else",
      "return","function","null","true","false","case","switch","break","continue","default","import","export","while","do","new","try","catch",
      "document","window","undefined","then","async","await","class","extends","apply","call","map","set","get","use","html","body", "head",
      "src","href","style","div","span","type","id","name","data","http","https","function","let","const"
    ]);
    // 1. Tokenize and normalize docs
    let allTokens = [];
    let docFreqs = [];
    docs.forEach(doc => {
      // Remove comments
      let t = doc.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, " ");
      // Tokenize by words, exclude digits and symbols, lowercase
      let tokens = t.match(/\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b/g) || [];
      tokens = tokens.map(w => w.toLowerCase()).filter(w => !STOPWORDS.has(w));
      allTokens.push(tokens);
      let freq = Object.create(null);
      tokens.forEach(w => freq[w] = (freq[w] || 0) + 1);
      docFreqs.push(freq);
    });
    // 2. Compute DF and TF-IDF
    let df = Object.create(null);
    allTokens.forEach(tokens => {
      let seen = new Set();
      tokens.forEach(w => { if (!seen.has(w)) { df[w] = (df[w] || 0) + 1; seen.add(w); } });
    });
    let N = docs.length;
    let tfidfScores = Object.create(null);
    allTokens.forEach((tokens, i) => {
      let tfTotal = tokens.length;
      (Object.entries(docFreqs[i])).forEach(([w, tf]) => {
        let score = (tf / tfTotal) * Math.log((N + 1) / ((df[w] || 1) + 1));
        tfidfScores[w] = (tfidfScores[w] || 0) + score;
      });
    });
    // 3. Rank and extract top keywords
    let ranked = Object.entries(tfidfScores)
      .map(([word, score]) => ({ word, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCount);
    // 4. Priority scoring: top 7 are "high-priority"
    ranked.forEach((k, i) => { k.rank = i + 1; k.priority = i < 7 ? "High" : (i < 18 ? "Med" : "Low"); });
    return ranked;
  }

  // PUBLIC_INTERFACE
  function handleExportCSV() {
    if (!keywords.length) return;
    const header = '"Rank","Keyword","Score","Priority"';
    const rows = keywords.map(
      k => `"${k.rank}","${k.word}","${Number(k.score).toFixed(6)}","${k.priority}"`
    );
    const csvContent = [header, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    triggerDownload(blob, "wordlist.csv");
  }

  // PUBLIC_INTERFACE
  function handleExportJSON() {
    if (!keywords.length) return;
    const blob = new Blob([JSON.stringify(keywords, null, 2)], {
      type: "application/json"
    });
    triggerDownload(blob, "wordlist.json");
  }

  // Utility
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 180);
  }

  // Premium UI for main workspace
  return (
    <section
      aria-label="Wordlist Generator"
      tabIndex={0}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      style={{
        maxWidth: 650,
        margin: "0 auto",
        padding: "32px 0",
        color: "var(--text-color)"
      }}
    >
      {/* Accessibility ARIA live region */}
      <div id={ariaStatusId} className="visually-hidden" aria-live="polite">
        {error ? "Error: " + error : (processing ? "Processing..." : keywords.length
          ? `Extracted ${keywords.length} keywords.` : "")}
      </div>
      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 22,
        gap: 12
      }}>
        <span
          aria-hidden="true"
          style={{
            fontSize: 28,
            background: "linear-gradient(94deg,#ffad42,#ff9800 80%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontWeight: 900,
            marginRight: 9
          }}
        >📄</span>
        <h1 style={{
          margin: 0,
          fontSize: 26,
          letterSpacing: ".012em",
          color: "var(--base-light)",
          fontWeight: 800
        }}>Wordlist Generator</h1>
        <span
          aria-label="Premium"
          style={{
            fontSize: 13,
            color: "#daa84b",
            background: "rgba(255,168,64,0.09)",
            borderRadius: 13,
            padding: "3.5px 12px",
            marginLeft: 14,
            fontWeight: 700,
            boxShadow: "0 1.5px 7px 0 rgba(0,0,0,0.04)",
            border: "1.2px solid rgba(255,184,72,0.11)"
          }}>PREMIUM</span>
        <span style={{ flex: 1 }} />
      </header>
      {/* Input text/file panel */}
      <form
        aria-label="JS or HTML Input"
        style={{
          background: "var(--secondary)",
          borderRadius: 13,
          padding: "28px 32px 22px 32px",
          marginBottom: 31,
          boxShadow: "0 5px 32px -9px rgba(0,0,0,0.13)"
        }}
        onSubmit={e => { e.preventDefault(); runTfidfAnalysis(); }}
      >
        <label htmlFor="jswordlist-input"
          style={{
            fontWeight: 700,
            color: "var(--base-accent)",
            letterSpacing: ".01em",
            fontSize: 17,
            display: "block",
            marginBottom: 8
          }}
        >
          Paste JS/HTML or Upload File
          <span aria-hidden="true" style={{ fontSize: 18, marginLeft: 7 }}>📝</span>
        </label>
        <textarea
          id="jswordlist-input"
          name="input"
          value={inputText}
          onChange={handleTextChange}
          onPaste={handlePaste}
          rows={7}
          spellCheck={false}
          required
          aria-required="true"
          aria-describedby="jswordlist-desc"
          tabIndex={0}
          style={{
            width: "100%",
            padding: "13px 10px",
            borderRadius: 9,
            fontSize: 15.2,
            fontFamily: "var(--font-code)",
            color: "var(--text-color)",
            border: "1.4px solid var(--border-color)",
            background: "var(--base-dark)",
            marginBottom: 7,
            boxShadow: "0 2.5px 9px -6px rgba(0,0,0,0.13)",
            fontWeight: 500,
            letterSpacing: ".01em",
            minHeight: 120,
            resize: "vertical"
          }}
            disabled={processing}
        />
        <small
          id="jswordlist-desc"
          style={{
            color: "var(--text-tertiary)",
            fontSize: 13,
            marginBottom: 8,
            letterSpacing: ".01em",
            display: "block"
          }}
        >
          Supports JS/HTML/code or text. Drag-and-drop, paste, or upload files below.
        </small>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 6
          }}
        >
          <input
            type="file"
            accept=".js,.html,.txt"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
            tabIndex={-1}
          />
          <button
            type="button"
            className="btn"
            aria-label="Upload JS/HTML/Text File"
            style={{
              fontWeight: 600,
              fontSize: 15.2,
              background: "linear-gradient(91deg,#51b57f,#90ffa9)",
              color: "#191b22"
            }}
            disabled={processing}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >📤 Upload File</button>
          {fileName && (
            <span
              style={{ fontSize: 13.7, color: "#a8f6c1", marginLeft: 7 }}
              aria-label="Selected filename"
            >{fileName}</span>
          )}
          <span
            aria-hidden="true"
            style={{
              marginLeft: 14,
              fontSize: 13.4,
              color: "var(--text-secondary)",
              fontStyle: "italic"
            }}
          >or drag &amp; drop a supported file here</span>
        </div>
        {error && (
          <div
            role="alert"
            style={{
              color: "#ff5964",
              background: "#2c1616",
              fontWeight: 700,
              padding: "8px 17px",
              borderRadius: 8,
              marginBottom: 10,
              fontSize: 15.5
            }}
          >❌ {error}</div>
        )}
        {/* Action Buttons */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 13,
            flexWrap: "wrap",
            alignItems: "center"
          }}>
          <button
            type="submit"
            className="btn btn-large"
            style={{
              fontWeight: 700,
              fontSize: 17,
              background: "var(--base-light)",
              color: "#272a31"
            }}
            aria-label="Analyze & Generate Wordlist"
            disabled={processing || !inputText}
          >
            📊 Extract Keywords
          </button>
          <button
            type="button"
            className="btn"
            style={{
              fontSize: 14.2,
              marginLeft: 7,
            }}
            disabled={processing && !inputText}
            onClick={() => { setInputText(""); setKeywords([]); setFileName(""); setError(""); }}
            aria-label="Clear input"
          >
            🧹 Clear
          </button>
        </div>
      </form>
      {/* Output table */}
      <section
        aria-label="TF-IDF Keyword Results"
        style={{
          background: "var(--secondary)",
          borderRadius: 13,
          padding: "20px 23px",
          marginBottom: 18,
          boxShadow: "0 3.5px 18px -10px #2b231449",
          minHeight: 77
        }}
      >
        {/* Table export + live list */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14, gap: 16 }}>
          <span aria-hidden="true" style={{ fontSize: 21, color: "#ffad42", marginRight: 9 }}>🔑</span>
          <h2 style={{
            margin: 0,
            fontSize: 19,
            fontWeight: 800,
            color: "var(--base-accent)",
            letterSpacing: 0.012
          }}>Extracted Keywords</h2>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="btn"
            aria-label="Export as CSV"
            style={{
              background: "linear-gradient(90deg,#ff9800,#ffad42)",
              color: "#23272e",
              fontWeight: 700,
              fontSize: 15.3,
              marginLeft: 7
            }}
            disabled={!keywords.length}
            onClick={handleExportCSV}
          >📤 CSV</button>
          <button
            type="button"
            className="btn"
            aria-label="Export as JSON"
            style={{
              background: "linear-gradient(90deg,#6ce9ff,#8d76ff)",
              color: "#191b22",
              fontWeight: 700,
              fontSize: 15.3
            }}
            disabled={!keywords.length}
            onClick={handleExportJSON}
          >🗎 JSON</button>
        </div>
        <TableDisplay
          data={keywords}
          columns={[
            {
              label: "Rank",
              field: "rank",
              bold: true,
              sortable: true,
            },
            {
              label: "Keyword",
              field: "word",
              emoji: "🔑",
              sortable: true,
              bold: true
            },
            {
              label: "TF-IDF Score",
              field: "score",
              sortable: true,
              render: v => Number(v).toFixed(6),
              colored: true,
              colorMap: k => k.rank <= 7 ? "#ff9800" : (k.rank < 17 ? "#51b57f" : "#c7cbce")
            },
            {
              label: "Priority",
              field: "priority",
              emojiMap: { High: "🔥", Med: "⭐", Low: "・" },
              colored: true,
              colorMap: { High: "#ff9800", Med: "#ffd940", Low: "#9fc2e8" }
            }
          ]}
          size="lg"
          filterable={true}
          style={{ minWidth: 330 }}
        />
        {!keywords.length && !processing &&
          <div style={{
            opacity: 0.64,
            width: "100%",
            minHeight: 60,
            background: "linear-gradient(90deg,#22242c 68%,#232028 95%)",
            borderRadius: 11,
            margin: "15px 0 16px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#bba157",
            fontWeight: 600,
            fontSize: 16
          }}>
            Paste/upload some code or markup and extract keywords to begin.
          </div>}
        {processing && (
          <div style={{
            color: "#ffad42",
            fontWeight: 600,
            fontSize: 16,
            marginTop: 4
          }}>
            <span style={{ fontSize: 18, marginRight: 7, animation: "spin-emoji 1.2s linear infinite" }}>✨</span>
            Analyzing text, extracting most important keywords...
            <style>{`@keyframes spin-emoji { 100% { transform: rotate(360deg); }}`}</style>
          </div>
        )}
      </section>
      <footer style={{
        padding: "9px 0 0 0",
        fontSize: 12.5,
        color: "var(--text-tertiary)",
        display: "flex",
        alignItems: "center",
        gap: 10
      }}>
        <span aria-hidden="true" style={{ fontSize: 15, marginRight: 7 }}>🧰</span>
        Use the extracted list for brute force, endpoint hunting, or recon. Data is processed locally in-browser.
      </footer>
      <Modal
        isOpen={showModal}
        title="Notice"
        onClose={() => setShowModal(false)}
      >
        <div>{modalMsg}</div>
      </Modal>
    </section>
  );
}

export default WordlistGenerator;
