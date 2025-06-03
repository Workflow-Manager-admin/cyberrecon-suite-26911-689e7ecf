import React, { useState, useRef, useEffect } from "react";

/**
 * ReportGenerator module: Premium Markdown report editor with live preview,
 * drag/drop & paste image upload, findings selection/auto-insert, and export.
 * - Accessible, visually polished dark theme (matching suite)
 * - Cross-platform: works in both browser and Electron renderer
 * - Integrates with findings from ReconDashboard and VulnerabilityScanner for report embedding
 * - Exports to PDF/HTML (Electron/native and fallback browser)
 */

// PUBLIC_INTERFACE
function ReportGenerator() {
  // Editor state
  const [markdown, setMarkdown] = useState("# 📝 Report Title\n\nWrite your summary here...");
  const [previewMode, setPreviewMode] = useState(false);
  const [images, setImages] = useState([]); // {name, url}
  const [statusMsg, setStatusMsg] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [findings, setFindings] = useState([]); // Merged from recon/scanner modules
  const [showFindingsPicker, setShowFindingsPicker] = useState(false);
  const textareaRef = useRef();

  // Markdown parser (built-in fallback)
  function parseMarkdown(mdText) {
    // Minimal custom renderer: bold, italics, code, links, headings, lists, images
    let html = mdText;
    html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\!\[([^\]]*)\]\(([^)]+)\)/gim, "<img alt='$1' src='$2' style='max-width:90%; border-radius:9px; box-shadow:0 0 11px #1112; margin-top:7px; margin-bottom:10px;'/>");
    html = html.replace(/\[([^\]]+)]\(([^)]+)\)/gim, "<a href='$2' target='_blank'>$1</a>");
    html = html.replace(/`([^`]+)`/gim, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/gim, "<b>$1</b>");
    html = html.replace(/\*([^*]+)\*/gim, "<i>$1</i>");
    // Lists:
    html = html.replace(/^\s*[-*] (.*$)/gim, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");
    // Newlines
    html = html.replace(/\n$/gim, "<br/>");
    // Paragraphs for demo (do not double-P)
    html = html.replace(/^\s*(?!<h\d|<ul|<li|<img|<code|<b|<i|<a)(.+)$/gim, "<p>$1</p>");
    return html;
  }

  // Handle image drag/drop or paste (inserts inline images)
  function handleFileUpload(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = e => {
        // Insert as markdown ![] inline (for browser/Electron; image is data URL)
        const imageUrl = e.target.result;
        setImages(prev => [...prev, { name: file.name, url: imageUrl }]);
        setMarkdown(prev =>
          prev +
          `\n\n![${
            file.name
          }](${imageUrl})\n`);
        announce("Image uploaded: " + file.name);
      };
      reader.readAsDataURL(file);
    });
  }
  // Keyboard paste handler
  function handlePaste(e) {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
      handleFileUpload(e.clipboardData.files);
      e.preventDefault();
    }
  }
  // Drag-and-drop image handler
  function handleDrop(e) {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFileUpload(e.dataTransfer.files);
    }
  }

  // Fetch findings from ReconDashboard and VulnerabilityScanner (Electron/Browser)
  useEffect(() => {
    async function fetchFindings() {
      let found = [];
      // If Electron: use window.electronAPI or local storage
      if (window.electronAPI && typeof window.electronAPI.getReconHistory === "function") {
        try {
          const recon = await window.electronAPI.getReconHistory();
          found = (recon || []).map(f => ({
            source: "Recon",
            domain: f.domain,
            tool: f.tool,
            result: f.result,
            time: f.time,
          }));
        } catch {}
      } else if (window.localStorage) {
        // Try browser storage fallback (simulate previous runs)
        let hist = [];
        try { hist = JSON.parse(localStorage.getItem("recon_history") || "[]"); }
        catch {}       
        found = (hist || []).map(f => ({
          source: "Recon",
          domain: f.domain,
          tool: f.tool,
          result: f.result,
          time: f.time,
        }));
      }
      // Similarly for scanner
      let scannerFindings = [];
      if (window.electronAPI && typeof window.electronAPI.getScannerFindings === "function") {
        try {
          scannerFindings = await window.electronAPI.getScannerFindings();
        } catch {}
      } else if (window.localStorage) {
        try { scannerFindings = JSON.parse(localStorage.getItem("scanner_findings") || "[]"); }
        catch {}
      }
      // Normalize
      const normScanner = (scannerFindings || []).map(f => ({
        source: "Scanner",
        name: f.name || f.info?.name,
        severity: f.severity || f.info?.severity,
        matched: f.matched,
        templateID: f.templateID,
        raw: f.raw || f
      }));
      setFindings([...found, ...normScanner]);
    }
    fetchFindings();
  }, []);

  // Insert findings (as markdown table or list)
  function insertFindingsMarkdown(selected = []) {
    if (!selected.length) return;
    // Auto-generate as a markdown table for premium UX
    let md = "";
    const isRecon = selected[0].source === "Recon";
    if (isRecon) {
      md = `\n\n### 🔍 Recon Findings\n\n| Domain | Tool | Result | Time |\n|---|---|---|---|\n` +
        selected
          .map(
            f =>
              `| ${f.domain} | ${f.tool} | ${f.result} | ${f.time || "-"} |`
          )
          .join("\n");
    } else {
      md = `\n\n### 🛡️ Vulnerability Findings\n\n| Name | Severity | Target | Template |\n|---|---|---|---|\n` +
        selected
          .map(
            f =>
              `| ${f.name || "-"} | ${f.severity || "-"} | ${f.matched || "-"} | ${f.templateID || "-"} |`
          )
          .join("\n");
    }
    setMarkdown(prev => prev + md + "\n");
    setShowFindingsPicker(false);
    announce("Findings inserted.");
  }

  // Accessible announcement
  function announce(msg) {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 1500);
  }

  // Export to PDF/HTML - premium (in Electron: native, browser: print/HTML)
  function handleExport(format) {
    if (format === "PDF") {
      // Electron - use native printToPDF if available
      if (
        window.electronAPI &&
        typeof window.electronAPI.exportPDF === "function"
      ) {
        window.electronAPI.exportPDF(markdown).then(() =>
          announce("PDF exported via Electron.")
        );
      } else {
        // Browser fallback
        var w = window.open("", "_blank");
        w.document.write(`<html><head><title>Report</title></head><body style="background:#222;color:#fafbfc">${parseMarkdown(markdown)}</body></html>`);
        w.print();
        announce("Print dialog opened for PDF export.");
      }
    } else if (format === "HTML") {
      // Export HTML for download
      const html = `<html><head><title>Report</title></head><body style="background:#222;color:#fafbfc">${parseMarkdown(markdown)}</body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cyberrecon_report.html";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
      announce("HTML exported.");
    }
    setShowExportModal(false);
  }

  // Accessibility: focus on textarea editor for accessibility
  useEffect(() => {
    if (!previewMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [previewMode]);

  // Findings picker state
  const [selectedFindingsIdx, setSelectedFindingsIdx] = useState([]);
  function toggleFindingIdx(i) {
    setSelectedFindingsIdx((prev) =>
      prev.includes(i)
        ? prev.filter((ii) => ii !== i)
        : [...prev, i]
    );
  }
  function handleInsertFindings() {
    if (!selectedFindingsIdx.length) return;
    const selected = selectedFindingsIdx.map(i => findings[i]);
    insertFindingsMarkdown(selected);
    setSelectedFindingsIdx([]); // Reset
  }

  // Premium styling - matches dark suite
  const accent = "var(--base-light,#ff9800)";
  const accentGrad = "linear-gradient(95deg,#ff9800,#ffad42 85%)";
  const editorStyle = {
    background: "var(--secondary,#22242c)",
    color: "var(--text-color,#fafbfc)",
    borderRadius: 14,
    padding: 0,
    boxShadow: "0 3px 32px -10px #151b22b0",
    fontFamily: "var(--font-main)",
    fontSize: 16.2,
    minHeight: 420,
    display: "flex",
    flexDirection: "row",
    position: "relative",
  };

  return (
    <section
      aria-label="Report Generator"
      tabIndex={0}
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "34px 0",
        color: "var(--text-color)"
      }}
      onDrop={handleDrop}
      onDragOver={e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onPaste={handlePaste}
    >
      <header style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 26,
        gap: 15
      }}>
        <span aria-hidden="true" style={{
          fontSize: 32,
          background: accentGrad,
          WebkitBackgroundClip: "text",
          color: "transparent",
          fontWeight: 900,
          marginRight: 9,
          textShadow: "0 2.8px 14px rgba(255,168,32,0.12)"
        }}>
          📝
        </span>
        <h1 style={{
          margin: 0,
          fontSize: 27.5,
          letterSpacing: ".009em",
          color: accent,
          fontWeight: 800
        }}>Report Generator</h1>
        <span aria-label="Premium"
          style={{
            fontSize: 14,
            color: "#daa84b",
            background: "rgba(255,168,64,0.09)",
            borderRadius: 13,
            padding: "3.5px 11px",
            marginLeft: 13,
            fontWeight: 700,
            boxShadow: "0 1.5px 7px 0 rgba(0,0,0,0.04)",
            border: "1.2px solid rgba(255,184,72,0.11)"
          }}>PREMIUM</span>
        <span style={{ flex: 1 }} />
      </header>
      <div style={editorStyle}>
        {/* --- Editor & Tools --- */}
        <div
          style={{
            flex: 1.2,
            minWidth: 288,
            display: previewMode ? "none" : "flex",
            flexDirection: "column",
            borderRight: "2.3px solid var(--border-color)",
            padding: "28px 25px 20px 25px",
            background: "var(--secondary,#22242c)",
            borderTopLeftRadius: 14,
            borderBottomLeftRadius: 14,
            transition: "box-shadow 0.14s"
          }}
        >
          <label htmlFor="markdown-editor"
            style={{
              fontWeight: 700,
              color: accent,
              fontSize: 17,
              display: "block",
              marginBottom: 7,
              letterSpacing: ".01em"
            }}>
            Markdown Editor <span aria-hidden="true" style={{ fontSize: 15, marginLeft: 7 }}>✍️</span>
          </label>
          <textarea
            id="markdown-editor"
            ref={textareaRef}
            value={markdown}
            onChange={e => setMarkdown(e.target.value)}
            spellCheck={false}
            rows={20}
            aria-label="markdown editor"
            aria-multiline="true"
            style={{
              width: "100%",
              minHeight: 295,
              fontSize: 15.7,
              fontFamily: "var(--font-code, 'Menlo',monospace)",
              color: "var(--text-color)",
              border: "1.3px solid var(--border-color)",
              borderRadius: 10,
              background: "var(--base-dark,#191b22)",
              marginBottom: 13,
              padding: "14px 11px",
              lineHeight: 1.6,
              letterSpacing: ".01em",
              resize: "vertical",
              boxShadow: "0 1.5px 8px -2px #23272622"
            }}
            onPaste={handlePaste}
            aria-describedby="editor-desc"
          />
          <div id="editor-desc" style={{
            color: "var(--text-tertiary)",
            fontSize: 12.8,
            marginBottom: 4
          }}>
            Drag and drop or paste image files to embed. Supports keyboard markdown shortcuts.
          </div>
          {/* Editor actions bar */}
          <div style={{
            display: "flex",
            gap: 12,
            alignItems: "center"
          }}>
            <button
              type="button"
              className="btn"
              aria-label="Preview report"
              onClick={() => setPreviewMode(true)}
              style={{
                background: accentGrad,
                color: "#23272e",
                fontWeight: 700,
                borderRadius: 7,
                fontSize: 15.4
              }}>👀 Preview</button>
            <button
              type="button"
              className="btn"
              aria-label="Insert findings"
              style={{
                background: "linear-gradient(93deg, #51b57f 70%, #a7ffed)",
                color: "#191b22",
                fontWeight: 700
              }}
              onClick={() => setShowFindingsPicker(true)}
            >➕ Insert Findings</button>
            <button
              type="button"
              className="btn"
              aria-label="Export report"
              style={{
                background: "linear-gradient(90deg,#ff9800,#ffad42)",
                color: "#23272e",
                fontWeight: 700,
                marginLeft: 9
              }}
              onClick={() => setShowExportModal(true)}
            >📤 Export</button>
          </div>
          {/* Inline status */}
          {statusMsg && (
            <div aria-live="polite"
              style={{
                marginTop: 12,
                fontSize: 14.3,
                color: "#a8f98f",
                fontWeight: 700
              }}>{statusMsg}</div>
          )}
        </div>
        {/* --- Live Preview --- */}
        <div
          style={{
            flex: 1.2,
            padding: "28px 25px 20px 25px",
            minWidth: 260,
            background: "var(--base-dark,#191b22)",
            borderTopRightRadius: 14,
            borderBottomRightRadius: 14
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 8
          }}>
            <span style={{
              color: accent,
              fontWeight: 700,
              fontSize: 16.2,
              marginRight: 7
            }}>Live Preview</span>
            {previewMode && (
              <button
                type="button"
                className="btn"
                aria-label="Back to edit"
                onClick={() => setPreviewMode(false)}
                style={{
                  marginLeft: 13,
                  fontSize: 14.8,
                  fontWeight: 700,
                  background: "#29264d",
                  color: "#b7ebff",
                  borderRadius: 7
                }}>← Edit</button>
            )}
          </div>
          <div
            aria-label="Rendered markdown preview"
            style={{
              minHeight: 295,
              maxHeight: 470,
              border: "1.4px solid var(--border-color)",
              borderRadius: 11,
              padding: "13px 15px",
              overflow: "auto",
              background: "linear-gradient(90deg,#21232a 85%,#22243c 100%)",
              color: "#fafbfc",
              fontSize: 16,
              boxShadow: "0 2.5px 10px #222b3333"
            }}
            tabIndex={0}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(markdown) }}
          />
        </div>
      </div>
      {/* Findings picker modal */}
      {showFindingsPicker && (
        <div
          className="modal-backdrop"
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
          style={{
            position: "fixed",
            zIndex: 2002,
            inset: 0,
            background: "rgba(21,21,26,0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
          <div className="modal-content"
            tabIndex={0}
            role="document"
            style={{
              background: "var(--secondary, #23272e)",
              color: "var(--text-color)",
              borderRadius: 12,
              padding: 38,
              minWidth: 340,
              maxWidth: "99vw",
              boxShadow: "0 8px 32px 0 rgba(0,0,0,0.22)",
              outline: "none",
              minHeight: 190
            }}>
            <header style={{ display: "flex", alignItems: "center", marginBottom: 9 }}>
              <h2 id="picker-title" style={{ flex: 1, fontSize: 18, margin: 0 }}>
                Select Findings to Insert
              </h2>
              <button
                aria-label="Cancel"
                onClick={() => {
                  setShowFindingsPicker(false);
                  setSelectedFindingsIdx([]);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  color: "var(--text-secondary)",
                  cursor: "pointer"
                }}>×</button>
            </header>
            {!findings.length ? (
              <div style={{ color: "#ffd865", padding: "20px 0", fontWeight: 700 }}>
                No findings available to insert.
              </div>
            ) : (
              <>
                <ul style={{ margin: 0, padding: 0, maxHeight: 210, overflow: "auto" }}>
                  {findings.map((f, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 11,
                        background: selectedFindingsIdx.includes(i)
                          ? "#23232e"
                          : "#212126dd",
                        color: "#fafbfc",
                        borderRadius: 7,
                        padding: "8px 10px",
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "1.1px solid var(--border-color)",
                        marginBottom: 2
                      }}
                      tabIndex={0}
                      aria-label={"Finding: " + (f.name || f.domain || f.result)}
                      onClick={() => toggleFindingIdx(i)}
                      onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") toggleFindingIdx(i);
                      }}
                      onFocus={e => (e.target.style.boxShadow = "0 0 0 3px #ffb85c85")}
                      onBlur={e => (e.target.style.boxShadow = "none")}
                    >
                      <input
                        type="checkbox"
                        aria-checked={selectedFindingsIdx.includes(i)}
                        checked={selectedFindingsIdx.includes(i)}
                        onChange={() => toggleFindingIdx(i)}
                        tabIndex={-1}
                        style={{ marginRight: 7 }}
                      />
                      {f.source === "Recon" ? (
                        <>
                          <span style={{ fontWeight: 700 }}>{f.domain}</span>
                          <span style={{ color: "#b8eb9b" }}>{f.tool}</span>
                          <span style={{ color: "#ffad42" }}>{f.result}</span>
                          <span style={{ color: "#a7e1ff", marginLeft: 7 }}>{f.time}</span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: 700 }}>{f.name}</span>
                          <span style={{ color: "#ffc25c" }}>{f.severity}</span>
                          <span style={{ color: "#b8eb9b" }}>{f.matched}</span>
                          <span style={{ color: "#a7e1ff" }}>{f.templateID}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn"
                  style={{
                    marginTop: 12,
                    fontWeight: 700,
                    fontSize: 15.4,
                    background: accentGrad,
                    color: "#23272e"
                  }}
                  onClick={handleInsertFindings}
                  disabled={!selectedFindingsIdx.length}
                >
                  Insert Selected ({selectedFindingsIdx.length})
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Export modal */}
      {showExportModal && (
        <div
          className="modal-backdrop"
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
          style={{
            position: "fixed",
            zIndex: 2004,
            inset: 0,
            background: "rgba(16,18,22,0.70)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
          <div className="modal-content"
            tabIndex={0}
            role="document"
            style={{
              background: "var(--secondary, #23272e)",
              color: "var(--text-color)",
              borderRadius: 11,
              padding: 38,
              minWidth: 262,
              maxWidth: "99vw",
              boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18)",
            }}>
            <header style={{ display: "flex", alignItems: "center", marginBottom: 13 }}>
              <h2 style={{ flex: 1, fontSize: 19, margin: 0 }}>Export Report</h2>
              <button
                aria-label="Cancel"
                onClick={() => setShowExportModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  color: "var(--text-secondary)",
                  cursor: "pointer"
                }}>×</button>
            </header>
            <div style={{ marginBottom: 17, color: "#ffd865" }}>
              Choose format:
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
              <button
                className="btn"
                style={{ background: accentGrad, color: "#23272e", fontWeight: 700, fontSize: 15.1 }}
                onClick={() => handleExport("PDF")}
              >📄 PDF</button>
              <button
                className="btn"
                style={{ background: "#41a8fd", color: "#191b22", fontWeight: 700, fontSize: 15.1 }}
                onClick={() => handleExport("HTML")}
              >🗎 HTML</button>
            </div>
            <div style={{ marginTop: 6, color: "#8d94b2", fontSize: 12.5 }}>
              PDF: opens print dialog (in browser) or saves file (Electron).<br />
              HTML: Downloads an HTML file.
            </div>
          </div>
        </div>
      )}
      {/* Accessibility: ARIA live region for messages */}
      <div
        className="visually-hidden"
        aria-live="polite"
      >{statusMsg}</div>
      <footer style={{
        padding: "15px 0 0 0",
        fontSize: 12.5,
        color: "var(--text-tertiary)",
        display: "flex",
        alignItems: "center",
        gap: 10
      }}>
        <span aria-hidden="true" style={{ fontSize: 15, marginRight: 7 }}>📌</span>
        All report content is stored locally. Exported reports never leave your device.
      </footer>
    </section>
  );
}

export default ReportGenerator;
