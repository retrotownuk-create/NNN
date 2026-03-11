const fs = require('fs');
const file = './src/OrderDetailsView.tsx';
let txt = fs.readFileSync(file, 'utf8');

// The replacement was too aggressive.
// It replaced all three "skuType === 'sku300'" lines with the same cutlistPipes block because I used the string replace carelessly. Wait, NO. I used "REPLACEME_1", etc. But `sku300` appeared in multiple places.
txt = txt.replace("=== 'sku189' || skuType === 'sku190')", "=== 'sku189')");

// We'll just restore from the last git commit and apply it properly.
