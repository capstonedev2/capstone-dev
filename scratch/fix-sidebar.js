const fs = require('fs');
const path = 'c:/Users/kylec/Desktop/capstone dev 1/src/styles/adviser-dashboard.css';

let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// We want to remove lines 3087 to 3314 (1-indexed)
// This means indexes 3086 to 3313.
lines.splice(3086, 3314 - 3087 + 1);

fs.writeFileSync(path, lines.join('\n'));
console.log('Successfully removed custom adviser sidebar CSS.');
