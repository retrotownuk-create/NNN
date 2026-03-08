const { Euler, Vector3 } = require('three');
const rot = new Euler(Math.PI / 2, 0, -Math.PI / 2, 'XYZ');
const v = new Vector3(0, 0, -2.2);
v.applyEuler(rot);
console.log("Left branch (-2.2 on Z):", v.x, v.y, v.z);

const vThrough = new Vector3(0, 2.2, 0);
vThrough.applyEuler(rot);
console.log("Through axis (+2.2 on Y):", vThrough.x, vThrough.y, vThrough.z);

const rotRight = new Euler(Math.PI / 2, 0, Math.PI / 2, 'XYZ');
const v2 = new Vector3(0, 0, -2.2);
v2.applyEuler(rotRight);
console.log("Right branch (-2.2 on Z):", v2.x, v2.y, v2.z);
