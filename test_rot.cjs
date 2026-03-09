const THREE = require('three');
const angles = [0, Math.PI/2, Math.PI, -Math.PI/2];

for (let x of angles) {
  for (let y of angles) {
    for (let z of angles) {
      const eul = new THREE.Euler(x, y, z, 'XYZ');
      
      // TFitting:
      // In T-fitting code, Body is aligned along Y axis (+Y and -Y)
      // Branch is aligned along Z axis (typically -Z or +Z, let's check standard).
      // Assuming Branch is +Z.
      const body1 = new THREE.Vector3(0, 1, 0).applyEuler(eul);
      const branchPos = new THREE.Vector3(0, 0, 1).applyEuler(eul);
      const branchNeg = new THREE.Vector3(0, 0, -1).applyEuler(eul);
      
      // We want the drop pipe to come from above. So the branch (or the middle of the body?) 
      // Wait, T-Fitting has 3 ports. Normally, Body goes left-right, Branch goes up or down.
      // We want Branch to go UP (+Y).
      // We want Body to go LEFT/RIGHT (+X / -X).
      if (Math.abs(body1.x) > 0.99 && Math.abs(branchPos.y - 1) < 0.01) {
        console.log(`Branch=+Z UP, Body=X: [${x/(Math.PI/2)} * Math.PI/2, ${y/(Math.PI/2)} * Math.PI/2, ${z/(Math.PI/2)} * Math.PI/2]`);
      }
      if (Math.abs(body1.x) > 0.99 && Math.abs(branchNeg.y - 1) < 0.01) {
        console.log(`Branch=-Z UP, Body=X: [${x/(Math.PI/2)} * Math.PI/2, ${y/(Math.PI/2)} * Math.PI/2, ${z/(Math.PI/2)} * Math.PI/2]`);
      }
    }
  }
}
