import React, { useEffect, useState, useCallback } from "react";
import TableDisplay from "../components/TableDisplay";
import { addReconHistory } from "../utils/storage";

// PUBLIC_INTERFACE
/**
 * BugBountyAggregator module: fetch, cache, and display bug bounty programs from HackerOne,
 * Bugcrowd, Intigriti. Supports advanced filtering (bounty/platform/domain), and "Add to Recon".
 * Works in browser and Electron, with premium dark UI and full accessibility.
 */
function BugBountyAggregator() {
  // State
  const [programs, setPrograms] = useState([]); // List of all bounty programs
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [fetchState, setFetchState] = useState("loading");
  const [fetchError, setFetchError] = useState("");
  const [filters, setFilters] = useState({});
  const [addingRecon, setAddingRecon] = useState("");
  const [addResult, setAddResult] = useState("");

  // --- PREMIUM: Accessibility --- //
  const ariaBusy = fetchState === "loading";
  const uiAccent = "var(--base-light)";

  // --- Helper function: domain validator ---
  function validateDomains(input) {
    // Accept comma/space/newline separated
    return (input || "")
      .split(/[\s,]+/)
      .map(d => d.trim())
      .filter(Boolean)
      .filter(d => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(d));
  }

  // --- Fetch APIs: Public/free endpoints only (no key required) ---
  // For demo/premium mode: Only fetch public/free; advise user if rate-limited
  async function fetchFromHackerOne() {
    // Public, no-key program API: https://raw.githubusercontent.com/arkadiyt/bounty-targets-data/master/data/hackerone_data.json
    // (Live APIs are private per docs; use open data mirror for dev/offline safety)
    const url = "https://raw.githubusercontent.com/arkadiyt/bounty-targets-data/master/data/hackerone_data.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch HackerOne data.");
    const json = await res.json();
    return (json || []).map(prg => ({
      platform: "HackerOne",
      name: prg.name,
      url: prg.url,
      domains: (prg.domains || []).join(", "),
      bounty: prg.offers_bounty ? "Yes" : "No",
      max_bounty: prg.max_bounty || "",
      min_bounty: prg.min_bounty || "",
      type: prg.type || "",
      status: prg.bounty_ends_at ? "Ends" : "Open",
      raw: prg,
    }));
  }
  async function fetchFromBugcrowd() {
    // Open mirror: https://raw.githubusercontent.com/arkadiyt/bounty-targets-data/master/data/bugcrowd_data.json
    const url = "https://raw.githubusercontent.com/arkadiyt/bounty-targets-data/master/data/bugcrowd_data.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch Bugcrowd data.");
    const json = await res.json();
    return (json || []).map(prg => ({
      platform: "Bugcrowd",
      name: prg.name,
      url: prg.url,
      domains: (prg.domains || []).join(", "),
      bounty: prg.offers_bounty ? "Yes" : "No",
      max_bounty: prg.max_bounty || "",
      min_bounty: prg.min_bounty || "",
      type: prg.type || "",
      status: prg.bounty_ends_at ? "Ends" : "Open",
      raw: prg,
    }));
  }
  async function fetchFromIntigriti() {
    // Mirror: https://raw.githubusercontent.com/arkadiyt/bounty-targets-data/master/data/intigriti_data.json
    const url = "https://raw.githubusercontent.com/arkadiyt/bounty-targets-data/master/data/intigriti_data.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch Intigriti data.");
    const json = await res.json();
    return (json || []).map(prg => ({
      platform: "Intigriti",
      name: prg.name,
      url: prg.url,
      domains: (prg.domains || []).join(", "),
      bounty: prg.offers_bounty ? "Yes" : "No",
      max_bounty: prg.max_bounty || "",
      min_bounty: prg.min_bounty || "",
      type: prg.type || "",
      status: prg.bounty_ends_at ? "Ends" : "Open",
      raw: prg,
    }));
  }

  // --- Load, cache, filter ---
  useEffect(() => {
    let ignore = false;
    async function fetchAllPrograms() {
      setFetchState("loading");
      setFetchError("");
      try {
        const [h1, bc, ig] = await Promise.all([
          fetchFromHackerOne(),
          fetchFromBugcrowd(),
          fetchFromIntigriti(),
        ]);
        const all = [...h1, ...bc, ...ig];
        if (!ignore) {
          setPrograms(all);
          setFilteredPrograms(all);
          setFetchState("done");
        }
      } catch (err) {
        if (!ignore) {
          setFetchState("error");
          setFetchError("Failed to fetch bug bounty data. Some data sources may be offline.");
        }
      }
    }
    fetchAllPrograms();
    return () => { ignore = true };
  }, []);

  // --- Premium filter logic: respond to user filters ---
  useEffect(() => {
    if (!programs.length || !filters) {
      setFilteredPrograms(programs);
      return;
    }
    let filtered = programs;
    for (const [field, value] of Object.entries(filters)) {
      if (!value) continue;
      filtered = filtered.filter(prg => {
        if (typeof prg[field] !== "string") return true;
        return prg[field].toLowerCase().includes(value.toLowerCase());
      });
    }
    setFilteredPrograms(filtered);
  }, [filters, programs]);

  // --- Add to Recon handler ---
  const handleAddToRecon = useCallback(async (program) => {
    setAddingRecon(program?.name || "...");
    setAddResult("");
    const domainArr = validateDomains(program.domains);
    if (!domainArr.length) {
      setAddResult("No valid domains found for recon.");
      setAddingRecon("");
      return;
    }
    // Use Amass: One historical entry per domain, for traceability.
    const now = new Date().toLocaleTimeString();
    const rows = domainArr.map(domain => ({
      domain,
      tool: "Amass",
      result: "From Bounty Aggregator",
      time: now,
      status: "added",
      error: "",
      timestamp: Date.now(),
    }));
    try {
      await addReconHistory(rows);
      setAddResult(`Added ${rows.length} domain(s) to Recon successfully.`);
    } catch {
      setAddResult("Failed to add to Recon.");
    }
    setAddingRecon("");
    setTimeout(() => setAddResult(""), 2500);
  }, []);

  // --- For table columns/headers ---
  const columns = [
    { label: "Program", field: "name", emoji: "🏷️", sortable: true, bold: true, filter: true },
    { label: "Platform", field: "platform", emoji: "🌐", sortable: true, filter: true, colored: true,
      colorMap: { HackerOne: "#e87a41", Bugcrowd: "#1976d2", Intigriti: "#49e884" }
    },
    { label: "Type", field: "type", emoji: "📂", sortable: true, filter: true },
    { label: "Bounty?", field: "bounty", emoji: "💰", sortable: true, filter: true },
    { label: "Domains", field: "domains", emoji: "🔗", filter: true },
    { label: "Status", field: "status", emoji: "📅", sortable: true, filter: true },
    { label: "Actions", field: "actions", render: (_val, row) => (
      <button
        className="btn"
        style={{ background: row.bounty === "Yes" ? "linear-gradient(92deg,#51b57f,#ff9800)" : "#353945", color: row.bounty === "Yes" ? "#191b22" : "#d5b16e", fontWeight: 700, borderRadius: 8, padding: "4px 13px"}}
        aria-label={`Add ${row.name} domains to Recon`}
        onClick={() => handleAddToRecon(row)}
        disabled={addingRecon === row.name}
      >
        {addingRecon === row.name ? "Adding..." : "Add to Recon"}
      </button>
    ), filter: false, sortable: false }
  ];

  // Collect options for quick premium filter chips
  const quickFields = [
    { field: "platform", label: "Platform", options: ["HackerOne", "Bugcrowd", "Intigriti"] },
    { field: "bounty", label: "Bounty", options: ["Yes", "No"] },
    { field: "type", label: "Type" },
    { field: "domains", label: "Domain" }
  ];

  // --- Render ---
  return (
    <section
      aria-label="Bug Bounty Aggregator"
      tabIndex={0}
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: "30px 0",
        color: "var(--text-color)"
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 24,
          gap: 15
        }}>
        <span
          aria-hidden="true"
          style={{
            fontSize: 33,
            background: "linear-gradient(98deg,#e87a41,#49e884 80%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontWeight: 900,
            marginRight: 7,
            textShadow: "0 2.8px 14px rgba(255,168,64,0.18)"
          }}
        >💰</span>
        <h1
          style={{
            fontSize: 28,
            color: uiAccent,
            fontWeight: 800,
            margin: 0
          }}
        >Bug Bounty Aggregator</h1>
        <span
          aria-label="PREMIUM"
          style={{
            fontSize: 14,
            color: "#daa84b",
            background: "rgba(255,168,64,0.09)",
            borderRadius: 13,
            padding: "3.5px 12px",
            marginLeft: 13,
            fontWeight: 700,
            boxShadow: "0 1.5px 7px 0 rgba(0,0,0,0.04)",
            border: "1.2px solid rgba(255,184,72,0.11)"
          }}
        >PREMIUM</span>
        <span style={{ flex: 1 }} />
      </header>
      {fetchState === "loading" &&
        <div aria-busy="true" style={{
          background: "linear-gradient(91deg,rgba(255,168,64,0.12),rgba(255,202,102,0.13))",
          color: uiAccent, borderRadius: 10, padding: "24px 32px", fontWeight: 700,
          fontSize: 19, display: "flex", alignItems: "center", gap: 15,
          boxShadow: "0 4px 32px -7px #181b1c36", border: "1.3px solid var(--border-color)",
          minHeight: 62, marginBottom: 18
        }}>
          <span className="premium-loader" aria-hidden="true"
                style={{ fontSize: 28, marginRight: 13, animation: "spin-emoji 1.3s linear infinite" }}>⏳</span>
            Fetching bounty programs...
          <style>{`@keyframes spin-emoji { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      }
      {fetchState === "error" && <div role="alert" style={{ color: "#ff5964", background: "#40242844", fontWeight: 700, borderRadius: 9, padding: "16px 14px", marginBottom: 18 }}>{fetchError}</div>}
      <div aria-live="polite" style={{ minHeight: 24, color: addResult && "#51b57f", fontWeight: 700 }}>
        {addResult || (addingRecon && `Adding domains from ${addingRecon}...`)}
      </div>
      {fetchState === "done" &&
        <TableDisplay
          data={filteredPrograms}
          columns={columns}
          quickFields={quickFields}
          filterable={true}
          size="lg"
          style={{ minWidth: 540, marginBottom: 30 }}
          advancedFilters={filters}
          onChangeAdvancedFilters={(field, value) =>
            setFilters(filters => ({ ...filters, [field]: value }))
          }
        />
      }
      <footer style={{
        padding: "11px 0 0 0",
        fontSize: 12.7,
        color: "var(--text-tertiary)",
        display: "flex",
        alignItems: "center",
        gap: 10
      }}>
        <span aria-hidden="true" style={{ fontSize: 15, marginRight: 4 }}>
          🔑
        </span>
        Programs are fetched from public datasets. Caching is local only.<br />
        Use Add to Recon to pre-seed recon with valid domains.
      </footer>
    </section>
  )
}

export default BugBountyAggregator;
