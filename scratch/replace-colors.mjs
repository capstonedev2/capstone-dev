import fs from 'fs';

const files = [
  'src/components/students/student-dashboard.tsx',
  'src/components/students/student-layout-shell.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Backgrounds
  content = content.replace(/\bbg-white\/85\b/g, 'bg-[var(--surface)]');
  content = content.replace(/\bbg-white\/[0-9]+\b/g, 'bg-[var(--surface)]');
  content = content.replace(/\bbg-white\b/g, 'bg-[var(--surface)]');
  content = content.replace(/\bbg-slate-50\/?[0-9]*\b/g, 'bg-[var(--surface-alt)]');
  content = content.replace(/\bbg-slate-100\/?[0-9]*\b/g, 'bg-[var(--surface-alt)]');
  content = content.replace(/\bbg-slate-950\/10\b/g, 'bg-[var(--surface-sunken)]');
  
  // Texts
  content = content.replace(/\btext-slate-900\b/g, 'text-[var(--text)]');
  content = content.replace(/\btext-slate-800\b/g, 'text-[var(--text)]');
  content = content.replace(/\btext-slate-700\b/g, 'text-[var(--text)]');
  content = content.replace(/\btext-slate-600\b/g, 'text-[var(--muted)]');
  content = content.replace(/\btext-slate-500\b/g, 'text-[var(--muted)]');
  content = content.replace(/\btext-slate-400\b/g, 'text-[var(--text-meta)]');
  content = content.replace(/\btext-slate-[23]00\b/g, 'text-[var(--muted)]');
  content = content.replace(/\btext-slate-100\b/g, 'text-[var(--text)]');

  // Borders
  content = content.replace(/\bborder-slate-100\b/g, 'border-[var(--border)]');
  content = content.replace(/\bborder-slate-200\/?[0-9]*\b/g, 'border-[var(--border)]');
  content = content.replace(/\bborder-slate-300\b/g, 'border-[var(--border-strong)]');
  content = content.replace(/\bborder-white\/?[0-9]*\b/g, 'border-[var(--border)]');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Processed ' + file);
}
