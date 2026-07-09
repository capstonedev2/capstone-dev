const fs = require('fs');
const filePath = 'c:\\Users\\kylec\\Desktop\\capstone dev 1\\src\\components\\program-head\\program-head-dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(/bg-gradient-to-b from-white\/\d+ to-white\/\d+/g, 'bg-[var(--surface)]');
content = content.replace(/bg-slate-50\/50/g, 'bg-[var(--surface-alt)]');
content = content.replace(/bg-white\/\d+/g, 'bg-[var(--surface)]');
content = content.replace(/text-\[\#081B4B\]/g, 'text-[var(--text)]');
content = content.replace(/text-slate-700/g, 'text-[var(--text)]');
content = content.replace(/text-slate-500/g, 'text-[var(--muted)]');
content = content.replace(/text-slate-400/g, 'text-[var(--muted)]');
content = content.replace(/ring-slate-200(\/\d+)?/g, 'ring-[var(--border)]');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done');
