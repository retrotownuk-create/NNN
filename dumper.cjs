const fs = require('fs');
const txt = fs.readFileSync('src/App.tsx', 'utf8');
const lines = txt.split('\n');
console.log(lines.slice(5010, 5070).join('\n'));
