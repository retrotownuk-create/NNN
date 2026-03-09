const THREE = require('three');
const th = Math.atan2(-100, 200);

const baseElbowRot = new THREE.Euler(0, Math.PI, th - Math.PI);
const baseQuat = new THREE.Quaternion().setFromEuler(baseElbowRot);
const port1 = new THREE.Vector3(0, -1, 0).applyQuaternion(baseQuat);
const port2 = new THREE.Vector3(0, 0, 1).applyQuaternion(baseQuat);
console.log("BaseElbow port1 (-Y):", port1);
console.log("BaseElbow port2 (+Z):", port2);

const startElbowRot = new THREE.Euler(0, Math.PI / 2, th);
const startQuat = new THREE.Quaternion().setFromEuler(startElbowRot);
const sp1 = new THREE.Vector3(0, -1, 0).applyQuaternion(startQuat);
const sp2 = new THREE.Vector3(0, 0, 1).applyQuaternion(startQuat);
console.log("StartElbow port1 (-Y):", sp1);
console.log("StartElbow port2 (+Z):", sp2);

const endElbowRot = new THREE.Euler(0, -Math.PI / 2, th);
const endQuat = new THREE.Quaternion().setFromEuler(endElbowRot);
const ep1 = new THREE.Vector3(0, -1, 0).applyQuaternion(endQuat);
const ep2 = new THREE.Vector3(0, 0, 1).applyQuaternion(endQuat);
console.log("EndElbow port1 (-Y):", ep1);
console.log("EndElbow port2 (+Z):", ep2);

const perpNippleRot = new THREE.Euler(0, 0, th - Math.PI);
const pnQuat = new THREE.Quaternion().setFromEuler(perpNippleRot);
const pnp1 = new THREE.Vector3(0, 1, 0).applyQuaternion(pnQuat);
const pnp2 = new THREE.Vector3(0, -1, 0).applyQuaternion(pnQuat);
console.log("HexNipple2 port1 (+Y):", pnp1);
console.log("HexNipple2 port2 (-Y):", pnp2);

