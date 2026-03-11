// Vector (0,0,-1) rotated by X, Y, Z (euler order is XYZ by default in Three.js? No, Three.js default order is XYZ.)
function rotate(vector, rx, ry, rz) {
  let v1 = {
    x: vector.x,
    y: vector.y * Math.cos(rx) - vector.z * Math.sin(rx),
    z: vector.y * Math.sin(rx) + vector.z * Math.cos(rx)
  };
  let v2 = {
    x: v1.x * Math.cos(ry) + v1.z * Math.sin(ry),
    y: v1.y,
    z: -v1.x * Math.sin(ry) + v1.z * Math.cos(ry)
  };
  let v3 = {
    x: v2.x * Math.cos(rz) - v2.y * Math.sin(rz),
    y: v2.x * Math.sin(rz) + v2.y * Math.cos(rz),
    z: v2.z
  };
  return v3;
}
console.log("-PI/4, 0, -PI/2", rotate({x:0,y:0,z:-1}, -Math.PI/4, 0, -Math.PI/2));
console.log("0, PI/4, -PI/2", rotate({x:0,y:0,z:-1}, 0, Math.PI/4, -Math.PI/2));
console.log("PI/4, 0, -PI/2", rotate({x:0,y:0,z:-1}, Math.PI/4, 0, -Math.PI/2));

