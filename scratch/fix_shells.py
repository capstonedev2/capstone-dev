import os
import glob

files = [
    'src/components/tech-transfer/tech-transfer-shell.tsx',
    'src/components/partner/partner-shell.tsx',
    'src/components/program-head/program-head-shell.tsx',
    'src/components/library/library-shell.tsx',
    'src/components/admin/admin-shell.tsx'
]

decorative_bg_1 = """        {/* Decorative Light Background for Glassmorphism */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0F3DDE]/[0.03] via-[#0F3DDE]/[0.01] to-transparent"></div>
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#0F3DDE]/[0.05] to-indigo-500/[0.03] blur-[80px]"></div>
          <div className="absolute top-[20%] -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500/[0.03] to-[#0F3DDE]/[0.03] blur-[80px]"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay"></div>
        </div>"""

fixed_bg = """      {/* Decorative Light Background for Glassmorphism */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0F3DDE]/[0.03] via-[#0F3DDE]/[0.01] to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#0F3DDE]/[0.05] to-indigo-500/[0.03] blur-[80px]"></div>
        <div className="absolute top-[20%] -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500/[0.03] to-[#0F3DDE]/[0.03] blur-[80px]"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay"></div>
      </div>
"""

for filepath in files:
    full_path = os.path.join(r'c:\Users\kylec\Desktop\capstone dev 1', filepath)
    if not os.path.exists(full_path):
        print('File not found: ' + full_path)
        continue
        
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    content_normalized = content.replace('\r\n', '\n')
    
    if '{/* Decorative Light Background for Glassmorphism */}' in content_normalized and '<main className="student-global-main relative">' in content_normalized:
        parts = content_normalized.split('<main className="student-global-main relative">')
        if len(parts) == 2:
            main_content = parts[1]
            main_content = main_content.replace(decorative_bg_1, '')
            content_normalized = parts[0] + '<main className="student-global-main relative z-10">' + main_content
            
            content_normalized = content_normalized.replace(
                '<header className="student-global-navbar">', 
                fixed_bg + '      <header className="student-global-navbar">'
            )
            
            with open(full_path, 'w', encoding='utf-8', newline='') as f:
                f.write(content_normalized)
            print('Updated ' + filepath)
        else:
            print('Main not split correctly in ' + filepath)
    else:
        print('Target content not found exactly in ' + filepath)
