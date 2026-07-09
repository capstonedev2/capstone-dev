const fs = require('fs');
const filePath = 'c:\\Users\\kylec\\Desktop\\capstone dev 1\\src\\components\\program-head\\program-head-dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(/bg-white(\/\d+)?\b/g, 'bg-[var(--surface)]');
content = content.replace(/bg-gradient-to-[a-z] from-[a-z]+-50\/\d+ to-[a-z]+-50\/\d+\b/g, 'bg-[var(--surface)]');
content = content.replace(/bg-gradient-to-[a-z] from-[a-z]+-50\/\d+ to-white\b/g, 'bg-[var(--surface)]');
content = content.replace(/bg-slate-50\/\d+\b/g, 'bg-[var(--surface-alt)]');

content = content.replace(/text-\[\#081B4B\]/g, 'text-[var(--text)]');
content = content.replace(/text-slate-700\b/g, 'text-[var(--text)]');
content = content.replace(/text-slate-500\b/g, 'text-[var(--muted)]');
content = content.replace(/text-slate-400\b/g, 'text-[var(--muted)]');

content = content.replace(/ring-blue-200\/\d+\b/g, 'ring-[var(--border)]');
content = content.replace(/ring-slate-200(\/\d+)?\b/g, 'ring-[var(--border)]');
content = content.replace(/ring-white\/20\b/g, 'ring-[var(--border)]');
content = content.replace(/border-slate-100(\/\d+)?\b/g, 'border-[var(--border)]');
content = content.replace(/border-slate-200(\/\d+)?\b/g, 'border-[var(--border)]');
content = content.replace(/border-amber-200\/\d+\b/g, 'border-[var(--border)]');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done');
