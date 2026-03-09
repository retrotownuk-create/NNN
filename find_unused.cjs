const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const defs = [...content.matchAll(/const default(\d+): SavedSKU = {.*?skuType: '([^']+)'/g)].map(m => m[2]);
const rack = content.substring(content.indexOf('const Rack ='), content.indexOf('const Scene ='));
const used = new Set([...rack.matchAll(/skuType === '([^']+)'/g)].map(m => m[1]));

const unused = defs.filter(d => !used.has(d));
console.log('Unused SKUs:', unused.length);
console.log(unused.join(', '));
