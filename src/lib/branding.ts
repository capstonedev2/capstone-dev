export const BRANDING_SETTING_KEY = 'system.themeBranding';
export const BRANDING_VERSION = 1;

export const BRANDING_COLOR_KEYS = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'sidebar',
  'navbar',
  'textPrimary',
  'textSecondary',
  'border',
  'success',
  'warning',
  'error',
  'info'
] as const;

export type BrandingColorKey = (typeof BRANDING_COLOR_KEYS)[number];

export type BrandingColors = Record<BrandingColorKey, string>;

export type BrandingAssets = {
  mainLogo: string;
  lightLogo: string;
  darkLogo: string;
  favicon: string;
  loginBackground: string;
};

export type BrandingDerivedColors = {
  hover: string;
  lightVariant: string;
  darkVariant: string;
  borderSuggestion: string;
  backgroundSuggestion: string;
};

export type BrandingSettings = {
  version: number;
  systemName: string;
  systemShortName: string;
  tagline: string;
  themePreset: string;
  colors: BrandingColors;
  derivedColors: BrandingDerivedColors;
  assets: BrandingAssets;
  updatedAt?: string;
};

export const SYSTEM_LOGO_SRC = '/System%20Logo/logo-transparent.png';

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  colors: BrandingColors;
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type HslColor = {
  h: number;
  s: number;
  l: number;
};

const DEFAULT_COLORS: BrandingColors = {
  primary: '#003A8F',
  secondary: '#1E40AF',
  accent: '#F6BE00',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  sidebar: '#0F3B82',
  navbar: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#64748B',
  border: '#E5E7EB',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#2563EB'
};

const DEFAULT_ASSETS: BrandingAssets = {
  mainLogo: SYSTEM_LOGO_SRC,
  lightLogo: SYSTEM_LOGO_SRC,
  darkLogo: SYSTEM_LOGO_SRC,
  favicon: SYSTEM_LOGO_SRC,
  loginBackground: ''
};

const FALLBACK_DERIVED_COLORS: BrandingDerivedColors = {
  hover: '#002C6B',
  lightVariant: '#DBEAFE',
  darkVariant: '#1A1851',
  borderSuggestion: '#BFDBFE',
  backgroundSuggestion: '#EFF6FF'
};

export const DEFAULT_BRANDING: BrandingSettings = {
  version: BRANDING_VERSION,
  systemName: 'Thesis Track',
  systemShortName: 'TT',
  tagline: 'Inventory, progress monitoring, and technology transfer system.',
  themePreset: 'academic-blue',
  colors: DEFAULT_COLORS,
  derivedColors: FALLBACK_DERIVED_COLORS,
  assets: DEFAULT_ASSETS
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'academic-blue',
    name: 'Academic Blue',
    description: 'Formal blue identity for university research offices.',
    colors: DEFAULT_COLORS
  },
  {
    id: 'university-gold',
    name: 'University Gold',
    description: 'Warm gold-led palette with high-contrast institutional accents.',
    colors: {
      primary: '#7C4A00',
      secondary: '#A16207',
      accent: '#F6BE00',
      background: '#FFFBEB',
      surface: '#FFFFFF',
      sidebar: '#3F2A00',
      navbar: '#FFFFFF',
      textPrimary: '#1F2937',
      textSecondary: '#6B5B28',
      border: '#FDE68A',
      success: '#15803D',
      warning: '#D97706',
      error: '#DC2626',
      info: '#2563EB'
    }
  },
  {
    id: 'maroon-institution',
    name: 'Maroon Institution',
    description: 'Deep maroon theme for traditional institutional branding.',
    colors: {
      primary: '#7F1D1D',
      secondary: '#991B1B',
      accent: '#F59E0B',
      background: '#FFF7ED',
      surface: '#FFFFFF',
      sidebar: '#450A0A',
      navbar: '#FFFFFF',
      textPrimary: '#1F2937',
      textSecondary: '#6B5560',
      border: '#FECACA',
      success: '#15803D',
      warning: '#D97706',
      error: '#B91C1C',
      info: '#1D4ED8'
    }
  },
  {
    id: 'green-research',
    name: 'Green Research',
    description: 'Research and innovation palette with calm green foundations.',
    colors: {
      primary: '#047857',
      secondary: '#065F46',
      accent: '#14B8A6',
      background: '#F0FDFA',
      surface: '#FFFFFF',
      sidebar: '#064E3B',
      navbar: '#FFFFFF',
      textPrimary: '#10231E',
      textSecondary: '#4B635B',
      border: '#99F6E4',
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      info: '#2563EB'
    }
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Quiet white interface with restrained blue actions.',
    colors: {
      primary: '#111827',
      secondary: '#475569',
      accent: '#2563EB',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      sidebar: '#111827',
      navbar: '#FFFFFF',
      textPrimary: '#111827',
      textSecondary: '#64748B',
      border: '#E5E7EB',
      success: '#16A34A',
      warning: '#F59E0B',
      error: '#DC2626',
      info: '#2563EB'
    }
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Dark operational dashboard with readable surfaces.',
    colors: {
      primary: '#2563EB',
      secondary: '#38BDF8',
      accent: '#FACC15',
      background: '#0F172A',
      surface: '#111827',
      sidebar: '#020617',
      navbar: '#111827',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      border: '#334155',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#F87171',
      info: '#60A5FA'
    }
  }
];

