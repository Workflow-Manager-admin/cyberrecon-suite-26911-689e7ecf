// PUBLIC_INTERFACE
/**
 * DummyModule: Premium welcome for inactive or upcoming modules.
 * Polished modern UI, matches Burp Suite-inspired dark theme, accessible.
 */
function DummyModule() {
  return (
    <section
      tabIndex={0}
      aria-label="Welcome | CyberRecon Suite"
      style={{
        height: "100%",
        minHeight: 300,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(97deg,#19191b 93%,#181923 100%)",
        borderRadius: 20,
        boxShadow: "0 10px 38px -12px #181d22a0, 0 5.5px 29px -13px #ffad4214",
        color: "var(--text-color)",
        padding: "48px 18vw 40px 18vw",
        margin: "0 auto"
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: 59,
          background: "linear-gradient(91deg,#ffad42 40%,#41b57f 120%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 3px 24px #191a1a24, 0 2px 14px #ffad421c"
        }}
      >
        🛰️
      </span>
      <h1
        style={{
          fontSize: 29,
          fontWeight: 900,
          letterSpacing: ".01em",
          margin: "18px 0 9px 0",
          color: "var(--base-light)"
        }}
      >
        Welcome to CyberRecon Suite
      </h1>
      <div
        style={{
          fontSize: 17,
          color: "var(--text-secondary)",
          marginBottom: 19,
          textAlign: "center",
          maxWidth: 540,
          lineHeight: 1.61
        }}
      >
        Select a module from the sidebar to get started.<br />
        Use <b>Recon</b>, <b>Scanner</b>, <b>Exploitation</b>, or other tools for cybersecurity tasks.<br />
        This workspace will display tool functionality as you explore.
      </div>
      <div
        aria-hidden="true"
        style={{
          fontSize: 14.7,
          color: "var(--text-tertiary)",
          marginTop: 5,
          opacity: 0.85,
        }}
      >
        <span role="img" aria-label="">🔒</span>
        &nbsp;All analysis runs 100% locally for privacy. No module loaded yet.
      </div>
    </section>
  );
}

export default DummyModule;
