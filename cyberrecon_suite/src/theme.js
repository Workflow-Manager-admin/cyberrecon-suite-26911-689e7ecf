const theme = {
  colors: {
    // Base true-black theme
    baseDark: "#101114",          // True black/darkest
    baseDarker: "#0b0c0f",        // Even deeper blacks for backgrounds/sidebars
    baseDeep: "#16171a",          // Subtle elevation
    sidebarDark: "#15161b",       // Sidebar, nav
    secondary: "#191a1f",         // Card/surface backgrounds
    elevated: "#23242a",          // Alternate panel surfaces
    contrast: "#22242c",          // For borders/shadows
    baseLight: "#ff9800",         // Primary accent (orange/gold)
    baseAccent: "#ffad42",        // Lighter accent (hover, focus, graph)
    accentBlue: "#6ce9ff",        // Accent: blue (graph, tag, feedback)
    accentPurple: "#8d76ff",      // Accent: purple (graph, highlight)
    accentGreen: "#51b57f",       // Success, graph
    accentRed: "#ff5964",         // Danger, error
    accentYellow: "#ffc25c",      // Warning, contrast
    text: "#fafbfc",              // Default text (off-white)
    textSecondary: "#beb9b2",     // Subtle text
    textTertiary: "#76767a",      // Unfocused, muted text
    border: "rgba(255,255,255,0.06)", // Very low contrast for premium look
    focusRing: "#ffb85c",
    shadowElevate: "0 7px 42px -11px rgba(0,0,0,0.68)",
    shadowCard: "0 2px 24px -5px rgba(0,0,0,0.29)",
    overlay: "rgba(9,10,14,0.94)"
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
    modal: "16px",
    button: "7px"
  },
  // Extra for future design
  gradients: {
    orange: "linear-gradient(90deg,#ff9800,#ffad42)",
    green: "linear-gradient(90deg,#51b57f,#90ffa9)",
    blue: "linear-gradient(90deg,#6ce9ff,#8d76ff)",
    glass: "linear-gradient(90deg,rgba(28,29,39,0.94) 45%,rgba(28,29,44,0.82) 100%)"
  }
};

export default theme;