export const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
  slate: '#334155',
  navy: '#0F172A',
  blue: '#2563EB',
  'academic blue': '#003A8F',
  'royal blue': '#1D4ED8',
  sky: '#0284C7',
  teal: '#0F766E',
  green: '#16A34A',
  emerald: '#047857',
  'research green': '#047857',
  gold: '#F6BE00',
  amber: '#F59E0B',
  orange: '#EA580C',
  maroon: '#7F1D1D',
  crimson: '#DC2626',
  red: '#DC2626',
  danger: '#DC2626',
  purple: '#7C3AED',
  violet: '#6D28D9',
  indigo: '#4338CA',
  gray: '#6B7280',
  zinc: '#71717A',
  border: '#E5E7EB',
  background: '#F8FAFC',
  surface: '#FFFFFF'
};

function clamp(value: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, value));
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function normalizeHue(value: number) {
  return ((value % 360) + 360) % 360;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeHexColor(value: unknown, fallback = '#000000') {
  const raw = String(value ?? '').trim();
  const shortMatch = raw.match(/^#?([0-9a-fA-F]{3})$/);
  const longMatch = raw.match(/^#?([0-9a-fA-F]{6})$/);

  if (longMatch) {
    return `#${longMatch[1].toUpperCase()}`;
  }

  if (shortMatch) {
    return `#${shortMatch[1]
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
      .toUpperCase()}`;
  }

  return fallback;
}

function hexToRgb(value: string): RgbColor {
  const normalized = normalizeHexColor(value, '#000000').slice(1);
  const numberValue = Number.parseInt(normalized, 16);

  return {
    r: (numberValue >> 16) & 255,
    g: (numberValue >> 8) & 255,
    b: numberValue & 255
  };
}

export function rgbToHex({ r, g, b }: RgbColor) {
  return `#${[r, g, b]
    .map((part) => clamp(Math.round(part)).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: lightness * 100 };
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return {
    h: hue * 60,
    s: saturation * 100,
    l: lightness * 100
  };
}

function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hue = normalizeHue(h) / 360;
  const saturation = clampPercent(s) / 100;
  const lightness = clampPercent(l) / 100;

  if (saturation === 0) {
    const channel = lightness * 255;
    return { r: channel, g: channel, b: channel };
  }

  const hueToRgb = (p: number, q: number, tValue: number) => {
    let t = tValue;

    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    r: hueToRgb(p, q, hue + 1 / 3) * 255,
    g: hueToRgb(p, q, hue) * 255,
    b: hueToRgb(p, q, hue - 1 / 3) * 255
  };
}

export function getRgbInputValue(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

export function getHslInputValue(hex: string) {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  return `${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%`;
}

export function parseColorValue(value: unknown, fallback?: string) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return fallback;
  }

  const namedColor = NAMED_COLORS[raw.toLowerCase()];

  if (namedColor) {
    return namedColor;
  }

  const normalizedHex = normalizeHexColor(raw, '');

  if (normalizedHex) {
    return normalizedHex;
  }

  const rgbMatch = raw.match(/^rgba?\(([^)]+)\)$/i) || raw.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);

  if (rgbMatch) {
    const parts = (rgbMatch[1] ?? raw)
      .split(',')
      .slice(0, 3)
      .map((part) => Number.parseFloat(part.trim()));

    if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
      return rgbToHex({ r: parts[0], g: parts[1], b: parts[2] });
    }
  }

  const hslMatch = raw.match(/^hsla?\(([^)]+)\)$/i) || raw.match(/^(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%$/);

  if (hslMatch) {
    const parts = (hslMatch[1] ?? raw)
      .split(',')
      .slice(0, 3)
      .map((part) => Number.parseFloat(part.trim().replace('%', '')));

    if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
      return rgbToHex(hslToRgb({ h: parts[0], s: parts[1], l: parts[2] }));
    }
  }

  return fallback;
}

export function mixColors(fromHex: string, toHex: string, weight = 0.5) {
  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);
  const normalizedWeight = Math.min(1, Math.max(0, weight));

  return rgbToHex({
    r: from.r * (1 - normalizedWeight) + to.r * normalizedWeight,
    g: from.g * (1 - normalizedWeight) + to.g * normalizedWeight,
    b: from.b * (1 - normalizedWeight) + to.b * normalizedWeight
  });
}

export function adjustColor(
  hex: string,
  adjustment: Partial<{
    hue: number;
    saturation: number;
    lightness: number;
  }>
) {
  const hsl = rgbToHsl(hexToRgb(hex));

  return rgbToHex(
    hslToRgb({
      h: normalizeHue(hsl.h + (adjustment.hue ?? 0)),
      s: clampPercent(hsl.s + (adjustment.saturation ?? 0)),
      l: clampPercent(hsl.l + (adjustment.lightness ?? 0))
    })
  );
}

export function deriveColorsFromPrimary(primaryInput: string): BrandingDerivedColors {
  const primary = normalizeHexColor(primaryInput, DEFAULT_COLORS.primary);

  return {
    hover: adjustColor(primary, { lightness: -8 }),
    lightVariant: mixColors(primary, '#FFFFFF', 0.82),
    darkVariant: adjustColor(primary, { lightness: -22 }),
    borderSuggestion: mixColors(primary, '#FFFFFF', 0.72),
    backgroundSuggestion: mixColors(primary, '#FFFFFF', 0.93)
  };
}

export function generateThemeFromPrimary(primaryInput: string, currentColors: BrandingColors = DEFAULT_COLORS): {
  colors: BrandingColors;
  derivedColors: BrandingDerivedColors;
} {
  const primary = normalizeHexColor(primaryInput, DEFAULT_COLORS.primary);
  const derivedColors = deriveColorsFromPrimary(primary);

  return {
    colors: {
      ...currentColors,
      primary,
      secondary: adjustColor(primary, { hue: 8, saturation: 4, lightness: 12 }),
      accent: adjustColor(primary, { hue: 42, saturation: 18, lightness: 22 }),
      background: derivedColors.backgroundSuggestion,
      surface: '#FFFFFF',
      sidebar: derivedColors.darkVariant,
      navbar: '#FFFFFF',
      border: derivedColors.borderSuggestion
    },
    derivedColors
  };
}

export function createBrandingFromPreset(presetId: string, current: BrandingSettings = DEFAULT_BRANDING) {
  const preset = THEME_PRESETS.find((item) => item.id === presetId) ?? THEME_PRESETS[0];

  return {
    ...current,
    themePreset: preset.id,
    colors: { ...preset.colors },
    derivedColors: deriveColorsFromPrimary(preset.colors.primary)
  };
}

export function sanitizeBrandingSettings(value: unknown): BrandingSettings {
  if (!isRecord(value)) {
    return cloneBranding(DEFAULT_BRANDING);
  }

  const colorValue = isRecord(value.colors) ? value.colors : {};
  const assetValue = isRecord(value.assets) ? value.assets : {};
  const derivedValue = isRecord(value.derivedColors) ? value.derivedColors : {};
  const colors = BRANDING_COLOR_KEYS.reduce((nextColors, key) => {
    nextColors[key] = normalizeHexColor(colorValue[key], DEFAULT_BRANDING.colors[key]);
    return nextColors;
  }, {} as BrandingColors);
  const generatedDerived = deriveColorsFromPrimary(colors.primary);
  const derivedColors: BrandingDerivedColors = {
    hover: normalizeHexColor(derivedValue.hover, generatedDerived.hover),
    lightVariant: normalizeHexColor(derivedValue.lightVariant, generatedDerived.lightVariant),
    darkVariant: normalizeHexColor(derivedValue.darkVariant, generatedDerived.darkVariant),
    borderSuggestion: normalizeHexColor(derivedValue.borderSuggestion, generatedDerived.borderSuggestion),
    backgroundSuggestion: normalizeHexColor(derivedValue.backgroundSuggestion, generatedDerived.backgroundSuggestion)
  };
  const assets: BrandingAssets = {
    mainLogo: String(assetValue.mainLogo ?? ''),
    lightLogo: String(assetValue.lightLogo ?? ''),
    darkLogo: String(assetValue.darkLogo ?? ''),
    favicon: String(assetValue.favicon ?? ''),
    loginBackground: String(assetValue.loginBackground ?? '')
  };

  return {
    version: BRANDING_VERSION,
    systemName: String(value.systemName ?? DEFAULT_BRANDING.systemName).trim() || DEFAULT_BRANDING.systemName,
    systemShortName: String(value.systemShortName ?? DEFAULT_BRANDING.systemShortName).trim() || DEFAULT_BRANDING.systemShortName,
    tagline: String(value.tagline ?? DEFAULT_BRANDING.tagline).trim() || DEFAULT_BRANDING.tagline,
    themePreset: String(value.themePreset ?? DEFAULT_BRANDING.themePreset).trim() || DEFAULT_BRANDING.themePreset,
    colors,
    derivedColors,
    assets,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : undefined
  };
}

export function cloneBranding(value: BrandingSettings) {
  return {
    ...value,
    colors: { ...value.colors },
    derivedColors: { ...value.derivedColors },
    assets: { ...value.assets }
  };
}

export function getCssVariableMap(brandingInput: BrandingSettings) {
  const branding = sanitizeBrandingSettings(brandingInput);
  const { colors, derivedColors } = branding;

  return {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
    '--color-background': colors.background,
    '--color-surface': colors.surface,
    '--color-sidebar': colors.sidebar,
    '--color-navbar': colors.navbar,
    '--color-text-primary': colors.textPrimary,
    '--color-text-secondary': colors.textSecondary,
    '--color-border': colors.border,
    '--color-success': colors.success,
    '--color-warning': colors.warning,
    '--color-error': colors.error,
    '--color-info': colors.info,
    '--color-primary-hover': derivedColors.hover,
    '--color-primary-light': derivedColors.lightVariant,
    '--color-primary-dark': derivedColors.darkVariant,
    '--color-border-suggestion': derivedColors.borderSuggestion,
    '--color-background-suggestion': derivedColors.backgroundSuggestion,
    '--primary': colors.primary,
    '--secondary': colors.secondary,
    '--accent': colors.accent,
    '--bg': colors.background,
    '--panel': colors.surface,
    '--text': colors.textPrimary,
    '--muted': colors.textSecondary,
    '--border': colors.border,
    '--success': colors.success,
    '--warning': colors.warning,
    '--danger': colors.error,
    '--info': colors.info,
    '--primary-light': derivedColors.lightVariant,
    '--primary-dark': derivedColors.darkVariant,
    '--hover': derivedColors.hover,
    '--surface-sunken': derivedColors.backgroundSuggestion
  };
}

function getLinearChannel(value: number) {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  return (0.2126 * getLinearChannel(r)) + (0.7152 * getLinearChannel(g)) + (0.0722 * getLinearChannel(b));
}

export function getContrastRatio(foreground: string, background: string) {
  const first = getRelativeLuminance(foreground);
  const second = getRelativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getContrastStatus(ratio: number) {
  if (ratio >= 4.5) {
    return 'Good Contrast';
  }

  if (ratio >= 3) {
    return 'Low Contrast';
  }

  return 'Needs Improvement';
}
