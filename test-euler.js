const THREE = require('three');
function test(name, vec, rot, expects) {
  const v = new THREE.Vector3(...vec);
  const e = new THREE.Euler(...rot, 'XYZ');
  v.applyEuler(e);
  console.log(`${name}: [${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}] (expected ${expects})`);
}
// TFitting left
test('Tee Left Straight Y', 'Tee Left Straight Y', [0, 1, 0], [Math.PI/2, 0, -Math.PI/2], '+Z [0,0,1]');
test('Tee Left Straight -Y', 'Tee Left Straight -Y', [0, -1, 0], [Math.PI/2, 0, -Math.PI/2], '-Z [0,0,-1]');
test('Tee Left Branch -Z', 'Tee Left Branch -Z', [0, 0, -1], [Math.PI/2, 0, -Math.PI/2], '+X [1,0,0]');

test('Elbow Left Branch -Y', 'Elbow Left Branch -Y', [0, -1, 0], [Math.PI, 0, -Math.PI/2], '+X [1,0,0]');
test('Elbow Left Branch +Z', 'Elbow Left Branch +Z', [0, 0, 1], [Math.PI, 0, -Math.PI/2], '-Z [0,0,-1]');

test('Elbow Right Branch -Y', 'Elbow Right Branch -Y', [0, -1, 0], [Math.PI, 0, Math.PI/2], '-X [-1,0,0]');
test('Elbow Right Branch +Z', 'Elbow Right Branch +Z', [0, 0, 1], [Math.PI, 0, Math.PI/2], '-Z [0,0,-1]');
