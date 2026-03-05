const THREE = require('three');
const euler = new THREE.Euler(Math.PI / 2, 0, Math.PI / 2, 'XYZ');
const v1 = new THREE.Vector3(0, -1, 0);
v1.applyEuler(euler);
const v2 = new THREE.Vector3(0, 0, 1);
v2.applyEuler(euler);
console.log('Math.PI/2, 0, Math.PI/2:');
console.log('v1 (-Y):', v1.x, v1.y, v1.z); // Expected: 1, 0, 0
console.log('v2 (+Z):', v2.x, v2.y, v2.z); // Expected: 0, 0, -1
