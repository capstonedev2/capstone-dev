const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\Users\\kylec\\Desktop\\capstone dev 1', 'src/components/shared/portal-shell-action-menus.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Replace the state hooks
const stateHookTarget = 'const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());';
const stateHookReplacement = \const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [themeMode, setThemeMode] = useState('light');

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-student-theme') || 'light';
    setThemeMode(currentTheme);
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-student-theme') {
          setThemeMode(document.documentElement.getAttribute('data-student-theme') || 'light');
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-student-theme'] });
    return () => observer.disconnect();
  }, []);

  const updateTheme = (nextTheme: string) => {
    setThemeMode(nextTheme);
    document.documentElement.setAttribute('data-student-theme', nextTheme);
    window.localStorage.setItem('studentWorkspaceTheme', nextTheme);
  };\;
content = content.replace(stateHookTarget, stateHookReplacement);

// 2. Add the toggle UI right above extraProfileSection
const uiTarget = '{extraProfileSection ? (';
const uiReplacement = \
            <div className="portal-shell-profile-dropdown-divider" />
            <div className="portal-shell-profile-dropdown-section">
              <span className="portal-shell-profile-dropdown-label">Theme</span>
              <button
                aria-label={\Switch to \ mode\}
                aria-pressed={themeMode === 'dark'}
                className="profile-theme-toggle"
                type="button"
                onClick={() => updateTheme(themeMode === 'dark' ? 'light' : 'dark')}
              >
                <span className="profile-theme-toggle-icon">
                  <i aria-hidden="true" className={\as \\} />
                </span>
                <span className="profile-theme-toggle-copy">
                  <strong>{themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong>
                  <small>Switch workspace appearance</small>
                </span>
                <span className="profile-theme-toggle-track" aria-hidden="true">
                  <span />
                </span>
              </button>
            </div>

            {extraProfileSection ? (\;
content = content.replace(uiTarget, uiReplacement);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully patched portal-shell-action-menus.tsx');
