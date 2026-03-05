import * as THREE from 'three';
const eulerLeft = new THREE.Euler(Math.PI, 0, Math.PI / 2, 'XYZ');
const vLeft1 = new THREE.Vector3(0, -1, 0).applyEuler(eulerLeft);
const vLeft2 = new THREE.Vector3(0, 0, 1).applyEuler(eulerLeft);

const eulerRight = new THREE.Euler(Math.PI, Math.PI, Math.PI / 2, 'XYZ');
const vRight1 = new THREE.Vector3(0, -1, 0).applyEuler(eulerRight);
const vRight2 = new THREE.Vector3(0, 0, 1).applyEuler(eulerRight);

console.log('Left Side:');
console.log('v1 (-Y):', Math.round(vLeft1.x), Math.round(vLeft1.y), Math.round(vLeft1.z)); // vertical connection? TFitting branches are -Y, +Y (ends) and +Z (branch). Wait, TFitting has ends along Y (+Y and -Y) and branch along Z (+Z). Wait, no...
// Wait, in App.tsx TFitting is:
// args:[1.65,1.65,2.4] at [0, -1.2, 0] (-Y side)
// args:[1.65... ] at [0,0,1.2] rot [PI/2,0,0] (+Z branch side)
// Actually App.tsx TFitting has: +Y is open, -Y is open, +Z is branch? No!
// Let's check App.tsx TFitting.
