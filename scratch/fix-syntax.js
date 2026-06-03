const fs = require('fs');
let css = fs.readFileSync('src/styles/student-workspace.css', 'utf8');

// Match `.student-shell .student-global-navbar::before { display: none !important; }`
// and any following orphaned CSS properties up to the next selector or empty line.
// A safe way is to replace `.student-shell .student-global-navbar::before { display: none !important; }`
// and all characters until `.student-shell` (using positive lookahead).
css = css.replace(/\.student-shell\s+(?:\[data-theme="dark"\]\s+)?\.student-global-navbar::before\s*\{\s*display:\s*none\s*!important;\s*\}(?:[\s\S]*?(?=\.student-shell))/g, '');

fs.writeFileSync('src/styles/student-workspace.css', css, 'utf8');
console.log('Fixed orphaned syntax blocks!');
