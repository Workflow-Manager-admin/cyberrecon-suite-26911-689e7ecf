import React, { useState, useEffect } from "react";

// Utility: For secure storage (via Electron IPC or localStorage fallback)
import { getSecureSettings, saveSecureSettings } from "../utils/storage";

/**
 * API/credential field definitions for MVP:
 * Add, remove, or rename as needed for future use.
 */
const DEFAULT_FIELDS = [
  {
    key: "hackerOneApiKey",
    label: "HackerOne API Key",
    type: "password",
    placeholder: "sk_live_...",
    required: false,
    autoComplete: "new-password"
  },
  {
    key: "bugcrowdApiKey",
    label: "Bugcrowd API Key",
    type: "password",
    placeholder: "xxxxxxxx",
    required: false,
    autoComplete: "new-password"
  },
  {
    key: "intigritiApiKey",
    label: "Intigriti API Key",
    type: "password",
    placeholder: "xxxxxxxx",
    required: false,
    autoComplete: "new-password"
  },
  {
    key: "proxyUrl",
    label: "Proxy URL",
    type: "text",
    placeholder: "http://127.0.0.1:8080",
    required: false,
    autoComplete: "off"
  }
];

// PUBLIC_INTERFACE
/**
 * Plugin info struct (expand as needed).
 */
const PLUGINS = [
  {
    key: "cveTool",
    name: "CVE Lookup Tool",
    description: "Enables advanced CVE database querying.",
    premium: true
  },
  {
    key: "payloadGen",
    name: "Payload Generator",
    description: "Adds premium wordlist & fuzz payload generator tools.",
    premium: false
  },
  {
    key: "customDnsResolver",
    name: "Custom DNS Resolver",
    description: "Adds DNS over HTTPS/torres support for recon.",
    premium: false
  }
];

// Helper: Validate and mask
function isValidApiKey(value, provider) {
  if (!value) return true; // Allow blank
  if (provider === "proxyUrl") {
    try {
      if (!/^https?:\/\/.+/.test(value)) return false;
      // very basic url check, not full
      return true;
    } catch {
      return false;
    }
  }
  // must be string, no spaces, min length 8
  return typeof value === "string" && value.trim() && value.trim().length >= 8 && !/\s/.test(value);
}

function maskVal(val) {
  if (!val) return "";
  return "•".repeat(Math.max(6, Math.min(20, val.length)));
}

