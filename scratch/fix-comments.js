const fs = require('fs');
let css = fs.readFileSync('src/styles/student-workspace.css', 'utf8');

// Replace the specific line that introduces the unclosed comment
// From: .student-shell .student-global-navbar::before { display: none !important; } /*
// To: .student-shell .student-global-navbar::before { display: none !important; }
css = css.replace(/\.student-shell\s+\.student-global-navbar::before\s*\{\s*display:\s*none\s*!important;\s*\}\s*\/\*\s*/g, '.student-shell .student-global-navbar::before { display: none !important; }\n');

// Also remove any lone `*/` lines that were added as a manual fix earlier (like around line 20836 and 26427)
css = css.replace(/^\s*\*\/\s*$/gm, '');

// Save it back
fs.writeFileSync('src/styles/student-workspace.css', css, 'utf8');
console.log('Fixed broken CSS comments!');
