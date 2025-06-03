const theme = {
  colors: {
    // True Black/OLED-Optimized Foundation
    baseBlack: "#000000",             // Absolute black for backgrounds
    baseDark: "#101114",              // Main dark bg (slightly lifted for content)
    baseDarker: "#0b0c0f",            // Even deeper blacks for modal/outer bg
    baseDeep: "#16171a",              // Subtle elevation bg (cards/surfaces)
    sidebarDark: "#111215",           // Sidebar/nav exclusive - distinct from content dark
    secondary: "#16171b",             // Secondary/differentiated content regions
    elevated: "#22242a",              // Popup, modal, card
    contrast: "#23242c",              // Border, lines, hover overlays

    // Premium Accents
    accentPrimary: "#ff9800",           // Main accent - gold/orange
    accentPrimaryFg: "#191a1f",         // Text on accent background
    accentLight: "#ffad42",             // Active/hover accent
    accentBlue: "#53d0f9",              // Digital blue accent (feedback, highlight)
    accentPurple: "#b590ff",            // Premium purple (graph, figure, selection)
    accentGreen: "#56ef9b",             // Success/positive
    accentRed: "#ff6c7c",               // Errors/danger
    accentYellow: "#ffe88c",            // Warning/attention

    // Typography
    text: "#fafbfc",                  // Pure off-white for max contrast
    textSecondary: "#bbbbd3",         // Less prominent UI text
    textTertiary: "#60606b",          // Further-muted, placeholders, disabled
    textOnAccent: "#191a1f",          // Very dark text on orange/yellow bg

    // Border & Shadows
    border: "rgba(255,255,255,0.07)",
    shadowElevate: "0 7px 32px -13px rgba(0,0,0,0.82)",
    shadowCard: "0 2px 18px -7px rgba(0,0,0,0.24)",
    focusRing: "#ffb85c",

    // Overlay and Effects
    glassOverlay: "linear-gradient(90deg,rgba(13,14,18,0.92) 44%,rgba(21,22,29,0.82) 100%)",
    boxShadowMain: "0 8px 38px -10px #000a",
  },
  font: {
    main: "'Inter', 'Roboto', 'Helvetica Neue', 'Segoe UI', Arial, sans-serif",
    code: "'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', monospace"
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "56px"
  },
  borderRadius: {
    base: "10px",
    card: "14px",
    modal: "18px",
    button: "7px"
  },
  gradients: {
    orange: "linear-gradient(90deg,#ff9800,#ffad42)",
    blue: "linear-gradient(90deg,#53d0f9,#b590ff)",
    green: "linear-gradient(90deg,#56ef9b,#99ffee)",
    glass: "linear-gradient(90deg,rgba(17,19,22,0.91) 41%,rgba(18,20,24,0.81) 100%)"
  }
};

export default theme;
