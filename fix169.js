const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(/if \(skuType === 'sku169'\) \{[\s\S]*?if \(skuType === 'sku160'\)/, "if (skuType === 'sku160')");
fs.writeFileSync('src/App.tsx', code);
