const fs = require('fs');
let text = fs.readFileSync('scratch/sql_dump_text.txt', 'utf8');

let dbml = `Project "ThesisTrack Official SQL Dump" {
  database_type: 'PostgreSQL'
  Note: 'Official Thesis ERD from SQL Dump (Option B)'
}

`;

const createTableRegex = /CREATE TABLE ([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+) \(([\s\S]*?)\);/g;
let match;
while ((match = createTableRegex.exec(text)) !== null) {
  let tableNameFull = match[1];
  let schema = tableNameFull.split('.')[0];
  let tableName = tableNameFull.split('.')[1];

  dbml += `Table ${tableName} {\n`;
  dbml += `  Note: 'Schema: ${schema}'\n`;
  
  let lines = match[2].split('\n').map(l => l.trim()).filter(l => l);
  for(let line of lines) {
    if(line.startsWith('CONSTRAINT') || line.startsWith('PRIMARY KEY') || line.startsWith('FOREIGN KEY')) continue;
    let parts = line.split(' ');
    let colName = parts[0];
    let type = parts[1];
    
    if(colName && type) {
       type = type.replace(/,/g, ''); // Fix trailing commas on types like numeric(52),
       let settings = [];
       if(line.includes('NOT NULL')) settings.push('not null');
       if(line.includes('DEFAULT')) {
          let defMatch = line.match(/DEFAULT (.*?)(,|$)/);
          if (defMatch) settings.push(`default: \`${defMatch[1].trim()}\``);
       }
       if(colName.endsWith('_id') && line.includes('uuid')) settings.push('pk'); // Infer PK
       
       let settingStr = settings.length > 0 ? ` [${settings.join(', ')}]` : '';
       dbml += `  ${colName} ${type}${settingStr}\n`;
    }
  }
  dbml += '}\n\n';
}

dbml += '// Relationships\n';
const statements = text.split(';');
for (let stmt of statements) {
  if (stmt.includes('ALTER TABLE ONLY') && stmt.includes('ADD CONSTRAINT') && stmt.includes('FOREIGN KEY')) {
    let tableMatch = stmt.match(/ALTER TABLE ONLY ([a-zA-Z0-9_.]+)/);
    let fkMatch = stmt.match(/FOREIGN KEY \(([a-zA-Z0-9_]+)\) REFERENCES ([a-zA-Z0-9_.]+)\(([a-zA-Z0-9_]+)\)/);
    
    if (tableMatch && fkMatch) {
      let sourceTable = tableMatch[1].split('.').pop();
      let sourceCol = fkMatch[1];
      let targetTable = fkMatch[2].split('.').pop();
      let targetCol = fkMatch[3];
      dbml += `Ref: ${sourceTable}.${sourceCol} > ${targetTable}.${targetCol}\n`;
    }
  }
}

fs.writeFileSync('C:/Users/kylec/.gemini/antigravity/brain/5fce7c8b-3c74-40a3-9a4e-861bb0d3c669/thesis_erd_official.dbml', dbml);
console.log('Done!');
