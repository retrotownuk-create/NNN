const fs = require('fs');

try {
  let app = fs.readFileSync('src/App.tsx', 'utf8');

  const sku183Logic = `
  if (skuType === 'sku183') {
    const e = explode * 1.5;
    
    // Flange at Top -> Vertical Pipe -> Reducer at Bottom
    const actualHeight = getPipesForLength(Math.max(0, height)).reduce((a, b) => a + b, 0) || 10;

    return (
      <group position={[0, -actualHeight / 2, 0]}>
        {/* Reducer at bottom, faces UP (+Y) */}
        <group position={[0, -e, 0]}>
          <Reducer position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Vertical Pipe */}
        <group position={[0, 0, 0]}>
          {/* Reducer top collar is at Y=0.5. Flange sits at actualHeight + 0.5 */}
          <Pipe start={[0, 0.5, 0]} end={[0, actualHeight + 0.5, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Top Flange facing DOWN (-Y) */}
        <group position={[0, actualHeight + 0.5 + e, 0]}>
          <Flange position={[0, 0, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }
`;

  if (!app.includes("skuType === 'sku183'")) {
    app = app.replace("if (skuType === 'sku179')", sku183Logic + "\n  if (skuType === 'sku179')");
  }

  if (!app.includes("default183:")) {
    const default183Code = "        const default183: SavedSKU = { name: 'SKU 183 (Table Leg)', length: 15, height: 75, wallDistance: 0, hasShelves: false, isFreestanding: true, colorName: 'Black', skuType: 'sku183' };\n";
    app = app.replace("const default182: SavedSKU =", default183Code + "        const default182: SavedSKU =");
    app = app.replace(/\| 'sku182'/g, "| 'sku182' | 'sku183'");
    
    // For conditions testing skuTypes:
    app = app.replace(/skuType === 'sku182'\)/g, "skuType === 'sku182' || skuType === 'sku183')");
    app = app.replace(/skuType === 'sku182' \?/g, "(skuType === 'sku182' || skuType === 'sku183') ?");
    app = app.replace(/skuType === 'sku181' \|\| skuType === 'sku182'/g, "skuType === 'sku181' || skuType === 'sku182' || skuType === 'sku183'");
    
    app = app.replace("default181, default182", "default181, default182, default183");
  }

  // FORCE CACHE INVALIDATION
  app = app.replace("const APP_VERSION = 'v6_sku182_v3';", "const APP_VERSION = 'v6_sku183';");

  fs.writeFileSync('src/App.tsx', app);
  console.log('Saved App.tsx');

  let order = fs.readFileSync('src/OrderDetailsView.tsx', 'utf8');
  if (!order.includes('sku183')) {
    order = order.replace(/\| 'sku182'/g, "| 'sku182' | 'sku183'");
    order = order.replace(/skuType !== 'sku182'/g, "skuType !== 'sku182' && skuType !== 'sku183'");

    const orderLogic = `
  } else if (skuType === 'sku183') {
    addPipes(height, 1, 'p-vert');
    addFitting('f-wall-flanges', 'Flange', quantity * 1);
    addFitting('f-reducers', 'Reducers', quantity * 1);
    const pipeCouplings = getExtraCouplings(height, 1);
    if (pipeCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * pipeCouplings);
    }
  } else if (skuType === 'sku144') {`;
    
    order = order.replace("} else if (skuType === 'sku144') {", orderLogic);
    fs.writeFileSync('src/OrderDetailsView.tsx', order);
    console.log('Saved OrderDetailsView.tsx');
  } else {
    console.log('sku183 already in OrderDetailsView.tsx');
  }

} catch(e) {
  console.error(e);
}
