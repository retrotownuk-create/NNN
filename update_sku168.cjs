const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

const sku168Regex = /if \(skuType === 'sku168'\) \{([\s\S]*?)if \(skuType === 'sku173'\)/;

const newSku168 = `if (skuType === 'sku168') {
    // Modular freestanding rack with 5-Way Hub bases.
    const e = explode * 1.5;
    const baseArmHeight = 5.75;
    const spreadArm = 23; // wallDistance / 2 ... wait, sku126 uses 23. sku168 cutlist uses spreadArm = wallDistance / 2.
    // Let's use wallDistance / 2
    const unionHeight = (height + baseArmHeight) / 2;

    const buildLeg = (x, type) => {
      const isLeft = type === 'left';
      const sideX = isLeft ? -e : e;
      const innerDir = isLeft ? 1 : -1;
      const outerDir = isLeft ? -1 : 1;

      // 5-Way Hub rotation: the "side" branch (+X locally) rotated by 90deg Z becomes UP (+Y)
      // Local +Y becomes -X (left). Local -Y becomes +X (right).
      const hubRot = [0, 0, Math.PI / 2];

      return (
        <group key={type} position={[sideX, 0, 0]}>
          {/* Top Corner Elbow */}
          <group position={[0, e * 3, 0]}>
            <Elbow position={[x, height, 0]} rotation={[0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Vertical Pole - Top Half */}
          <group position={[0, e * 2, 0]}>
            <Pipe start={[x, height - 1.2, 0]} end={[x, unionHeight + 1.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Union */}
          <group position={[0, e * 1.5, 0]}>
            <Union position={[x, unionHeight, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Vertical Pole - Bottom Half */}
          <group position={[0, e, 0]}>
            <Pipe start={[x, unionHeight - 1.2, 0]} end={[x, baseArmHeight + 1.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* 5-Way Junction Base */}
          <group position={[0, 0, 0]}>
            <FiveWayFitting position={[x, baseArmHeight, 0]} rotation={hubRot} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Outward Stabilizer Arm & Foot (Hex Nipple horizontally + Drop) */}
          <group position={[outerDir * e * 0.5, 0, 0]}>
            <HexNipple position={[x + outerDir * 2.875, baseArmHeight, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
            <group position={[x + outerDir * 5.75, baseArmHeight, 0]}>
              <group position={[outerDir * e * 0.5, 0, 0]}>
                <Elbow position={[0, 0, 0]} rotation={[0, isLeft ? -Math.PI / 2 : Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
                <group position={[0, -e * 0.5, 0]}>
                  <HexNipple position={[0, -2.875, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  <group position={[0, -e * 0.5, 0]}>
                    <Flange position={[0, -5.75, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              </group>
            </group>
          </group>

          {/* Forward Stabilizer Arm & Foot */}
          <group position={[0, 0, e * 0.5]}>
            <Pipe start={[x, baseArmHeight, 2.0]} end={[x, baseArmHeight, spreadArm - 2.0]} showLabel={showLabel} colorOption={colorOption} />
            <group position={[x, baseArmHeight, spreadArm]}>
              <group position={[0, 0, e * 0.5]}>
                <Elbow position={[0, 0, 0]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
                <group position={[0, -e * 0.5, 0]}>
                  <HexNipple position={[0, -2.875, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  <group position={[0, -e * 0.5, 0]}>
                    <Flange position={[0, -5.75, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              </group>
            </group>
          </group>

          {/* Backward Stabilizer Arm & Foot */}
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[x, baseArmHeight, -2.0]} end={[x, baseArmHeight, -spreadArm + 2.0]} showLabel={showLabel} colorOption={colorOption} />
            <group position={[x, baseArmHeight, -spreadArm]}>
              <group position={[0, 0, -e * 0.5]}>
                <Elbow position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                <group position={[0, -e * 0.5, 0]}>
                  <HexNipple position={[0, -2.875, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  <group position={[0, -e * 0.5, 0]}>
                    <Flange position={[0, -5.75, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      );
    }

    return (
      <group position={[0, -height / 2, 0]}>
        {buildLeg(-(length / 2 - 1.5), 'left')}
        {buildLeg((length / 2 - 1.5), 'right')}

        {/* Top Rail */}
        <group position={[0, e * 3, 0]}>
          <Pipe start={[-(length / 2 - 3.0), height, 0]} end={[(length / 2 - 3.0), height, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Bottom Rail connecting 5-Way Hubs */}
        <group position={[0, 0, 0]}>
          <Pipe start={[-(length / 2 - 3.0), baseArmHeight, 0]} end={[(length / 2 - 3.0), baseArmHeight, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku173') `;

code = code.replace(sku168Regex, newSku168);
fs.writeFileSync('src/App.tsx', code);
