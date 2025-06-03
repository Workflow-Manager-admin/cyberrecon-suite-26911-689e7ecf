const theme = {
  colors: {
    // Foundational — Modern dark mode with max readability
    baseBlack: "#000000",    // True black for OLED
    baseDark: "#181920",     // Core surface dark
    baseDarker: "#0b0c0f",
    baseDeep: "#1a1a1a",
    sidebarDark: "#16171b",  // Exclusive for navigation
    secondary: "#22242a",    // Used for content background, cards
    elevated: "#23242c",
    contrast: "#28292e",

    // Premium Brand Accents
    accentPrimary: "#ff9800",    // Orange brand
    accentPrimaryFg: "#191a1f",  // On accent text
    accentLight: "#ffba67",      // Lighter/orange
    accentBlue: "#53d0f9",
    accentPurple: "#b590ff",
    accentGreen: "#56ef9b",
    accentRed: "#ff6c7c",
    accentYellow: "#ffe88c",

    // Typography
    text: "#fafbfc",
    textSecondary: "#bbbbd3",
    textTertiary: "#767581",
    textOnAccent: "#191a1f",

    // Focus/Border/Shadow
    border: "rgba(255,255,255,0.07)",
    focusRing: "#ffb85c",
    shadowElevate: "0 7px 32px -13px rgba(0,0,0,0.76)",
    shadowCard: "0 2px 18px -7px rgba(0,0,0,0.19)",
    boxShadowMain: "0 6px 32px -10px #0007",
    shadowSidebar: "4px 0 39px -12px #10101a, 0 0 16px 0 #1e180333, 2px 0 14px #ff98001a",

    // Overlay
    glassOverlay: "linear-gradient(94deg,rgba(17,19,22,0.97) 41%,rgba(18,20,24,0.86) 100%)"
  },
  font: {
    main: "'Inter', 'Roboto', 'Segoe UI', Arial, sans-serif",
    code: "'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', monospace"
  },
  spacing: {
    xxs: "2px",
    xs: "5px",
    sm: "10px",
    md: "16px",
    lg: "22px",
    xl: "30px",
    xxl: "58px"
  },
  borderRadius: {
    base: "10px",
    card: "13px",
    modal: "16px",
    button: "8px"
  },
  gradients: {
    orange: "linear-gradient(90deg,#ff9800,#ffad42)",
    blue: "linear-gradient(90deg,#53d0f9,#b590ff)",
    green: "linear-gradient(90deg,#56ef9b,#99ffee)",
    glass: "linear-gradient(94deg,rgba(17,19,22,0.91) 41%,rgba(18,20,24,0.81) 100%)"
  }
};

export default theme;
