import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/styles');

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Replace background-color: white; and similar
  content = content.replace(/background(-color)?:\s*(?:#ffffff|#fff|white|#F8FAFC|#F1F5F9)\b/ig, 'background$1: var(--surface)');
  // Replace background: rgb(255 255 255 / 0.96) or similar
  content = content.replace(/background(-color)?:\s*(?:rgba?\([^\)]+\)|#ffffff[0-9a-fA-F]{2})\b/ig, (match, p1) => {
      if(match.includes('255, 255, 255') || match.includes('255 255 255') || match.toLowerCase().includes('#ffffff')) {
          return 'background' + (p1 || '') + ': var(--surface)';
      }
      return match;
  });
  // Replace color: #333 or similar (gray text) with var(--text)
  content = content.replace(/color:\s*#(?:333333|333|475569|64748b|1e293b|0f172a)\b/ig, 'color: var(--text)');
  // Replace border color for white/light gray
  content = content.replace(/border(-color)?:\s*#(?:e2e8f0|cbd5e1|f1f5f9|f8fafc|ffffff|fff)\b/ig, 'border$1: var(--border)');
  
  fs.writeFileSync(file, content, 'utf8');
}
console.log('Finished updating css files');
