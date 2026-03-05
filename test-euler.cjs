const THREE = require('three');

function testEuler(name, rotArray) {
  const e = new THREE.Euler(...rotArray, 'XYZ');
  
  const tf1 = new THREE.Vector3(0, 1, 0); tf1.applyEuler(e);
  const tf2 = new THREE.Vector3(0, -1, 0); tf2.applyEuler(e);
  const tf3 = new THREE.Vector3(0, 0, -1); tf3.applyEuler(e);
  
  const el1 = new THREE.Vector3(0, -1, 0); el1.applyEuler(e);
  const el2 = new THREE.Vector3(0, 0, 1); el2.applyEuler(e);

  console.log('--- ' + name + ' ---');
  console.log(`TFitting Straight Y: [${Math.round(tf1.x)}, ${Math.round(tf1.y)}, ${Math.round(tf1.z)}]`);
  console.log(`TFitting Straight -Y: [${Math.round(tf2.x)}, ${Math.round(tf2.y)}, ${Math.round(tf2.z)}]`);
  console.log(`TFitting Branch -Z: [${Math.round(tf3.x)}, ${Math.round(tf3.y)}, ${Math.round(tf3.z)}]`);
  console.log(`Elbow Branch -Y: [${Math.round(el1.x)}, ${Math.round(el1.y)}, ${Math.round(el1.z)}]`);
  console.log(`Elbow Branch +Z: [${Math.round(el2.x)}, ${Math.round(el2.y)}, ${Math.round(el2.z)}]`);
}

// Proposals from script 1
testEuler('Left Tee [0, -PI/2, PI/2]', [0, -Math.PI/2, Math.PI/2]);
testEuler('Right Tee [0, PI/2, -PI/2]', [0, Math.PI/2, -Math.PI/2]);

testEuler('Left Elbow [0, PI/2, PI/2]', [0, Math.PI/2, Math.PI/2]);
testEuler('Right Elbow [0, -PI/2, -PI/2]', [0, -Math.PI/2, -Math.PI/2]);

testEuler('Center Tee [0, 0, -PI/2]', [0, 0, -Math.PI/2]);

