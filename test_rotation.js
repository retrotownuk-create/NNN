const math = require('mathjs'); // if available, or just use basic trig
const cos = Math.cos;
const sin = Math.sin;
function rotateX(v, a) { return [v[0], v[1]*cos(a)-v[2]*sin(a), v[1]*sin(a)+v[2]*cos(a)]; }
function rotateY(v, a) { return [v[0]*cos(a)+v[2]*sin(a), v[1], -v[0]*sin(a)+v[2]*cos(a)]; }
function rotateZ(v, a) { return [v[0]*cos(a)-v[1]*sin(a), v[0]*sin(a)+v[1]*cos(a), v[2]]; }
function applyEuler(v, e) {
  let v1 = rotateX(v, e[0]);
  let v2 = rotateY(v1, e[1]);
  let v3 = rotateZ(v2, e[2]);
  return v3.map(x => Math.round(x*1000)/1000); // simplify
}

const euler = [Math.PI/2, Math.PI/2, 0];
console.log("Branch (0,0,-1) after [PI/2, PI/2, 0]:", applyEuler([0,0,-1], euler));
console.log("Body+ (0,1,0) after [PI/2, PI/2, 0]:", applyEuler([0,1,0], euler));
console.log("Body- (0,-1,0) after [PI/2, PI/2, 0]:", applyEuler([0,-1,0], euler));
