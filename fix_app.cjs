const fs = require('fs');
const file = '/Users/abdulbarinoori/Downloads/sdd/src/App.tsx';
let source = fs.readFileSync(file, 'utf8');

const tStr = `  const buildSide = (x: number, side: 'left' | 'right') => {`;

const repStr = `  if (skuType === 'sku158') {
    const e = explode * 1.5;
    const zTee = -4.0;
    const zElbow = 0;
    const zWallSurface = -wallDistance;
    const yTee = 0;
    const yFlangeTop = yTee + 3.0;

    return (
      <group position={[0, -height / 2 + 10, 0]}>
        {/* Left Side */}
        <group position={[leftX + 2.5, 0, 0]}>
          <group position={[0, 0, -e]}>
            <Flange position={[0, yTee, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[0, yTee, zWallSurface + 1.5]} end={[0, yTee, zTee - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, 0]}>
            <TFitting position={[0, yTee, zTee]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 0.5, 0]}>
            <Pipe start={[0, yTee + 1.5, zTee]} end={[0, yFlangeTop - 1.0, zTee]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 1.0, 0]}>
            <Flange position={[0, yFlangeTop, zTee]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, e * 0.5]}>
            <Pipe start={[0, yTee, zTee + 1.5]} end={[0, yTee, zElbow - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, e * 1.0]}>
            <Elbow position={[0, yTee, zElbow]} rotation={[0, Math.PI, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* Right Side */}
        <group position={[rightX - 2.5, 0, 0]}>
          <group position={[0, 0, -e]}>
            <Flange position={[0, yTee, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[0, yTee, zWallSurface + 1.5]} end={[0, yTee, zTee - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, 0]}>
            <TFitting position={[0, yTee, zTee]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 0.5, 0]}>
            <Pipe start={[0, yTee + 1.5, zTee]} end={[0, yFlangeTop - 1.0, zTee]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 1.0, 0]}>
            <Flange position={[0, yFlangeTop, zTee]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, e * 0.5]}>
            <Pipe start={[0, yTee, zTee + 1.5]} end={[0, yTee, zElbow - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, e * 1.0]}>
            <Elbow position={[0, yTee, zElbow]} rotation={[0, Math.PI, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* Horizontal Bar */}
        <group position={[0, 0, e * 1.0]}>
          <Pipe start={[leftX + 2.5 + 1.5, yTee, zElbow]} end={[rightX - 2.5 - 1.5, yTee, zElbow]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku159') {
    const e = explode * 1.5;

    const zElbow = 0;
    const zWallSurface = -30.0;
    const yTee = 0;
    
    const leftTx = leftX + 5.0;
    const rightTx = rightX - 5.0;

    const eZ = zWallSurface + 4.5;
    const eY = eZ;

    const diagTopY = yTee - 1.556;
    const diagTopZ = zElbow - 1.556;
    
    const diagBotY = eY + 1.414;
    const diagBotZ = eZ + 1.414;

    return (
      <group position={[0, -height / 2 + 10, 0]}>
        {/* Left Side */}
        <group position={[0, 0, 0]}>
          <group position={[0, 0, -e]}>
            <Flange position={[leftX, yTee, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[leftX, yTee, zWallSurface + 1.5]} end={[leftX, yTee, zElbow - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, 0]}>
            <Elbow position={[leftX, yTee, zElbow]} rotation={[0, Math.PI, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          
          <group position={[e * 0.5, 0, 0]}>
            <HexNipple position={[leftX + 3.2, yTee, zElbow]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[e * 1.0, 0, 0]}>
            <TFitting position={[leftTx, yTee, zElbow]} rotation={[-Math.PI / 4, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          <group position={[e * 1.0, -e * 0.5, -e * 0.5]}>
            <Pipe start={[leftTx, diagTopY, diagTopZ]} end={[leftTx, diagBotY, diagBotZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[e * 1.0, -e * 1.0, -e * 1.0]}>
            <FortyFiveElbow position={[leftTx, eY, eZ]} rotation={[Math.PI / 2, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[e * 1.0, -e * 1.5, -e * 1.5]}>
            <HexNipple position={[leftTx, eY, zWallSurface + 1.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[e * 1.0, -e * 2.0, -e * 2.0]}>
            <Flange position={[leftTx, eY, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* Right Side */}
        <group position={[0, 0, 0]}>
          <group position={[0, 0, -e]}>
            <Flange position={[rightX, yTee, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[rightX, yTee, zWallSurface + 1.5]} end={[rightX, yTee, zElbow - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, 0]}>
            <Elbow position={[rightX, yTee, zElbow]} rotation={[0, Math.PI, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          
          <group position={[-e * 0.5, 0, 0]}>
            <HexNipple position={[rightX - 3.2, yTee, zElbow]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[-e * 1.0, 0, 0]}>
            <TFitting position={[rightTx, yTee, zElbow]} rotation={[-Math.PI / 4, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          <group position={[-e * 1.0, -e * 0.5, -e * 0.5]}>
            <Pipe start={[rightTx, diagTopY, diagTopZ]} end={[rightTx, diagBotY, diagBotZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[-e * 1.0, -e * 1.0, -e * 1.0]}>
            <FortyFiveElbow position={[rightTx, eY, eZ]} rotation={[Math.PI / 2, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[-e * 1.0, -e * 1.5, -e * 1.5]}>
            <HexNipple position={[rightTx, eY, zWallSurface + 1.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[-e * 1.0, -e * 2.0, -e * 2.0]}>
            <Flange position={[rightTx, eY, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* Horizontal Bar */}
        <group position={[0, 0, e * 1.0]}>
          {(() => {
            const hPipes = getPipesForLength(length);
            const railL_base = leftTx + 1.8;
            const railR_base = rightTx - 1.8;
            const totalW = railR_base - railL_base;

            const pipeGap = hPipes.length > 1 ? e * 2 : 0;
            const segW = totalW / hPipes.length;

            return (
              <group>
                {hPipes.map((p, idx) => {
                  const startX_n = railL_base + (idx * segW);
                  const endX_n = railL_base + ((idx + 1) * segW);

                  const centerSep = (idx - (hPipes.length - 1) / 2) * pipeGap;
                  const startX = startX_n + centerSep + (idx === 0 ? -e : idx === hPipes.length - 1 ? e : 0);
                  const endX = endX_n + centerSep + (idx === 0 ? -e : idx === hPipes.length - 1 ? e : 0);

                  return (
                    <group key={idx}>
                      <Pipe start={[startX, yTee, zElbow]} end={[endX, yTee, zElbow]} colorOption={colorOption} showLabel={showLabel} />
                      {idx < hPipes.length - 1 && (
                        <Coupling position={[endX + pipeGap / 2, yTee, zElbow]} rotation={[0, 0, Math.PI / 2]} colorOption={colorOption} showLabel={showLabel} />
                      )}
                    </group>
                  );
                })}
              </group>
            );
          })()}
        </group>
      </group>
    );
  }

  const buildSide = (x: number, side: 'left' | 'right') => {`;

if (source.includes(tStr) && !source.includes("if (skuType === 'sku159')")) {
    source = source.replace(tStr, repStr);
    fs.writeFileSync(file, source);
    console.log("Success");
} else {
    console.log("Failed " + source.includes(tStr) + " " + source.includes("if (skuType === 'sku159')"));
}
