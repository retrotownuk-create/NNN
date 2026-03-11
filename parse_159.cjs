const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');
let in159 = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("if (skuType === 'sku159')")) in159 = true;
  if (in159 && lines[i].includes("if (skuType === 'sku160')")) break;
  if (in159) console.log(lines[i]);
}
