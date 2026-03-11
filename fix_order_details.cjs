const fs = require('fs');
let order = fs.readFileSync('src/OrderDetailsView.tsx', 'utf8');

// Replace unions and checks
if (!order.includes("| 'sku186'")) {
  order = order.replace(/\| 'sku184'/g, "| 'sku184' | 'sku186'");
  order = order.replace(/skuType !== 'sku184'/g, "skuType !== 'sku184' && skuType !== 'sku186'");
  fs.writeFileSync('src/OrderDetailsView.tsx', order);
  console.log('unions updated');
}
