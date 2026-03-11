const fs = require('fs');

try {
  let app = fs.readFileSync('src/App.tsx', 'utf8');

  const sku184Logic = `  if (skuType === 'sku184') {
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

  if (skuType === 'sku185') {
    const e = explode * 1.5;

    return (
      <group position={[0, -2, 2.9]}>
        {/* Wall Flange at -Z wall */}
        <group position={[0, 0, -5.8 - e * 3]}>
          <Flange position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Hex Nipple connecting Flange to T-Fitting */}
        <group position={[0, 0, -2.8 - e * 1.5]}>
          <HexNipple position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Center T-Fitting */}
        <group position={[0, 0, 0]}>
          <TFitting position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* --- LEFT SIDE HOOK --- */}
        <group position={[-2.8 - e, 0, 0]}>
          <HexNipple position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-5.6 - e * 2, 0, 0]}>
          <Elbow position={[0, 0, 0]} rotation={[-Math.PI, Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-5.6 - e * 2, 2.8 + e, 0]}>
          <HexNipple position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-5.6 - e * 2, 4.4 + e * 2, 0]}>
          <EndCap position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* --- RIGHT SIDE HOOK --- */}
        <group position={[2.8 + e, 0, 0]}>
          <HexNipple position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[5.6 + e * 2, 0, 0]}>
          <Elbow position={[0, 0, 0]} rotation={[-Math.PI, -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[5.6 + e * 2, 2.8 + e, 0]}>
          <HexNipple position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[5.6 + e * 2, 4.4 + e * 2, 0]}>
          <EndCap position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }`;

  const startIdx = app.indexOf("  if (skuType === 'sku184') {");
  const endIdx = app.indexOf("  if (skuType === 'sku179')", startIdx);
  
  if (startIdx !== -1 && endIdx !== -1) {
    app = app.substring(0, startIdx) + sku184Logic + "\n\n" + app.substring(endIdx);
  }

  if (!app.includes("default185:")) {
    const default185Code = "                                const default185: SavedSKU = { name: 'SKU 185 (Double Hook)', length: 5, height: 0, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku185' };\n";
    app = app.replace("const default184: SavedSKU =", default185Code + "                                const default184: SavedSKU =");
    
    // Add sku185 to the type and lists
    app = app.replace(/\| 'sku184'/g, "| 'sku184' | 'sku185'");
    
    app = app.replace(/skuType === 'sku184'\)/g, "skuType === 'sku184' || skuType === 'sku185')");
    app = app.replace(/skuType === 'sku183' \|\| skuType === 'sku184'/g, "skuType === 'sku183' || skuType === 'sku184' || skuType === 'sku185'");
    app = app.replace(/\|\| skuType === 'sku184'\) \?/g, "|| skuType === 'sku184' || skuType === 'sku185') ?");
    
    app = app.replace("default183, default184", "default183, default184, default185");
  }

  // FORCE CACHE INVALIDATION
  app = app.replace(/APP_VERSION = 'v6_sku\w+'/g, "APP_VERSION = 'v6_sku185';");

  fs.writeFileSync('src/App.tsx', app);
  console.log('Saved App.tsx');

  let order = fs.readFileSync('src/OrderDetailsView.tsx', 'utf8');
  if (!order.includes('sku185')) {
    order = order.replace(/\| 'sku184'/g, "| 'sku184' | 'sku185'");
    order = order.replace(/skuType !== 'sku184'/g, "skuType !== 'sku184' && skuType !== 'sku185'");

    const orderLogic = `
  } else if (skuType === 'sku184') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 1);
    addFitting('f-end-caps', 'End Caps', quantity * 1);
  } else if (skuType === 'sku185') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 5);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-end-caps', 'End Caps', quantity * 2);
  } else if (skuType === 'sku144') {`;
    
    const orderStart = order.indexOf("  } else if (skuType === 'sku184') {");
    const orderEnd = order.indexOf("  } else if (skuType === 'sku144') {", orderStart) + "  } else if (skuType === 'sku144') {".length;
    
    order = order.substring(0, orderStart) + orderLogic.trim() + " {\n    // Wall-mounted" + order.substring(orderEnd).replace(/^\w+/, '');
    
    fs.writeFileSync('src/OrderDetailsView.tsx', order);
    console.log('Saved OrderDetailsView.tsx');
  } else {
    console.log('sku185 already in OrderDetailsView.tsx');
  }

} catch(e) {
  console.error(e);
}
