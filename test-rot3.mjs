import * as THREE from 'three';
function checkRot(rotX, rotY, rotZ) {
    const e = new THREE.Euler(rotX, rotY, rotZ, 'XYZ');
    const p1 = new THREE.Vector3(0, -1.5, 0).applyEuler(e);
    const p2 = new THREE.Vector3(0, 0, 1.5).applyEuler(e);
    console.log(`Rot(${rotX/Math.PI}, ${rotY/Math.PI}, ${rotZ/Math.PI}) -> p1: ${p1.toArray().map(n => Math.round(n))}, p2: ${p2.toArray().map(n => Math.round(n))}`);
}
checkRot(-Math.PI/2, -Math.PI/2, 0);
checkRot(0, 0, Math.PI);
checkRot(0, 0, Math.PI/2);
checkRot(Math.PI, 0, Math.PI/2);
checkRot(Math.PI/2, Math.PI/2, 0);
checkRot(Math.PI, Math.PI/2, 0);
