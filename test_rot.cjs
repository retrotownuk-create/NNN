const THREE = require('three');

function testRot() {
  const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

  for (let x of angles) {
    for (let y of angles) {
      for (let z of angles) {
        const eul = new THREE.Euler(x, y, z, 'XYZ');
        const p1 = new THREE.Vector3(0, -1, 0).applyEuler(eul);
        const p2 = new THREE.Vector3(0, 0, 1).applyEuler(eul);

        // We want left elbow: P1=+X(1,0,0), P2=+Y(0,1,0)
        if (Math.abs(p1.x - 1) < 0.01 && Math.abs(p2.y - 1) < 0.01) {
          console.log(`Left Elbow match: x=${x / (Math.PI / 2)} pi/2, y=${y / (Math.PI / 2)} pi/2, z=${z / (Math.PI / 2)} pi/2`);
        }

        // We want right elbow: P1=-X(-1,0,0), P2=+Y(0,1,0)
        if (Math.abs(p1.x + 1) < 0.01 && Math.abs(p2.y - 1) < 0.01) {
          console.log(`Right Elbow match: x=${x / (Math.PI / 2)} pi/2, y=${y / (Math.PI / 2)} pi/2, z=${z / (Math.PI / 2)} pi/2`);
        }

        // TFitting: Body is +Y to -Y. So applying Euler to Y should give X or -X.
        // Branch is +Z. Branch (+Z) should give +Y.
        const body1 = new THREE.Vector3(0, 1, 0).applyEuler(eul);
        const branch = new THREE.Vector3(0, 0, 1).applyEuler(eul);
        if (Math.abs(body1.x) > 0.99 && Math.abs(branch.y - 1) < 0.01) {
          console.log(`T-Fitting match: x=${x / (Math.PI / 2)} pi/2, y=${y / (Math.PI / 2)} pi/2, z=${z / (Math.PI / 2)} pi/2 (Body to ${body1.x > 0 ? '+X' : '-X'})`);
        }
      }
    }
  }
}
testRot();