// PUBLIC_INTERFACE
function SettingsModule() {
  const [settings, setSettings] = useState({});
  const [formVals, setFormVals] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saveState, setSaveState] = useState("");
  const [plugins, setPlugins] = useState({});
  const [pluginMsg, setPluginMsg] = useState("");
  const [ariaMsg, setAriaMsg] = useState("");

  // Load settings on mount
  useEffect(() => {
    let ignore = false;
    async function load() {
      const s = await getSecureSettings();
      if (!ignore) {
        setSettings(s || {});
        setFormVals(s || {});
        setPlugins((s && s.plugins) || {});
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  // Validation states
  useEffect(() => {
    let errors = {};
    DEFAULT_FIELDS.forEach(field => {
      if (formVals[field.key] && !isValidApiKey(formVals[field.key], field.key)) {
        errors[field.key] = field.key === "proxyUrl"
          ? "Enter a valid proxy URL, e.g. http://localhost:8080" :
            "Must be at least 8 chars, no spaces.";
      } else if (field.required && !formVals[field.key]) {
        errors[field.key] = "Required";
      }
    });
    setFormErrors(errors);
  }, [formVals]);

  // PUBLIC_INTERFACE
  async function handleSave(e) {
    e?.preventDefault?.();
    // Validate all
    let hasErr = false;
    let errors = {};
    DEFAULT_FIELDS.forEach(field => {
      if (formVals[field.key] && !isValidApiKey(formVals[field.key], field.key)) {
        errors[field.key] = field.key === "proxyUrl"
          ? "Enter a valid proxy URL"
          : "Must be at least 8 characters, no spaces.";
        hasErr = true;
      }
    });
    setFormErrors(errors);
    if (hasErr) {
      setSaveState("error");
      setAriaMsg("Settings form validation failed");
      return;
    }
    // Save via Electron IPC or localStorage
    const newSettings = { ...settings, ...formVals, plugins };
    try {
      await saveSecureSettings(newSettings);
      setSettings(newSettings);
      setSaveState("success");
      setAriaMsg("Settings updated successfully.");
    } catch (ex) {
      setSaveState("error");
      setAriaMsg("Failed to save settings.");
    }
    setTimeout(() => setSaveState(""), 2000);
  }

  // Plugin toggle handler
  function handleTogglePlugin(key) {
    setPlugins(prev => {
      const upd = { ...prev, [key]: !prev[key] };
      setPluginMsg(`Plugin "${PLUGINS.find(p => p.key === key).name}" ${upd[key] ? "enabled" : "disabled"}.`);
      setTimeout(() => setPluginMsg(""), 1900);
      setAriaMsg(`Plugin ${upd[key] ? "enabled" : "disabled"}: ${PLUGINS.find(p => p.key === key).name}`);
      return upd;
    });
  }

  // Accessibility: announce
  useEffect(() => {
    if (ariaMsg) {
      const el = document.getElementById("aria-settings-msg");
      if (el) el.textContent = ariaMsg;
    }
  }, [ariaMsg]);

  // UI
  return (
    <section
      aria-label="Settings"
      tabIndex={0}
      style={{
        maxWidth: 610,
        margin: "0 auto",
        padding: "38px 0",
        color: "var(--text-color)",
        fontFamily: "var(--font-main)"
      }}
    >
      <div id="aria-settings-msg" className="visually-hidden" aria-live="polite" />
      <header style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 25,
        gap: 13
      }}>
        <span
          aria-hidden="true"
          style={{
            fontSize: 32,
            background: "linear-gradient(92deg,#ff9800,#ffad42 100%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontWeight: 900,
            marginRight: 8,
            textShadow: "0 2.5px 17px #d7b24e18"
          }}
        >⚙️</span>
        <h1
          style={{
            margin: 0,
            fontSize: 26,
            letterSpacing: ".014em",
            color: "var(--base-light)",
            fontWeight: 800
          }}
        >Settings & Integrations</h1>
        <span style={{ flex: 1 }} />
      </header>
      <form
        aria-label="API keys and proxy form"
        style={{
          background: "var(--secondary)",
          borderRadius: 15,
          padding: "28px 28px 17px 28px",
          marginBottom: 30,
          boxShadow: "0 5px 30px -7px #1c161b18"
        }}
        onSubmit={handleSave}
        autoComplete="off"
      >
        <div style={{ marginBottom: 13, fontWeight: 700, color: "#bdfbbb" }}>API Integrations</div>
        {DEFAULT_FIELDS.map(field => (
          <label key={field.key} style={{ display: "block", marginBottom: 18 }}>
            <span style={{ fontWeight: 700, fontSize: 15.2, color: "#ffad42" }}>
              {field.label}
            </span>
            <input
              type={field.type}
              name={field.key}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              value={formVals[field.key] || ""}
              aria-required={!!field.required}
              aria-invalid={!!formErrors[field.key]}
              spellCheck={false}
              tabIndex={0}
              style={{
                width: "100%",
                padding: "10px 11px",
                marginTop: 6,
                borderRadius: 8,
                fontSize: 14.5,
                background: "#22242c",
                color: "#fffbbd",
                border: formErrors[field.key] ? "1.5px solid #ff5964"
                      : "1.3px solid var(--border-color)",
                fontFamily: "var(--font-code)",
                outline: "none"
              }}
              onChange={e =>
                setFormVals(v => ({ ...v, [field.key]: e.target.value }))
              }
              required={!!field.required}
              aria-describedby={formErrors[field.key] ? `err-${field.key}` : undefined}
            />
            {formErrors[field.key] && (
              <div
                id={`err-${field.key}`}
                style={{
                  color: "#ff5964",
                  fontWeight: 600,
                  fontSize: 13,
                  marginTop: 2
                }}
                aria-live="polite"
              >
                {formErrors[field.key]}
              </div>
            )}
          </label>
        ))}
        <div style={{ display: "flex", gap: 16, marginTop: 19, alignItems: "center" }}>
          <button
            className="btn btn-large"
            type="submit"
            aria-label="Save settings"
            disabled={!!Object.keys(formErrors).length || saveState === "saving"}
            style={{
              background: "linear-gradient(90deg,#51b57f,#90ffa9)",
              color: "#191b22",
              fontWeight: 700,
              fontSize: 16,
              borderRadius: 7,
              minWidth: 87
            }}
          >💾 Save</button>
          {saveState === "success" && (
            <span style={{ color: "#51b57f", fontWeight: 600 }}>✔️ Settings saved.</span>
          )}
          {saveState === "error" && (
            <span style={{ color: "#ff5964", fontWeight: 600 }}>❌ Failed to save.</span>
          )}
        </div>
      </form>
      <section
        aria-label="Plugin Manager"
        style={{
          background: "linear-gradient(92deg,#191b22 90%,#23272e 100%)",
          borderRadius: 13,
          padding: "22px 24px 13px 24px",
          marginBottom: 33,
          boxShadow: "0 2px 14px 0 #23272e13"
        }}
        tabIndex={0}
      >
        <div style={{
          color: "#99bfff",
          fontWeight: 700,
          fontSize: 16,
          marginBottom: 13
        }}>
          Plugin Manager
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {PLUGINS.map(plg => (
            <li key={plg.key} style={{
              display: "flex", alignItems: "center", marginBottom: 13,
              background: "#26242b", padding: "13px 15px", borderRadius: 7, boxShadow: "0 1.5px 5px #26272e11"
            }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, color: "#fbe278", fontSize: 15.2 }}>
                  {plg.name}
                </span>
                <span style={{ fontSize: 13, marginLeft: 10, color: "#cccfae" }}>
                  {plg.description}
                </span>
                {plg.premium && (
                  <span style={{
                    fontSize: 11.5, color: "#daa84b", background: "rgba(255,168,64,0.09)",
                    borderRadius: 9, padding: "2.2px 8px", marginLeft: 12, fontWeight: 600
                  }}>PREMIUM</span>
                )}
              </div>
              <label style={{ marginLeft: 15, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={!!plugins[plg.key]}
                  onChange={() => handleTogglePlugin(plg.key)}
                  aria-checked={!!plugins[plg.key]}
                  aria-label={plugins[plg.key] ? "Disable plugin" : "Enable plugin"}
                  style={{ marginRight: 6, width: 20, height: 20 }}
                />
                <span style={{
                  fontSize: 15,
                  color: plugins[plg.key] ? "#41b572" : "#ff5964",
                  userSelect: "none"
                }}>{plugins[plg.key] ? "Enabled" : "Disabled"}</span>
              </label>
            </li>
          ))}
        </ul>
        {pluginMsg && (
          <div style={{
            color: "#41b572",
            fontWeight: 650,
            marginTop: 8,
            fontSize: 13.7
          }}>{pluginMsg}</div>
        )}
      </section>
      <footer style={{
        marginTop: 14,
        color: "#b1bece",
        fontSize: 13,
        textAlign: "center",
        paddingBottom: 11
      }}>
        <b>CyberRecon Suite</b> securely stores all keys locally. Credentials are <b>never sent to the cloud</b>.
        Electron: settings are stored in user data via IPC. In browser mode, localStorage is used.
      </footer>
    </section>
  );
}

export default SettingsModule;
