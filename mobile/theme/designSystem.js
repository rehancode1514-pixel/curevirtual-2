import { Colors } from './color';

/**
 * CureVirtual Mobile Design System
 * Synchronized with the "State-of-the-Art" overhaul.
 */

export const COLORS = {
  ...Colors,
  
  // Neutral Scale
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',

  // Text
  textMain: Colors.onSurface,
  textSoft: '#333333',
  textMuted: '#666666',
  textPlaceholder: '#94a3b8',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  border: 'rgba(0, 0, 0, 0.1)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const TYPOGRAPHY = {
  // Font sizes
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  display: 32,

  // Weights
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  black: '900',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  premium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  }
};

export const COMPONENTS = {
  screen: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: RADIUS.base,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  input: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    fontSize: TYPOGRAPHY.md,
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: RADIUS.base,
    padding: SPACING.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  primaryButtonText: {
    color: Colors.onPrimary,
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.black,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: TYPOGRAPHY.xs,
    color: Colors.primary,
    fontWeight: TYPOGRAPHY.black,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
};

export default {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  SHADOWS,
  COMPONENTS,
};
