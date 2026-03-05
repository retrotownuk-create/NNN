import * as THREE from 'three';

function testElbow(x, y, z) {
    const e = new THREE.Euler(x, y, z, 'XYZ');
    const portDown = new THREE.Vector3(0, -1, 0).applyEuler(e);
    const portForward = new THREE.Vector3(0, 0, 1).applyEuler(e);
    console.log(`Rot [${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}]:`);
    console.log(`  portDown (-Y) mapped to: ${portDown.x.toFixed(1)}, ${portDown.y.toFixed(1)}, ${portDown.z.toFixed(1)}`);
    console.log(`  portForward (+Z) mapped to: ${portForward.x.toFixed(1)}, ${portForward.y.toFixed(1)}, ${portForward.z.toFixed(1)}`);
}

// Left edge elbow: Needs to connect to rightwards pipe (+x) and wall pipe (-z)
console.log("Looking for Left Elbow: (+X, -Z)");
testElbow(Math.PI/2, Math.PI/2, 0);
testElbow(Math.PI/2, -Math.PI/2, 0);
testElbow(-Math.PI/2, Math.PI/2, 0);
testElbow(-Math.PI/2, -Math.PI/2, 0);
testElbow(0, Math.PI/2, Math.PI/2);
testElbow(0, -Math.PI/2, Math.PI/2);
testElbow(Math.PI/2, 0, 0); // starts getting confusing

// The elbow usually starts at y=-1 and z=1.
// We want y=0, z=-1 and x=1.
// If we rotate around X by 180 (Math.PI): 
// y=-1 -> y=1. 
// z=1 -> z=-1.
testElbow(Math.PI, 0, 0); // -> +Y, -Z. (we need +X, -Z)
// Now rotate around Z by -90: 
testElbow(Math.PI, 0, -Math.PI/2); // -> +X, -Z
testElbow(Math.PI, 0, Math.PI/2);  // -> -X, -Z

console.log("Looking for Right Elbow: (-X, -Z)");
testElbow(Math.PI, 0, Math.PI/2);

