const fs = require('fs');

function flattenFile(filename) {
  let css = fs.readFileSync(filename, 'utf8');

  // 1. Navbar bottom border
  css = css.replace(/border-bottom:\s*3px\s+solid\s+#f6be00\s*!important;/g, 'border-bottom: 0 !important;');

  // 2. Navbar before/after glow (remove background gradients containing f6be00)
  css = css.replace(/background:\s*linear-gradient\([^)]+#f6be00[^)]+\)\s*!important;/gi, 'background: transparent !important;');
  css = css.replace(/background:\s*radial-gradient\([^)]+#f6be00[^)]+\)\s*(?:,\s*linear-gradient\([^)]+\))?\s*!important;/gi, 'background: transparent !important;');
  css = css.replace(/background:\s*linear-gradient\([^)]+\)\s*,\s*radial-gradient\([^)]+#f6be00[^)]+\)\s*!important;/gi, 'background: transparent !important;');

  // 3. Remove heavy box shadows containing f6be00
  css = css.replace(/box-shadow:\s*0\s+0\s+12px\s+rgba\(246,\s*190,\s*0,\s*0\.\d+\)\s*!important;/gi, 'box-shadow: none !important;');
  // And general navbar shadow
  css = css.replace(/box-shadow:\s*0\s+10px\s+24px\s+rgba\(15,\s*23,\s*42,\s*0\.\d+\)\s*!important;/gi, 'box-shadow: none !important;');

  // 4. Also fix sidebar active link glow (remove the inset shadow with f6be00)
  css = css.replace(/box-shadow:\s*inset\s+3px\s+0\s+0\s+#f6be00\s*!important;/gi, 'box-shadow: none !important;');

  fs.writeFileSync(filename, css, 'utf8');
}

flattenFile('src/styles/adviser-dashboard.css');
flattenFile('src/styles/admin-dashboard.css');
flattenFile('src/styles/program-head-portal.css');

console.log('Flattened all remaining role portals!');
