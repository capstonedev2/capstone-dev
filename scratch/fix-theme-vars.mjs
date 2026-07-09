import fs from 'fs';

const lightVars = `
:root, [data-theme="light"] {
    --primary: #003A8F;
    --primary-deep: #002c6b;
    --primary-bright: #3B82F6;
    --primary-soft: rgba(0, 58, 143, 0.1);
    --secondary: #F6BE00;
    --secondary-deep: #d4a000;
    --secondary-soft: rgba(246, 190, 0, 0.15);
    --bg: #F8FAFC;
    --surface: #FFFFFF;
    --surface-alt: #F1F5F9;
    --surface-accent: #E2E8F0;
    --surface-sunken: #F8FAFC;
    --border: #E2E8F0;
    --border-strong: #CBD5E1;
    --text: #0F172A;
    --muted: #475569;
    --muted-strong: #334155;
    --text-meta: #64748B;
    --success: #10B981;
    --success-soft: rgba(16, 185, 129, 0.15);
    --warning: #F59E0B;
    --warning-soft: rgba(245, 158, 11, 0.15);
    --danger: #EF4444;
    --danger-soft: rgba(239, 68, 68, 0.15);
    --info: #3B82F6;
    --info-soft: rgba(59, 130, 246, 0.15);
    --archived: #64748B;
    --archived-soft: rgba(100, 116, 139, 0.15);
    --transfer: #14B8A6;
    --transfer-soft: rgba(20, 184, 166, 0.15);
    --shadow-sm: 0 4px 12px rgba(15, 23, 42, 0.05);
    --shadow-md: 0 8px 24px rgba(15, 23, 42, 0.08);
    --shadow-lg: 0 16px 36px rgba(15, 23, 42, 0.12);
    --radius-sm: 12px;
    --radius-md: 18px;
    --radius-lg: 26px;
    --sidebar-width: 280px;
    --border-color: #E2E8F0;
    --bg-active: rgba(0, 58, 143, 0.08);
    --transition-fast: all 0.18s ease;
}

[data-theme="dark"] {
    --primary: #3B82F6;
    --primary-deep: #1E3A8A;
    --primary-bright: #60A5FA;
    --primary-soft: rgba(59, 130, 246, 0.15);
    --secondary: #FBBF24;
    --secondary-deep: #D97706;
    --secondary-soft: rgba(251, 191, 36, 0.15);
    --bg: #0F172A;
    --surface: #1E293B;
    --surface-alt: #0F172A;
    --surface-accent: #334155;
    --surface-sunken: #020617;
    --border: #334155;
    --border-strong: #475569;
    --text: #F8FAFC;
    --muted: #94A3B8;
    --muted-strong: #CBD5E1;
    --text-meta: #94A3B8;
    --success: #34D399;
    --success-soft: rgba(16, 185, 129, 0.15);
    --warning: #FBBF24;
    --warning-soft: rgba(245, 158, 11, 0.15);
    --danger: #F87171;
    --danger-soft: rgba(239, 68, 68, 0.15);
    --info: #60A5FA;
    --info-soft: rgba(59, 130, 246, 0.15);
    --archived: #94A3B8;
    --archived-soft: rgba(148, 163, 184, 0.15);
    --transfer: #2DD4BF;
    --transfer-soft: rgba(20, 184, 166, 0.15);
    --shadow-sm: 0 12px 28px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 18px 42px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 24px 56px rgba(0, 0, 0, 0.5);
    --border-color: #334155;
    --bg-active: rgba(59, 130, 246, 0.12);
}
`;

let content = fs.readFileSync('src/styles/student-workspace.css', 'utf8');
content = content.replace(/:root\s*\{[^}]+\}/, lightVars);
fs.writeFileSync('src/styles/student-workspace.css', content, 'utf8');
console.log('Updated student-workspace.css');
