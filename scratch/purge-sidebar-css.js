const fs = require('fs');
const path = require('path');

const stylesDir = 'c:/Users/kylec/Desktop/capstone dev 1/src/styles';
const cssFiles = fs.readdirSync(stylesDir).filter(file => file.endsWith('.css') && file !== 'student-workspace.css');

for (const file of cssFiles) {
    const filePath = path.join(stylesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    let newContent = '';
    let i = 0;
    let modified = false;
    
    while (i < content.length) {
        let braceIndex = content.indexOf('{', i);
        if (braceIndex === -1) {
            newContent += content.substring(i);
            break;
        }
        
        let prevBrace = content.lastIndexOf('}', braceIndex);
        if (prevBrace === -1) prevBrace = 0; else prevBrace += 1;
        
        let selector = content.substring(prevBrace, braceIndex);
        
        let closeBrace = braceIndex;
        let depth = 0;
        while (closeBrace < content.length) {
            if (content[closeBrace] === '{') depth++;
            else if (content[closeBrace] === '}') {
                depth--;
                if (depth === 0) break;
            }
            closeBrace++;
        }
        
        if (selector.includes('sidebar')) {
            i = closeBrace + 1;
            modified = true;
        } else {
            newContent += content.substring(i, closeBrace + 1);
            i = closeBrace + 1;
        }
    }
    
    if (modified) {
        fs.writeFileSync(filePath, newContent);
        console.log(`Purged sidebar CSS from ${file}`);
    } else {
        console.log(`No sidebar CSS found in ${file}`);
    }
}
