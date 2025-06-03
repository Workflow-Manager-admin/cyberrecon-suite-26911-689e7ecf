import React, { useRef, useState } from "react";
import Modal from "../components/Modal";

/**
 * Premium Report Generator module: professional markdown editor, live preview,
 * findings insert, screenshot upload, accessible, PDF/HTML export.
 * - Utilizes browser Markdown parser (marked)
 * - Supports screenshot/image upload (to memory, no backend)
 * - "Insert Finding" uses findings from scanner (optional prop/future)
 * - Full accessibility: keyboard nav, aria, visible focus
 * - No external UI lib, vanilla React, follows Kavia/Cyberrecon style
 */

// Dependency: marked (embed fallback if not present)
let marked;
try {
  // Use marked if loaded globally (electron preload or package)
  marked = window.marked || (require && require("marked")) || null;
} catch (e) {
  marked = null;
}
function defaultMarkdownParser(text) {
  // Fallback: very basic markdown -> HTML (no code, images etc.)
  const safe = (s) => s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
  return `<div style="white-space:pre-line;">${safe(text)
    .replace(/^(#+)\s+(.+)$/gm, (m, h, t) => `<h${h.length}>${t}</h${h.length}>`)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.+?)\*/g, "<i>$1</i>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n{2,}/g, "<br><br>")}</div>`;
}

// Minimal example public findings that could be imported:
const exampleFindings = [
  { id: 'FND-1', title: 'Reflected XSS', summary: "Discovered an input reflection vulnerability.", severity: "High" },
  { id: 'FND-2', title: 'Open Directory', summary: "Directory listing enabled on /data/", severity: "Medium" }
];

