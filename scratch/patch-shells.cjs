const fs = require('fs');
const path = require('path');

const shells = [
    'src/components/admin/admin-shell.tsx',
    'src/components/library/library-shell.tsx',
    'src/components/partner/partner-shell.tsx',
    'src/components/program-head/program-head-shell.tsx',
    'src/components/tech-transfer/tech-transfer-shell.tsx'
];

for (const shellPath of shells) {
    const fullPath = path.join('c:\\Users\\kylec\\Desktop\\capstone dev 1', shellPath);
    let content = fs.readFileSync(fullPath, 'utf-8');

    // Add import if not present
    if (!content.includes('useTheme')) {
        content = content.replace("import { usePathname } from 'next/navigation';", "import { usePathname } from 'next/navigation';\nimport { useTheme } from 'next-themes';");
    }

    // Add theme hooks
    if (!content.includes('const { theme')) {
        content = content.replace(/const \[mounted, setMounted\] = useState\(false\);/, "const { theme, systemTheme } = useTheme();\n  const [mounted, setMounted] = useState(false);");
        // if mounted is not there, we'll just inject it
        if (!content.includes('const [mounted')) {
            content = content.replace(/const pathname = usePathname\(\);/, "const pathname = usePathname();\n  const { theme, systemTheme } = useTheme();\n  const [mounted, setMounted] = useState(false);\n  \n  useEffect(() => {\n    setMounted(true);\n  }, []);");
        }
    }

    // Add themeMode
    if (!content.includes('const themeMode')) {
        content = content.replace(/const activeNav = [^;]+;/, "$& \n  const themeMode = !mounted ? 'light' : theme === 'system' ? systemTheme : theme;");
    }

    // Add data-theme to the div wrapper
    if (!content.includes('data-theme={themeMode}')) {
        content = content.replace(/className=\{\student-shell[^\]*\\}/, "$& data-theme={themeMode}");
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
}
console.log('Done patching shells');
