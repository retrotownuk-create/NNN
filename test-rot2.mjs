import * as THREE from 'three';
function getSockets(rotX, rotY, rotZ) {
    const euler = new THREE.Euler(rotX, rotY, rotZ, 'XYZ');
    const p1 = new THREE.Vector3(0, -1.5, 0).applyEuler(euler);
    const p2 = new THREE.Vector3(0, 0, 1.5).applyEuler(euler);
    console.log(`Rot(${rotX/Math.PI}pi, ${rotY/Math.PI}pi, ${rotZ/Math.PI}pi) -> p1: ${p1.toArray().map(n => n.toFixed(2))}, p2: ${p2.toArray().map(n => n.toFixed(2))}`);
}
getSockets(0, Math.PI, 0); 
getSockets(0, 0, 0); 
