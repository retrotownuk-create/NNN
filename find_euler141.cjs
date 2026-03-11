const THREE = require('three');

function testAngles() {
  const angles = [
    0, Math.PI/2, Math.PI, -Math.PI/2,
  ];

  for (let x of angles) {
    for (let y of angles) {
      for (let z of angles) {
        const e = new THREE.Euler(x, y, z);
        
        // TFitting base orientation: Straight is X, Branch is Y.
        // We want Straight to be roughly ±Y.
        // We want Branch to be roughly ±Z.

        const straight = new THREE.Vector3(1,0,0).applyEuler(e);
        const branch = new THREE.Vector3(0,1,0).applyEuler(e);

        const sy = Math.round(straight.y);
        const bz = Math.round(branch.z);

        if (Math.abs(sy) === 1 && Math.abs(bz) === 1) {
          console.log(`Match: [${x/(Math.PI/2)} * PI/2, ${y/(Math.PI/2)} * PI/2, ${z/(Math.PI/2)} * PI/2]`);
          console.log(`  Straight Y: ${sy}, Branch Z: ${bz}`);
          
          const rx = x;
          const ry = y;
          const rz = z;
          
          if (sy === 1 && bz === -1) {
             console.log("  => FRONT LEG (Straight +Y, Branch -Z)");
          }
          if (sy === 1 && bz === 1) {
             console.log("  => BACK LEG (Straight +Y, Branch +Z)");
          }
        }
      }
    }
  }
}
testAngles();
