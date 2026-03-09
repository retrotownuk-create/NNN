const fs = require('fs');
const content = fs.readFileSync('src/OrderDetailsView.tsx', 'utf8');

const regex = /skuType === '([^']+)'/g;
let match;
const used = new Set();
while ((match = regex.exec(content)) !== null) {
  used.add(match[1]);
}

const defs = require('fs').readFileSync('find_unused.cjs', 'utf8');
const appUsed = new Set();
const rackCodeMatch = fs.readFileSync('src/App.tsx', 'utf8').substring(fs.readFileSync('src/App.tsx', 'utf8').indexOf('const Rack ='), fs.readFileSync('src/App.tsx', 'utf8').indexOf('const Scene ='));
while ((match = regex.exec(rackCodeMatch)) !== null) {
  appUsed.add(match[1]);
}

console.log('In App.tsx but NOT OrderDetailsView.tsx:');
console.log([...appUsed].filter(x => !used.has(x)).join(', '));
console.log('In OrderDetailsView.tsx but NOT App.tsx:');
console.log([...used].filter(x => !appUsed.has(x)).join(', '));
