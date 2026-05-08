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
  type BrandingAuthSettings,
  type BrandingAssets,
  type BrandingColorKey,
  type BrandingDepartmentSettings,
  type BrandingLandingFeature,
  type BrandingLandingSettings,
  type BrandingLandingStatistic,
  type BrandingNavigationLink,
  type BrandingNavigationSettings,
  type BrandingShellSettings,
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

const DEFAULT_DEPARTMENT_IDS = new Set(DEFAULT_BRANDING.departments.map((department) => department.id.toUpperCase()));

function normalizeDepartmentDraftId(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function createDepartmentDraft(existingDepartments: BrandingDepartmentSettings[]): BrandingDepartmentSettings {
  let index = existingDepartments.length + 1;
  let id = `NEW-${index}`;
  const existingIds = new Set(existingDepartments.map((department) => department.id.toUpperCase()));

  while (existingIds.has(id)) {
    index += 1;
    id = `NEW-${index}`;
  }

  const shortName = `NEW${index}`;

  return {
    id,
    shortName,
    name: 'New Department Program',
    label: `${shortName} - New Department Program`,
    description: 'Describe the new department, its academic scope, and the projects it supports.',
    mission: 'Define the department mission for research, capstone development, and student outcomes.',
    vision: 'Define the long-term department vision and academic impact.',
    icon: 'fas fa-building-columns',
    color: '#2563EB',
    logo: '',
    active: true
  };
}

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

function formatBrandingTimestamp(value?: string) {
  if (!value) {
    return 'Not saved yet';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function getPresetLabel(presetId: string) {
  if (presetId === 'auto-generated') {
    return 'Auto Generated';
  }

  if (presetId === 'custom') {
    return 'Custom Theme';
  }

  return THEME_PRESETS.find((preset) => preset.id === presetId)?.name ?? 'Custom Theme';
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
          {branding.auth.login.pill}
        </span>
        <h2>{branding.auth.login.title}</h2>
        <p>{branding.auth.login.subtitle}</p>
        <label>
          {branding.auth.login.identifierLabel}
          <input readOnly value="user@university.edu.ph" />
        </label>
        <label>
          {branding.auth.login.passwordLabel}
          <input readOnly type="password" value="password" />
        </label>
        <button type="button">{branding.auth.login.submitLabel}</button>
      </div>
    </div>
  );
}

function LandingBrandingPreview({ branding }: { branding: BrandingSettings }) {
  const visibleLinks = branding.navigation.links.filter((link) => link.visible);

  return (
    <div className="branding-preview-landing-screen">
      <nav className="branding-preview-landing-nav">
        <BrandMark branding={branding} />
        <div>
          {visibleLinks.slice(0, 4).map((link) => (
            <span key={link.id}>{link.label}</span>
          ))}
        </div>
        {branding.navigation.showLogin ? <button type="button">{branding.navigation.loginLabel}</button> : null}
      </nav>
      <section className="branding-preview-landing-hero">
        <span>{branding.landing.subtitle}</span>
        <h2>{branding.landing.heroTitle}</h2>
        <p>{branding.landing.description}</p>
        {branding.landing.showCtaButtons ? (
          <div>
            <button type="button">{branding.landing.primaryCtaText}</button>
            <button className="is-outline" type="button">{branding.landing.secondaryCtaText}</button>
          </div>
        ) : null}
      </section>
      <section className="branding-preview-landing-modules">
        {branding.landing.features.filter((feature) => feature.visible).slice(0, 3).map((feature) => (
          <article key={feature.id}>
            <i className={`fas ${feature.icon}`}></i>
            <strong>{feature.title}</strong>
            <p>{feature.description}</p>
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
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
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

  const updateLandingField = <K extends keyof BrandingLandingSettings>(
    field: K,
    value: BrandingLandingSettings[K]
  ) => {
    updateDraft((current) => ({
      ...current,
      landing: {
        ...current.landing,
        [field]: value
      }
    }));
  };

  const updateLandingFeature = <K extends keyof BrandingLandingFeature>(
    index: number,
    field: K,
    value: BrandingLandingFeature[K]
  ) => {
    updateDraft((current) => ({
      ...current,
      landing: {
        ...current.landing,
        features: current.landing.features.map((feature, featureIndex) => (
          featureIndex === index ? { ...feature, [field]: value } : feature
        ))
      }
    }));
  };

  const updateLandingStatistic = <K extends keyof BrandingLandingStatistic>(
    index: number,
    field: K,
    value: BrandingLandingStatistic[K]
  ) => {
    updateDraft((current) => ({
      ...current,
      landing: {
        ...current.landing,
        statistics: current.landing.statistics.map((statistic, statisticIndex) => (
          statisticIndex === index ? { ...statistic, [field]: value } : statistic
        ))
      }
    }));
  };

  const updateAuthLoginField = <K extends keyof BrandingAuthSettings['login']>(
    field: K,
    value: BrandingAuthSettings['login'][K]
  ) => {
    updateDraft((current) => ({
      ...current,
      auth: {
        ...current.auth,
        login: {
          ...current.auth.login,
          [field]: value
        }
      }
    }));
  };

  const updateAuthRegisterField = <K extends keyof BrandingAuthSettings['register']>(
    field: K,
    value: BrandingAuthSettings['register'][K]
  ) => {
    updateDraft((current) => ({
      ...current,
      auth: {
        ...current.auth,
        register: {
          ...current.auth.register,
          [field]: value
        }
      }
    }));
  };

  const updateNavigationField = <K extends keyof Omit<BrandingNavigationSettings, 'links'>>(
    field: K,
    value: BrandingNavigationSettings[K]
  ) => {
    updateDraft((current) => ({
      ...current,
      navigation: {
        ...current.navigation,
        [field]: value
      }
    }));
  };

  const updateNavigationLink = <K extends keyof BrandingNavigationLink>(
    index: number,
    field: K,
    value: BrandingNavigationLink[K]
  ) => {
    updateDraft((current) => ({
      ...current,
      navigation: {
        ...current.navigation,
        links: current.navigation.links.map((link, linkIndex) => (
          linkIndex === index ? { ...link, [field]: value } : link
        ))
      }
    }));
  };

  const updateShellField = <K extends keyof BrandingShellSettings>(
    field: K,
    value: BrandingShellSettings[K]
  ) => {
    updateDraft((current) => ({
      ...current,
      shell: {
        ...current.shell,
        [field]: value
      }
    }));
  };

  const updateDepartmentField = <K extends keyof BrandingDepartmentSettings>(
    index: number,
    field: K,
    value: BrandingDepartmentSettings[K]
  ) => {
    updateDraft((current) => ({
      ...current,
      departments: current.departments.map((department, departmentIndex) => (
        departmentIndex === index ? { ...department, [field]: value } : department
      ))
    }));
  };

  const addDepartment = () => {
    updateDraft((current) => ({
      ...current,
      departments: [
        ...current.departments,
        createDepartmentDraft(current.departments)
      ]
    }));
    setBanner({
      tone: 'info',
      title: 'Department added',
      body: 'Fill in the new department details, then save branding to publish it in registration and public department pages.'
    });
  };

  const removeDepartment = (index: number) => {
    const department = draft.departments[index];

    if (!department) {
      return;
    }

    if (DEFAULT_DEPARTMENT_IDS.has(department.id.toUpperCase())) {
      setBanner({
        tone: 'info',
        title: 'Default department retained',
        body: 'Default departments stay in the list for data compatibility. Turn Active off if you need to hide one.'
      });
      return;
    }

    if (!window.confirm(`Remove ${department.shortName || department.id} from managed departments?`)) {
      return;
    }

    updateDraft((current) => ({
      ...current,
      departments: current.departments.filter((_, departmentIndex) => departmentIndex !== index)
    }));
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
  const configuredAssetCount = Object.values(draft.assets).filter(Boolean).length;
  const contrastPassCount = contrastChecks.length - accessibilityWarnings.length;
  const selectedPresetLabel = getPresetLabel(draft.themePreset);
  const savedAtLabel = formatBrandingTimestamp(savedBranding.updatedAt);
  const heroLogo = draft.assets.mainLogo || draft.assets.darkLogo || draft.assets.lightLogo;
  const brandInitials = (draft.systemShortName || draft.systemName)
    .slice(0, 3)
    .toUpperCase();
  const heroPalette = [
    ['Primary', draft.colors.primary],
    ['Secondary', draft.colors.secondary],
    ['Accent', draft.colors.accent],
    ['Surface', draft.colors.surface],
    ['Sidebar', draft.colors.sidebar]
  ];
  const heroStyle = {
    '--brand-hero-primary': draft.colors.primary,
    '--brand-hero-secondary': draft.colors.secondary,
    '--brand-hero-accent': draft.colors.accent,
    '--brand-hero-surface': draft.colors.surface,
    '--brand-hero-background': draft.colors.background,
    '--brand-hero-text': draft.colors.textPrimary,
    '--brand-hero-muted': draft.colors.textSecondary,
    '--brand-hero-border': draft.colors.border
  } as CSSProperties;

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

        <section className="branding-hero-panel" style={heroStyle}>
          <div className="branding-hero-main">
            <span className="branding-hero-kicker">
              <i className="fas fa-palette"></i>
              Brand Control Center
            </span>
            <div className="branding-hero-brandline">
              <span className="branding-hero-logo" aria-hidden="true">
                {heroLogo ? <img alt="" src={heroLogo} /> : brandInitials}
              </span>
              <div>
                <h2>{draft.systemName}</h2>
                <p>{draft.tagline}</p>
              </div>
            </div>
            <div className="branding-hero-palette" aria-label="Current theme palette">
              {heroPalette.map(([label, color]) => (
                <span key={label} title={`${label}: ${color}`}>
                  <i style={{ backgroundColor: color }}></i>
                  <strong>{label}</strong>
                  <small>{color}</small>
                </span>
              ))}
            </div>
          </div>
          <div className="branding-hero-metrics">
            <article>
              <span>Active Preset</span>
              <strong>{selectedPresetLabel}</strong>
              <small>{draft.themePreset === 'custom' ? 'Manual color direction' : 'Preset-based direction'}</small>
            </article>
            <article>
              <span>Accessibility</span>
              <strong>{contrastPassCount}/{contrastChecks.length}</strong>
              <small>{accessibilityWarnings.length ? `${accessibilityWarnings.length} contrast warnings` : 'Contrast checks passed'}</small>
            </article>
            <article>
              <span>Brand Assets</span>
              <strong>{configuredAssetCount}/{ASSET_FIELDS.length}</strong>
              <small>{pendingFileCount ? `${pendingFileCount} pending upload` : 'Current asset set'}</small>
            </article>
            <article>
              <span>Saved Version</span>
              <strong>{isDirty ? 'Draft' : 'Live'}</strong>
              <small>{savedAtLabel}</small>
            </article>
          </div>
        </section>

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

        <div className={`branding-layout ${isPreviewExpanded ? 'is-preview-expanded' : ''}`}>
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
                  <h3>Landing Page Content</h3>
                  <p>Manage the public hero, call-to-action buttons, feature row, and about metrics.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-form-grid">
                  <div className="form-field">
                    <label htmlFor="branding-landing-subtitle">Hero Badge</label>
                    <input
                      id="branding-landing-subtitle"
                      value={draft.landing.subtitle}
                      onChange={(event) => updateLandingField('subtitle', event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-landing-alignment">Hero Text Alignment</label>
                    <select
                      id="branding-landing-alignment"
                      value={draft.landing.textAlignment}
                      onChange={(event) => updateLandingField('textAlignment', event.target.value as BrandingLandingSettings['textAlignment'])}
                    >
                      <option value="center">Center</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div className="form-field branding-span-full">
                    <label htmlFor="branding-landing-title">Hero Title</label>
                    <input
                      id="branding-landing-title"
                      value={draft.landing.heroTitle}
                      onChange={(event) => updateLandingField('heroTitle', event.target.value)}
                    />
                  </div>
                  <div className="form-field branding-span-full">
                    <label htmlFor="branding-landing-description">Hero Description</label>
                    <textarea
                      id="branding-landing-description"
                      value={draft.landing.description}
                      onChange={(event) => updateLandingField('description', event.target.value)}
                    />
                  </div>
                  <label className="branding-toggle-line branding-span-full">
                    <input
                      checked={draft.landing.showCtaButtons}
                      type="checkbox"
                      onChange={(event) => updateLandingField('showCtaButtons', event.target.checked)}
                    />
                    Show landing call-to-action buttons
                  </label>
                  <div className="form-field">
                    <label htmlFor="branding-landing-primary-cta">Primary CTA Text</label>
                    <input
                      id="branding-landing-primary-cta"
                      value={draft.landing.primaryCtaText}
                      onChange={(event) => updateLandingField('primaryCtaText', event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-landing-primary-link">Primary CTA Link</label>
                    <input
                      id="branding-landing-primary-link"
                      value={draft.landing.primaryCtaLink}
                      onChange={(event) => updateLandingField('primaryCtaLink', event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-landing-secondary-cta">Secondary CTA Text</label>
                    <input
                      id="branding-landing-secondary-cta"
                      value={draft.landing.secondaryCtaText}
                      onChange={(event) => updateLandingField('secondaryCtaText', event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-landing-secondary-link">Secondary CTA Link</label>
                    <input
                      id="branding-landing-secondary-link"
                      value={draft.landing.secondaryCtaLink}
                      onChange={(event) => updateLandingField('secondaryCtaLink', event.target.value)}
                    />
                  </div>
                  <label className="branding-toggle-line branding-span-full">
                    <input
                      checked={draft.landing.showHeroImage}
                      type="checkbox"
                      onChange={(event) => updateLandingField('showHeroImage', event.target.checked)}
                    />
                    Show hero image
                  </label>
                  <div className="form-field branding-span-full">
                    <label htmlFor="branding-landing-hero-image">Hero Image URL</label>
                    <input
                      id="branding-landing-hero-image"
                      value={draft.landing.heroImage}
                      onChange={(event) => updateLandingField('heroImage', event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-landing-about-title">About Title</label>
                    <input
                      id="branding-landing-about-title"
                      value={draft.landing.aboutTitle}
                      onChange={(event) => updateLandingField('aboutTitle', event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-landing-about-description">About Description</label>
                    <textarea
                      id="branding-landing-about-description"
                      value={draft.landing.aboutDescription}
                      onChange={(event) => updateLandingField('aboutDescription', event.target.value)}
                    />
                  </div>
                </div>

                <div className="branding-management-list">
                  <div className="branding-management-heading">
                    <strong>Feature Row</strong>
                    <span>Controls the four public highlight items.</span>
                  </div>
                  {draft.landing.features.map((feature, index) => (
                    <div key={feature.id} className="branding-repeater-card">
                      <label className="branding-toggle-line">
                        <input
                          checked={feature.visible}
                          type="checkbox"
                          onChange={(event) => updateLandingFeature(index, 'visible', event.target.checked)}
                        />
                        Visible
                      </label>
                      <div className="branding-mini-editor-grid">
                        <div className="form-field">
                          <label htmlFor={`branding-feature-title-${feature.id}`}>Title</label>
                          <input
                            id={`branding-feature-title-${feature.id}`}
                            value={feature.title}
                            onChange={(event) => updateLandingFeature(index, 'title', event.target.value)}
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor={`branding-feature-icon-${feature.id}`}>Icon Class</label>
                          <input
                            id={`branding-feature-icon-${feature.id}`}
                            value={feature.icon}
                            onChange={(event) => updateLandingFeature(index, 'icon', event.target.value)}
                          />
                        </div>
                        <div className="form-field branding-span-full">
                          <label htmlFor={`branding-feature-description-${feature.id}`}>Description</label>
                          <input
                            id={`branding-feature-description-${feature.id}`}
                            value={feature.description}
                            onChange={(event) => updateLandingFeature(index, 'description', event.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="branding-management-list">
                  <div className="branding-management-heading">
                    <strong>About Metrics</strong>
                    <span>Shown in the public about summary card.</span>
                  </div>
                  {draft.landing.statistics.map((statistic, index) => (
                    <div key={statistic.id} className="branding-repeater-card">
                      <label className="branding-toggle-line">
                        <input
                          checked={statistic.visible}
                          type="checkbox"
                          onChange={(event) => updateLandingStatistic(index, 'visible', event.target.checked)}
                        />
                        Visible
                      </label>
                      <div className="branding-mini-editor-grid">
                        <div className="form-field">
                          <label htmlFor={`branding-stat-value-${statistic.id}`}>Value</label>
                          <input
                            id={`branding-stat-value-${statistic.id}`}
                            value={statistic.value}
                            onChange={(event) => updateLandingStatistic(index, 'value', event.target.value)}
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor={`branding-stat-label-${statistic.id}`}>Label</label>
                          <input
                            id={`branding-stat-label-${statistic.id}`}
                            value={statistic.label}
                            onChange={(event) => updateLandingStatistic(index, 'label', event.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Login and Register Pages</h3>
                  <p>Manage authentication page headings, instructions, labels, and footer prompts.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="branding-two-panel-grid">
                  <div className="branding-subsection-panel">
                    <div className="branding-management-heading">
                      <strong>Login Page</strong>
                      <span>Account access screen copy.</span>
                    </div>
                    <div className="admin-form-grid">
                      <div className="form-field">
                        <label htmlFor="branding-login-pill">Pill Label</label>
                        <input id="branding-login-pill" value={draft.auth.login.pill} onChange={(event) => updateAuthLoginField('pill', event.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="branding-login-title">Title</label>
                        <input id="branding-login-title" value={draft.auth.login.title} onChange={(event) => updateAuthLoginField('title', event.target.value)} />
                      </div>
                      <div className="form-field branding-span-full">
                        <label htmlFor="branding-login-subtitle">Subtitle</label>
                        <textarea id="branding-login-subtitle" value={draft.auth.login.subtitle} onChange={(event) => updateAuthLoginField('subtitle', event.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="branding-login-identifier-label">Identifier Label</label>
                        <input id="branding-login-identifier-label" value={draft.auth.login.identifierLabel} onChange={(event) => updateAuthLoginField('identifierLabel', event.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="branding-login-identifier-placeholder">Identifier Placeholder</label>
                        <input id="branding-login-identifier-placeholder" value={draft.auth.login.identifierPlaceholder} onChange={(event) => updateAuthLoginField('identifierPlaceholder', event.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="branding-login-submit">Submit Label</label>
                        <input id="branding-login-submit" value={draft.auth.login.submitLabel} onChange={(event) => updateAuthLoginField('submitLabel', event.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="branding-login-google">Google Button Label</label>
                        <input id="branding-login-google" value={draft.auth.login.googleLabel} onChange={(event) => updateAuthLoginField('googleLabel', event.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="branding-login-prompt">Footer Prompt</label>
                        <input id="branding-login-prompt" value={draft.auth.login.alternatePrompt} onChange={(event) => updateAuthLoginField('alternatePrompt', event.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="branding-login-link">Footer Link Label</label>
                        <input id="branding-login-link" value={draft.auth.login.alternateLinkLabel} onChange={(event) => updateAuthLoginField('alternateLinkLabel', event.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="branding-subsection-panel">
                    <div className="branding-management-heading">
                      <strong>Register Page</strong>
                      <span>Student registration screen copy.</span>
                    </div>
                    <div className="admin-form-grid">
                      <div className="form-field">
                        <label htmlFor="branding-register-pill">Pill Label</label>
                        <input id="branding-register-pill" value={draft.auth.register.pill} onChange={(event) => updateAuthRegisterField('pill', event.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="branding-register-title">Title</label>
                        <input id="branding-register-title" value={draft.auth.register.title} onChange={(event) => updateAuthRegisterField('title', event.target.value)} />
                      </div>
                      <div className="form-field branding-span-full">
                        <label htmlFor="branding-register-subtitle">Subtitle</label>
                        <textarea id="branding-register-subtitle" value={draft.auth.register.subtitle} onChange={(event) => updateAuthRegisterField('subtitle', event.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="branding-register-submit">Submit Label</label>
                        <input id="branding-register-submit" value={draft.auth.register.submitLabel} onChange={(event) => updateAuthRegisterField('submitLabel', event.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="branding-register-prompt">Footer Prompt</label>
                        <input id="branding-register-prompt" value={draft.auth.register.alternatePrompt} onChange={(event) => updateAuthRegisterField('alternatePrompt', event.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="branding-register-link">Footer Link Label</label>
                        <input id="branding-register-link" value={draft.auth.register.alternateLinkLabel} onChange={(event) => updateAuthRegisterField('alternateLinkLabel', event.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="branding-register-note-strong">Access Note Lead</label>
                        <input id="branding-register-note-strong" value={draft.auth.register.academicNote} onChange={(event) => updateAuthRegisterField('academicNote', event.target.value)} />
                      </div>
                      <div className="form-field branding-span-full">
                        <label htmlFor="branding-register-note">Access Note Body</label>
                        <input id="branding-register-note" value={draft.auth.register.staffNote} onChange={(event) => updateAuthRegisterField('staffNote', event.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Navbar and Sidebar</h3>
                  <p>Manage public navigation labels and System Admin shell sidebar copy.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-form-grid">
                  <div className="form-field">
                    <label htmlFor="branding-nav-subtitle">Public Navbar Subtitle</label>
                    <input id="branding-nav-subtitle" value={draft.navigation.subtitle} onChange={(event) => updateNavigationField('subtitle', event.target.value)} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-nav-login">Login Button Label</label>
                    <input id="branding-nav-login" value={draft.navigation.loginLabel} onChange={(event) => updateNavigationField('loginLabel', event.target.value)} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-nav-register">Register Button Label</label>
                    <input id="branding-nav-register" value={draft.navigation.registerLabel} onChange={(event) => updateNavigationField('registerLabel', event.target.value)} />
                  </div>
                  <div className="branding-toggle-stack">
                    <label className="branding-toggle-line">
                      <input checked={draft.navigation.showLogin} type="checkbox" onChange={(event) => updateNavigationField('showLogin', event.target.checked)} />
                      Show Login Button
                    </label>
                    <label className="branding-toggle-line">
                      <input checked={draft.navigation.showRegister} type="checkbox" onChange={(event) => updateNavigationField('showRegister', event.target.checked)} />
                      Show Register Button
                    </label>
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-shell-navbar-title">Portal Navbar Title</label>
                    <input id="branding-shell-navbar-title" value={draft.shell.navbarTitle} onChange={(event) => updateShellField('navbarTitle', event.target.value)} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-shell-navbar-subtitle">Portal Navbar Subtitle</label>
                    <input id="branding-shell-navbar-subtitle" value={draft.shell.navbarSubtitle} onChange={(event) => updateShellField('navbarSubtitle', event.target.value)} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-shell-sidebar-kicker">Sidebar Kicker</label>
                    <input id="branding-shell-sidebar-kicker" value={draft.shell.sidebarKicker} onChange={(event) => updateShellField('sidebarKicker', event.target.value)} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-shell-sidebar-title">Sidebar Title</label>
                    <input id="branding-shell-sidebar-title" value={draft.shell.sidebarTitle} onChange={(event) => updateShellField('sidebarTitle', event.target.value)} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="branding-shell-sidebar-badge">Sidebar Badge</label>
                    <input id="branding-shell-sidebar-badge" value={draft.shell.sidebarBadge} onChange={(event) => updateShellField('sidebarBadge', event.target.value)} />
                  </div>
                  <div className="form-field branding-span-full">
                    <label htmlFor="branding-shell-sidebar-description">Sidebar Description</label>
                    <textarea id="branding-shell-sidebar-description" value={draft.shell.sidebarDescription} onChange={(event) => updateShellField('sidebarDescription', event.target.value)} />
                  </div>
                </div>

                <div className="branding-management-list">
                  <div className="branding-management-heading">
                    <strong>Public Navigation Links</strong>
                    <span>Visible in the public landing navbar.</span>
                  </div>
                  {draft.navigation.links.map((link, index) => (
                    <div key={link.id} className="branding-repeater-card">
                      <label className="branding-toggle-line">
                        <input checked={link.visible} type="checkbox" onChange={(event) => updateNavigationLink(index, 'visible', event.target.checked)} />
                        Visible
                      </label>
                      <div className="branding-mini-editor-grid">
                        <div className="form-field">
                          <label htmlFor={`branding-nav-link-label-${link.id}`}>Label</label>
                          <input id={`branding-nav-link-label-${link.id}`} value={link.label} onChange={(event) => updateNavigationLink(index, 'label', event.target.value)} />
                        </div>
                        <div className="form-field">
                          <label htmlFor={`branding-nav-link-href-${link.id}`}>Href</label>
                          <input id={`branding-nav-link-href-${link.id}`} value={link.href} onChange={(event) => updateNavigationLink(index, 'href', event.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Departments</h3>
                  <p>Add new departments and manage names, register dropdown labels, logos, colors, and public descriptions.</p>
                </div>
                <button className="btn btn-primary small" type="button" onClick={addDepartment}>
                  <i className="fas fa-plus"></i>
                  Add Department
                </button>
              </div>
              <div className="admin-section-body">
                <div className="branding-department-grid">
                  {draft.departments.map((department, index) => {
                    const isDefaultDepartment = DEFAULT_DEPARTMENT_IDS.has(department.id.toUpperCase());

                    return (
                      <div key={`${department.id || 'department'}-${index}`} className="branding-department-editor">
                        <div className="branding-department-editor-head">
                          <span style={{ backgroundColor: department.color }}></span>
                          <div>
                            <strong>{department.shortName}</strong>
                            <small>{department.id}</small>
                          </div>
                          <div className="branding-department-editor-actions">
                            {isDefaultDepartment ? (
                              <span className="admin-inline-badge">Default</span>
                            ) : (
                              <button className="btn btn-outline small" type="button" onClick={() => removeDepartment(index)}>
                                <i className="fas fa-trash"></i>
                                Remove
                              </button>
                            )}
                            <label className="branding-toggle-line">
                              <input checked={department.active} type="checkbox" onChange={(event) => updateDepartmentField(index, 'active', event.target.checked)} />
                              Active
                            </label>
                          </div>
                        </div>
                        <div className="branding-mini-editor-grid">
                          <div className="form-field">
                            <label htmlFor={`branding-dept-id-${department.id}`}>Department Code</label>
                            <input
                              disabled={isDefaultDepartment}
                              id={`branding-dept-id-${department.id}`}
                              value={department.id}
                              onChange={(event) => updateDepartmentField(index, 'id', normalizeDepartmentDraftId(event.target.value))}
                            />
                            <span className="branding-field-note">
                              {isDefaultDepartment ? 'Default department code is locked.' : 'Used in the public URL, for example /departments/NEW-6.'}
                            </span>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`branding-dept-short-${department.id}`}>Short Name</label>
                            <input id={`branding-dept-short-${department.id}`} value={department.shortName} onChange={(event) => updateDepartmentField(index, 'shortName', event.target.value)} />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`branding-dept-color-${department.id}`}>Color</label>
                            <input id={`branding-dept-color-${department.id}`} value={department.color} onChange={(event) => updateDepartmentField(index, 'color', event.target.value)} />
                          </div>
                          <div className="form-field branding-span-full">
                            <label htmlFor={`branding-dept-name-${department.id}`}>Full Name</label>
                            <input id={`branding-dept-name-${department.id}`} value={department.name} onChange={(event) => updateDepartmentField(index, 'name', event.target.value)} />
                          </div>
                          <div className="form-field branding-span-full">
                            <label htmlFor={`branding-dept-label-${department.id}`}>Register Dropdown Label</label>
                            <input id={`branding-dept-label-${department.id}`} value={department.label} onChange={(event) => updateDepartmentField(index, 'label', event.target.value)} />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`branding-dept-icon-${department.id}`}>Icon Class</label>
                            <input id={`branding-dept-icon-${department.id}`} value={department.icon} onChange={(event) => updateDepartmentField(index, 'icon', event.target.value)} />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`branding-dept-logo-${department.id}`}>Logo URL</label>
                            <input id={`branding-dept-logo-${department.id}`} value={department.logo} onChange={(event) => updateDepartmentField(index, 'logo', event.target.value)} />
                          </div>
                          <div className="form-field branding-span-full">
                            <label htmlFor={`branding-dept-description-${department.id}`}>Public Description</label>
                            <textarea id={`branding-dept-description-${department.id}`} value={department.description} onChange={(event) => updateDepartmentField(index, 'description', event.target.value)} />
                          </div>
                          <div className="form-field branding-span-full">
                            <label htmlFor={`branding-dept-mission-${department.id}`}>Mission</label>
                            <textarea id={`branding-dept-mission-${department.id}`} value={department.mission} onChange={(event) => updateDepartmentField(index, 'mission', event.target.value)} />
                          </div>
                          <div className="form-field branding-span-full">
                            <label htmlFor={`branding-dept-vision-${department.id}`}>Vision</label>
                            <textarea id={`branding-dept-vision-${department.id}`} value={department.vision} onChange={(event) => updateDepartmentField(index, 'vision', event.target.value)} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                      {draft.themePreset === preset.id ? (
                        <span className="branding-preset-active">
                          <i className="fas fa-circle-check"></i>
                          Active
                        </span>
                      ) : null}
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
                <div className="branding-preview-head-actions">
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
                  <button
                    className="btn btn-outline small branding-preview-expand-btn"
                    type="button"
                    onClick={() => setIsPreviewExpanded((current) => !current)}
                  >
                    <i className={`fas ${isPreviewExpanded ? 'fa-down-left-and-up-right-to-center' : 'fa-up-right-and-down-left-from-center'}`}></i>
                    {isPreviewExpanded ? 'Compact Preview' : 'Expand Preview'}
                  </button>
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
