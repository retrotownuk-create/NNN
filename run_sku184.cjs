const fs = require('fs');

try {
  let app = fs.readFileSync('src/App.tsx', 'utf8');

  const sku184Logic = `
  if (skuType === 'sku184') {
    const e = explode * 1.5;

    return (
      <group position={[0, 0, 0]}>
        {/* Wall Flange at -Z wall */}
        <group position={[0, 0, -e * 2]}>
          <Flange position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Hex Nipple */}
        <group position={[0, 0, 2.75 - e]}>
          <HexNipple position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* End Cap directly on Hex Nipple */}
        <group position={[0, 0, 4.0]}>
          <EndCap position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }
`;

  if (!app.includes("skuType === 'sku184'")) {
    app = app.replace("if (skuType === 'sku179')", sku184Logic + "\n  if (skuType === 'sku179')");
  }

  if (!app.includes("default184:")) {
    const default184Code = "        const default184: SavedSKU = { name: 'SKU 184 (Short Peg)', length: 5, height: 0, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku184' };\n";
    app = app.replace("const default183: SavedSKU =", default184Code + "        const default183: SavedSKU =");
    app = app.replace(/\| 'sku183'/g, "| 'sku183' | 'sku184'");
    
    app = app.replace(/skuType === 'sku183'\)/g, "skuType === 'sku183' || skuType === 'sku184')");
    app = app.replace(/skuType === 'sku183' \?/g, "(skuType === 'sku183' || skuType === 'sku184') ?");
    app = app.replace(/skuType === 'sku182' \|\| skuType === 'sku183'/g, "skuType === 'sku182' || skuType === 'sku183' || skuType === 'sku184'");
    
    app = app.replace("default182, default183", "default182, default183, default184");
  }

  // FORCE CACHE INVALIDATION
  app = app.replace(/APP_VERSION = 'v6_sku\w+'/g, "APP_VERSION = 'v6_sku184';");

  fs.writeFileSync('src/App.tsx', app);
  console.log('Saved App.tsx');

  let order = fs.readFileSync('src/OrderDetailsView.tsx', 'utf8');
  if (!order.includes('sku184')) {
    order = order.replace(/\| 'sku183'/g, "| 'sku183' | 'sku184'");
    order = order.replace(/skuType !== 'sku183'/g, "skuType !== 'sku183' && skuType !== 'sku184'");

    const orderLogic = `
  } else if (skuType === 'sku184') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 1);
    addFitting('f-end-caps', 'End Caps', quantity * 1);
  } else if (skuType === 'sku144') {`;
    
    order = order.replace("} else if (skuType === 'sku144') {", orderLogic);
    fs.writeFileSync('src/OrderDetailsView.tsx', order);
    console.log('Saved OrderDetailsView.tsx');
  } else {
    console.log('sku184 already in OrderDetailsView.tsx');
  }

} catch(e) {
  console.error(e);
}
