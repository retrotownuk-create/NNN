const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(
  '<group position={[0, e, 0]}>\n          <Pipe start={[-(hPipeLength / 2), height, 0]} end={[(hPipeLength / 2), height, 0]} showLabel={showLabel} colorOption={colorOption} />\n        </group>',
  '<group position={[0, e, 0]}>\n          <Pipe start={[-(length / 2 - 3.0), height, 0]} end={[(length / 2 - 3.0), height, 0]} showLabel={showLabel} colorOption={colorOption} />\n        </group>'
);

code = code.replace(
  '<group position={[0, -e, 0]}>\n          <Pipe start={[-(hPipeLength / 2), baseArmHeight, 0]} end={[(hPipeLength / 2), baseArmHeight, 0]} showLabel={showLabel} colorOption={colorOption} />\n        </group>',
  '<group position={[0, -e, 0]}>\n          <Pipe start={[-(length / 2 - 3.0), baseArmHeight, 0]} end={[(length / 2 - 3.0), baseArmHeight, 0]} showLabel={showLabel} colorOption={colorOption} />\n        </group>'
);

fs.writeFileSync('src/App.tsx', code);
