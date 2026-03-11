function rotate(x,y,z, rx,ry,rz) {
  let x1=x, y1=y*Math.cos(rx)-z*Math.sin(rx), z1=y*Math.sin(rx)+z*Math.cos(rx);
  let x2=x1*Math.cos(ry)+z1*Math.sin(ry), y2=y1, z2=-x1*Math.sin(ry)+z1*Math.cos(ry);
  let x3=x2*Math.cos(rz)-y2*Math.sin(rz), y3=x2*Math.sin(rz)+y2*Math.cos(rz), z3=z2;
  return [parseFloat(x3.toFixed(3)), parseFloat(y3.toFixed(3)), parseFloat(z3.toFixed(3))];
}
console.log("FortyFiveElbow: [Math.PI/2, 0, 0]");
console.log("  Downward branch (0,-1,0):", rotate(0,-1,0, Math.PI/2, 0, 0));
console.log("  45 Deg Branch (0,0.707,0.707):", rotate(0,0.707,0.707, Math.PI/2, 0, 0));

console.log("\nFortyFiveElbow: [-Math.PI/2, 0, 0]");
console.log("  Downward branch (0,-1,0):", rotate(0,-1,0, -Math.PI/2, 0, 0));
console.log("  45 Deg Branch (0,0.707,0.707):", rotate(0,0.707,0.707, -Math.PI/2, 0, 0));

console.log("\nFortyFiveElbow: [-Math.PI/2, Math.PI, 0]");
console.log("  Downward branch (0,-1,0):", rotate(0,-1,0, -Math.PI/2, Math.PI, 0));
console.log("  45 Deg Branch (0,0.707,0.707):", rotate(0,0.707,0.707, -Math.PI/2, Math.PI, 0));
