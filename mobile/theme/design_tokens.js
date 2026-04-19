/**
 * CureVirtual Mobile Design Tokens
 * Synchronized with the Web "State-of-the-Art" Overhaul
 */

export const Colors = {
  primary: "#006c0a", // Deep Green
  onPrimary: "#ffffff",
  primaryContainer: "#99f894",
  onPrimaryContainer: "#002201",

  secondary: "#0054cc", // Royal Blue
  onSecondary: "#ffffff",
  secondaryContainer: "#d8e2ff",
  onSecondaryContainer: "#001a41",

  tertiary: "#386567",
  onTertiary: "#ffffff",
  tertiaryContainer: "#bcebed",
  onTertiaryContainer: "#002021",

  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  onErrorContainer: "#410002",

  outline: "#72796f",
  outlineVariant: "#c2c9bd",

  surface: "#f7fbf1",
  onSurface: "#191d17",
  surfaceVariant: "#dee5d8",
  onSurfaceVariant: "#42493f",
  
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f1f5eb",
  surfaceContainer: "#ecf0e5",
  surfaceContainerHigh: "#e6ebe0",
  surfaceContainerHighest: "#e0e5da",
};

export const Typography = {
  headlines: {
    fontFamily: "Manrope",
    bold: "800",
    semiBold: "600",
  },
  body: {
    fontFamily: "Inter",
    regular: "400",
    medium: "500",
  },
  tracking: {
    tighter: -0.5,
    widest: 2,
  }
};

export const Layout = {
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  elevation: {
    low: 2,
    medium: 4,
    high: 8,
  }
};
