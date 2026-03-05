import * as THREE from 'three';

const t = new THREE.Object3D();
t.rotation.set(-Math.PI / 2, Math.PI / 2, 0);
t.updateMatrixWorld();

// TFitting through-pipe is Y axis
const pY1 = new THREE.Vector3(0, 1, 0).applyMatrix4(t.matrixWorld);
const pY2 = new THREE.Vector3(0, -1, 0).applyMatrix4(t.matrixWorld);
// TFitting branch is -Z axis
const pZ = new THREE.Vector3(0, 0, -1).applyMatrix4(t.matrixWorld);

console.log("TFitting ports:", { pY1, pY2, pZ });

const cb = new THREE.Object3D();
cb.rotation.set(Math.PI / 2, 0, 0);
cb.updateMatrixWorld();

// ConnectorBracket through-pipe is Y axis
const cbY1 = new THREE.Vector3(0, 1, 0).applyMatrix4(cb.matrixWorld);
const cbY2 = new THREE.Vector3(0, -1, 0).applyMatrix4(cb.matrixWorld);
// Branch is -Z axis
const cbZ = new THREE.Vector3(0, 0, -1).applyMatrix4(cb.matrixWorld);

console.log("ConnectorBracket ports:", { cbY1, cbY2, cbZ });

