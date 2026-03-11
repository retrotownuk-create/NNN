const e = 0;
const wallDistance = 30;
const length = 100;

const zElbow = 0;
const zWallSurface = -wallDistance;
const yTee = 0;

const lX = -length / 2 + 2.2;
const rX = length / 2 - 2.2;

const eZ = zWallSurface + 4.4; 
const eY = Math.abs(eZ); 

const diagTopY = yTee + 1.556;
const diagTopZ = zElbow - 1.556;

const diagBotY = eY - 1.414;
const diagBotZ = eZ + 1.414;

console.log("eZ", eZ, "eY", eY, "diagTopY", diagTopY, "diagTopZ", diagTopZ, "diagBotY", diagBotY, "diagBotZ", diagBotZ);
