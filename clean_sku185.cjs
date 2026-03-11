const fs = require('fs');

try {
  let app = fs.readFileSync('src/App.tsx', 'utf8');

  // remove unions
  app = app.replace(/ \| 'sku185'/g, "");
  
  // remove default array
  app = app.replace(/, default185/g, "");
  
  // remove default creation logic
  app = app.replace(/const default185: SavedSKU.*?;\n/g, "");
  app = app.replace(/const default185: SavedSKU.*?;/g, "");

  // fix conditionals
  app = app.replace(/skuType === 'sku184' \|\| skuType === 'sku185'/g, "skuType === 'sku184'");
  app = app.replace(/skuType === 'sku184' \|\| skuType === 'sku185'\)/g, "skuType === 'sku184')");
  
  app = app.replace(/APP_VERSION = 'v6_sku185'/g, "APP_VERSION = 'v6_sku184b'");

  // remove the rendering block
  const sku185Start = app.indexOf("  if (skuType === 'sku185') {");
  if (sku185Start !== -1) {
    const sku179Start = app.indexOf("  if (skuType === 'sku179')", sku185Start);
    if (sku179Start !== -1) {
      app = app.substring(0, sku185Start) + app.substring(sku179Start);
    }
  }

  // remove from boolean checks in sliders
  app = app.replace(/ \|\| skuType === 'sku185'/g, "");

  fs.writeFileSync('src/App.tsx', app);
  console.log('App.tsx cleaned');

} catch(e) {
  console.error(e);
}
