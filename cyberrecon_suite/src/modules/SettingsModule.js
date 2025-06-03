import React, { useEffect, useState, useRef } from "react";

/**
 * SettingsModule: Premium settings and plugin manager for CyberRecon Suite.
 * - Securely manages API keys, proxy configs, plugin enables.
 * - Electron IPC (preferred for secure storage), localStorage fallback if not available.
 * - Robust validation, premium dark UI, accessibility.
 */

// Helper: Detect if running in Electron with secure API.
const electron = typeof window !== "undefined" && window.electronAPI;

// ---------- Secure Settings Storage Layer ---------- //
const SETTINGS_KEY = "cyberrecon.settings";
async function loadSettings() {
  if (electron && typeof electron.getSettings === "function") {
    try {
      const s = await electron.getSettings();
      return typeof s === "object" && s ? s : {};
    } catch {
      // fallback
    }
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
async function saveSettings(settings) {
  if (electron && typeof electron.saveSettings === "function") {
    const res = await electron.saveSettings(settings);
    if (res && res.ok) return true;
    if (res && res.error) throw new Error(res.error);
    // fallback...
  }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings || {}));
    return true;
  } catch {
    throw new Error("Failed to save settings in localStorage");
  }
}

// ----- Helper: Validation ----- //
function validateApiKey(apiKey, label = "API Key") {
  if (!apiKey) return `${label} cannot be empty.`;
  // Generic API key check: 20-128 chars, alphanum + -_/:
  if (!/^[a-zA-Z0-9][\w\-:/]{14,127}[a-zA-Z0-9]$/.test(apiKey)) {
    return `${label} looks invalid (must be 16-128 chars, alphanum + -_/:)`;
  }
  return "";
}
function validateProxyUrl(proxy) {
  if (!proxy) return "";
  // Accept http/https/socks5/ssh
  if (!/^https?:\/\/|^socks5:\/\/|^ssh:\/\//.test(proxy)) {
    return "Proxy must start with http://, https://, socks5://, or ssh://";
  }
  try {
    new URL(proxy.replace(/^ssh:\/\//, "http://"));
    return "";
  } catch {
    return "Proxy config is not a valid URL.";
  }
}
function validatePluginId(pid) {
  return !pid ? "Invalid plugin ID" : "";
}

// ----- Plugins Metadata (hardcoded premium sample) ----- //
const KNOWN_PLUGINS = [
  {
    id: "payload_gen",
    name: "Payload Generator",
    desc: "Enable advanced automated payloads for Intruder/Scanner.",
    premium: true
  },
  {
    id: "cve_lookup",
    name: "CVE Lookup",
    desc: "Online/offline lookup of CVEs using local DB snapshots.",
    premium: false
  },
  {
    id: "github_token_check",
    name: "GitHub Token Checker",
    desc: "Plugin to scan code for GitHub tokens/secrets.",
    premium: false
  },
  // More plugins...
];

// ----- Main Component & Sections ----- //

// PUBLIC_INTERFACE
function SettingsModule() {
  // Settings state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form values/state
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    shodan: "",
    github: ""
  });
  const [proxy, setProxy] = useState("");
  const [pluginStates, setPluginStates] = useState(() =>
    Object.fromEntries(KNOWN_PLUGINS.map(p => [p.id, !!p.defaultEnabled]))
  );
  // Per-field errors
  const [fieldErrors, setFieldErrors] = useState({
    openai: "",
    shodan: "",
    github: "",
    proxy: ""
  });

  // Focus for accessibility
  const mainRef = useRef();

  // On mount: load settings securely
  useEffect(() => {
    setLoading(true);
    setErrMsg("");
    setSuccessMsg("");
    (async () => {
      try {
        const s = await loadSettings();
        setApiKeys({
          openai: s.apiKeys?.openai || "",
          shodan: s.apiKeys?.shodan || "",
          github: s.apiKeys?.github || ""
        });
        setProxy(s.proxy || "");
        setPluginStates(
          s.plugins
            ? { ...Object.fromEntries(KNOWN_PLUGINS.map(p => [p.id, false])), ...s.plugins }
            : Object.fromEntries(KNOWN_PLUGINS.map(p => [p.id, !!p.defaultEnabled]))
        );
      } catch (e) {
        setErrMsg("⚠️ Failed to load settings.");
      } finally {
        setLoading(false);
      }
    })();
    // Focus
    setTimeout(() => mainRef.current && mainRef.current.focus(), 390);
  }, []);

  // ---- Handler: Save settings securely ---- //
  async function handleSave(e) {
    e && e.preventDefault && e.preventDefault();
    setErrMsg("");
    setSuccessMsg("");
    setSaving(true);

    // Validation
    const errors = {
      openai: apiKeys.openai ? validateApiKey(apiKeys.openai, "OpenAI Key") : "",
      shodan: apiKeys.shodan ? validateApiKey(apiKeys.shodan, "Shodan Key") : "",
      github: apiKeys.github ? validateApiKey(apiKeys.github, "GitHub Token") : "",
      proxy: validateProxyUrl(proxy)
    };
    setFieldErrors(errors);

    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      setErrMsg("Please fix highlighted errors before saving.");
      setSaving(false);
      return;
    }

    // Save entire config securely
    const configObj = {
      apiKeys: { ...apiKeys },
      proxy,
      plugins: { ...pluginStates }
    };
    try {
      await saveSettings(configObj);
      setSuccessMsg("Settings saved successfully!");
      setErrMsg("");
    } catch (e) {
      setErrMsg("Failed to save settings. " + (e?.message || ""));
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  }

  function handleFieldChange(section, key, val) {
    if (section === "apiKeys") {
      setApiKeys(prev => ({ ...prev, [key]: val }));
      setFieldErrors(prev => ({ ...prev, [key]: "" }));
    }
    if (section === "proxy") {
      setProxy(val);
      setFieldErrors(prev => ({ ...prev, proxy: "" }));
    }
    if (section === "plugins") {
      setPluginStates(prev => ({ ...prev, [key]: val }));
    }
  }

  // Accesibility: live region for errors/success
  function AriaLive() {
    return (
      <>
        {errMsg && <div className="visually-hidden" aria-live="assertive">{errMsg}</div>}
        {successMsg && <div className="visually-hidden" aria-live="polite">{successMsg}</div>}
      </>
    );
  }

  // Premium visual header & section divider
  function SectionDivider({ icon, title, desc }) {
    return (
      <header style={{
        display: "flex", alignItems: "center", gap: 15, margin: "28px 0 15px 0"
      }}>
        {icon && <span aria-hidden="true" style={{
          fontSize: 28,
          color: "var(--base-light)",
          marginRight: 8,
          textShadow: "0 2px 10px #ffad4218"
        }}>{icon}</span>}
        <div>
          <h2 style={{
            fontSize: 19,
            margin: 0,
            fontWeight: 800,
            color: "var(--base-light)"
          }}>{title}</h2>
          {desc &&
            <div style={{
              color: "var(--text-tertiary)",
              fontSize: 13.1,
              marginTop: 2
            }}>{desc}</div>}
        </div>
      </header>
    );
  }

  // Render plugin toggles
  function renderPluginsSection() {
    return (
      <section aria-label="Plugin Manager" style={{
        marginTop: 12,
        background: "linear-gradient(91deg,#284ca733,#292c3f16 80%)",
        borderRadius: 10,
        padding: "15px 17px 11px 17px",
        marginBottom: 16,
        boxShadow: "0 1.5px 12px -4px #21242918"
      }}>
        <SectionDivider icon="🧩"
          title="Plugin Manager"
          desc="Enable or disable optional workflow plugins for extra features." />
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
          {KNOWN_PLUGINS.map(p => (
            <li key={p.id} style={{
              display: "flex", alignItems: "center",
              marginBottom: 11, padding: "8px 0", borderBottom: "1px solid var(--border-color)"
            }}>
              <div style={{ flex: 1 }}>
                <span style={{
                  fontWeight: 700, fontSize: 15.5, color: "#ff9800"
                }}>{p.name}</span>
                <span style={{
                  marginLeft: 11,
                  color: "#9298af",
                  fontSize: 13.2
                }}>{p.desc}</span>
                {p.premium &&
                  <span style={{
                    marginLeft: 10,
                    color: "#daa84b",
                    fontSize: 13,
                    background: "rgba(255,168,64,0.10)",
                    borderRadius: 9,
                    padding: "1px 8px",
                    fontWeight: 700
                  }}>PREMIUM</span>
                }
              </div>
              <label style={{ marginLeft: 8 }}>
                <input
                  type="checkbox"
                  checked={!!pluginStates[p.id]}
                  onChange={e => handleFieldChange("plugins", p.id, e.target.checked)}
                  aria-checked={!!pluginStates[p.id]}
                  aria-label={`Enable ${p.name}`}
                  style={{ width: 18, height: 18, marginRight: 4 }}
                />
                <span style={{
                  fontSize: 13.9, color: pluginStates[p.id] ? "#51b57f" : "#b0b4ba"
                }}>{pluginStates[p.id] ? "Enabled" : "Disabled"}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // Render API Key forms
  function renderApiKeysSection() {
    return (
      <section aria-label="API Keys" style={{
        background: "linear-gradient(94deg,#292b33 80%,#252934 110%)",
        borderRadius: 10,
        padding: "15px 17px 10px 17px",
        marginBottom: 16,
        boxShadow: "0 1.5px 12px -4px #ff980021"
      }}>
        <SectionDivider icon="🔑"
          title="API Keys"
          desc="Store and manage keys for premium integrations. AES encrypted when possible (Electron)." />
        <form
          aria-label="API Keys Form"
          autoComplete="off"
          onSubmit={handleSave}
          style={{ margin: 0, display: "flex", flexDirection: "column", gap: 17 }}>
          {[
            { id: "openai", label: "OpenAI Key", type: "password", placeholder: "sk-...", autocomplete: "off" },
            { id: "shodan", label: "Shodan API Key", type: "password", placeholder: "shodan-api-key", autocomplete: "off" },
            { id: "github", label: "GitHub Token", type: "password", placeholder: "ghp_...", autocomplete: "off" }
          ].map(f => (
            <label key={f.id} style={{
              fontWeight: 700, color: "#ffad42", fontSize: 14
            }}>
              {f.label}
              <input
                type={f.type}
                name={f.id}
                autoComplete={f.autocomplete}
                spellCheck={false}
                value={apiKeys[f.id]}
                aria-label={f.label}
                aria-required="false"
                aria-invalid={fieldErrors[f.id] ? "true" : "false"}
                aria-describedby={fieldErrors[f.id] ? f.id + "-error" : undefined}
                placeholder={f.placeholder}
                maxLength={128}
                style={{
                  marginLeft: 12,
                  marginTop: 4,
                  fontSize: 15,
                  background: "#222229",
                  color: "#e7d196",
                  border: fieldErrors[f.id] ? "2px solid #ff5964" : "1.2px solid var(--border-color)",
                  borderRadius: 6.5,
                  padding: "9px 16px"
                }}
                onChange={e => handleFieldChange("apiKeys", f.id, e.target.value)}
              />
              {fieldErrors[f.id] && (
                <span id={f.id + "-error"} aria-live="assertive"
                  style={{ color: "#ff5a7e", fontWeight: 600, marginLeft: 14, fontSize: 12.9 }}>
                  {fieldErrors[f.id]}
                </span>
              )}
            </label>
          ))}
        </form>
      </section>
    );
  }

  // Render Proxy section
  function renderProxySection() {
    return (
      <section aria-label="Proxy Settings" style={{
        background: "linear-gradient(92deg,#182c28 70%,#2c2328 125%)",
        borderRadius: 10,
        padding: "15px 17px 12px 17px",
        marginBottom: 12,
        boxShadow: "0 1.5px 13px -5px #41b57223"
      }}>
        <SectionDivider icon="🌐"
          title="Proxy Configuration"
          desc="Configure a system- or app-level HTTP(S) or SOCKS5 proxy (for scans, API, or browser traffic)." />
        <label style={{
          fontWeight: 700, color: "#79ffd2", fontSize: 14.3
        }}>
          Proxy (optional)
          <input
            type="text"
            name="proxy"
            spellCheck={false}
            autoComplete="off"
            value={proxy}
            aria-label="Proxy config"
            aria-required="false"
            aria-invalid={fieldErrors.proxy ? "true" : "false"}
            aria-describedby={fieldErrors.proxy ? "proxy-error" : undefined}
            placeholder="e.g. http://127.0.0.1:8080"
            maxLength={130}
            style={{
              marginLeft: 12,
              marginTop: 4,
              fontSize: 15,
              background: "#191c22",
              color: "#b8eb9b",
              border: fieldErrors.proxy ? "2px solid #ff5d74" : "1.2px solid var(--border-color)",
              borderRadius: 6.5,
              padding: "9px 16px",
              minWidth: 222
            }}
            onChange={e => handleFieldChange("proxy", "proxy", e.target.value)}
          />
          {fieldErrors.proxy && (
            <span id="proxy-error" aria-live="assertive"
              style={{ color: "#ff5a7e", fontWeight: 600, marginLeft: 14, fontSize: 12.7 }}>
              {fieldErrors.proxy}
            </span>
          )}
        </label>
      </section>
    );
  }

  // Main premium UI
  return (
    <main
      ref={mainRef}
      tabIndex={0}
      aria-label="Settings and Plugin Manager"
      style={{
        maxWidth: 640,
        margin: "0 auto",
        color: "var(--text-color)",
        padding: "34px 0",
        outline: "none",
        fontFamily: "var(--font-main)",
      }}
      role="region"
    >
      <AriaLive />

      <header style={{
        display: "flex", alignItems: "center", gap: 18,
        marginBottom: 30
      }}>
        <span aria-hidden="true"
          style={{
            fontSize: 31,
            background: "linear-gradient(88deg,#ffad42,#ff9800 80%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontWeight: 900,
            marginRight: 10,
            textShadow: "0 2.8px 18px rgba(255,168,32,0.18)"
          }}>⚙️</span>
        <h1 style={{
          margin: 0,
          fontSize: 27,
          letterSpacing: ".011em",
          color: "var(--base-light)",
          fontWeight: 800
        }}>
          Settings & Integration
        </h1>
        <span style={{
          fontSize: 14, color: "#daa84b",
          background: "rgba(255,168,64,0.09)",
          borderRadius: 13, padding: "3px 13px",
          marginLeft: 11, fontWeight: 700,
          boxShadow: "0 1.5px 7px #ffb84b10",
          letterSpacing: ".07em",
          border: "1.4px solid rgba(255,184,72,0.13)"
        }}>
          PREMIUM
        </span>
      </header>

      {loading ? (
        <div style={{
          color: "#ffad42",
          fontWeight: 700,
          fontSize: 20,
          marginTop: 37,
          display: "flex", alignItems: "center", gap: 12
        }}>
          <span aria-hidden="true"
            style={{
              fontSize: 25,
              marginRight: 10,
              animation: "spin-emoji 1.25s linear infinite"
            }}>✨<span role="img" aria-label="loading" style={{ marginLeft: 2 }}>⏳</span></span>
          Loading settings ...
          <style>{`
            @keyframes spin-emoji { 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      ) : (
        <section style={{
          background: "var(--secondary)",
          borderRadius: 15,
          padding: "18px 0 31px 0",
          boxShadow: "0 3px 18px 1px rgba(31,36,58,0.11)"
        }}>
          {errMsg && (
            <div
              style={{
                background: "linear-gradient(89deg,#311b1f13,#ff596428 90%)",
                color: "#ff5964",
                fontWeight: 800,
                fontSize: 15.5,
                borderRadius: 7,
                padding: "8px 19px",
                margin: "0 0 19px 0",
                border: "1.8px solid #2c404b22"
              }}
              role="alert"
              aria-live="assertive"
            >{errMsg}</div>
          )}
          {successMsg && (
            <div
              style={{
                background: "linear-gradient(93deg,#51b57f16,#41b5721f 90%)",
                color: "#51b57f",
                fontWeight: 800,
                fontSize: 15.5,
                borderRadius: 7,
                padding: "8px 15px",
                margin: "0 0 22px 0",
                border: "1.8px solid #41b57229"
              }}
              role="status"
              aria-live="polite"
            >{successMsg}</div>
          )}

          {/* API Keys */}
          {renderApiKeysSection()}

          {/* Proxy Config */}
          {renderProxySection()}

          {/* Plugins */}
          {renderPluginsSection()}

          {/* Save/Reset */}
          <form aria-label="Save Settings" onSubmit={handleSave}
            style={{ marginTop: 28, display: "flex", gap: 19, alignItems: "center", justifyContent: "flex-start" }}>
            <button
              className="btn btn-large"
              type="submit"
              disabled={saving || loading}
              aria-label="Save settings"
              style={{
                background: "linear-gradient(91deg,#ff9800,#ffad42)",
                color: "#23272e",
                fontWeight: 800,
                fontSize: 16.2,
                borderRadius: 6,
                minWidth: 104
              }}>
              {saving ? "Saving..." : "💾 Save"}
            </button>
            <button
              type="button"
              className="btn"
              aria-label="Reset settings"
              disabled={loading || saving}
              style={{
                background: "linear-gradient(90deg,#292c38,#191c22)",
                color: "#d39c3c",
                fontWeight: 700,
                fontSize: 15.5,
                marginLeft: 12
              }}
              onClick={async () => {
                setLoading(true);
                setErrMsg("");
                setSuccessMsg("");
                try {
                  const s = await loadSettings();
                  setApiKeys({
                    openai: s.apiKeys?.openai || "",
                    shodan: s.apiKeys?.shodan || "",
                    github: s.apiKeys?.github || ""
                  });
                  setProxy(s.proxy || "");
                  setPluginStates(
                    s.plugins ?
                      { ...Object.fromEntries(KNOWN_PLUGINS.map(p => [p.id, false])), ...s.plugins }
                      : Object.fromEntries(KNOWN_PLUGINS.map(p => [p.id, !!p.defaultEnabled]))
                  );
                  setFieldErrors({});
                } catch {
                  setErrMsg("Failed to reload settings.");
                } finally {
                  setLoading(false);
                  setTimeout(() => mainRef.current && mainRef.current.focus(), 250);
                }
              }}
            >↻ Reset</button>
          </form>
        </section>
      )}

      {/* Accessible footer */}
      <footer style={{
        fontSize: 12.2, color: "var(--text-tertiary)",
        marginTop: 38, textAlign: "center"
      }}>
        All data is stored locally and never sent externally. API keys are encrypted via Electron IPC when available (see docs for details).
      </footer>
    </main>
  );
}

export default SettingsModule;
