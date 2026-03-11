const fs = require('fs');
const appPath = 'src/App.tsx';
let code = fs.readFileSync(appPath, 'utf8');

const regex = /if \(skuType === 'sku180'\) \{[\s\S]*?if \(skuType === 'sku888'\)/g;

const newBlock = `if (skuType === 'sku180') {
    const e = explode * 1.5;
    
    // Calculate actual stock pipe lengths matching cutlist
    const actualDrop = getPipesForLength(Math.max(0, height - 5)).reduce((a, b) => a + b, 0) || 5;
    const actualLen = getPipesForLength(Math.max(0, length - 5)).reduce((a, b) => a + b, 0) || 5;
    const actualDepth = getPipesForLength(Math.max(0, wallDistance - 5)).reduce((a, b) => a + b, 0) || 5;

    // Shift to center the corner rack in the camera view
    const groupX = (actualLen + 4.4) / 2;
    const groupY = -(actualDrop + 4.4) / 2;
    const groupZ = (actualDepth + 4.4) / 2;

    return (
      <group position={[groupX, groupY, groupZ]}>
        {/* Ceiling Flange */}
        <group position={[0, actualDrop + 4.4 + e * 2, 0]}>
          <Flange position={[0, 0, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Vertical Drop Pipe */}
        <group position={[0, e, 0]}>
          <Pipe start={[0, 2.2, 0]} end={[0, actualDrop + 2.2, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        
        {/* 3-Way Corner Elbow */}
        <group position={[0, 0, 0]}>
          {/* using side="left" with Z rotation Math.PI gives collars pointing UP(+Y), LEFT(-X), BACK(-Z) */}
          <CornerFitting position={[0, 0, 0]} side="left" rotation={[0, 0, Math.PI]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        
        {/* Horizontal Length Pipe (-X) */}
        <group position={[-e, 0, 0]}>
          <Pipe start={[-2.2, 0, 0]} end={[-actualLen - 2.2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Wall Flange for Length Pipe (Faces +X, sits at -X wall) */}
        <group position={[-actualLen - 4.4 - e * 2, 0, 0]}>
          <Flange position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Horizontal Depth Pipe (-Z) */}
        <group position={[0, 0, -e]}>
          <Pipe start={[0, 0, -2.2]} end={[0, 0, -actualDepth - 2.2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Wall Flange for Depth Pipe (Faces +Z, sits at -Z wall) */}
        <group position={[0, 0, -actualDepth - 4.4 - e * 2]}>
          <Flange position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku888')`;

if (regex.test(code)) {
  code = code.replace(regex, newBlock);
  fs.writeFileSync(appPath, code);
  console.log("Replaced using regex successfully!");
} else {
  console.log("Could not find regex match!");
}
