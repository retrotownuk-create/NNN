const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex143 = /if \(skuType === 'sku143'\) \{([\s\S]*?)        \{\/\* --- Diagonal Rail Pipes/g;
const match = regex143.exec(code);

const replacement = `if (skuType === 'sku143' || skuType === 'sku169') {
    // Brackets every 120cm max (matching max pipe length)
    const numMounts = Math.max(2, Math.ceil(length / 120) + 1);
    const e = explode * 1.5;
    const wallZ = -8;          // wall face position in Z
    const railZ = wallZ + 5;   // rail at 5cm out from wall (Z = -3)

    const startX = -length / 2;
    const endX = length / 2;
    const startY = height / 2;   // high end (top of stairs)
    const endY = -height / 2;   // low end (bottom of stairs)

    const isThin = tubeType === 'square';
    const railRad = isThin ? 1.35 : 1.65;

    // Slope angle θ of the rail in the XY plane
    const \u03B8 = Math.atan2(endY - startY, endX - startX);

    // Wall bracket alignment: 
    // They extend straight down exactly perpendicular to the slope \u03B8.
    const perpDirX = Math.sin(\u03B8);
    const perpDirY = -Math.cos(\u03B8);

    const startElbowRot: [number, number, number] = [0, -Math.PI / 2, \u03B8 + Math.PI / 2];
    const endElbowRot: [number, number, number] = [0, Math.PI / 2, \u03B8 - Math.PI / 2];
    const tFitRot: [number, number, number] = [0, -Math.PI / 2, \u03B8 - Math.PI / 2];
    const perpNippleRot: [number, number, number] = [0, 0, \u03B8 - Math.PI];
    const baseElbowRot: [number, number, number] = [0, Math.PI, \u03B8 - Math.PI];

    return (
      <group position={[0, height / 2, -wallZ / 2]}>
        {/* --- Wall Brackets --- */}
        {Array.from({ length: numMounts }).map((_, i) => {
          const t = i / (numMounts - 1);
          const mx = startX + t * (endX - startX);
          const my = startY + t * (endY - startY);

          const isFirst = i === 0;
          const isLast = i === numMounts - 1;
          const xExp = isFirst ? -e : (isLast ? e : 0);
          
          const nx = mx + 2.7 * perpDirX;
          const ny = my + 2.7 * perpDirY;
          
          const ex = mx + 5.0 * perpDirX;
          const ey = my + 5.0 * perpDirY;

          return (
            <group key={\`mount-\${i}\`} position={[xExp, 0, 0]}>
              <group position={[0, 0, -e]}>
                <Flange position={[ex, ey, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              <group position={[0, 0, -e * 0.75]}>
                <HexNipple position={[ex, ey, wallZ + 2.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              <group position={[0, -e * 0.5, -e * 0.5]}>
                <Elbow position={[ex, ey, railZ]} rotation={baseElbowRot} showLabel={showLabel} colorOption={colorOption} />
              </group>

              <group position={[0, -e * 0.25, -e * 0.25]}>
                <HexNipple position={[nx, ny, railZ]} rotation={perpNippleRot} showLabel={showLabel} colorOption={colorOption} />
              </group>

              {/* Fitting at rail connects perpendicular downward nipple to diagonal rail */}
              <group position={[mx, my, railZ]}>
                {isFirst ? (
                  <Elbow position={[0, 0, 0]} rotation={startElbowRot} showLabel={showLabel} colorOption={colorOption} />
                ) : isLast ? (
                  <Elbow position={[0, 0, 0]} rotation={endElbowRot} showLabel={showLabel} colorOption={colorOption} />
                ) : (
                  <TFitting position={[0, 0, 0]} rotation={tFitRot} showLabel={showLabel} colorOption={colorOption} />
                )}
              </group>
            </group>
          );
        })}

        {/* --- Diagonal Rail Pipes`;

code = code.replace(/if \(skuType === 'sku143'\) \{[\s\S]*?\{\/\* --- Diagonal Rail Pipes/g, replacement);

// And we need to remove the whole sku169 block since they now cleanly share!
code = code.replace(/if \(skuType === 'sku169'\) \{[\s\S]*?if \(skuType === 'sku160'\)/g, "if (skuType === 'sku160')");

fs.writeFileSync('src/App.tsx', code);
