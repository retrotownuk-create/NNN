const L = 100; // placeholder
const bracketZ = 0; // placeholder
console.log(`
  if (skuType === 'sku173') {
    const e = explode * 1.5;
    const bracketZ = -wallDistance;
    const lHalf = length / 2;

    const lxElbow = -lHalf + 2;
    const rxElbow = lHalf - 2;

    // Vector from left elbow to left wall is (-0.7071, 0, -0.7071)
    const lxHex = lxElbow - 2.6 * 0.7071;
    const lzHex = bracketZ - 2.6 * 0.7071;
    const lxFlange = lxElbow - 3.6 * 0.7071;
    const lzFlange = bracketZ - 3.6 * 0.7071;

    // Vector from right elbow to right wall is (0.7071, 0, -0.7071)
    const rxHex = rxElbow + 2.6 * 0.7071;
    const rzHex = bracketZ - 2.6 * 0.7071;
    const rxFlange = rxElbow + 3.6 * 0.7071;
    const rzFlange = bracketZ - 3.6 * 0.7071;

    return (
      <group position={[0, height / 2, 0]}>
        {/* Left Side Group */}
        <group position={[-e, 0, -e]}>
          <Flange position={[lxFlange, 0, lzFlange]} rotation={[0.9553, -0.5236, -0.9553]} showLabel={showLabel} colorOption={colorOption} />
          <HexNipple position={[lxHex, 0, lzHex]} rotation={[0.9553, -0.5236, -0.9553]} showLabel={showLabel} colorOption={colorOption} />
          <FortyFiveElbow position={[lxElbow, 0, bracketZ]} rotation={[-Math.PI, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Right Side Group */}
        <group position={[e, 0, -e]}>
          <Flange position={[rxFlange, 0, rzFlange]} rotation={[0.9553, 0.5236, 0.9553]} showLabel={showLabel} colorOption={colorOption} />
          <HexNipple position={[rxHex, 0, rzHex]} rotation={[0.9553, 0.5236, 0.9553]} showLabel={showLabel} colorOption={colorOption} />
          <FortyFiveElbow position={[rxElbow, 0, bracketZ]} rotation={[-Math.PI, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Center Diagonal Pipe */}
        <group position={[0, 0, 0]}>
          <Pipe start={[lxElbow + 0.8, 0, bracketZ]} end={[rxElbow - 0.8, 0, bracketZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }
`);
