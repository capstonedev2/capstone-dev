'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent
} from 'react';
import {
  clearBrandingPreview,
  publishBrandingPreview,
  publishBrandingUpdate,
  useBranding
} from '@/components/branding/branding-provider';
import {
  BRANDING_COLOR_KEYS,
  DEFAULT_BRANDING,
  NAMED_COLORS,
  THEME_PRESETS,
  adjustColor,
  cloneBranding,
  createBrandingFromPreset,
  generateThemeFromPrimary,
  getContrastRatio,
  getContrastStatus,
  getHslInputValue,
  getRgbInputValue,
  mixColors,
  normalizeHexColor,
  parseColorValue,
  sanitizeBrandingSettings,
  type BrandingAssets,
  type BrandingColorKey,
  type BrandingSettings
} from '@/lib/branding';
import { SystemAdminShell } from '@/components/system-admin/system-admin-shell';

type BrandingApiResponse = {
  success?: boolean;
  message?: string;
  branding?: unknown;
};

type BannerState = {
  tone: 'success' | 'warning' | 'info';
  title: string;
  body: string;
};

type BrandingAssetKey = keyof BrandingAssets;
type BrandingPreviewMode = 'dashboard' | 'login' | 'landing' | 'portal';

const COLOR_FIELDS: Array<{
  key: BrandingColorKey;
  label: string;
  description: string;
}> = [
  { key: 'primary', label: 'Primary Color', description: 'Main actions, active states, and key emphasis.' },
  { key: 'secondary', label: 'Secondary Color', description: 'Supporting actions and secondary navigation states.' },
  { key: 'accent', label: 'Accent Color', description: 'Highlights, focus details, and institution marks.' },
  { key: 'background', label: 'Background Color', description: 'Application page background.' },
  { key: 'surface', label: 'Surface/Card Color', description: 'Cards, panels, modals, and raised surfaces.' },
  { key: 'sidebar', label: 'Sidebar Color', description: 'Main role navigation background.' },
  { key: 'navbar', label: 'Navbar/Header Color', description: 'Top navigation and header surfaces.' },
  { key: 'textPrimary', label: 'Text Primary Color', description: 'Main text and headings.' },
  { key: 'textSecondary', label: 'Text Secondary Color', description: 'Muted copy, descriptions, and metadata.' },
  { key: 'border', label: 'Border Color', description: 'Dividers, input outlines, and table lines.' },
  { key: 'success', label: 'Success Color', description: 'Approved, saved, and completed states.' },
  { key: 'warning', label: 'Warning Color', description: 'Pending, due soon, and caution states.' },
  { key: 'error', label: 'Error/Danger Color', description: 'Rejected, failed, and destructive states.' },
  { key: 'info', label: 'Info Color', description: 'Informational notices and neutral status hints.' }
];

const ASSET_FIELDS: Array<{
  key: BrandingAssetKey;
  label: string;
  description: string;
  accept: string;
  maxBytes: number;
}> = [
  {
    key: 'mainLogo',
    label: 'Main Logo',
    description: 'Used in headers and standard light interfaces.',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml',
    maxBytes: 1_500_000
  },
  {
    key: 'lightLogo',
    label: 'Light Logo',
    description: 'Used over dark backgrounds such as the sidebar.',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml',
    maxBytes: 1_500_000
  },
  {
    key: 'darkLogo',
    label: 'Dark Logo',
    description: 'Used over white and pale surfaces.',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml',
    maxBytes: 1_500_000
  },
  {
    key: 'favicon',
    label: 'Favicon',
    description: 'Browser tab icon, preferably square.',
    accept: 'image/png,image/x-icon,image/svg+xml',
    maxBytes: 500_000
  },
  {
    key: 'loginBackground',
    label: 'Login Page Background',
    description: 'Authentication background image.',
    accept: 'image/png,image/jpeg,image/webp',
    maxBytes: 3_000_000
  }
];

const NAMED_COLOR_OPTIONS = Object.keys(NAMED_COLORS).sort((first, second) => first.localeCompare(second));
const SAVE_CONFIRMATION = 'Are you sure you want to apply this branding to the whole system?';
const PREVIEW_MODES: Array<{
  key: BrandingPreviewMode;
  label: string;
  icon: string;
}> = [
  { key: 'dashboard', label: 'Dashboard', icon: 'fa-table-columns' },
  { key: 'login', label: 'Login', icon: 'fa-right-to-bracket' },
  { key: 'landing', label: 'Landing', icon: 'fa-globe' },
  { key: 'portal', label: 'Role Portal', icon: 'fa-users-gear' }
];

function getSuggestedColors(value: string) {
  const normalized = normalizeHexColor(value, DEFAULT_BRANDING.colors.primary);
  const suggestions = [
    adjustColor(normalized, { lightness: 12 }),
    adjustColor(normalized, { lightness: -10 }),
    adjustColor(normalized, { hue: 28, saturation: 10, lightness: 8 }),
    mixColors(normalized, '#FFFFFF', 0.72),
    mixColors(normalized, '#000000', 0.18)
  ];

  return Array.from(new Set(suggestions));
}

