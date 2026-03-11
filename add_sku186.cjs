const fs = require('fs');

try {
  let app = fs.readFileSync('src/App.tsx', 'utf8');

  // Add Plug component
  const plugCode = `const Plug = ({ position, rotation = [0, 0, 0], showLabel, labelText = "In Cap", colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean, labelText?: string, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[1.4, 1.0, 1.4]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.2, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 0.6, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text={labelText} type="fitting" lineClass="h-8" />}
    </group>
  );
};

`;
  if (!app.includes("const Plug =")) {
    app = app.replace("const Reducer =", plugCode + "const Reducer =");
  }

  // Add sku186 rendering logic right after sku184
  const sku186Logic = `  if (skuType === 'sku186') {
    const e = explode * 1.5;

    return (
      <group position={[0, -2, 2.9]}>
        {/* Wall Flange at -Z wall */}
        <group position={[0, 0, -5.4 - e * 2]}>
          <Flange position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Hex Nipple connecting Flange to T-Fitting */}
        <group position={[0, 0, -2.4 - e]}>
          <HexNipple position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Center T-Fitting */}
        <group position={[0, 0, 0]}>
          <TFitting position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* --- LEFT SIDE HOOK --- */}
        <group position={[-3.4 - e, 0, 0]}>
          <HexNipple position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-6.8 - e * 2, 0, 0]}>
          <Elbow position={[0, 0, 0]} rotation={[-Math.PI, Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-6.8 - e * 2, 2.2 + e, 0]}>
          <Plug position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* --- RIGHT SIDE HOOK --- */}
        <group position={[3.4 + e, 0, 0]}>
          <HexNipple position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[6.8 + e * 2, 0, 0]}>
          <Elbow position={[0, 0, 0]} rotation={[-Math.PI, -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[6.8 + e * 2, 2.2 + e, 0]}>
          <Plug position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

`;
  if (!app.includes("if (skuType === 'sku186') {")) {
    const insertPoint = "  if (skuType === 'sku179')";
    app = app.replace(insertPoint, sku186Logic + insertPoint);
  }

  // Type definition and arrays
  if (!app.includes("| 'sku186'")) {
    app = app.replace(/\| 'sku184'/g, "| 'sku184' | 'sku186'");
    
    // UI logic checks
    app = app.replace(/skuType === 'sku184'\)/g, "skuType === 'sku184' || skuType === 'sku186')");
    app = app.replace(/skuType === 'sku183' \|\| skuType === 'sku184'/g, "skuType === 'sku183' || skuType === 'sku184' || skuType === 'sku186'");
    app = app.replace(/\|\| skuType === 'sku184'\) \?/g, "|| skuType === 'sku184' || skuType === 'sku186') ?");
  }

  // Default configuration
  if (!app.includes("const default186:")) {
    const default186Code = "                                const default186: SavedSKU = { name: 'SKU 186 (Double Hook plugged)', length: 5, height: 0, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku186' };\n";
    app = app.replace("const default184: SavedSKU =", default186Code + "                                const default184: SavedSKU =");
    app = app.replace("default183, default184", "default183, default184, default186");
  }

  app = app.replace(/APP_VERSION = 'v6_sku\w+'/g, "APP_VERSION = 'v6_sku186';");

  fs.writeFileSync('src/App.tsx', app);
  console.log('App.tsx updated');

  let order = fs.readFileSync('src/OrderDetailsView.tsx', 'utf8');
  if (!order.includes('sku186')) {
    order = order.replace(/\| 'sku184'/g, "| 'sku184' | 'sku186'");
    order = order.replace(/skuType !== 'sku184'/g, "skuType !== 'sku184' && skuType !== 'sku186'");

    const orderLogic = `
  } else if (skuType === 'sku184') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 5);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-end-caps', 'End Caps', quantity * 2);
  } else if (skuType === 'sku186') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 3);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-end-caps', 'In caps', quantity * 2);
`;
    order = order.replace(/\} else if \(skuType === 'sku184'\) \{[\s\S]*?\} else if/s, orderLogic.substring(orderLogic.indexOf("}") + 2) + "  } else if");

    fs.writeFileSync('src/OrderDetailsView.tsx', order);
    console.log('OrderDetailsView.tsx updated');
  } else {
    console.log('sku186 already in OrderDetailsView.tsx');
  }

} catch(e) {
  console.error(e);
}
