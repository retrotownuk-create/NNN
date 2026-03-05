const THREE = require('three');

function test(rx, ry, rz, name) {
    const euler = new THREE.Euler(rx, ry, rz);
    let v1 = new THREE.Vector3(0, -1.5, 0);
    v1.applyEuler(euler);
    let v2 = new THREE.Vector3(0, 0, 1.5);
    v2.applyEuler(euler);
    console.log(name, "-> Port A:", v1.x.toFixed(2), v1.y.toFixed(2), v1.z.toFixed(2), "| Port B:", v2.x.toFixed(2), v2.y.toFixed(2), v2.z.toFixed(2));
}

// We want (1.5, 0, 0) and (0, 0, -1.5) for LEFT
test(-Math.PI / 2, Math.PI / 2, 0, "Test L1 (-90, 90, 0)");
test(Math.PI / 2, -Math.PI / 2, 0, "Test L2 (90, -90, 0)");
test(0, Math.PI / 2, Math.PI / 2, "Test L3 (0, 90, 90)");
test(0, Math.PI / 2, -Math.PI / 2, "Test L4 (0, 90, -90)");

// We want (-1.5, 0, 0) and (0, 0, -1.5) for RIGHT
test(-Math.PI / 2, -Math.PI / 2, 0, "Test R1 (-90, -90, 0)");
test(Math.PI / 2, Math.PI / 2, 0, "Test R2 (90, 90, 0)");
test(0, -Math.PI / 2, Math.PI / 2, "Test R3 (0, -90, 90)");
test(0, -Math.PI / 2, -Math.PI / 2, "Test R4 (0, -90, -90)");

