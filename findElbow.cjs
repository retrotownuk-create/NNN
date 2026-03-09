const THREE = require('three');

function findElbow(dx, dy) {
    const angle = Math.atan2(dy, dx);
    const targetDir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    const targetWall = new THREE.Vector3(0, 0, -1);

    // Elbow default ports (assuming port1 is -Z and port2 is -Y or +Y?)
    // In previous test_elbow.cjs:
    // [-Math.PI/2, 0, 0] -> Branch: 0, -1, 0 | Body: 0, 0, -1.
    // Let's sweep Euler ranges to find a rotation where one port is -Z and the other is targetDir
    const baseP1 = new THREE.Vector3(0, 0, -1);
    const baseP2 = new THREE.Vector3(0, -1, 0); // Assuming standard elbow puts second port at -Y
    const baseP3 = new THREE.Vector3(0, 1, 0); // Or maybe +Y
    const baseP4 = new THREE.Vector3(-1, 0, 0);
    const baseP5 = new THREE.Vector3(1, 0, 0);

    // If baseP1 is -Z, we can just rotate around Z axis!
    // If we apply rotation [0, 0, theta]:
    // p1 stays -Z.
    // p2 (-Y) becomes (sin(theta), -cos(theta), 0). We want this to be targetDir (cos(angle), sin(angle), 0).
    // sin(theta) = cos(angle)  => theta = angle + pi/2
    // -cos(theta) = sin(angle)

    // So if port 2 is -Y, theta = angle + Math.PI/2
    // Let's test this
    let theta1 = angle - Math.PI / 2;
    let theta2 = angle + Math.PI / 2;
    console.log("Vector angle:", (angle * 180 / Math.PI).toFixed(2));
    ['+Y', '-Y', '+X', '-X'].forEach((port, idx) => {
        const v = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0)][idx];
        const eul = new THREE.Euler(0, 0, angle, 'XYZ');
        const eul_minus90 = new THREE.Euler(0, 0, angle - Math.PI / 2, 'XYZ');
        const eul_plus90 = new THREE.Euler(0, 0, angle + Math.PI / 2, 'XYZ');

        console.log(`If port is ${port}:`);
        console.log(`  +0: `, v.clone().applyEuler(eul).toArray().map(n => n.toFixed(2)));
        console.log(`  -90:`, v.clone().applyEuler(eul_minus90).toArray().map(n => n.toFixed(2)));
        console.log(`  +90:`, v.clone().applyEuler(eul_plus90).toArray().map(n => n.toFixed(2)));
    });
}
findElbow(1, 1);
findElbow(-1, -1);
