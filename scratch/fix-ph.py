import re

file_path = r'c:\Users\kylec\Desktop\capstone dev 1\src\components\program-head\program-head-dashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Backgrounds
content = re.sub(r'bg-white(/\d+)?\b', r'bg-[var(--surface)]', content)
content = re.sub(r'bg-gradient-to-[a-z] from-[a-z]+-50/\d+ to-[a-z]+-50/\d+\b', r'bg-[var(--surface)]', content)
content = re.sub(r'bg-gradient-to-[a-z] from-[a-z]+-50/\d+ to-white\b', r'bg-[var(--surface)]', content)
content = re.sub(r'bg-slate-50/\d+\b', r'bg-[var(--surface-alt)]', content)

# Texts
content = re.sub(r'text-\[\#081B4B\]', r'text-[var(--text)]', content)
content = re.sub(r'text-slate-700\b', r'text-[var(--text)]', content)
content = re.sub(r'text-slate-500\b', r'text-[var(--muted)]', content)
content = re.sub(r'text-slate-400\b', r'text-[var(--muted)]', content)

# Borders
content = re.sub(r'ring-blue-200/\d+\b', r'ring-[var(--border)]', content)
content = re.sub(r'ring-slate-200(/\d+)?\b', r'ring-[var(--border)]', content)
content = re.sub(r'ring-white/20\b', r'ring-[var(--border)]', content)
content = re.sub(r'border-slate-100(/\d+)?\b', r'border-[var(--border)]', content)
content = re.sub(r'border-slate-200(/\d+)?\b', r'border-[var(--border)]', content)
content = re.sub(r'border-amber-200/\d+\b', r'border-[var(--border)]', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
