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

    // 1. Add import
    if (!content.includes('next-themes')) {
        content = content.replace(/import \{ useRouter \} from 'next\/navigation';/, "import { useRouter } from 'next/navigation';\nimport { useTheme } from 'next-themes';");
    }

    // 2. Add hook state
    if (!content.includes('const { theme')) {
        content = content.replace(/const router = useRouter\(\);/, "const router = useRouter();\n  const { theme, systemTheme } = useTheme();\n  const [mounted, setMounted] = useState(false);\n  \n  useEffect(() => {\n    setMounted(true);\n  }, []);");
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
}
console.log('Done');
