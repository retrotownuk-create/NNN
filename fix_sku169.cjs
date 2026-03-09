const fs = require('fs');
const file = '/Users/abdulbarinoori/Downloads/sdd/src/App.tsx';
let source = fs.readFileSync(file, 'utf8');

const tStr = `  const buildSide = (x: number, side: 'left' | 'right') => {`;

const repStr = `  if (skuType === 'sku169') {
    const numMounts = Math.max(2, Math.ceil(length / 120) + 1);
    const mountSpacing = length / (numMounts - 1);
    // Diagonal handrail logic based on OrderDetailsView
    // This is a placeholder structural logic to restore 3D rendering
    return (
      <group position={[0, -height / 2 + 10, 0]}>
        {Array.from({ length: numMounts }).map((_, i) => {
          const x = -length / 2 + i * mountSpacing;
          const isEnd = i === 0 || i === numMounts - 1;
          return (
            <group key={i} position={[x, 0, 0]}>
              <Flange position={[0, 0, -wallDistance]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              <HexNipple position={[0, 0, -wallDistance + 2.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              <Elbow position={[0, 0, -wallDistance + 5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              <HexNipple position={[0, -2.5, -wallDistance + 5]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              {isEnd ? (
                <Elbow position={[0, -5, -wallDistance + 5]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              ) : (
                <TFitting position={[0, -5, -wallDistance + 5]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              )}
            </group>
          );
        })}
        {/* Handrail pipes */}
        {Array.from({ length: numMounts - 1 }).map((_, i) => {
          const startX = -length / 2 + i * mountSpacing;
          const endX = startX + mountSpacing;
          return (
            <Pipe key={'rail' + i} start={[startX, -5, -wallDistance + 5]} end={[endX, -5, -wallDistance + 5]} colorOption={colorOption} showLabel={showLabel}/>
          );
        })}
      </group>
    );
  }

  const buildSide = (x: number, side: 'left' | 'right') => {`;

if (source.includes(tStr) && !source.includes("if (skuType === 'sku169')")) {
    source = source.replace(tStr, repStr);
    fs.writeFileSync(file, source);
    console.log("Success");
} else {
    console.log("Failed: either anchor missing or sku already exists");
}
