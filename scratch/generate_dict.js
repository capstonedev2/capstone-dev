const fs = require('fs');

const dbml = fs.readFileSync('C:/Users/kylec/.gemini/antigravity/brain/5fce7c8b-3c74-40a3-9a4e-861bb0d3c669/thesis_erd_official.dbml', 'utf8');

const lines = dbml.split('\n');

let currentTable = null;
let tables = {};
let fks = {}; // fks['table.column'] = 'targetTable.targetCol'

// First pass: extract FKs
for (let line of lines) {
  line = line.trim();
  if (line.startsWith('Ref:')) {
    let match = line.match(/Ref:\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*>\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/);
    if (match) {
       fks[`${match[1]}.${match[2]}`] = `${match[3]}.${match[4]}`;
    }
    let match1to1 = line.match(/Ref:\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*-\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/);
    if (match1to1) {
       fks[`${match1to1[1]}.${match1to1[2]}`] = `${match1to1[3]}.${match1to1[4]}`;
    }
  }
}

// Second pass: extract tables and columns
for (let line of lines) {
  line = line.trim();
  if (line.startsWith('Table ')) {
     currentTable = line.split(' ')[1];
     tables[currentTable] = [];
  } else if (line.startsWith('}') && currentTable) {
     currentTable = null;
  } else if (currentTable && line && !line.startsWith('Note:') && !line.startsWith('//')) {
     let parts = line.split(' ');
     let colName = parts[0];
     let type = parts[1];
     if (colName && type && !colName.startsWith('Ref:')) {
       let settingsMatch = line.match(/\[(.*?)\]/);
       let isPk = false;
       let isNotNull = false;
       let def = '-';
       
       if (settingsMatch) {
         let settings = settingsMatch[1];
         if (settings.includes('pk')) isPk = true;
         if (settings.includes('not null')) isNotNull = true;
         let defMatch = settings.match(/default: `(.*?)`/);
         if (defMatch) def = '`' + defMatch[1] + '`';
       }
       
       let fkTarget = fks[`${currentTable}.${colName}`] || '-';
       let constraints = [];
       if (isPk) constraints.push('**PK**');
       if (fkTarget !== '-') constraints.push('**FK**');
       if (isNotNull) constraints.push('NOT NULL');
       
       tables[currentTable].push({
         name: colName,
         type: type,
         constraints: constraints.length > 0 ? constraints.join(', ') : 'NULL',
         def: def,
         fkTarget: fkTarget
       });
     }
  }
}

let md = '# ThesisTrack Full Data Dictionary\n\nThis document details the exact structure, data types, constraints, and foreign key relationships for all 40 tables in the system. It is automatically generated from the official SQL schema.\n\n';

for (let t in tables) {
  md += `## Table: \`${t}\`\n\n`;
  md += `| Field Name | Data Type | Constraints | Default Value | Foreign Key Reference |\n`;
  md += `|---|---|---|---|---|\n`;
  for (let c of tables[t]) {
    let fkStr = c.fkTarget === '-' ? '-' : `\`${c.fkTarget}\``;
    md += `| **\`${c.name}\`** | \`${c.type}\` | ${c.constraints} | ${c.def} | ${fkStr} |\n`;
  }
  md += `\n---\n\n`;
}

fs.writeFileSync('C:/Users/kylec/.gemini/antigravity/brain/5fce7c8b-3c74-40a3-9a4e-861bb0d3c669/detailed_data_dictionary.md', md);
console.log('Data Dictionary generated.');