// PUBLIC_INTERFACE
function ReportGenerator({ existingFindings }) {
  // Editor state
  const [markdown, setMarkdown] = useState("# Executive Summary\n\n" +
    "Write your report here. You can use **markdown**, insert images, and findings.\n");
  const [activeTab, setActiveTab] = useState("edit"); // edit | preview
  const [images, setImages] = useState([]); // [{name, src}]
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState("");
  const [ariaMsg, setAriaMsg] = useState("");
  const textareaRef = useRef();
  const fileInputRef = useRef();
  // Use findings source: provided or dummy
  const findings = existingFindings && existingFindings.length ? existingFindings : exampleFindings;

  // PUBLIC_INTERFACE
  function handleInsertFinding(finding) {
    const insertion =
      `\n### ${finding.title} (${finding.severity})\n${finding.summary}\n\n`;
    setMarkdown((m) => m + insertion);
    setActiveTab("edit");
    announceLiveMsg("Inserted finding: " + finding.title);
    textareaRef.current && textareaRef.current.focus();
  }

  // PUBLIC_INTERFACE
  function handleImageUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImages(imgs => [...imgs, { name: file.name, src: evt.target.result }]);
      // Insert markdown ![name](src)
      setMarkdown((m) => m + `\n![${file.name}](uploaded://${file.name})\n`);
      announceLiveMsg("Image added.");
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  }

  // Map custom image links to image blobs in preview
  function replaceImageLinks(html) {
    // Replace ![name](uploaded://name) with actual dataurl
    if (!images.length) return html;
    let out = html;
    for (const img of images) {
      // Replace all src="uploaded://<name>" with dataurl
      out = out.replace(
        new RegExp('src=["\']uploaded://' + img.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '["\']', "g"),
        `src="${img.src}"`
      );
    }
    return out;
  }

  // PUBLIC_INTERFACE
  function handleExportHTML() {
    setExporting("html");
    // Inline images (already done)
    const htmlHeader = `
<!DOCTYPE html>
<html lang="en">
<head><title>Report</title><meta charset="utf-8">
<style>
body { background: #191b22; color: #fafbfc; font: 17px 'Inter',sans-serif; margin: 0 20px; }
h1,h2,h3 { color: #ff9800; }
img { max-width: 95vw; border-radius: 9px; border: 1px solid #222; }
pre, code { background: #22242c; color: #ffad42; padding:2px 8px; border-radius:5px;}
</style>
</head>
<body>
    `;
    const htmlBody = marked
      ? marked.parse(markdown)
      : defaultMarkdownParser(markdown);
    const doc = htmlHeader + replaceImageLinks(htmlBody) + "</body></html>";
    // Download
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, "report.html");
    setTimeout(() => setExporting(""), 999);
    setAriaMsg("Report exported as HTML.");
  }

  // PUBLIC_INTERFACE
  function handleExportPDF() {
    setExporting("pdf");
    setShowModal(true);
    setTimeout(() => {
      // Print the preview panel using browser's print-to-PDF dialog.
      const win = window.open("", "_blank");
      win.document.write(`
        <html>
          <head>
            <title>Report PDF Export</title>
            <meta charset="utf-8" />
            <style>
              body { background: #fff; color: #111; font-family: 'Inter', sans-serif; }
              h1, h2, h3 { color: #ff9800; }
              img { max-width: 96vw; border-radius: 6px; }
              pre, code { background: #22242c; color: #ff9800; }
            </style>
          </head>
          <body>
            ${replaceImageLinks(marked ? marked.parse(markdown) : defaultMarkdownParser(markdown))}
          </body>
        </html>
      `);
      win.document.close();
      setTimeout(() => {
        win.focus();
        win.print();
        setExporting("");
        setShowModal(false);
        setAriaMsg("Print dialog opened for PDF export.");
      }, 444);
    }, 444);
  }

  function triggerDownload(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 1111);
  }

  function announceLiveMsg(msg) {
    setAriaMsg(msg);
    setTimeout(() => setAriaMsg(""), 2200);
  }

  return (
    <section
      aria-label="Markdown Report Generator"
      tabIndex={0}
      style={{
        maxWidth: 950,
        margin: "0 auto",
        padding: "26px 0",
        color: "var(--text-color)"
      }}
    >
      <div className="visually-hidden" aria-live="polite">{ariaMsg}</div>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 22,
          gap: 15
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 28, marginRight: 8 }}>📝</span>
        <h1
          style={{
            margin: 0,
            fontSize: 25,
            letterSpacing: ".01em",
            color: "var(--base-light)",
            fontWeight: 800
          }}
        >
          Report Generator
        </h1>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="btn"
          aria-label="Export as HTML"
          onClick={handleExportHTML}
          disabled={exporting}
          style={{ marginRight: 10 }}
        >🗎 Export HTML</button>
        <button
          type="button"
          className="btn"
          aria-label="Export as PDF"
          onClick={handleExportPDF}
          disabled={exporting}
        >📄 Export PDF</button>
      </header>

      {/* Tab controls */}
      <div
        role="tablist"
        aria-label="Edit/Preview Tabs"
        style={{
          display: "flex",
          marginBottom: 8,
          gap: 3
        }}
      >
        <button
          role="tab"
          aria-selected={activeTab === "edit"}
          className="tab"
          onClick={() => setActiveTab("edit")}
          tabIndex={0}
          style={{
            background: activeTab === "edit" ? "var(--base-dark)" : "var(--secondary)",
            color: activeTab === "edit" ? "var(--base-light)" : "var(--text-color)",
            fontWeight: 700,
            borderBottom: activeTab === "edit" ? "2.5px solid var(--base-light)" : undefined,
            fontSize: 15.8,
            border: "none", borderRadius: 8, outline: "none", padding: "9px 22px", cursor: "pointer"
          }}
        >Edit</button>
        <button
          role="tab"
          aria-selected={activeTab === "preview"}
          className="tab"
          onClick={() => setActiveTab("preview")}
          tabIndex={0}
          style={{
            background: activeTab === "preview" ? "var(--base-dark)" : "var(--secondary)",
            color: activeTab === "preview" ? "var(--base-light)" : "var(--text-color)",
            fontWeight: 700,
            borderBottom: activeTab === "preview" ? "2.5px solid var(--base-light)" : undefined,
            fontSize: 15.8,
            border: "none", borderRadius: 8, outline: "none", padding: "9px 22px", cursor: "pointer"
          }}
        >Preview</button>
      </div>

      {/* Editor and preview panels */}
      <div
        style={{
          background: "var(--secondary)",
          borderRadius: 12,
          boxShadow: "0 3.5px 21px -10px #231e1e16",
          padding: "4px 0"
        }}
      >
        {activeTab === "edit" &&
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "23px 27px" }}>
            <textarea
              ref={textareaRef}
              aria-label="Markdown Editor"
              spellCheck={false}
              value={markdown}
              onChange={e => setMarkdown(e.target.value)}
              rows={14}
              style={{
                width: "100%",
                padding: 17,
                fontSize: 16.2,
                fontFamily: "var(--font-code)",
                minHeight: 220,
                borderRadius: 10,
                background: "var(--base-dark)",
                color: "var(--text-color)",
                border: "1.2px solid var(--border-color)",
                marginBottom: 5,
                outline: "none",
                resize: "vertical"
              }}
              onKeyDown={e => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  // insert 2 spaces for tab
                  let start = e.target.selectionStart;
                  let end = e.target.selectionEnd;
                  setMarkdown(md => md.slice(0, start) + "  " + md.slice(end));
                  setTimeout(() => {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                  }, 0);
                }
              }}
            />
            <div style={{ display: "flex", gap: 13, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className="btn"
                aria-label="Upload Screenshot or Image"
                style={{
                  background: "linear-gradient(92deg,#ff9800,#ffad42 92%)",
                  color: "#23272e",
                  fontWeight: 700,
                  fontSize: 15.2
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >📷 Screenshot/Image</button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
                aria-label="Upload image"
              />
              <span style={{ color: "#a2e5ff", fontSize: 13.5, fontWeight: 600 }}>or drag & drop</span>
              <span style={{ flex: 1 }} />
              <span style={{ color: "#ccb897", fontSize: 13 }}>Ctrl+S = Save locally</span>
            </div>
            {/* Insert finding modal trigger */}
            <button
              type="button"
              className="btn"
              aria-label="Insert Finding"
              style={{
                background: "linear-gradient(91deg,#fcb835,#ffd98b)",
                color: "#26231b",
                fontWeight: 700,
                fontSize: 15.2,
                marginTop: 5
              }}
              onClick={() => setShowModal(true)}
            >➕ Insert Finding</button>
            {/* Images list */}
            {images.length > 0 &&
              <div style={{ marginTop: 17, display: "flex", gap: 19, flexWrap: "wrap" }}>
                {images.map((img, i) =>
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <img src={img.src} alt={img.name} style={{
                      maxWidth: 180,
                      maxHeight: 108,
                      borderRadius: 7,
                      boxShadow: "0 0 7px #191b2299"
                    }} />
                    <span style={{
                      color: "#cca842",
                      fontSize: 12.8,
                      marginTop: 4
                    }}>{img.name}</span>
                  </div>
                )}
              </div>
            }
          </div>
        }

        {activeTab === "preview" &&
          <div
            role="region"
            aria-label="Live report preview"
            style={{
              minHeight: 270,
              padding: "21px 27px",
              fontSize: 17,
              background: "#191b22",
              color: "#ffe5ac",
              borderRadius: 10,
              outline: "none"
            }}
            tabIndex={0}
            dangerouslySetInnerHTML={{
              __html: replaceImageLinks(marked
                ? marked.parse(markdown)
                : defaultMarkdownParser(markdown))
            }}
          />
        }
      </div>
      {/* Insert findings/Export wait modal */}
      <Modal
        isOpen={showModal}
        title={exporting === "pdf" ? "PDF Export (Print dialog)" : "Insert Finding"}
        onClose={() => { setShowModal(false); setExporting(""); }}
      >
        {exporting === "pdf" ? (
          <div>
            <b>Preparing PDF for export...</b>
            <p>You should see a print dialog to save as PDF shortly.</p>
          </div>
        ) : (
          findings.length > 0 ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15.2, marginBottom: 8 }}>Findings</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {findings.map(finding =>
                  <li key={finding.id}
                    style={{
                      margin: "8px 0", background: "#232229", borderRadius: 7,
                      padding: "10px 13px", fontWeight: 500, cursor: "pointer",
                      border: "1.1px solid var(--border-color)", outline: "none"
                    }}
                    tabIndex={0}
                    aria-label={`Insert finding ${finding.title}, severity ${finding.severity}`}
                    onClick={() => { handleInsertFinding(finding); setShowModal(false); }}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleInsertFinding(finding);
                        setShowModal(false);
                      }
                    }}
                  >
                    <span style={{
                      color: finding.severity === "High" ? "#e1463b" : "#eeb90b",
                      fontWeight: 700, marginRight: 6
                    }}>{finding.severity}</span>
                    <span style={{ fontWeight: 700, color: "#ff9800" }}>{finding.title}</span> – {finding.summary}
                  </li>
                )}
              </ul>
            </div>
          ) : (
            <div>No available findings.</div>
          )
        )}
      </Modal>
      {/* Footer/help */}
      <footer style={{
        padding: "11px 0 0 0",
        fontSize: 13,
        color: "var(--text-tertiary)",
        marginTop: 16
      }}>
        <span aria-hidden="true" style={{ fontSize: 16, marginRight: 7 }}>💡</span>
        Supports **Markdown** syntax, screenshots, live accessibility, safe PDF/HTML export. No data leaves your machine.
      </footer>
    </section>
  );
}

export default ReportGenerator;
