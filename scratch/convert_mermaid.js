const fs = require('fs');
const dbml = fs.readFileSync('C:/Users/kylec/.gemini/antigravity/brain/5fce7c8b-3c74-40a3-9a4e-861bb0d3c669/thesis_erd_official.dbml', 'utf8');

let mermaid = 'erDiagram\n';

const lines = dbml.split('\n');
let currentTable = null;

for(let line of lines) {
  line = line.trim();
  
  if (line.startsWith('Table ')) {
     currentTable = line.split(' ')[1];
     mermaid += `    ${currentTable} {\n`;
  } else if (line.startsWith('}') && currentTable) {
     mermaid += `    }\n\n`;
     currentTable = null;
  } else if (currentTable && line && !line.startsWith('Note:')) {
     let parts = line.split(' ');
     let colName = parts[0];
     let type = parts[1];
     if (colName && type && !colName.startsWith('//')) {
         type = type.replace(/[^a-zA-Z0-9_]/g, '');
         mermaid += `        ${type} ${colName}\n`;
     }
  } else if (line.startsWith('Ref:')) {
     let match = line.match(/Ref:\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*>\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/);
     if (match) {
        let sourceT = match[1];
        let targetT = match[3];
        let sourceCol = match[2];
        mermaid += `    ${targetT} ||--o{ ${sourceT} : "${sourceCol}"\n`;
     }
     
     let match1to1 = line.match(/Ref:\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*-\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/);
     if (match1to1) {
        let sourceT = match1to1[1];
        let targetT = match1to1[3];
        let sourceCol = match1to1[2];
        mermaid += `    ${targetT} ||--|| ${sourceT} : "${sourceCol}"\n`;
     }
  }
}

fs.writeFileSync('C:/Users/kylec/.gemini/antigravity/brain/5fce7c8b-3c74-40a3-9a4e-861bb0d3c669/thesis_erd.mermaid', mermaid);
console.log('Mermaid generated successfully!');
