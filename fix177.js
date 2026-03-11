const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetRegex = /  if \(skuType === 'sku177'\) \{[\s\S]*?      <\/group>\n    \);\n  \}/;

const replacement = `  if (skuType === 'sku177') {
    const e = explode * 1.5;
    const numRails = Math.max(2, tiers || 3);
    const leftX = -(length / 2) + 2.5;
    const rightX = (length / 2) - 2.5;
    const zBase = -wallDistance;
    const zRail = zBase + wallDistance; // Usually 0

    const bottomY = 15;
    const vertLength = 20;
    const topY = bottomY + (numRails - 1) * vertLength;

    const getEY = (i) => {
      const maxIdx = numRails - 1;
      if (maxIdx === 0) return 0;
      const normalized = (i / maxIdx) * 2 - 1;
      return normalized * e * 0.5;
    };

    // Draw horizontal wall pipes and flanges
    const drawSupports = (x, isLeft) => {
      let parts = [];
      const xExp = isLeft ? -e : e;
      for (let i = 0; i < numRails; i++) {
        const y = bottomY + i * vertLength;
        const eY = getEY(i);
        parts.push(
          <group key={\`supp-\${i}-\${isLeft}\`} position={[xExp, y + eY, -e]}>
            <Flange position={[x, 0, zBase]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            <Pipe start={[x, 0, zBase + 1.2]} end={[x, 0, zRail - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        );
      }
      return parts;
    };

    // Draw vertical poles
    const drawVerticals = (x, isLeft) => {
      let parts = [];
      const xExp = isLeft ? -e : e;

      // Fitting at bottomY - CORNER ELBOW AS PER REQUEST
      parts.push(
        <group key={\`c-bot-\${isLeft}\`} position={[xExp, bottomY + getEY(0), e]}>
          <CornerFitting position={[x, 0, zRail]} rotation={[Math.PI / 2, isLeft ? 0 : -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} side={isLeft ? 'left' : 'right'} />
        </group>
      );

      // Verticals between rails
      for (let i = 0; i < numRails - 1; i++) {
        const yStart = bottomY + i * vertLength;
        const yEnd = bottomY + (i + 1) * vertLength;
        const eY1 = getEY(i);
        const eY2 = getEY(i + 1);
        const eYMid = (eY1 + eY2) / 2;

        parts.push(
          <group key={\`vert-\${i}-\${isLeft}\`} position={[xExp, 0, e]}>
            <Pipe start={[x, yStart + 1.5 + eYMid, zRail]} end={[x, yEnd - 1.5 + eYMid, zRail]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        );

        // Fitting at yEnd (which is a T-fitting unless it's top and we wanted something else)
        if (i < numRails - 2) {
          parts.push(
            <group key={\`t-\${i + 1}-\${isLeft}\`} position={[xExp, yEnd + getEY(i + 1), e]}>
              <TFitting position={[x, 0, zRail]} rotation={[-Math.PI / 2, isLeft ? Math.PI : 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          );
        }
      }

      // Fitting at topY
      parts.push(
        <group key={\`t-top-\${isLeft}\`} position={[xExp, topY + getEY(numRails - 1), e]}>
          <TFitting position={[x, 0, zRail]} rotation={[-Math.PI / 2, isLeft ? Math.PI : 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          {/* Top stub */}
          <Pipe start={[x, 1.5 + e * 0.2, zRail]} end={[x, 5 - 1.0 + e * 0.2, zRail]} showLabel={showLabel} colorOption={colorOption} />
          <EndCap position={[x, 5 + e * 0.4, zRail]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      );

      return parts;
    };

    // Calculate dynamic total height for centering visually
    const totalHeightRendered = topY + 5.0 - bottomY;

    return (
      <group position={[0, -totalHeightRendered / 2, -wallDistance / 2]}>
        {drawSupports(leftX, true)}
        {drawSupports(rightX, false)}
        {drawVerticals(leftX, true)}
        {drawVerticals(rightX, false)}

        {/* Bottom Horizontal Rail */}
        <group position={[0, bottomY + getEY(0), e]}>
          <Pipe start={[leftX + 1.5, 0, zRail]} end={[rightX - 1.5, 0, zRail]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Shelves for all tiers above the bottom rail */}
        {hasShelves && Array.from({ length: numRails - 1 }).map((_, i) => {
          const tierIdx = i + 1;
          const y = bottomY + tierIdx * vertLength;
          const eY = getEY(tierIdx);
          return (
            <group key={\`shelf-\${i}\`} position={[0, y + 1.5 + eY + e * 0.4, -e * 0.5]}>
              <Shelf position={[0, 0, zBase / 2]} length={length} depth={wallDistance} woodColor={woodColor} />
            </group>
          );
        })}
      </group>
    );
  }`;

if (targetRegex.test(code)) {
  code = code.replace(targetRegex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Successfully replaced sku177 logic');
} else {
  console.log('Could not find target regex in file');
}
