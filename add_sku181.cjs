const fs = require('fs');

const appPath = 'src/App.tsx';
let appCode = fs.readFileSync(appPath, 'utf8');

// 1. Add 'sku181' to the SKU type definitions
appCode = appCode.replace(/\| 'sku180'/g, "| 'sku180' | 'sku181'");

// 2. Add default config for sku181
const default181Str = `        const default181: SavedSKU = { name: 'SKU 181', length: 30, height: 30, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku181' };\n        const default180:`;
appCode = appCode.replace(/        const default180:/g, default181Str);

appCode = appCode.replace(/default179, default180/g, 'default179, default180, default181');

// 3. Add geometry before sku888
const sku181Geom = `  if (skuType === 'sku181') {
    const e = explode * 1.5;

    // Use height for vertical pole (default 30), wallDistance for stem (default 5)
    const actualHeight = getPipesForLength(Math.max(0, height)).reduce((a, b) => a + b, 0) || 30;
    const actualStem = getPipesForLength(Math.max(0, wallDistance)).reduce((a, b) => a + b, 0) || 5;

    // Shift group down a bit to center it
    const groupY = -actualHeight / 2;

    return (
      <group position={[0, groupY, actualStem / 2]}>
        {/* Wall Flange at -Z */}
        <group position={[0, 0, -actualStem - 4.4 - e * 2]}>
          <Flange position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Stem pipe from wall to T-Fitting */}
        <group position={[0, 0, -e]}>
          <Pipe start={[0, 0, -actualStem - 2.2]} end={[0, 0, -2.2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* T-Fitting in center */}
        {/* With rotation [0, Math.PI, 0], branch points to -Z, straight is along Y */}
        <group position={[0, 0, 0]}>
          <TFitting position={[0, 0, 0]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Bottom Hex Nipple and End Cap */}
        <group position={[0, -e, 0]}>
          <HexNipple position={[0, -1.95, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, -e * 2, 0]}>
          <EndCap position={[0, -3.9, 0]} rotation={[Math.PI, 0, 0]} labelText="In cap" showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Vertical Top Pole (30cm) */}
        <group position={[0, e, 0]}>
          <Pipe start={[0, 2.2, 0]} end={[0, actualHeight + 2.2, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Top End Cap */}
        <group position={[0, e * 2, 0]}>
          <EndCap position={[0, actualHeight + 4.4, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

      </group>
    );
  }

  if (skuType === 'sku888')`;

appCode = appCode.replace(/  if \(skuType === 'sku888'\)/g, sku181Geom);

// 4. Update the sliders
// Exclude Length slider for sku181 since it only goes up and from wall
appCode = appCode.replace(/skuType === 'sku150'\)/, "skuType === 'sku150' || skuType === 'sku181')"); 
// Oh wait, the Length slider is actually enabled by NOT being in the excluded list, or by being in the included list?
// Let's actually look at App.tsx lines 8880-8910 using file content modification next. 

fs.writeFileSync(appPath, appCode);
console.log('App.tsx geometric operations updated for sku181.');

const orderPath = 'src/OrderDetailsView.tsx';
let orderCode = fs.readFileSync(orderPath, 'utf8');

// Replace unions
orderCode = orderCode.replace(/\| 'sku180'/g, "| 'sku180' | 'sku181'");

// Exclude from fallback list
orderCode = orderCode.replace(/&& skuType !== 'sku180'/g, "&& skuType !== 'sku180' && skuType !== 'sku181'");

// Add cutlist logic
const cutlist181 = `  } else if (skuType === 'sku181') {
    addPipes(height, 1, 'p-vert');
    addPipes(wallDistance, 1, 'p-wall');
    
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 1);
    addFitting('f-end-caps', 'End Caps', quantity * 2);
    
    const heightCouplings = getExtraCouplings(height, 1);
    const wallCouplings = getExtraCouplings(wallDistance, 1);
    if (heightCouplings + wallCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * (heightCouplings + wallCouplings));
    }
  } else if (skuType === 'sku144') {`;

orderCode = orderCode.replace(/  } else if \(skuType === 'sku144'\) \{/g, cutlist181);

fs.writeFileSync(orderPath, orderCode);
console.log('OrderDetailsView.tsx updated for sku181.');
