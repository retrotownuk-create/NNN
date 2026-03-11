const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(
  '<Elbow position={[x, baseArmHeight, spreadArm]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />',
  '<Elbow position={[x, baseArmHeight, spreadArm]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />'
);

code = code.replace(
  '<Elbow position={[x, baseArmHeight, -spreadArm]} rotation={[-Math.PI / 2, 0, Math.PI]} showLabel={showLabel} colorOption={colorOption} />',
  '<Elbow position={[x, baseArmHeight, -spreadArm]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />'
);

fs.writeFileSync('src/App.tsx', code);