function getContrastTone(status: string) {
  if (status === 'Good Contrast') return 'is-good';
  if (status === 'Low Contrast') return 'is-low';
  return 'is-poor';
}

function getAssetPreviewLabel(key: BrandingAssetKey) {
  if (key === 'favicon') return 'Icon';
  if (key === 'loginBackground') return 'Background';
  return 'Logo';
}

async function parseApiPayload<T>(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return null;
}

function ColorControl({
  colorKey,
  description,
  label,
  value,
  onChange
}: {
  colorKey: BrandingColorKey;
  description: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [hexInput, setHexInput] = useState(value);
  const [formatInput, setFormatInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const datalistId = `branding-color-names-${colorKey}`;

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const commitColor = (input: string) => {
    const parsed = parseColorValue(input);

    if (parsed) {
      onChange(parsed);
      setHexInput(parsed);
    }
  };

  const handleNamedColor = (input: string) => {
    setNameInput(input);
    const parsed = parseColorValue(input);

    if (parsed) {
      onChange(parsed);
      setNameInput('');
    }
  };

  const suggestions = getSuggestedColors(value);

  return (
    <div className="branding-color-control">
      <div className="branding-color-control-head">
        <div>
          <label htmlFor={`branding-${colorKey}-hex`}>{label}</label>
          <p>{description}</p>
        </div>
        <input
          aria-label={`${label} color picker`}
          className="branding-color-picker"
          type="color"
          value={value}
          onChange={(event) => onChange(normalizeHexColor(event.target.value, value))}
        />
      </div>

      <div className="branding-color-input-grid">
        <div className="form-field">
          <label htmlFor={`branding-${colorKey}-hex`}>HEX</label>
          <input
            id={`branding-${colorKey}-hex`}
            value={hexInput}
            onBlur={() => setHexInput(value)}
            onChange={(event) => {
              setHexInput(event.target.value);
              commitColor(event.target.value);
            }}
          />
        </div>
        <div className="form-field">
          <label htmlFor={`branding-${colorKey}-format`}>RGB/HSL Input</label>
          <input
            id={`branding-${colorKey}-format`}
            placeholder={`${getRgbInputValue(value)} or ${getHslInputValue(value)}`}
            value={formatInput}
            onBlur={() => setFormatInput('')}
            onChange={(event) => {
              setFormatInput(event.target.value);
              commitColor(event.target.value);
            }}
          />
        </div>
        <div className="form-field branding-color-name-field">
          <label htmlFor={`branding-${colorKey}-name`}>Search Color Name</label>
          <input
            id={`branding-${colorKey}-name`}
            list={datalistId}
            placeholder="blue, gold, maroon..."
            value={nameInput}
            onChange={(event) => handleNamedColor(event.target.value)}
          />
          <datalist id={datalistId}>
            {NAMED_COLOR_OPTIONS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="branding-color-suggestions" aria-label={`${label} suggested matching colors`}>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            aria-label={`Use ${suggestion}`}
            className="branding-color-swatch"
            title={suggestion}
            type="button"
            style={{ backgroundColor: suggestion }}
            onClick={() => onChange(suggestion)}
          >
            <span>{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AssetUploadControl({
  assetKey,
  description,
  label,
  accept,
  maxBytes,
  pendingFile,
  value,
  onChange,
  onFile,
  onReset,
  onWarning
}: {
  assetKey: BrandingAssetKey;
  description: string;
  label: string;
  accept: string;
  maxBytes: number;
  pendingFile?: File;
  value: string;
  onChange: (value: string) => void;
  onFile: (file: File, previewUrl: string) => void;
  onReset: () => void;
  onWarning: (message: string) => void;
}) {
  const inputId = `branding-asset-${assetKey}`;
  const isBackground = assetKey === 'loginBackground';

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      onWarning('Only image files can be used for branding assets.');
      event.target.value = '';
      return;
    }

    if (file.size > maxBytes) {
      onWarning(`${label} must be ${Math.round(maxBytes / 1_000_000)} MB or smaller.`);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onFile(file, reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className={`branding-asset-control ${isBackground ? 'is-wide' : ''}`}>
      <div className={`branding-asset-preview ${isBackground ? 'is-background' : ''}`}>
        {value ? (
          <img alt={`${label} preview`} src={value} />
        ) : (
          <span>
            <i className={`fas ${isBackground ? 'fa-image' : 'fa-building-columns'}`}></i>
            {getAssetPreviewLabel(assetKey)}
          </span>
        )}
      </div>
      <div className="branding-asset-copy">
        <strong>{label}</strong>
        <p>{description}</p>
        {pendingFile ? <small>Pending upload: {pendingFile.name}</small> : null}
      </div>
      <div className="branding-asset-actions">
        <label className="btn btn-outline small" htmlFor={inputId}>
          <i className="fas fa-upload"></i>
          Upload
        </label>
        <input id={inputId} accept={accept} hidden type="file" onChange={handleFileChange} />
        <button className="btn btn-outline small" type="button" onClick={onReset}>
          <i className="fas fa-rotate-left"></i>
          Reset
        </button>
      </div>
      <div className="form-field branding-asset-url">
        <label htmlFor={`${inputId}-url`}>Asset URL</label>
        <input
          id={`${inputId}-url`}
          placeholder="/logo.png or https://..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

function BrandMark({ branding, onDark = false }: { branding: BrandingSettings; onDark?: boolean }) {
  const logo = onDark
    ? branding.assets.lightLogo || branding.assets.mainLogo || branding.assets.darkLogo
    : branding.assets.mainLogo || branding.assets.darkLogo || branding.assets.lightLogo;

  return (
    <div className="branding-preview-brand">
      <span className="branding-preview-logo" aria-hidden="true">
        {logo ? <img alt="" src={logo} /> : branding.systemShortName.slice(0, 2).toUpperCase()}
      </span>
      <div>
        <strong>{branding.systemName}</strong>
        <small>{branding.tagline}</small>
      </div>
    </div>
  );
}

function LoginBrandingPreview({ branding }: { branding: BrandingSettings }) {
  const backgroundStyle = branding.assets.loginBackground ? {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.58), rgba(0, 58, 143, 0.28)), url("${branding.assets.loginBackground.replace(/"/g, '\\"')}")`
  } as CSSProperties : undefined;

  return (
    <div className="branding-preview-auth-screen" style={backgroundStyle}>
      <div className="branding-preview-auth-card">
        <BrandMark branding={branding} />
        <span className="branding-preview-auth-pill">
          <i className="fas fa-right-to-bracket"></i>
          Account Access
        </span>
        <h2>Welcome back</h2>
        <p>{branding.tagline}</p>
        <label>
          Student ID / Email
          <input readOnly value="user@university.edu.ph" />
        </label>
        <label>
          Password
          <input readOnly type="password" value="password" />
        </label>
        <button type="button">Sign in</button>
      </div>
    </div>
  );
}

function LandingBrandingPreview({ branding }: { branding: BrandingSettings }) {
  return (
    <div className="branding-preview-landing-screen">
      <nav className="branding-preview-landing-nav">
        <BrandMark branding={branding} />
        <div>
          <span>Home</span>
          <span>Modules</span>
          <span>Workflow</span>
        </div>
        <button type="button">Login</button>
      </nav>
      <section className="branding-preview-landing-hero">
        <span>Institutional Research System</span>
        <h2>{branding.systemName}</h2>
        <p>{branding.tagline}</p>
        <div>
          <button type="button">Open Portal</button>
          <button className="is-outline" type="button">View Departments</button>
        </div>
      </section>
      <section className="branding-preview-landing-modules">
        {['Student Module', 'Adviser Module', 'Research Head'].map((item) => (
          <article key={item}>
            <i className="fas fa-layer-group"></i>
            <strong>{item}</strong>
            <p>Previewing public landing colors, cards, text, and actions.</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function RolePortalBrandingPreview({ branding }: { branding: BrandingSettings }) {
  return (
    <div className="branding-preview-portal-screen">
      <aside>
        <BrandMark branding={branding} onDark />
        {['Workspace', 'Submissions', 'Schedule', 'Feedback'].map((item, index) => (
          <span key={item} className={index === 0 ? 'is-active' : ''}>
            <i className={`fas ${index === 0 ? 'fa-gauge-high' : 'fa-circle'}`}></i>
            {item}
          </span>
        ))}
      </aside>
      <main>
        <header>
          <div>
            <strong>Student Workspace</strong>
            <p>{branding.systemName}</p>
          </div>
          <button type="button">Submit Progress</button>
        </header>
        <section>
          <article>
            <span>Current Milestone</span>
            <strong>Chapter 3 Review</strong>
            <p>Role portal preview for cards, badges, alerts, and forms.</p>
          </article>
          <article>
            <span>Status</span>
            <strong>On Track</strong>
            <p>Theme tokens are shared across every role workspace.</p>
          </article>
        </section>
        <div className="branding-preview-portal-alert">
          <i className="fas fa-circle-check"></i>
          Branding applies to role portal components after saving.
        </div>
      </main>
    </div>
  );
}

function ActualRouteBrandingPreview({ mode }: { mode: Exclude<BrandingPreviewMode, 'portal'> }) {
  const previewRouteByMode: Record<Exclude<BrandingPreviewMode, 'portal'>, string> = {
    dashboard: '/system-admin/dashboard?brandingPreview=1',
    login: '/login?brandingPreview=1',
    landing: '/?brandingPreview=1'
  };

  return (
    <iframe
      key={mode}
      className="branding-preview-route-frame"
      src={previewRouteByMode[mode]}
      title={`${mode} actual branding preview`}
    />
  );
}

function LiveSystemPreview({ branding, mode }: { branding: BrandingSettings; mode: BrandingPreviewMode }) {
  const { colors } = branding;
  const logoItems = [
    ['Main', branding.assets.mainLogo],
    ['Light', branding.assets.lightLogo],
    ['Dark', branding.assets.darkLogo],
    ['Favicon', branding.assets.favicon]
  ].filter(([, value]) => Boolean(value));
  const previewStyle = {
    '--preview-primary': colors.primary,
    '--preview-secondary': colors.secondary,
    '--preview-accent': colors.accent,
    '--preview-background': colors.background,
    '--preview-surface': colors.surface,
    '--preview-sidebar': colors.sidebar,
    '--preview-navbar': colors.navbar,
    '--preview-text-primary': colors.textPrimary,
    '--preview-text-secondary': colors.textSecondary,
    '--preview-border': colors.border,
    '--preview-success': colors.success,
    '--preview-warning': colors.warning,
    '--preview-error': colors.error,
    '--preview-info': colors.info
  } as CSSProperties;

  if (mode === 'portal') {
    return (
      <div className="branding-preview-frame is-single" style={previewStyle}>
        <RolePortalBrandingPreview branding={branding} />
      </div>
    );
  }

  if (mode === 'dashboard' || mode === 'login' || mode === 'landing') {
    return (
      <div className="branding-preview-frame is-route" style={previewStyle}>
        <ActualRouteBrandingPreview mode={mode} />
      </div>
    );
  }

  return (
    <div className="branding-preview-frame" style={previewStyle}>
      <aside className="branding-preview-sidebar">
        <BrandMark branding={branding} onDark />
        <nav>
          {[
            ['fa-gauge-high', 'Dashboard'],
            ['fa-folder-open', 'Projects'],
            ['fa-calendar-days', 'Schedule'],
            ['fa-file-shield', 'Reports']
          ].map(([icon, label], index) => (
            <span key={label} className={index === 0 ? 'is-active' : ''}>
              <i className={`fas ${icon}`}></i>
              {label}
            </span>
          ))}
        </nav>
      </aside>

      <main className="branding-preview-main">
        <header className="branding-preview-navbar">
          <BrandMark branding={branding} />
          <div className="branding-preview-user">
            <span>Super Admin</span>
            <i className="fas fa-user-shield"></i>
          </div>
        </header>

        <section className="branding-preview-content">
          <div className="branding-preview-alert">
            <i className="fas fa-circle-info"></i>
            <span>System branding preview is updating live.</span>
          </div>

          <section className="branding-preview-live-brand" aria-label="Live brand preview">
            <div className="branding-preview-live-brand-main">
              <span className="branding-preview-live-logo" aria-hidden="true">
                {branding.assets.mainLogo ? (
                  <img alt="" src={branding.assets.mainLogo} />
                ) : (
                  branding.systemShortName.slice(0, 2).toUpperCase()
                )}
              </span>
              <div>
                <span>Live Brand Preview</span>
                <strong>{branding.systemName}</strong>
                <p>{branding.tagline}</p>
              </div>
            </div>
            <div className="branding-preview-live-meta">
              <span>{branding.systemShortName}</span>
              {logoItems.length ? (
                <div className="branding-preview-logo-strip">
                  {logoItems.map(([label, value]) => (
                    <i key={label} title={`${label} logo`}>
                      <img alt="" src={value} />
                    </i>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <div className="branding-preview-toolbar">
            <button type="button">Primary Button</button>
            <button className="is-secondary" type="button">Secondary</button>
            <span className="branding-preview-badge">Active</span>
            <span className="branding-preview-badge is-warning">Pending</span>
          </div>

          <div className="branding-preview-grid">
            <article>
              <small>Total Projects</small>
              <strong>128</strong>
              <span className="branding-preview-status is-success">Approved</span>
            </article>
            <article>
              <small>For Review</small>
              <strong>24</strong>
              <span className="branding-preview-status is-info">In progress</span>
            </article>
          </div>

          <div className="branding-preview-form-card">
            <label>
              System Form
              <input readOnly value={branding.systemName} />
            </label>
            <label>
              Select Theme
              <select value={branding.themePreset} onChange={() => undefined}>
                <option>{branding.themePreset}</option>
              </select>
            </label>
          </div>

          <div className="branding-preview-table">
            <div className="branding-preview-table-row is-head">
              <span>User</span>
              <span>Status</span>
              <span>Role</span>
            </div>
            <div className="branding-preview-table-row">
              <span>Research Head</span>
              <span><b className="is-success">Active</b></span>
              <span>Oversight</span>
            </div>
            <div className="branding-preview-table-row">
              <span>Program Head</span>
              <span><b className="is-warning">Pending</b></span>
              <span>Academic</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export function SystemAdminBranding() {
  const { branding: activeBranding, setBranding } = useBranding();
  const [savedBranding, setSavedBranding] = useState<BrandingSettings>(() => sanitizeBrandingSettings(activeBranding));
  const [draft, setDraft] = useState<BrandingSettings>(() => sanitizeBrandingSettings(activeBranding));
  const [pendingFiles, setPendingFiles] = useState<Partial<Record<BrandingAssetKey, File>>>({});
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<BrandingPreviewMode>('dashboard');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const savedBrandingRef = useRef(savedBranding);

  useEffect(() => {
    savedBrandingRef.current = savedBranding;
  }, [savedBranding]);

  useEffect(() => {
    setBranding(draft);
    publishBrandingPreview(draft);
  }, [draft, setBranding]);

  useEffect(() => () => {
    clearBrandingPreview();
    setBranding(savedBrandingRef.current);
  }, [setBranding]);

  const loadBranding = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/branding', {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      const payload = await parseApiPayload<BrandingApiResponse>(response);

      if (!response.ok || !payload?.success || !payload.branding) {
        throw new Error(payload?.message || 'Unable to load branding settings.');
      }

      const loadedBranding = sanitizeBrandingSettings(payload.branding);

      setSavedBranding(loadedBranding);
      setDraft(loadedBranding);
      setBranding(loadedBranding);
      setBanner(null);
    } catch (error) {
      const fallbackBranding = sanitizeBrandingSettings(DEFAULT_BRANDING);

      setSavedBranding(fallbackBranding);
      setDraft(fallbackBranding);
      setBranding(fallbackBranding);
      setBanner({
        tone: 'warning',
        title: 'Using default branding',
        body: error instanceof Error && error.message ? error.message : 'Branding settings could not be loaded.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [setBranding]);

  useEffect(() => {
    void loadBranding();
  }, [loadBranding]);

  const updateDraft = (updater: (current: BrandingSettings) => BrandingSettings) => {
    setDraft((current) => sanitizeBrandingSettings(updater(cloneBranding(current))));
  };

  const updateIdentityField = (field: 'systemName' | 'systemShortName' | 'tagline', value: string) => {
    updateDraft((current) => ({
      ...current,
      [field]: value
    }));
  };

  const updateColor = (key: BrandingColorKey, value: string) => {
    updateDraft((current) => ({
      ...current,
      themePreset: key === 'primary' ? 'custom' : current.themePreset,
      colors: key === 'primary' ? generateThemeFromPrimary(value, current.colors).colors : {
        ...current.colors,
        [key]: normalizeHexColor(value, current.colors[key])
      },
      derivedColors: key === 'primary' ? generateThemeFromPrimary(value, current.colors).derivedColors : current.derivedColors
    }));
  };

  const updateAsset = (key: BrandingAssetKey, value: string) => {
    updateDraft((current) => ({
      ...current,
      assets: {
        ...current.assets,
        [key]: value
      }
    }));
    setPendingFiles((current) => {
      if (!current[key]) {
        return current;
      }

      const nextFiles = { ...current };
      delete nextFiles[key];
      return nextFiles;
    });
  };

  const handleAssetFile = (key: BrandingAssetKey, file: File, previewUrl: string) => {
    setPendingFiles((current) => ({
      ...current,
      [key]: file
    }));
    updateDraft((current) => ({
      ...current,
      assets: {
        ...current.assets,
        [key]: previewUrl
      }
    }));
  };

  const resetAsset = (key: BrandingAssetKey) => {
    updateAsset(key, DEFAULT_BRANDING.assets[key]);
  };

  const applyPreset = (presetId: string) => {
    updateDraft((current) => createBrandingFromPreset(presetId, current));
  };

  const autoGenerateTheme = () => {
    updateDraft((current) => {
      const generated = generateThemeFromPrimary(current.colors.primary, current.colors);

      return {
        ...current,
        themePreset: 'auto-generated',
        colors: generated.colors,
        derivedColors: generated.derivedColors
      };
    });
    setBanner({
      tone: 'info',
      title: 'Theme generated',
      body: 'Secondary, accent, hover, variants, border, and background suggestions were generated from the primary color.'
    });
  };

  const resetColorsOnly = () => {
    updateDraft((current) => ({
      ...current,
      themePreset: DEFAULT_BRANDING.themePreset,
      colors: { ...DEFAULT_BRANDING.colors },
      derivedColors: { ...DEFAULT_BRANDING.derivedColors }
    }));
    setBanner({
      tone: 'info',
      title: 'Colors reset',
      body: 'Default colors are in the preview. Save Branding to apply them system-wide.'
    });
  };

  const resetLogosOnly = () => {
    updateDraft((current) => ({
      ...current,
      assets: { ...DEFAULT_BRANDING.assets }
    }));
    setPendingFiles({});
    setBanner({
      tone: 'info',
      title: 'Logo assets reset',
      body: 'Logo and image fields are cleared in the preview. Save Branding to apply the reset.'
    });
  };

  const uploadPendingFiles = async (brandingInput: BrandingSettings) => {
    const nextBranding = cloneBranding(brandingInput);
    let usedInlineAssets = false;

    for (const key of Object.keys(pendingFiles) as BrandingAssetKey[]) {
      const file = pendingFiles[key];

      if (!file) {
        continue;
      }

      try {
        const formData = new FormData();
        formData.set('file', file);
        formData.set('folder', 'thesistrack/branding');
        formData.set('category', `Branding ${key}`);

        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
          credentials: 'same-origin'
        });
        const payload = await parseApiPayload<{
          success?: boolean;
          file?: {
            secureUrl?: string;
          };
          message?: string;
        }>(response);

        if (!response.ok || !payload?.success || !payload.file?.secureUrl) {
          throw new Error(payload?.message || 'Upload failed.');
        }

        nextBranding.assets[key] = payload.file.secureUrl;
      } catch {
        usedInlineAssets = true;
      }
    }

    return {
      branding: nextBranding,
      usedInlineAssets
    };
  };

  const saveBranding = async (brandingToSave = draft, successTitle = 'Branding saved') => {
    if (!window.confirm(SAVE_CONFIRMATION)) {
      return;
    }

    setIsSaving(true);

    try {
      const uploadResult = await uploadPendingFiles(brandingToSave);
      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          branding: uploadResult.branding
        })
      });
      const payload = await parseApiPayload<BrandingApiResponse>(response);

      if (!response.ok || !payload?.success || !payload.branding) {
        throw new Error(payload?.message || 'Unable to save branding settings.');
      }

      const saved = sanitizeBrandingSettings(payload.branding);

      setPendingFiles({});
      setSavedBranding(saved);
      setDraft(saved);
      setBranding(saved);
      publishBrandingUpdate(saved);
      setBanner({
        tone: uploadResult.usedInlineAssets ? 'warning' : 'success',
        title: successTitle,
        body: uploadResult.usedInlineAssets
          ? 'Branding was saved. Some selected images were stored inline because the upload service was unavailable.'
          : 'The selected branding is now stored in the database and applied through global CSS variables.'
      });
    } catch (error) {
      setBanner({
        tone: 'warning',
        title: 'Unable to save branding',
        body: error instanceof Error && error.message ? error.message : 'The server rejected this branding update.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const restoreDefaultBranding = async () => {
    if (!window.confirm(SAVE_CONFIRMATION)) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/branding', {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      const payload = await parseApiPayload<BrandingApiResponse>(response);

      if (!response.ok || !payload?.success || !payload.branding) {
        throw new Error(payload?.message || 'Unable to restore default branding.');
      }

      const restoredBranding = sanitizeBrandingSettings(payload.branding);

      setPendingFiles({});
      setSavedBranding(restoredBranding);
      setDraft(restoredBranding);
      setBranding(restoredBranding);
      publishBrandingUpdate(restoredBranding);
      setBanner({
        tone: 'success',
        title: 'Default branding restored',
        body: 'The default institutional theme has been restored and saved.'
      });
    } catch (error) {
      setBanner({
        tone: 'warning',
        title: 'Unable to restore defaults',
        body: error instanceof Error && error.message ? error.message : 'The default branding could not be restored.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const exportThemeJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${draft.systemShortName || 'theme'}-branding.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const importThemeJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}')) as {
          branding?: unknown;
        };
        const importedBranding = sanitizeBrandingSettings(parsed.branding ?? parsed);

        setPendingFiles({});
        setDraft(importedBranding);
        setBanner({
          tone: 'success',
          title: 'Theme imported',
          body: 'Imported settings are loaded into the preview. Save Branding to apply them system-wide.'
        });
      } catch {
        setBanner({
          tone: 'warning',
          title: 'Invalid theme JSON',
          body: 'Choose a valid exported branding JSON file.'
        });
      }
    };

    reader.readAsText(file);
  };

  const contrastChecks = useMemo(() => {
    const { colors } = draft;
    const checks = [
      {
        label: 'Page text on background',
        ratio: getContrastRatio(colors.textPrimary, colors.background),
        detail: 'Main page content readability.'
      },
      {
        label: 'Card text on surface',
        ratio: getContrastRatio(colors.textPrimary, colors.surface),
        detail: 'Cards, forms, and table content.'
      },
      {
        label: 'Muted text on surface',
        ratio: getContrastRatio(colors.textSecondary, colors.surface),
        detail: 'Descriptions, metadata, and helper text.'
      },
      {
        label: 'Button text on primary',
        ratio: getContrastRatio('#FFFFFF', colors.primary),
        detail: 'Primary action button readability.'
      },
      {
        label: 'Sidebar text on sidebar',
        ratio: getContrastRatio('#FFFFFF', colors.sidebar),
        detail: 'Navigation readability.'
      },
      {
        label: 'Navbar text on navbar',
        ratio: getContrastRatio(colors.textPrimary, colors.navbar),
        detail: 'Top navigation readability.'
      }
    ];

    return checks.map((check) => ({
      ...check,
      status: getContrastStatus(check.ratio)
    }));
  }, [draft]);

  const accessibilityWarnings = contrastChecks.filter((check) => check.status !== 'Good Contrast');
  const pendingFileCount = Object.values(pendingFiles).filter(Boolean).length;
  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedBranding) || pendingFileCount > 0,
    [draft, pendingFileCount, savedBranding]
  );

  const primaryGenerated = generateThemeFromPrimary(draft.colors.primary, draft.colors);

  return (
    <SystemAdminShell
      activeNav="branding"
      title="Theme and Branding"
      description="Customize the system identity, institutional colors, logos, and global interface theme."
    >
      <div className="admin-page-stack branding-page">
        {banner ? (
          <section className={`admin-result-banner is-${banner.tone}`}>
            <div>
              <strong>{banner.title}</strong>
              <p>{banner.body}</p>
            </div>
            <button className="btn btn-outline small" type="button" onClick={() => setBanner(null)}>
              Dismiss
            </button>
          </section>
        ) : null}

        <section className="branding-status-strip" aria-live="polite">
          <div>
            <span className="admin-inline-badge">
              <i className="fas fa-database"></i>
              Database backed
            </span>
            <span className="admin-inline-badge">
              <i className="fas fa-code"></i>
              CSS variables
            </span>
            <span className="admin-inline-badge is-live">
              <i className="fas fa-eye"></i>
              Live preview active
            </span>
            <span className={`admin-inline-badge ${isDirty ? 'is-unsaved' : 'is-saved'}`}>
              <i className={`fas ${isDirty ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
              {isDirty ? 'Unsaved changes' : 'Saved'}
            </span>
          </div>
          <button className="btn btn-outline small" disabled={isLoading} type="button" onClick={() => void loadBranding()}>
            <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-rotate'}`}></i>
            Refresh
          </button>
        </section>

        <div className="branding-layout">
          <div className="branding-controls-column">
            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>System Name Settings</h3>
                  <p>Shown in the navbar, login context, browser title, and preview.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-form-grid">
                  <div className="form-field">
                    <label htmlFor="branding-system-name">System Name</label>
                    <input
                      id="branding-system-name"
                      value={draft.systemName}
                      onChange={(event) => updateIdentityField('systemName', event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-system-short-name">System Short Name</label>
                    <input
                      id="branding-system-short-name"
                      maxLength={12}
                      value={draft.systemShortName}
                      onChange={(event) => updateIdentityField('systemShortName', event.target.value)}
                    />
                  </div>
                  <div className="form-field branding-span-full">
                    <label htmlFor="branding-tagline">Tagline or Description</label>
                    <textarea
                      id="branding-tagline"
                      value={draft.tagline}
                      onChange={(event) => updateIdentityField('tagline', event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Logo Upload</h3>
                  <p>Main, light, dark, favicon, and login background assets.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="branding-asset-grid">
                  {ASSET_FIELDS.map((asset) => (
                    <AssetUploadControl
                      key={asset.key}
                      accept={asset.accept}
                      assetKey={asset.key}
                      description={asset.description}
                      label={asset.label}
                      maxBytes={asset.maxBytes}
                      pendingFile={pendingFiles[asset.key]}
                      value={draft.assets[asset.key]}
                      onChange={(value) => updateAsset(asset.key, value)}
                      onFile={(file, previewUrl) => handleAssetFile(asset.key, file, previewUrl)}
                      onReset={() => resetAsset(asset.key)}
                      onWarning={(message) => setBanner({
                        tone: 'warning',
                        title: 'Asset not accepted',
                        body: message
                      })}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Preset Themes</h3>
                  <p>Institution-ready palettes that can be customized after selection.</p>
                </div>
                <button className="btn btn-primary small" type="button" onClick={autoGenerateTheme}>
                  <i className="fas fa-wand-magic-sparkles"></i>
                  Auto Generate Theme
                </button>
              </div>
              <div className="admin-section-body">
                <div className="branding-preset-grid">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className={`branding-preset-option ${draft.themePreset === preset.id ? 'is-active' : ''}`}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                    >
                      <span className="branding-preset-swatches" aria-hidden="true">
                        <i style={{ backgroundColor: preset.colors.primary }}></i>
                        <i style={{ backgroundColor: preset.colors.secondary }}></i>
                        <i style={{ backgroundColor: preset.colors.accent }}></i>
                        <i style={{ backgroundColor: preset.colors.background }}></i>
                      </span>
                      <strong>{preset.name}</strong>
                      <small>{preset.description}</small>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Color Settings</h3>
                  <p>Each color supports picker, HEX, RGB/HSL, named search, and suggestions.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="branding-generated-row">
                  {[
                    ['Secondary', primaryGenerated.colors.secondary],
                    ['Accent', primaryGenerated.colors.accent],
                    ['Hover', primaryGenerated.derivedColors.hover],
                    ['Light', primaryGenerated.derivedColors.lightVariant],
                    ['Dark', primaryGenerated.derivedColors.darkVariant],
                    ['Border', primaryGenerated.derivedColors.borderSuggestion],
                    ['Background', primaryGenerated.derivedColors.backgroundSuggestion]
                  ].map(([label, color]) => (
                    <button
                      key={`${label}-${color}`}
                      className="branding-generated-chip"
                      type="button"
                      style={{ '--chip-color': color } as CSSProperties}
                      onClick={() => {
                        if (label === 'Secondary') updateColor('secondary', color);
                        if (label === 'Accent') updateColor('accent', color);
                        if (label === 'Border') updateColor('border', color);
                        if (label === 'Background') updateColor('background', color);
                      }}
                    >
                      <span></span>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="branding-color-grid">
                  {COLOR_FIELDS.map((field) => (
                    <ColorControl
                      key={field.key}
                      colorKey={field.key}
                      description={field.description}
                      label={field.label}
                      value={draft.colors[field.key]}
                      onChange={(value) => updateColor(field.key, value)}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="branding-command-bar">
              <div>
                <strong>Branding Actions</strong>
                <span>{pendingFileCount ? `${pendingFileCount} asset upload pending` : 'Ready to save when changes are reviewed'}</span>
              </div>
              <div className="branding-command-actions">
                <button className="btn btn-primary" disabled={isSaving} type="button" onClick={() => void saveBranding()}>
                  <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
                  {isSaving ? 'Saving...' : 'Save Branding'}
                </button>
                <button className="btn btn-outline" disabled={isSaving} type="button" onClick={() => void restoreDefaultBranding()}>
                  <i className="fas fa-rotate-left"></i>
                  Restore Default Branding
                </button>
                <button className="btn btn-outline" disabled={isSaving} type="button" onClick={resetColorsOnly}>
                  <i className="fas fa-droplet"></i>
                  Reset Colors Only
                </button>
                <button className="btn btn-outline" disabled={isSaving} type="button" onClick={resetLogosOnly}>
                  <i className="fas fa-image"></i>
                  Reset Logo Only
                </button>
                <button className="btn btn-outline" disabled={isSaving} type="button" onClick={() => importInputRef.current?.click()}>
                  <i className="fas fa-file-import"></i>
                  Import Theme JSON
                </button>
                <input ref={importInputRef} accept="application/json" hidden type="file" onChange={importThemeJson} />
                <button className="btn btn-outline" type="button" onClick={exportThemeJson}>
                  <i className="fas fa-file-export"></i>
                  Export Theme JSON
                </button>
              </div>
            </section>
          </div>

          <aside className="branding-preview-column">
            <section className="admin-section-card branding-preview-card">
              <div className="admin-section-head">
                <div>
                  <h3>Live System Preview</h3>
                  <p>Switch screens to preview where the selected branding will appear.</p>
                </div>
                <div className="branding-preview-mode-tabs" role="tablist" aria-label="Preview screen">
                  {PREVIEW_MODES.map((mode) => (
                    <button
                      key={mode.key}
                      aria-selected={previewMode === mode.key}
                      className={previewMode === mode.key ? 'is-active' : ''}
                      role="tab"
                      type="button"
                      onClick={() => setPreviewMode(mode.key)}
                    >
                      <i className={`fas ${mode.icon}`}></i>
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-section-body">
                <LiveSystemPreview branding={draft} mode={previewMode} />
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Accessibility Check</h3>
                  <p>Contrast warnings before applying a theme globally.</p>
                </div>
                <span className={`branding-accessibility-summary ${accessibilityWarnings.length ? 'is-warning' : 'is-good'}`}>
                  {accessibilityWarnings.length ? `${accessibilityWarnings.length} warnings` : 'All good'}
                </span>
              </div>
              <div className="admin-section-body">
                <div className="branding-contrast-list">
                  {contrastChecks.map((check) => (
                    <div key={check.label} className="branding-contrast-item">
                      <div>
                        <strong>{check.label}</strong>
                        <span>{check.detail}</span>
                      </div>
                      <span className={`branding-contrast-badge ${getContrastTone(check.status)}`}>
                        {check.status}
                        <small>{check.ratio.toFixed(2)}:1</small>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>CSS Variables</h3>
                  <p>Current global theme tokens.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <pre className="branding-css-preview">
{`:root {
${BRANDING_COLOR_KEYS.map((key) => `  --color-${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}: ${draft.colors[key]};`).join('\n')}
}`}
                </pre>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </SystemAdminShell>
  );
}
