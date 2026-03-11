const fs = require('fs');

try {
  let app = fs.readFileSync('src/App.tsx', 'utf8');

  console.log('App.tsx size:', app.length);

  const valveCode = `
const RedValve = ({ position, rotation = [0, 0, 0], showLabel }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Base Silver Nut */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 1, 6]} />
        <meshStandardMaterial color="#d4d4d4" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Thin Silver Stem */}
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 2, 16]} />
        <meshStandardMaterial color="#d4d4d4" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Red Wheel Base */}
      <mesh castShadow receiveShadow position={[0, 2.7, 0]}>
        <cylinderGeometry args={[1, 1, 0.5, 16]} />
        <meshStandardMaterial color="#cc0000" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Red Wheel Spoke Edge */}
      <mesh castShadow receiveShadow position={[0, 3.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.4, 16, 16]} />
        <meshStandardMaterial color="#cc0000" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Red Wheel Inner Spokes */}
      <mesh castShadow receiveShadow position={[0, 3.0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 5, 16]} />
        <meshStandardMaterial color="#cc0000" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 3.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 5, 16]} />
        <meshStandardMaterial color="#cc0000" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Silver Top Nut */}
      <mesh castShadow receiveShadow position={[0, 3.2, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#d4d4d4" metalness={0.8} roughness={0.2} />
      </mesh>
      {showLabel && <Label text="Red Valve" type="fitting" lineClass="h-20" />}
    </group>
  );
};
`;

  const sku182Logic = `
  if (skuType === 'sku182') {
    const e = explode * 1.5;
    
    // Simple Flange -> 90 Elbow -> Red Valve
    // Flange mounts to wall at Z=0.
    // 90 Elbow points UP (+Y).
    const actualStem = getPipesForLength(Math.max(0, wallDistance)).reduce((a, b) => a + b, 0) || 5;

    return (
      <group position={[0, 0, actualStem/2]}>
        {/* Wall Flange at -Z wall */}
        <group position={[0, 0, -actualStem - 4.4 - e * 2]}>
          <Flange position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Stem Pipe */}
        <group position={[0, 0, -e]}>
          <Pipe start={[0, 0, -actualStem - 2.2]} end={[0, 0, -2.2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* 90-Degree Elbow */}
        {/* Pointing from straight back inside from wall (-Z to +Y) */}
        <group position={[0, 0, 0]}>
          <Elbow position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* The Hex Nipple pointing up */}
        <group position={[0, e * 1, 0]}>
          <HexNipple position={[0, 2.2, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Red Valve pointing up (mounted into Hex Nipple) */}
        <group position={[0, e * 2, 0]}>
          <RedValve position={[0, 4.0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} />
        </group>
      </group>
    );
  }
`;

  if (!app.includes('RedValve =')) {
    app = app.replace('const Rack = ', valveCode + '\nconst Rack = ');
    console.log('Added RedValve component');
  }

  if (!app.includes("skuType === 'sku182'")) {
    app = app.replace("if (skuType === 'sku179')", sku182Logic + "\n  if (skuType === 'sku179')");
    console.log('Added sku182 logic');
  }

  if (!app.includes("default182:")) {
    const default182Code = "        const default182: SavedSKU = { name: 'SKU 182 (Red Valve Hook)', length: 15, height: 15, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku182' };\n";
    app = app.replace("const default181: SavedSKU =", default182Code + "        const default181: SavedSKU =");
    app = app.replace(/\| 'sku181'/g, "| 'sku181' | 'sku182'");
    app = app.replace(/skuType === 'sku181'/g, "skuType === 'sku181' || skuType === 'sku182'");
    app = app.replace(/\[default181\]/g, "[default181, default182]");
    console.log('Added sku182 defaults');
  }

  fs.writeFileSync('src/App.tsx', app);
  console.log('Saved App.tsx');

  let order = fs.readFileSync('src/OrderDetailsView.tsx', 'utf8');
  console.log('Order Details size:', order.length);
  
  if (!order.includes('sku182')) {
    order = order.replace(/\| 'sku181'/g, "| 'sku181' | 'sku182'");
    order = order.replace(/skuType !== 'sku181'/g, "skuType !== 'sku181' && skuType !== 'sku182'");

    const orderLogic = `
  } else if (skuType === 'sku182') {
    addPipes(wallDistance, 1, 'p-wall');
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-90-elbows', '90° Elbows', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 1);
    addFitting('f-red-valves', 'Red Valve Hook Part', quantity * 1);
    const wallCouplings = getExtraCouplings(wallDistance, 1);
    if (wallCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * wallCouplings);
    }
  } else if (skuType === 'sku144') {`;
    
    // Replace the exact string
    order = order.replace("} else if (skuType === 'sku144') {", orderLogic);
    
    fs.writeFileSync('src/OrderDetailsView.tsx', order);
    console.log('Saved OrderDetailsView.tsx');
  } else {
    console.log('sku182 already in OrderDetailsView.tsx');
  }

} catch(e) {
  console.error(e);
}
