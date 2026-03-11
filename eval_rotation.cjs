const THREE = require('three');
function testRot(rot) {
  const euler = new THREE.Euler(...rot);
  // Default T-fitting: straight along X (1,0,0) and (-1,0,0), branch along Y (0,1,0)
  const v1 = new THREE.Vector3(1, 0, 0).applyEuler(euler);
  const v2 = new THREE.Vector3(0, 1, 0).applyEuler(euler);
  console.log('Rot:', rot, '-> Straight:', [v1.x, v1.y, v1.z].map(Math.round), 'Branch:', [v2.x, v2.y, v2.z].map(Math.round));
}

testRot([0, 0, 0]);
testRot([0, 0, Math.PI / 2]);
testRot([0, -Math.PI / 2, 0]);
testRot([0, -Math.PI / 2, Math.PI / 2]);
testRot([Math.PI / 2, 0, Math.PI / 2]);
testRot([-Math.PI / 2, 0, Math.PI / 2]);
testRot([Math.PI, 0, Math.PI / 2]);
