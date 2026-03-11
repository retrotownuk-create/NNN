const THREE = require('three');
function testRot(x,y,z) {
  const euler = new THREE.Euler(x, y, z);
  const v1 = new THREE.Vector3(1, 0, 0).applyEuler(euler);
  const v2 = new THREE.Vector3(0, 1, 0).applyEuler(euler);
  console.log('Rot:', [x,y,z].map(v => (v/(Math.PI/2)).toFixed(1)*90 + ' deg'), '-> Straight X:', [v1.x, v1.y, v1.z].map(v => Math.round(v)), 'Branch Y:', [v2.x, v2.y, v2.z].map(v => Math.round(v)));
}
testRot(0, -Math.PI / 2, Math.PI / 2);
testRot(-Math.PI / 2, -Math.PI / 2, 0);
