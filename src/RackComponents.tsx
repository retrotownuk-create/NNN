import React, { useState, useEffect, Suspense, useRef, useMemo, useDeferredValue } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera, Center } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, WOOD_COLORS, ColorOption, getPipesForLength } from './utils';

export const LabelContext = React.createContext({ size: 11, distance: 40 });



const Label = ({ text, type = 'pipe', lineClass = 'h-8' }: { text: string, type?: 'pipe' | 'fitting', lineClass?: string }) => {
  const context = React.useContext(LabelContext);
  const size = type === 'fitting' ? context.size * 0.85 : context.size;
  const distance = context.distance;
  const id = React.useId();

  const groupRef = React.useRef<THREE.Group>(null);
  const lineRef = React.useRef<HTMLDivElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // Calculate deterministic jitter based on unique React id
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(31, hash) + id.charCodeAt(i) | 0;
  }
  const hNumber = Math.abs(hash);

  useFrame((state) => {
    if (!groupRef.current || !lineRef.current || !boxRef.current) return;

    // Reset global label registry each frame to calculate fresh collisions
    if ((window as any).__LAST_FRAME_TIME !== state.clock.elapsedTime) {
      (window as any).__LAST_FRAME_TIME = state.clock.elapsedTime;
      (window as any).__LABEL_RECTS = [];
    }

    // Get the object's position in NDC (Normalized Device Coordinates) relative to camera
    const pos = new THREE.Vector3();
    groupRef.current.getWorldPosition(pos);
    pos.project(state.camera);

    // Calculate angle directly AWAY from the center of the screen
    let angleRad = Math.atan2(pos.y, pos.x);

    // Add deterministic jitter so nearby labels fan out differently
    angleRad += ((hNumber % 11) - 5) * 0.12;

    const distMultiplier = 1 + ((hNumber % 5) * 0.25);
    let currentDist = distance * distMultiplier;

    // Calculate approximate screen space position of the anchor
    const widthHalf = state.size.width / 2;
    const heightHalf = state.size.height / 2;
    const anchorX = pos.x * widthHalf + widthHalf;
    const anchorY = -pos.y * heightHalf + heightHalf;

    // Approximate label dimensions securely (font-black text is wide, plus increased padding)
    const labelW = 55 + (Math.max(text.length, 5) * 12) + (size * 0.5);
    const labelH = 35 + size;

    const rects = (window as any).__LABEL_RECTS;

    let dx = 0;
    let dy = 0;
    let attempts = 0;
    let spiralAttempt = 0;
    let overlapping = true;

    // Repulsion loop: if it overlaps, spiral search for empty space
    while (overlapping && attempts < 150) {
      dx = currentDist * Math.cos(angleRad);
      dy = -currentDist * Math.sin(angleRad);

      const isLeft = dx < 0;
      const boxX = anchorX + dx - (isLeft ? labelW : 0);
      const boxY = anchorY + dy - (labelH / 2);

      overlapping = false;
      for (const other of rects) {
        // Strict bounding box intersection (with 25px safe space padding)
        if (boxX < other.x + other.w + 25 && boxX + labelW + 25 > other.x &&
          boxY < other.y + other.h + 25 && boxY + labelH + 25 > other.y) {
          overlapping = true;
          spiralAttempt++;
          // Alternate swinging left/right and increase distance significantly
          const direction = (spiralAttempt % 2 === 0 ? 1 : -1);
          const swirlFactor = Math.ceil(spiralAttempt / 2) * 0.15; // Shift angle per layer
          angleRad += direction * swirlFactor;
          currentDist += 20; // Step outward AGGRESSIVELY as we sweep to escape dense clusters
          break;
        }
      }
      attempts++;
    }

    // Register final box to block other labels
    const isLeftFinal = dx < 0;
    rects.push({
      x: anchorX + dx - (isLeftFinal ? labelW : 0),
      y: anchorY + dy - (labelH / 2),
      w: labelW,
      h: labelH
    });

    const length = Math.sqrt(dx * dx + dy * dy);
    const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

    // Apply to DOM directly for buttery smooth 60fps updates without React renders
    lineRef.current.style.width = `${length}px`;
    lineRef.current.style.transform = `rotate(${angleDeg}deg)`;

    boxRef.current.style.left = `${dx}px`;
    boxRef.current.style.top = `${dy}px`;
    boxRef.current.style.transform = `translate(${dx < 0 ? '-100%' : '0%'}, -50%)`;
  });

  return (
    <group ref={groupRef}>
      <Html distanceFactor={150} zIndexRange={[100, 0]}>
        <div className="absolute pointer-events-none" style={{ left: 0, top: 0 }}>
          {/* Dot at origin */}
          <div className={`absolute w-[6px] h-[6px] rounded-full -left-[3px] -top-[3px] bg-black`}></div>

          {/* Leader line */}
          <div
            ref={lineRef}
            className={`absolute origin-left bg-black`}
            style={{
              height: '1.5px',
              top: 0,
              left: 0,
            }}
          />

          {/* Label Box */}
          <div
            ref={boxRef}
            className={"absolute font-black px-3 py-1.5 border-2 border-black bg-white text-black whitespace-nowrap rounded-sm tracking-wider"}
            style={{ fontSize: `${size}px` }}
          >
            {text}
          </div>
        </div>
      </Html>
    </group>
  );
};

const Pipe = ({ start, end, radius = 1.6, showLabel, colorOption = COLORS['Raw grey'] }: { start: [number, number, number], end: [number, number, number], radius?: number, showLabel?: boolean, colorOption?: ColorOption }) => {
  const vstart = new THREE.Vector3(...start);
  const vend = new THREE.Vector3(...end);
  const distance = vstart.distanceTo(vend);

  const direction = vend.clone().sub(vstart).normalize();
  let quaternion = new THREE.Quaternion();
  if (direction.y === -1) {
    quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
  } else {
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  }

  const pipes = getPipesForLength(distance);
  let currentPos = vstart.clone();

  return (
    <group>
      {pipes.map((pipeLen, i) => {
        const segmentEnd = currentPos.clone().add(direction.clone().multiplyScalar(pipeLen));
        const center = currentPos.clone().add(segmentEnd).divideScalar(2);

        const mesh = (
          <mesh key={`pipe-${i}`} position={center} quaternion={quaternion} castShadow receiveShadow>
            <cylinderGeometry args={[radius, radius, pipeLen, 32]} />
            <meshStandardMaterial color={colorOption.pipeColor} metalness={colorOption.metalness} roughness={colorOption.roughness} />
            {showLabel && <Label text={`${pipeLen.toFixed(1)} cm`} type="pipe" lineClass="h-8" />}
          </mesh>
        );

        const couplingPos = segmentEnd.clone();
        const hasCoupling = i < pipes.length - 1;

        currentPos = segmentEnd.clone();

        return (
          <group key={i}>
            {mesh}
            {hasCoupling && (
              <Coupling position={[couplingPos.x, couplingPos.y, couplingPos.z]} quaternion={quaternion} showLabel={showLabel} colorOption={colorOption} />
            )}
          </group>
        );
      })}
    </group>
  );
};

const Flange = ({ position, rotation, showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation: [number, number, number], showLabel?: boolean, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Base Plate */}
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[4.2, 4.2, 0.5, 32]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Tapered Neck */}
      <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
        <cylinderGeometry args={[1.8, 2.4, 0.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Vertical Socket Body */}
      <mesh castShadow receiveShadow position={[0, 1.3, 0]}>
        <cylinderGeometry args={[1.75, 1.8, 0.8, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Thick Thread Socket Collar */}
      <mesh castShadow receiveShadow position={[0, 1.85, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.6, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Bolted screws */}
      {[0, 1, 2, 3].map(i => {
        const angle = (i * Math.PI) / 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 3.1, 0.55, Math.sin(angle) * 3.1]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 8]} />
            <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={colorOption.roughness - 0.1} />
          </mesh>
        );
      })}
      {showLabel && <Label text="Flange" type="fitting" lineClass="h-16" />}
    </group>
  );
};

const TFitting = ({ position, rotation = [0, 0, 0], showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Central joining body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.75, 16, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Vertical Pipe Body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.65, 1.65, 4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Top Collar */}
      <mesh castShadow receiveShadow position={[0, 1.8, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Bottom Collar */}
      <mesh castShadow receiveShadow position={[0, -1.8, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Forward Outlet Branch */}
      <mesh castShadow receiveShadow position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 2.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Forward Branch Collar */}
      <mesh castShadow receiveShadow position={[0, 0, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="T-Fitting" type="fitting" lineClass="h-20" />}
    </group>
  );
};

const CrossFitting = ({ position, rotation = [0, 0, 0], showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.75, 16, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.65, 1.65, 4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.65, 1.65, 4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* 4 Collars for the 4 sockets */}
      <mesh castShadow receiveShadow position={[0, 1.8, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -1.8, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[1.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[-1.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="Cross Fitting" type="fitting" lineClass="h-20" />}
    </group>
  );
};

const SideOutletTee = ({ position, rotation = [0, 0, 0], showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Central joining body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.75, 16, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>

      {/* Horizontal Through Pipe (X Axis) */}
      <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.65, 1.65, 4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>

      {/* Down Branch (-Y Axis) */}
      <mesh castShadow receiveShadow position={[0, -1.2, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 2.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>

      {/* Back Branch (-Z Axis) */}
      <mesh castShadow receiveShadow position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 2.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>

      {/* Collars */}
      {/* Right/Left Collars (+/- X) */}
      <mesh castShadow receiveShadow position={[1.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[-1.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Down Collar (-Y) */}
      <mesh castShadow receiveShadow position={[0, -2.2, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Back Collar (-Z) */}
      <mesh castShadow receiveShadow position={[0, 0, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>

      {showLabel && <Label text="4-Way Fitting" type="fitting" lineClass="h-20" />}
    </group>
  );
};

const Elbow = ({ position, rotation = [0, 0, 0], showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.75, 16, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -1.2, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 2.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 2.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Downward Collar */}
      <mesh castShadow receiveShadow position={[0, -2.2, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Forward Collar */}
      <mesh castShadow receiveShadow position={[0, 0, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="90° Elbow" type="fitting" lineClass="h-12" />}
    </group>
  );
};

const FortyFiveElbow = ({ position, rotation = [0, 0, 0], showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean, colorOption?: ColorOption }) => {
  const angle = Math.PI / 4; // 45 degrees
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.75, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Downward Pipe */}
      <mesh castShadow receiveShadow position={[0, -1.0, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 2.0, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* 45 Deg Pipe */}
      <mesh castShadow receiveShadow position={[0, Math.cos(angle) * 1.0, Math.sin(angle) * 1.0]} rotation={[angle, 0, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 2.0, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Downward Collar */}
      <mesh castShadow receiveShadow position={[0, -2.0, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* 45 Deg Collar */}
      <mesh castShadow receiveShadow position={[0, Math.cos(angle) * 2.0, Math.sin(angle) * 2.0]} rotation={[angle, 0, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="45° Elbow" type="fitting" lineClass="h-10" />}
    </group>
  );
};

const EndCap = ({ position, rotation = [0, 0, 0], showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Thick collar rim */}
      <mesh castShadow receiveShadow position={[0, -0.3, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.6, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Rounded cap top */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <sphereGeometry args={[1.95, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Inner socket body connecting to pipe */}
      <mesh castShadow receiveShadow position={[0, -0.8, 0]}>
        <cylinderGeometry args={[1.75, 1.75, 0.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="In cap" type="fitting" lineClass="h-8" />}
    </group>
  );
};

const ConnectorBracket = ({ position, rotation = [0, 0, 0], showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Main slip-through body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.95, 1.95, 2.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Branch pipe section */}
      <mesh castShadow receiveShadow position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 2.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Right rim collar ring */}
      <mesh castShadow receiveShadow position={[2.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[2.2, 2.2, 0.4, 32]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={0.2} />
      </mesh>
      {/* Branch collar */}
      <mesh castShadow receiveShadow position={[0, 0, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="Connector Bracket" type="fitting" lineClass="h-16" />}
    </group>
  );
};

const HandrailBracket = ({ position, rotation = [0, 0, 0], showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean, colorOption?: ColorOption }) => {
  const wallZ = -4.5;
  const plateY = -4.0;
  const bendR = 1.2;
  const stemR = 0.55;

  const sleeveBottomY = -2.0;
  const horizZStart = wallZ + 0.5; // Hub ends at +0.5 from plate
  const horizZEnd = -bendR;
  const horizLength = Math.max(0.01, Math.abs(horizZStart - horizZEnd));
  const horizCenterZ = (horizZStart + horizZEnd) / 2;

  const vertYStart = plateY + bendR;
  const vertYEnd = sleeveBottomY;
  const vertLength = Math.max(0.01, Math.abs(vertYEnd - vertYStart));
  const vertCenterY = (vertYStart + vertYEnd) / 2;

  return (
    <group position={position} rotation={rotation}>
      {/* === Wall Rosette Plate === */}
      <mesh castShadow receiveShadow position={[0, plateY, wallZ]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.4, 2.4, 0.4, 32]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={0.3} />
      </mesh>
      {/* Center hub / base of stem */}
      <mesh castShadow receiveShadow position={[0, plateY, wallZ + 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.5, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={0.3} />
      </mesh>

      {/* === Stem === */}
      {/* Horizontal post coming out of the wall plate towards Z=0 */}
      <mesh castShadow receiveShadow position={[0, plateY, horizCenterZ]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[stemR, stemR, horizLength, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={0.35} />
      </mesh>

      {/* Curved 90-degree corner (Torus forming a perfect bend) */}
      <mesh castShadow receiveShadow position={[0, plateY, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[bendR, stemR, 16, 32, Math.PI / 2]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={0.35} />
      </mesh>

      {/* Vertical post going up to the sleeve */}
      <mesh castShadow receiveShadow position={[0, vertCenterY, 0]}>
        <cylinderGeometry args={[stemR, stemR, vertLength, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={0.35} />
      </mesh>

      {/* === Sleeve / Ring === */}
      <group position={[0, 0, 0]}>
        {/* Outer sleeve body */}
        <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[2.0, 2.0, 3.6, 32]} />
          <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={0.25} />
        </mesh>
        {/* Inner hollow (shows the rod passes through) */}
        <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.65, 1.65, 3.7, 32]} />
          <meshStandardMaterial color="#222" metalness={0.1} roughness={0.9} />
        </mesh>

        {/* Sleeve connection hub (welded transition to stem) */}
        <mesh castShadow receiveShadow position={[0, -1.8, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.4, 16]} />
          <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={0.25} />
        </mesh>
      </group>

      {showLabel && <Label text="Handrail Bracket" type="fitting" lineClass="h-16" />}
    </group>
  );
};

const StraightHandrailBracket = ({ position, rotation = [0, 0, 0], showLabel, colorOption = COLORS['Raw grey'], orientation = 'horizontal' }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean, colorOption?: ColorOption, orientation?: 'horizontal' | 'vertical' }) => {
  const wallZ = -4.5; // distance from center of rod back to wall plate
  const plateY = 0;
  const stemR = 0.55;
  const vertLength = Math.abs(wallZ) - 1.6; // span from wall plate to sleeve
  const vertCenterZ = wallZ + (Math.abs(wallZ) / 2);
  const sleeveRot: [number, number, number] = orientation === 'horizontal' ? [0, 0, Math.PI / 2] : [0, 0, 0];

  return (
    <group position={position} rotation={rotation}>
      {/* Wall Rosette Plate */}
      <mesh castShadow receiveShadow position={[0, plateY, wallZ]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.4, 2.4, 0.4, 32]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={0.3} />
      </mesh>

      {/* Center hub / base */}
      <mesh castShadow receiveShadow position={[0, plateY, wallZ + 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.5, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={0.3} />
      </mesh>

      {/* Straight Stem */}
      <mesh castShadow receiveShadow position={[0, plateY, vertCenterZ + 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[stemR, stemR, vertLength, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={0.35} />
      </mesh>

      {/* Sleeve / Ring */}
      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow rotation={sleeveRot}>
          <cylinderGeometry args={[2.0, 2.0, 3.6, 32]} />
          <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={0.25} />
        </mesh>
        <mesh castShadow receiveShadow rotation={sleeveRot}>
          <cylinderGeometry args={[1.65, 1.65, 3.7, 32]} />
          <meshStandardMaterial color={colorOption.pipeColor} metalness={colorOption.metalness} roughness={colorOption.roughness} />
        </mesh>
      </group>

      {showLabel && <Label text="Straight Handrail Bracket" type="fitting" lineClass="h-16" />}
    </group>
  );
};

const CornerFitting = ({ position, rotation = [0, 0, 0], side, showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], side: 'left' | 'right', showLabel?: boolean, colorOption?: ColorOption }) => {
  const sign = side === 'left' ? 1 : -1;
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.75, 16, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -1.2, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 2.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 2.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[sign * 1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.65, 1.65, 2.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* 3 Collars */}
      <mesh castShadow receiveShadow position={[0, -2.2, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[sign * 2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="Corner Elbow" type="fitting" lineClass="h-16" />}
    </group>
  );
};

const Union = ({ position, rotation = [0, 0, 0], quaternion, showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], quaternion?: THREE.Quaternion, showLabel?: boolean, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={quaternion ? undefined : rotation} quaternion={quaternion}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.75, 1.75, 4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[2.3, 2.3, 1.5, 8]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.8, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -1.8, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="Union" type="fitting" lineClass="h-12" />}
    </group>
  );
};

const Coupling = ({ position, rotation = [0, 0, 0], quaternion, showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], quaternion?: THREE.Quaternion, showLabel?: boolean, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={quaternion ? undefined : rotation} quaternion={quaternion}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.75, 1.75, 2.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -1.0, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="Coupling" type="fitting" lineClass="h-12" />}
    </group>
  );
};

const HexNipple = ({ position, rotation = [0, 0, 0], quaternion, showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], quaternion?: THREE.Quaternion, showLabel?: boolean, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={quaternion ? undefined : rotation} quaternion={quaternion}>
      {/* Central Hex Nut */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.0, 1.0, 6]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Threads/Body - 1.6 to match standard pipes/ports */}
      <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 1.0, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -1.0, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 1.0, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="Hex Nipple" type="fitting" lineClass="h-12" />}
    </group>
  );
};



const HairpinLeg = ({ position, height = 86, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], height?: number, colorOption?: ColorOption }) => {
  const rodRadius = 0.5;
  const spreadTop = 4;
  const tilt = 0.04;

  return (
    <group position={position}>
      {/* L-shaped top mounting plate at y=height */}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[10, 0.2, 10]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 3 Rods meeting at y=0 and widening at y=height */}
      {/* Front Left - tilted out (neg x) and out (pos z) at top */}
      <group position={[-spreadTop / 4, height / 2, spreadTop / 4]} rotation={[tilt, 0, tilt]}>
        <mesh castShadow>
          <cylinderGeometry args={[rodRadius, rodRadius, height, 8]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
      {/* Front Right - tilted out (pos x) and out (pos z) at top */}
      <group position={[spreadTop / 4, height / 2, spreadTop / 4]} rotation={[tilt, 0, -tilt]}>
        <mesh castShadow>
          <cylinderGeometry args={[rodRadius, rodRadius, height, 8]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
      {/* Back Center - tilted out (neg z) at top */}
      <group position={[0, height / 2, -spreadTop / 4]} rotation={[-tilt, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[rodRadius, rodRadius, height, 8]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Bottom floor point */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[rodRadius * 1.5, 12, 12]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
};

const ShelfBracket = ({ position, depth = 23.9 }: { position: [number, number, number], depth?: number }) => {
  return (
    <group position={position}>
      {/* Wall plate */}
      <mesh position={[0, 5, -depth / 2]}>
        <boxGeometry args={[3, 10, 0.3]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Horizontal plate */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 0.3, depth]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Front lip */}
      <mesh position={[0, 1.5, depth / 2]}>
        <boxGeometry args={[3, 3, 0.3]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

const Shelf = ({ position, length, depth, woodColor = 'Natural Oak', highlightFront = false }: { position: [number, number, number], length: number, depth: number, woodColor?: string, highlightFront?: boolean }) => {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, 3, depth]} />
        <meshStandardMaterial color={WOOD_COLORS[woodColor] || WOOD_COLORS['Natural Oak']} roughness={0.8} />
      </mesh>
      {highlightFront && (
        <mesh position={[0, 0, depth / 2 + 0.1]}>
          <boxGeometry args={[length, 3.1, 0.2]} />
          <meshStandardMaterial color={WOOD_COLORS[woodColor] || WOOD_COLORS['Natural Oak']} roughness={0.7} />
        </mesh>
      )}
    </group>
  );
};

const Rack = ({ length, height, wallDistance, explode, hasShelves = true, isFreestanding = false, colorOption = COLORS['Raw grey'], skuType = 'standard', woodColor = 'Natural Oak', tiers = 4 }: { length: number, height: number, wallDistance: number, explode: number, hasShelves?: boolean, isFreestanding?: boolean, colorOption?: ColorOption, skuType?: 'standard' | 'sku777' | 'sku000' | 'sku100' | 'sku200' | 'sku102' | 'sku103' | 'sku104' | 'sku4210' | 'sku300' | 'sku105' | 'sku106' | 'sku107' | 'sku108' | 'sku109' | 'sku110' | 'sku111' | 'sku112' | 'sku113' | 'sku114' | 'sku115' | 'sku116' | 'sku117' | 'sku118' | 'sku119' | 'sku120' | 'sku121' | 'sku122' | 'sku123' | 'sku124' | 'sku125' | 'sku126' | 'sku127' | 'sku128' | 'sku129' | 'sku130' | 'sku131' | 'sku132' | 'sku133' | 'sku134' | 'sku135' | 'sku136' | 'sku137' | 'sku138' | 'sku140' | 'sku141' | 'sku142' | 'sku143' | 'sku144' | 'sku145' | 'sku146' | 'sku147' | 'sku148' | 'sku149' | 'sku150' | 'sku151' | 'sku152' | 'sku153' | 'sku154' | 'sku155' | 'sku156' | 'sku157' | 'sku158' | 'sku159' | 'sku160' | 'sku161' | 'sku162' | 'sku163' | 'sku164' | 'sku165' | 'sku166' | 'sku167' | 'sku168' | 'sku169' | 'sku170' | 'sku171' | 'sku172' | 'sku173' | 'sku174' | 'sku175' | 'sku176' | 'sku177' | 'sku888', woodColor?: string, tiers?: number }) => {
  const leftX = -length / 2;
  const rightX = length / 2;
  const wallZ = -wallDistance;
  const showLabel = explode > 0 || (window as any).__PDF_MODE === true;

  if (skuType === 'sku108' || skuType === 'sku109') {
    const e = explode * 2;
    const legHeight = 86;
    const lx = leftX + 10;
    const rx = rightX - 10;
    const shelfDepth = skuType === 'sku109' ? 23 : 15;

    return (
      <group position={[0, -legHeight / 2, 0]}>
        {hasShelves && (
          <group position={[0, e, 0]}>
            <Shelf position={[0, legHeight + 1.5, 0]} length={length} depth={shelfDepth} woodColor={woodColor} highlightFront={true} />
          </group>
        )}
        <group position={[lx, 0, 0]}>
          <HairpinLeg position={[0, 0, 0]} height={legHeight} colorOption={colorOption} />
        </group>
        <group position={[rx, 0, 0]}>
          <HairpinLeg position={[0, 0, 0]} height={legHeight} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku110') {
    const e = explode * 1.5;
    const shelfDepth = 23;
    const bracketDepth = 23.9;
    const lx = leftX + length * 0.2;
    const rx = rightX - length * 0.2;

    return (
      <group position={[0, 0, 0]}>
        {hasShelves && (
          <group position={[0, e, 0]}>
            <Shelf position={[0, 1.5, 0]} length={length} depth={shelfDepth} woodColor={woodColor} highlightFront={true} />
          </group>
        )}
        <group position={[lx, 0, -0.4]}>
          <ShelfBracket position={[0, 0, 0]} depth={bracketDepth} />
        </group>
        <group position={[rx, 0, -0.4]}>
          <ShelfBracket position={[0, 0, 0]} depth={bracketDepth} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku111') {
    const e = explode * 1.5;
    const drop = height;
    const zWall = -wallDistance;

    const buildSide111 = (x: number, isLeft: boolean) => {
      const sideX = isLeft ? -e : e;
      return (
        <group key={isLeft ? 'left' : 'right'}>
          <group position={[sideX, e * 3, zWall]}>
            <Flange position={[x, drop, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Hex Nipple */}
          <group position={[sideX, e * 2.5, zWall]}>
            <HexNipple position={[x, drop - 1.5, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Coupling */}
          <group position={[sideX, e * 2, zWall]}>
            <Coupling position={[x, drop - 3.2, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, e, zWall]}>
            <Pipe start={[x, drop - 3.2, 0]} end={[x, 2.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, 0, zWall]}>
            <Elbow position={[x, drop, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, -e, zWall]}>
            <Pipe start={[x, drop, -2.2]} end={[x, 0, -2.2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, -e * 2, zWall]}>
            <Elbow position={[x, 0, 0]} rotation={[Math.PI, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      );
    };

    return (
      <group position={[0, -drop / 2, 0]}>
        {buildSide111(leftX, true)}
        {buildSide111(rightX, false)}

        <group position={[0, -e * 3, zWall]}>
          <Pipe start={[leftX + 2.2, 0, 0]} end={[rightX - 2.2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku113') {
    const e = explode * 1.5;
    const drop = height;
    const zWall = -wallDistance;

    return (
      <group position={[0, -drop / 2, 0]}>
        <group position={[-e, e, -e]}>
          <Flange position={[leftX, drop, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Hex Nipple from wall */}
        <group position={[-e, e, -e * 0.75]}>
          <HexNipple position={[leftX, drop, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Coupling after Hex Nipple */}
        <group position={[-e, e, -e * 0.625]}>
          <Coupling position={[leftX, drop, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-e, e, -e * 0.5]}>
          <Pipe start={[leftX, drop, zWall + 4.35]} end={[leftX, drop, -1.5]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-e, e, 0]}>
          <TFitting position={[leftX, drop, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-e, e * 1.5, 0]}>
          <EndCap position={[leftX, drop + 1.5, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-e, e * 0.5, 0]}>
          <Pipe start={[leftX, drop - 1.5, 0]} end={[leftX, 1.5, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-e, 0, 0]}>
          <Elbow position={[leftX, 0, 0]} rotation={[Math.PI, Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, 0, 0]}>
          <Pipe start={[leftX + 1.5, 0, 0]} end={[rightX - 1.5, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[e, 0, 0]}>
          <EndCap position={[rightX - 1.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku114') {
    const e = explode * 1.5;
    const drop = height;
    const zWall = -wallDistance;

    const renderBar = (xPos: number, xExplode: number) => (
      <group position={[xPos, 0, 0]}>
        <group position={[xExplode, e, -e]}>
          <Flange position={[0, drop, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Hex Nipple from wall */}
        <group position={[xExplode, e, -e * 0.75]}>
          <HexNipple position={[0, drop, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Coupling after Hex Nipple */}
        <group position={[xExplode, e, -e * 0.625]}>
          <Coupling position={[0, drop, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[xExplode, e, -e * 0.5]}>
          <Pipe start={[0, drop, zWall + 4.35]} end={[0, drop, -1.5]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[xExplode, e, 0]}>
          <Elbow position={[0, drop, 0]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[xExplode, e * 0.5, 0]}>
          <Pipe start={[0, drop - 1.5, 0]} end={[0, 1.5, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[xExplode, 0, 0]}>
          <Elbow position={[0, 0, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Wall Flange Base */}
        <group position={[xExplode, 0, -e]}>
          <Flange position={[0, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Hex Nipple from wall base */}
        <group position={[xExplode, 0, -e * 0.75]}>
          <HexNipple position={[0, 0, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Coupling after Hex Nipple base */}
        <group position={[xExplode, 0, -e * 0.625]}>
          <Coupling position={[0, 0, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[xExplode, 0, -e * 0.5]}>
          <Pipe start={[0, 0, zWall + 4.35]} end={[0, 0, -1.5]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );

    return (
      <group position={[0, -drop / 2, 0]}>
        {renderBar(leftX, -e)}
        {renderBar(rightX, e)}
      </group>
    );
  }

  if (skuType === 'sku115') {
    const e = explode * 1.5;
    const zWall = -wallDistance;
    const needsMidSupport = length > 180;

    const topY = 0;
    const midY = topY - 8; // 1.5 (fitting) + 5 (pipe) + 1.5 (fitting)
    const bottomY = midY - 8; // 1.5 (fitting) + 5 (pipe) + 1.5 (fitting)

    const buildSide115 = (x: number, type: 'left' | 'right' | 'center') => {
      const isLeft = type === 'left';
      const isCenter = type === 'center';
      const sideX = isLeft ? -e : type === 'right' ? e : 0;

      const midTeeRot: [number, number, number] = isLeft ? [0, -Math.PI / 2, 0] : type === 'right' ? [0, Math.PI / 2, 0] : [0, 0, 0];

      return (
        <group key={type}>
          {/* Top Wall Flange */}
          <group position={[sideX, e * 3, -e * 1.5]}>
            <Flange position={[x, topY, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Hex Nipple from wall */}
          <group position={[sideX, e * 3, -e * 1.125]}>
            <HexNipple position={[x, topY, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Coupling after Hex Nipple */}
          <group position={[sideX, e * 3, -e * 0.9375]}>
            <Coupling position={[x, topY, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Top Wall Pipe */}
          <group position={[sideX, e * 3, -e * 0.75]}>
            <Pipe start={[x, topY, zWall + 4.35]} end={[x, topY, -1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Top Connection: T-Fitting + EndCap (Always present regardless of shelf) */}
          <group position={[sideX, e * 3, 0]}>
            <TFitting position={[x, topY, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, e * 4, 0]}>
            <Pipe start={[x, topY + 1.5, 0]} end={[x, topY + 6.5, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, e * 5, 0]}>
            <EndCap position={[x, topY + 6.5, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* 5cm Pipe dropping to Middle Fitting */}
          <group position={[sideX, e * 1.5, 0]}>
            <Pipe start={[x, topY - 1.5, 0]} end={[x, midY + 1.5, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Mid Fitting (for horizontal clothing rail) */}
          <group position={[sideX, 0, 0]}>
            {isCenter ? (
              <CrossFitting position={[x, midY, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            ) : (
              <TFitting position={[x, midY, 0]} rotation={midTeeRot} showLabel={showLabel} colorOption={colorOption} />
            )}
          </group>

          {/* Vertical Drop Pipe (length: exactly 5cm to bottom bracket) */}
          <group position={[sideX, -e * 1.5, 0]}>
            <Pipe start={[x, midY - 1.5, 0]} end={[x, bottomY + 1.5, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Bottom Elbow (Always Elbow, even for center) */}
          <group position={[sideX, -e * 3, 0]}>
            <Elbow position={[x, bottomY, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Bottom Wall Flange */}
          <group position={[sideX, -e * 3, -e * 1.5]}>
            <Flange position={[x, bottomY, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Hex Nipple from wall */}
          <group position={[sideX, -e * 3, -e * 1.125]}>
            <HexNipple position={[x, bottomY, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Coupling after Hex Nipple */}
          <group position={[sideX, -e * 3, -e * 0.9375]}>
            <Coupling position={[x, bottomY, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Bottom Wall Pipe */}
          <group position={[sideX, -e * 3, -e * 0.75]}>
            <Pipe start={[x, bottomY, zWall + 4.35]} end={[x, bottomY, -1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      );
    };

    return (
      <group position={[0, height / 2, 0]}>
        {buildSide115(leftX, 'left')}
        {buildSide115(rightX, 'right')}
        {needsMidSupport && buildSide115(0, 'center')}

        {/* Horizontal Clothing Rail */}
        <group position={[0, 0, 0]}>
          {needsMidSupport ? (
            <>
              <Pipe start={[leftX - e + 1.5, midY, 0]} end={[-1.5, midY, 0]} showLabel={showLabel} colorOption={colorOption} />
              <Pipe start={[1.5, midY, 0]} end={[rightX + e - 1.5, midY, 0]} showLabel={showLabel} colorOption={colorOption} />
            </>
          ) : (
            <Pipe start={[leftX - e + 1.5, midY, 0]} end={[rightX + e - 1.5, midY, 0]} showLabel={showLabel} colorOption={colorOption} />
          )}
        </group>

        {hasShelves && (
          <group position={[0, e * 6, -e * 0.75]}>
            <Shelf
              position={[0, topY + 1.5, -wallDistance / 2]}
              length={length}
              depth={wallDistance + 2}
              woodColor={woodColor}
              highlightFront={true}
            />
          </group>
        )}
      </group>
    );
  }

  if (skuType === 'sku116') {
    const e = explode * 1.5;
    const zWall = -wallDistance;
    const needsMidSupport = true;

    const topY = height / 2;
    const bottomY = -height / 2;

    const buildSide116 = (x: number, type: 'left' | 'right' | 'center') => {
      const isCenter = type === 'center';
      const sideX = type === 'left' ? -e : type === 'right' ? e : 0;
      const elbowRot: [number, number, number] = type === 'left' ? [Math.PI, Math.PI / 2, 0] : [Math.PI, -Math.PI / 2, 0];
      const teeRot: [number, number, number] = [Math.PI / 2, 0, Math.PI / 2];

      return (
        <group key={type} position={[sideX, 0, zWall]}>
          {/* Ceiling Flange */}
          <group position={[0, e * 2, 0]}>
            <Flange position={[x, topY, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Vertical Drop Pipe */}
          <group position={[0, e, 0]}>
            <Pipe start={[x, topY - 2.2, 0]} end={[x, bottomY + 2.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Bottom Connection */}
          <group position={[0, -e, 0]}>
            {isCenter ? (
              <TFitting position={[x, bottomY, 0]} rotation={teeRot} showLabel={showLabel} colorOption={colorOption} />
            ) : (
              <Elbow position={[x, bottomY, 0]} rotation={elbowRot} showLabel={showLabel} colorOption={colorOption} />
            )}
          </group>
        </group>
      );
    };

    return (
      <group position={[0, height / 2, 0]}>
        {buildSide116(leftX, 'left')}
        {buildSide116(rightX, 'right')}
        {needsMidSupport && buildSide116(0, 'center')}

        {/* Horizontal Clothing Rail */}
        <group position={[0, -e * 2, zWall]}>
          <group position={[-e * 0.5, 0, 0]}>
            <Pipe start={[leftX + 2.2, bottomY, 0]} end={[0, bottomY, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[e * 0.5, 0, 0]}>
            <Pipe start={[0, bottomY, 0]} end={[rightX - 2.2, bottomY, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      </group>
    );
  }

  if (skuType === 'sku102') {
    const e = explode * 1.5;
    const zWall = -wallDistance;
    const zBack = zWall + 13; // 10cm pipe + 1.5cm flange + 1.5cm tee
    const zFront = 0;

    const buildSupport102 = (x: number, type: 'left' | 'right' | 'center') => {
      const isCenter = type === 'center';
      const sideX = type === 'left' ? -e : type === 'right' ? e : 0;

      const tRotation = type === 'left' ? [0, Math.PI / 2, -Math.PI / 2] :
        type === 'right' ? [0, Math.PI / 2, Math.PI / 2] : [0, 0, 0];

      const elbowRotation = type === 'left' ? [Math.PI / 2, 0, -Math.PI / 2] :
        type === 'right' ? [Math.PI / 2, 0, Math.PI / 2] : [0, 0, 0];

      return (
        <group key={type}>
          {/* Wall Connection */}
          <group position={[sideX, 0, -e]}>
            <Flange position={[x, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Hex Nipple from wall */}
          <group position={[sideX, 0, -e * 0.75]}>
            <HexNipple position={[x, 0, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Coupling after Hex Nipple */}
          <group position={[sideX, 0, -e * 0.625]}>
            <Coupling position={[x, 0, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Pipe from flange to T-fitting (10cm pole) */}
          <group position={[sideX, 0, -e * 0.5]}>
            <Pipe start={[x, 0, zWall + 4.35]} end={[x, 0, zBack - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* T-Fitting or CrossFitting for the back rail */}
          <group position={[sideX, 0, 0]}>
            {isCenter ? (
              <CrossFitting position={[x, 0, zBack]} rotation={[-Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            ) : (
              <TFitting position={[x, 0, zBack]} rotation={tRotation as [number, number, number]} showLabel={showLabel} colorOption={colorOption} />
            )}
          </group>

          {/* Forward Pipe Part 1 (T-fitting to Union) */}
          <group position={[sideX, 0, e * 0.25]}>
            <Pipe start={[x, 0, zBack + 1.5]} end={[x, 0, (zBack + zFront) / 2 - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Union */}
          <group position={[sideX, 0, e * 0.5]}>
            <Union position={[x, 0, (zBack + zFront) / 2]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Forward Pipe Part 2 (Union to Elbow) */}
          <group position={[sideX, 0, e * 0.75]}>
            <Pipe start={[x, 0, (zBack + zFront) / 2 + 1.5]} end={[x, 0, zFront - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Front Elbow or T-fitting */}
          <group position={[sideX, 0, e]}>
            {isCenter ? (
              <TFitting position={[x, 0, zFront]} rotation={[-Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            ) : (
              <Elbow position={[x, 0, zFront]} rotation={elbowRotation as [number, number, number]} showLabel={showLabel} colorOption={colorOption} />
            )}
          </group>
        </group>
      );
    };

    return (
      <group position={[0, 0, 0]}>
        {buildSupport102(leftX, 'left')}
        {buildSupport102(rightX, 'right')}
        {length > 120 && buildSupport102(0, 'center')}

        {/* Horizontal Rails */}
        {length > 120 ? (
          <>
            {/* Left side rails */}
            <group position={[-e * 0.5, 0, 0]}>
              <Pipe start={[leftX + 1.5, 0, zBack]} end={[-1.5, 0, zBack]} showLabel={showLabel} colorOption={colorOption} />
              <Pipe start={[leftX + 1.5, 0, zFront]} end={[-1.5, 0, zFront]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            {/* Right side rails */}
            <group position={[e * 0.5, 0, 0]}>
              <Pipe start={[1.5, 0, zBack]} end={[rightX - 1.5, 0, zBack]} showLabel={showLabel} colorOption={colorOption} />
              <Pipe start={[1.5, 0, zFront]} end={[rightX - 1.5, 0, zFront]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          </>
        ) : (
          <group position={[0, 0, 0]}>
            <Pipe start={[leftX + 1.5, 0, zBack]} end={[rightX - 1.5, 0, zBack]} showLabel={showLabel} colorOption={colorOption} />
            <Pipe start={[leftX + 1.5, 0, zFront]} end={[rightX - 1.5, 0, zFront]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        )}
      </group>
    );
  }

  if (skuType === 'sku200') {
    const e = explode * 1.5;
    const zWall = -wallDistance;
    const zBackPipe = -15;
    const zFrontPipe = 0;

    const pipeToTLength = wallDistance - 15;
    const pipeToFrontLength = 15;

    const buildSupport200 = (x: number, type: 'left' | 'right' | 'center') => {
      const sideX = type === 'left' ? -e : type === 'right' ? e : 0;
      return (
        <group key={type}>
          <group position={[sideX, 0, -e]}>
            <Flange position={[x, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} colorOption={colorOption} showLabel={showLabel} />
          </group>
          {/* Hex Nipple from wall */}
          <group position={[sideX, 0, -e * 0.75]}>
            <HexNipple position={[x, 0, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Coupling after Hex Nipple */}
          <group position={[sideX, 0, -e * 0.625]}>
            <Coupling position={[x, 0, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, 0, -e * 0.5]}>
            <Pipe start={[x, 0, zWall + 4.35]} end={[x, 0, zBackPipe - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, 0, 0]}>
            {type === 'center' ? (
              <CrossFitting position={[x, 0, zBackPipe]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            ) : (
              <TFitting position={[x, 0, zBackPipe]} rotation={[Math.PI / 2, 0, type === 'left' ? 0 : Math.PI]} showLabel={showLabel} colorOption={colorOption} />
            )}
          </group>
          <group position={[sideX, 0, e * 0.5]}>
            <Pipe start={[x, 0, zBackPipe + 1.5]} end={[x, 0, zFrontPipe - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, 0, e]}>
            {type === 'center' ? (
              <TFitting position={[x, 0, zFrontPipe]} rotation={[Math.PI / 2, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
            ) : (
              <Elbow position={[x, 0, zFrontPipe]} rotation={[-Math.PI / 2, 0, type === 'left' ? 0 : Math.PI]} showLabel={showLabel} colorOption={colorOption} />
            )}
          </group>
        </group>
      );
    };

    return (
      <group position={[0, 0, 0]}>
        {buildSupport200(leftX, 'left')}
        {buildSupport200(rightX, 'right')}
        {length > 120 && buildSupport200(0, 'center')}

        {/* Horizontal Pipes */}
        {length > 120 ? (
          <>
            <group position={[-e * 0.5, 0, 0]}>
              <Pipe start={[leftX + 1.5, 0, zBackPipe]} end={[-2, 0, zBackPipe]} showLabel={showLabel} colorOption={colorOption} />
              <Pipe start={[leftX + 1.5, 0, zFrontPipe]} end={[-2, 0, zFrontPipe]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[e * 0.5, 0, 0]}>
              <Pipe start={[2, 0, zBackPipe]} end={[rightX - 1.5, 0, zBackPipe]} showLabel={showLabel} colorOption={colorOption} />
              <Pipe start={[2, 0, zFrontPipe]} end={[rightX - 1.5, 0, zFrontPipe]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          </>
        ) : (
          <group position={[0, 0, 0]}>
            <Pipe start={[leftX + 1.5, 0, zBackPipe]} end={[rightX - 1.5, 0, zBackPipe]} showLabel={showLabel} colorOption={colorOption} />
            <Pipe start={[leftX + 1.5, 0, zFrontPipe]} end={[rightX - 1.5, 0, zFrontPipe]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        )}
      </group>
    );
  }

  if (skuType === 'sku000') {
    const e = explode * 1.5;
    const shelfDepth = wallDistance;
    const pipeDistX = length / 2 - 10; // Pipes are inset from the edges of the shelf
    const zWall = -wallDistance;
    // const zWall = -wallDistance; // No longer needed

    const buildSupport000 = (x: number, type: 'left' | 'right') => {
      const sideX = type === 'left' ? -e : e;
      return (
        <group key={type} position={[sideX, 0, 0]}>
          {/* Ceiling Flange */}
          <group position={[0, e, 0]}>
            <Flange position={[x, height, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Vertical Pipe */}
          <group position={[0, 0, 0]}>
            <Pipe start={[x, 0, 0]} end={[x, height, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Shelf Flange (Bottom) */}
          <group position={[0, -e, 0]}>
            <Flange position={[x, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      );
    };

    return (
      <group position={[0, 0, 0]}>
        {buildSupport000(-pipeDistX, 'left')}
        {buildSupport000(pipeDistX, 'right')}

        {/* Shelf - Now length matches and position is aligned to flange bottom */}
        <group position={[0, -explode * 2, 0]}>
          <Shelf position={[0, -1.0, 0]} length={length} depth={shelfDepth} woodColor={woodColor} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku4210') {
    const e = explode * 1.5;
    const tHeight = height - 10;

    const buildSupport4210 = (x: number, type: 'left' | 'right') => {
      const sideX = type === 'left' ? -e : e;

      return (
        <group key={type}>
          {/* Floor Flange */}
          <group position={[sideX, -e, 0]}>
            <Flange position={[x, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Lower Vertical Pipe */}
          <group position={[sideX, 0, 0]}>
            <Pipe start={[x, 0, 0]} end={[x, tHeight, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* T-Fitting */}
          <group position={[sideX, e, 0]}>
            <TFitting position={[x, tHeight, 0]} rotation={[0, type === 'left' ? -Math.PI / 2 : Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Upper Vertical Pipe */}
          <group position={[sideX, e * 1.5, 0]}>
            <Pipe start={[x, tHeight, 0]} end={[x, height, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Top Elbow */}
          <group position={[sideX, e * 2, 0]}>
            <Elbow position={[x, height, 0]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Wall Flange */}
          <group position={[sideX, e * 2, -e * 2]}>
            <Flange position={[x, height, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Hex Nipple from wall */}
          <group position={[sideX, e * 2, -e * 1.5]}>
            <HexNipple position={[x, height, wallZ + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Coupling after Hex Nipple */}
          <group position={[sideX, e * 2, -e * 1.25]}>
            <Coupling position={[x, height, wallZ + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Wall connector pipe */}
          <group position={[sideX, e * 2, -e]}>
            <Pipe start={[x, height, wallZ + 4.35]} end={[x, height, -1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      );
    };

    return (
      <group position={[0, 0, 0]}>
        {buildSupport4210(leftX, 'left')}
        {buildSupport4210(rightX, 'right')}

        {/* Top Horizontal Bar */}
        {length > 120 ? (
          <>
            <group position={[-explode * 0.75, e, 0]}>
              <Pipe start={[leftX + 1.5, tHeight, 0]} end={[0, tHeight, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[0, e, 0]}>
              <Coupling position={[0, tHeight, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[explode * 0.75, e, 0]}>
              <Pipe start={[0, tHeight, 0]} end={[rightX - 1.5, tHeight, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          </>
        ) : (
          <group position={[0, e, 0]}>
            <Pipe start={[leftX + 1.5, tHeight, 0]} end={[rightX - 1.5, tHeight, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        )}
      </group>
    );
  }

  if (skuType === 'sku100') {
    const e = explode * 1.5;
    const midY = height / 2;

    const buildSupport100 = (x: number, type: 'left' | 'right') => {
      const sideX = type === 'left' ? -e : e;

      return (
        <group key={type}>
          {/* Floor Flange */}
          <group position={[sideX, -e, 0]}>
            <Flange position={[x, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Lower Vertical */}
          <group position={[sideX, 0, 0]}>
            <Pipe start={[x, 0, 0]} end={[x, midY, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Middle T-Fitting */}
          <group position={[sideX, e, 0]}>
            <TFitting position={[x, midY, 0]} rotation={[0, type === 'left' ? -Math.PI / 2 : Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Upper Vertical (Split with Union) */}
          <group position={[sideX, e * 2, 0]}>
            <Pipe start={[x, midY, 0]} end={[x, height - 5, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, e * 2.5, 0]}>
            <Union position={[x, height - 5, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, e * 2.75, 0]}>
            <Pipe start={[x, height - 5, 0]} end={[x, height, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Top Corner Fitting */}
          <group position={[sideX, e * 3, 0]}>
            <CornerFitting position={[x, height, 0]} side={type} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Wall Flange */}
          <group position={[sideX, e * 3, -e * 2]}>
            <Flange position={[x, height, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Hex Nipple from wall */}
          <group position={[sideX, e * 3, -e * 1.5]}>
            <HexNipple position={[x, height, wallZ + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Coupling after Hex Nipple */}
          <group position={[sideX, e * 3, -e * 1.25]}>
            <Coupling position={[x, height, wallZ + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Wall Connector */}
          <group position={[sideX, e * 3, -e]}>
            <Pipe start={[x, height, wallZ + 4.35]} end={[x, height, -1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      );
    };

    return (
      <group position={[0, 0, 0]}>
        {buildSupport100(leftX, 'left')}
        {buildSupport100(rightX, 'right')}

        {/* Middle Horizontal Bar */}
        {length > 120 ? (
          <>
            <group position={[-explode * 0.75, e, 0]}>
              <Pipe start={[leftX + 1.5, midY, 0]} end={[0, midY, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[0, e, 0]}>
              <Coupling position={[0, midY, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[explode * 0.75, e, 0]}>
              <Pipe start={[0, midY, 0]} end={[rightX - 1.5, midY, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          </>
        ) : (
          <group position={[0, e, 0]}>
            <Pipe start={[leftX + 1.5, midY, 0]} end={[rightX - 1.5, midY, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        )}

        {/* Top Horizontal Bar */}
        {length > 120 ? (
          <>
            <group position={[-explode * 0.75, e * 3, 0]}>
              <Pipe start={[leftX + 1.5, height, 0]} end={[0, height, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[0, e * 3, 0]}>
              <Coupling position={[0, height, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[explode * 0.75, e * 3, 0]}>
              <Pipe start={[0, height, 0]} end={[rightX - 1.5, height, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          </>
        ) : (
          <group position={[0, e * 3, 0]}>
            <Pipe start={[leftX + 1.5, height, 0]} end={[rightX - 1.5, height, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        )}
      </group>
    );
  }

  if (skuType === 'sku777') {
    const e = explode * 1.5;
    const buildSupport777 = (x: number, type: 'left' | 'right' | 'center') => {
      const sideX = type === 'left' ? -e : type === 'right' ? e : 0;
      return (
        <group key={type}>
          {/* Fitting on horizontal bar */}
          <group position={[sideX, 0, 0]}>
            {type === 'center' ? (
              <CrossFitting position={[x, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            ) : (
              <TFitting position={[x, 0, 0]} rotation={[0, type === 'left' ? -Math.PI / 2 : Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
            )}
          </group>

          {/* Top Part */}
          <group position={[sideX, e * 0.5, 0]}>
            <Pipe start={[x, 2, 0]} end={[x, 10, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, e, 0]}>
            <Elbow position={[x, 10, 0]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Top Wall Flange */}
          <group position={[sideX, e, -e]}>
            <Flange position={[x, 10, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Hex Nipple from wall */}
          <group position={[sideX, e, -e * 0.75]}>
            <HexNipple position={[x, 10, wallZ + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>          {/* Coupling after Hex Nipple */}
          <group position={[sideX, e, -e * 0.625]}>
            <Coupling position={[x, 10, wallZ + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, e, -e * 0.5]}>
            <Pipe start={[x, 10, wallZ + 4.35]} end={[x, 10, -1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Bottom Part */}
          <group position={[sideX, -e * 0.5, 0]}>
            <Pipe start={[x, -2, 0]} end={[x, -10, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, -e, 0]}>
            <Elbow position={[x, -10, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Bottom Wall Flange */}
          <group position={[sideX, -e, -e]}>
            <Flange position={[x, -10, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Hex Nipple from wall */}
          <group position={[sideX, -e, -e * 0.75]}>
            <HexNipple position={[x, -10, wallZ + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>          {/* Coupling after Hex Nipple */}
          <group position={[sideX, -e, -e * 0.625]}>
            <Coupling position={[x, -10, wallZ + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[sideX, -e, -e * 0.5]}>
            <Pipe start={[x, -10, wallZ + 4.35]} end={[x, -10, -1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      );
    };

    return (
      <group position={[0, height / 2, 0]}>
        {buildSupport777(leftX, 'left')}
        {buildSupport777(rightX, 'right')}
        {length > 120 && buildSupport777(0, 'center')}

        {/* Horizontal Pipes */}
        {length > 120 ? (
          <>
            <group position={[-e * 0.5, 0, 0]}>
              <Pipe start={[leftX + 1.5, 0, 0]} end={[-2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[e * 0.5, 0, 0]}>
              <Pipe start={[2, 0, 0]} end={[rightX - 1.5, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          </>
        ) : (
          <group position={[0, 0, 0]}>
            <Pipe start={[leftX + 1.5, 0, 0]} end={[rightX - 1.5, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        )}
      </group>
    );
  }

  if (skuType === 'sku112') {
    const e = explode * 1.5;
    // Always use 3 legs (4 segments) for SKU 112
    const numLegs = 3;
    const segmentLength = length / (numLegs + 1);

    let legsX: number[] = [];
    let cx = leftX;
    for (let i = 0; i < numLegs; i++) {
      cx += segmentLength;
      legsX.push(Math.round(cx * 100) / 100);
    }

    const topY = height / 2;
    const bottomY = -height / 2;
    const zWall = -wallDistance;

    return (
      <group position={[0, height / 2, 0]}>
        {/* LEFT END */}
        <group position={[-e, e, 0]}>
          <Elbow position={[leftX, topY, 0]} rotation={[Math.PI, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-e, e, -e * 1.0]}>
          <Flange position={[leftX, topY, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Hex Nipple from wall */}
        <group position={[-e, e, -e * 0.75]}>
          <HexNipple position={[leftX, topY, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Coupling after Hex Nipple */}
        <group position={[-e, e, -e * 0.6]}>
          <Coupling position={[leftX, topY, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-e, e, -e * 0.5]}>
          <Pipe start={[leftX, topY, zWall + 4.35]} end={[leftX, topY, -1.5]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* RIGHT END */}
        <group position={[e, e, 0]}>
          <Elbow position={[rightX, topY, 0]} rotation={[Math.PI, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[e, e, -e * 1.0]}>
          <Flange position={[rightX, topY, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Hex Nipple from wall */}
        <group position={[e, e, -e * 0.75]}>
          <HexNipple position={[rightX, topY, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Coupling after Hex Nipple */}
        <group position={[e, e, -e * 0.6]}>
          <Coupling position={[rightX, topY, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[e, e, -e * 0.5]}>
          <Pipe start={[rightX, topY, zWall + 4.35]} end={[rightX, topY, -1.5]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* LEG NODES WITH 4-WAY SIDE OUTLET TEES */}
        {legsX.map((x, i) => {
          const expX = (x / Math.max(1, rightX)) * e * 0.5;
          return (
            <group key={`node-${i}`}>
              {/* REAL 4-WAY SIDE OUTLET TEE */}
              <group position={[expX, e, 0]}>
                <SideOutletTee position={[x, topY, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              {/* VERTICAL POLE */}
              <group position={[expX, 0, 0]}>
                <Pipe start={[x, topY - 1.5, 0]} end={[x, bottomY + 1.5, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              <group position={[expX, -e, 0]}>
                <Flange position={[x, bottomY, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              {/* WALL FLANGE */}
              <group position={[expX, e, -e]}>
                <Flange position={[x, topY, zWall]} rotation={[Math.PI / 2, 0, 0]} colorOption={colorOption} showLabel={showLabel} />
              </group>
              {/* Hex Nipple from wall */}
              <group position={[expX, e, -e * 0.75]}>
                <HexNipple position={[x, topY, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              {/* Coupling after Hex Nipple */}
              <group position={[expX, e, -e * 0.6]}>
                <Coupling position={[x, topY, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              {/* WALL PIPE */}
              <group position={[expX, e, -e * 0.5]}>
                <Pipe start={[x, topY, zWall + 4.35]} end={[x, topY, -1.5]} showLabel={showLabel} colorOption={colorOption} />
              </group>
            </group>
          )
        })}

        {/* HORIZONTAL RAILS */}
        {(() => {
          const rails = [];
          let startX = leftX;
          for (let i = 0; i < legsX.length; i++) {
            let endX = legsX[i];
            const expMidX = ((startX + endX) / 2 / Math.max(1, rightX)) * e * 0.5;
            rails.push(
              <group key={`rail-${i}`} position={[expMidX, e, 0]}>
                <Pipe start={[startX + 1.5, topY, 0]} end={[endX - 1.5, topY, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
            );
            startX = legsX[i];
          }
          // Final rail to right end
          const expMidX = ((startX + rightX) / 2 / Math.max(1, rightX)) * e * 0.5;
          rails.push(
            <group key={`rail-last`} position={[expMidX, e, 0]}>
              <Pipe start={[startX + 1.5, topY, 0]} end={[rightX - 1.5, topY, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          );
          return rails;
        })()}
      </group>
    );
  }

  if (skuType === 'sku300') {
    const e = explode * 1.5;
    const pipesX = getPipesForLength(length);
    const mounts: number[] = [leftX];
    let currentX = leftX;
    for (let i = 0; i < pipesX.length - 1; i++) {
      currentX += pipesX[i];
      mounts.push(currentX);
    }
    mounts.push(rightX);

    return (
      <group position={[0, height / 2, 0]}>
        {mounts.map((x, i) => {
          const isCenter = i > 0 && i < mounts.length - 1;
          const flangeZ = -wallDistance;
          const explodeX = isCenter ? (x / Math.max(1, length / 2)) * e * 0.5 : (x < 0 ? -e : e);

          return (
            <group key={`m-${i}`}>
              <group position={[explodeX, 0, -e * 1.5]}>
                <Flange position={[x, 0, flangeZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              {/* Hex Nipple from wall */}
              <group position={[explodeX, 0, -e * 1.1]}>
                <HexNipple position={[x, 0, flangeZ + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              {/* Coupling after Hex Nipple */}
              <group position={[explodeX, 0, -e * 0.9]}>
                <Coupling position={[x, 0, flangeZ + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              <group position={[explodeX, 0, -e * 0.75]}>
                <Pipe start={[x, 0, flangeZ + 4.35]} end={[x, 0, -2.2]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              <group position={[explodeX, 0, 0]}>
                {isCenter ? (
                  <ConnectorBracket position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
                ) : (
                  <TFitting position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
                )}
              </group>

              {!isCenter && (
                <group position={[x < 0 ? -e * 2 : e * 2, 0, 0]}>
                  <EndCap position={[x < 0 ? x - 2 : x + 2, 0, 0]} rotation={[0, 0, x < 0 ? Math.PI / 2 : -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
                </group>
              )}
            </group>
          );
        })}

        {mounts.slice(0, -1).map((mX, i) => {
          const nextX = mounts[i + 1];
          const midX = (mX + nextX) / 2;
          const explodeX = (midX / Math.max(1, length / 2)) * e * 0.75;
          return (
            <group key={`hp-${i}`} position={[explodeX, 0, 0]}>
              <Pipe start={[mX + 1.5, 0, 0]} end={[nextX - 1.5, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          );
        })}
      </group>
    );
  }

  if (skuType === 'sku103') {
    const e = explode * 1.5;
    const pipesX = getPipesForLength(length);
    const mounts: number[] = [leftX];
    let currentX = leftX;
    for (let i = 0; i < pipesX.length - 1; i++) {
      currentX += pipesX[i];
      mounts.push(currentX);
    }
    mounts.push(rightX);

    // Dynamic from wallDistance slider, or default to 10cm. 
    const pipe1Dist = wallDistance;
    const pipe2Dist = 5;
    const pipe3Dist = 5;

    const flangeZ = -wallDistance;
    const teeZ = flangeZ + pipe1Dist;
    const unionZ = teeZ + pipe2Dist;
    const frontZ = unionZ + pipe3Dist;

    return (
      <group position={[0, height, 0]}>
        {mounts.map((x, i) => {
          const isLeft = i === 0;
          const isRight = i === mounts.length - 1;
          const isCenter = !isLeft && !isRight;
          const expX = (x / Math.max(1, Math.abs(rightX))) * e;

          return (
            <group key={`m-${i}`} position={[expX, 0, 0]}>
              {/* Wall Flange */}
              <group position={[0, 0, -e * 1.5]}>
                <Flange position={[x, 0, flangeZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              {/* Hex Nipple from wall */}
              <group position={[0, 0, -e * 1.25]}>
                <HexNipple position={[x, 0, flangeZ + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              {/* Coupling after Hex Nipple */}
              <group position={[0, 0, -e * 1.1]}>
                <Coupling position={[x, 0, flangeZ + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              {/* Pipe: Flange -> Tee  */}
              <group position={[0, 0, -e * 1.0]}>
                <Pipe start={[x, 0, flangeZ + 4.35]} end={[x, 0, teeZ - 1.5]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              {/* Back Bar Fitting (at Z = teeZ) */}
              <group position={[0, 0, -e * 0.5]}>
                {isLeft && <TFitting position={[x, 0, teeZ]} rotation={[0, -Math.PI / 2, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />}
                {isRight && <TFitting position={[x, 0, teeZ]} rotation={[0, Math.PI / 2, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />}
                {isCenter && <CrossFitting position={[x, 0, teeZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />}
              </group>

              {/* Pipe: Tee -> Union */}
              <group position={[0, 0, 0]}>
                <Pipe start={[x, 0, teeZ + 1.5]} end={[x, 0, unionZ - 1.5]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              {/* Union */}
              <group position={[0, 0, e * 0.5]}>
                <Union position={[x, 0, unionZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              {/* Pipe: Union -> Elbow */}
              <group position={[0, 0, e * 1.0]}>
                <Pipe start={[x, 0, unionZ + 1.5]} end={[x, 0, frontZ - 1.5]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              {/* Front Bar Fitting (at Z = frontZ) */}
              <group position={[0, 0, e * 1.5]}>
                {isLeft && <Elbow position={[x, 0, frontZ]} rotation={[0, Math.PI / 2, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />}
                {isRight && <Elbow position={[x, 0, frontZ]} rotation={[0, -Math.PI / 2, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />}
                {isCenter && <TFitting position={[x, 0, frontZ]} rotation={[0, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />}
              </group>
            </group>
          );
        })}

        {/* Horizontal Bars */}
        {mounts.slice(0, -1).map((mX, i) => {
          const nextX = mounts[i + 1];
          const midX = (mX + nextX) / 2;
          const expX = (midX / Math.max(1, Math.abs(rightX))) * e;
          return (
            <group key={`hp-${i}`} position={[expX, 0, 0]}>
              {/* Back Bar */}
              <group position={[0, 0, -e * 0.5]}>
                <Pipe start={[mX + 1.5, 0, teeZ]} end={[nextX - 1.5, 0, teeZ]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              {/* Front Bar */}
              <group position={[0, 0, e * 1.5]}>
                <Pipe start={[mX + 1.5, 0, frontZ]} end={[nextX - 1.5, 0, frontZ]} showLabel={showLabel} colorOption={colorOption} />
              </group>
            </group>
          );
        })}
      </group>
    );
  }

  if (skuType === 'sku105') {
    const e = explode * 1.5;
    const zWall = -wallDistance;
    const yTop = height;

    const buildSupport105 = (x: number, side: 'left' | 'right') => {
      const sideE = side === 'left' ? -e : e;
      const rotationY = side === 'left' ? Math.PI / 2 : -Math.PI / 2;

      return (
        <group key={side} position={[sideE, 0, 0]}>
          {/* Pieces connecting to the wall explode in Z */}
          <group position={[0, 0, -e * 1.5]}>
            <Flange position={[x, yTop, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          <group position={[0, 0, -e * 1.125]}>
            <HexNipple position={[x, yTop, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          <group position={[0, 0, -e * 0.9375]}>
            <Coupling position={[x, yTop, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Main pipe connects coupling to Elbow */}
          <group position={[0, 0, -e * 0.75]}>
            <Pipe start={[x, yTop, zWall + 4.35]} end={[x, yTop, zWall + 8.0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* The main handle pieces explode vertically (in Y) */}
          <group position={[0, 0, 0]}>
            <Elbow position={[x, yTop, zWall + 8.0]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />

            <group position={[0, -e * 0.5, 0]}>
              <HexNipple position={[x, yTop - 4.5, zWall + 8.0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>

            <group position={[0, -e * 1.0, 0]}>
              <Coupling position={[x, yTop - 7.0, zWall + 8.0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>

            <group position={[0, -e * 1.5, 0]}>
              <HexNipple position={[x, yTop - 9.5, zWall + 8.0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>

            <group position={[0, -e * 2.0, 0]}>
              <Elbow position={[x, yTop - 14.0, zWall + 8.0]} rotation={[0, rotationY, Math.PI]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          </group>
        </group>
      );
    };

    return (
      <group position={[0, -yTop / 2 + 7, 0]}>
        {buildSupport105(leftX, 'left')}
        {buildSupport105(rightX, 'right')}

        {/* Horizontal bar pieces explode along X, but must follow bottom elbows in Y (negative explode) */}
        <group position={[0, -e * 2.0, 0]}>
          <group position={[-e * 0.5, 0, 0]}>
            <HexNipple position={[leftX + 4.5, yTop - 14.0, zWall + 8.0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          <group position={[0, 0, 0]}>
            <Coupling position={[0, yTop - 14.0, zWall + 8.0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          <group position={[e * 0.5, 0, 0]}>
            <HexNipple position={[rightX - 4.5, yTop - 14.0, zWall + 8.0]} rotation={[0, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {Math.abs(leftX + 6.0) > 1.0 && (
            <>
              <group position={[-e * 0.25, 0, 0]}>
                <Pipe start={[leftX + 6.0, yTop - 14.0, zWall + 8.0]} end={[-1, yTop - 14.0, zWall + 8.0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              <group position={[e * 0.25, 0, 0]}>
                <Pipe start={[1, yTop - 14.0, zWall + 8.0]} end={[rightX - 6.0, yTop - 14.0, zWall + 8.0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
            </>
          )}
        </group>
      </group>
    );
  }

  if (skuType === 'sku106') {
    const e = explode * 1.5;
    const tierSpacing = 23;
    const shelfThickness = 1.5;
    const totalHeight = (tiers - 1) * (tierSpacing + shelfThickness);

    return (
      <group position={[0, -totalHeight / 2, 0]}>
        {[...Array(tiers)].map((_, i) => {
          const y = i * (tierSpacing + shelfThickness);
          const shelfExplodeY = i * e * 3;

          return (
            <group key={`tier-${i}`} position={[0, shelfExplodeY, 0]}>
              <Shelf position={[0, y, 0]} length={length} depth={wallDistance} woodColor={woodColor} />
              {i > 0 && (
                <>
                  <group position={[leftX + 10, 0, 0]}>
                    <group position={[0, -e * 0.5, 0]}>
                      <Flange position={[0, y - 0.5, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                    </group>
                    <group position={[0, -e * 1.2, 0]}>
                      <Pipe start={[0, y - tierSpacing - 0.5, 0]} end={[0, y - 0.5, 0]} showLabel={showLabel} colorOption={colorOption} />
                    </group>
                    <group position={[0, -e * 2.0, 0]}>
                      <Flange position={[0, y - tierSpacing - 0.5, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                    </group>
                  </group>
                  <group position={[rightX - 10, 0, 0]}>
                    <group position={[0, -e * 0.5, 0]}>
                      <Flange position={[0, y - 0.5, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                    </group>
                    <group position={[0, -e * 1.2, 0]}>
                      <Pipe start={[0, y - tierSpacing - 0.5, 0]} end={[0, y - 0.5, 0]} showLabel={showLabel} colorOption={colorOption} />
                    </group>
                    <group position={[0, -e * 2.0, 0]}>
                      <Flange position={[0, y - tierSpacing - 0.5, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                    </group>
                  </group>
                </>
              )}
            </group>
          );
        })}
      </group>
    );
  }

  if (skuType === 'sku107') {
    const e = explode * 1.5;
    const tierSpacing = 23;
    const wallPipeLen = 23;
    const shelfThickness = 3;
    const levelInterval = 27;
    const totalHeight = tiers * levelInterval;
    const actualWallDist = 27;
    const lx = leftX + 10;
    const rx = rightX - 10;

    return (
      <group position={[0, -totalHeight / 2, 0]}>
        {[...Array(tiers + 1)].map((_, i) => {
          const y = i * levelInterval;
          const levelExplodeY = i * e * 3;
          const hasShelf = i < tiers;
          const isTop = (i === tiers);
          const isBottom = (i === 0);

          return (
            <group key={`level-${i}`} position={[0, levelExplodeY, 0]}>
              {hasShelf && hasShelves && (
                <Shelf
                  position={[0, y + 4.6, -actualWallDist / 2 - 2]}
                  length={length}
                  depth={actualWallDist + 4}
                  woodColor={woodColor}
                  highlightFront={true}
                />
              )}

              {[lx, rx].map((x, sideIdx) => (
                <group key={sideIdx} position={[x, y, 0]}>
                  <group>
                    <group position={[0, 0, -e * 1.5]}>
                      <Pipe start={[0, 0, -actualWallDist + 4.35]} end={[0, 0, -1.5]} showLabel={showLabel} colorOption={colorOption} />
                    </group>
                    {/* Hex Nipple after Flange */}
                    <group position={[0, 0, -e * 2.25]}>
                      <HexNipple position={[0, 0, -actualWallDist + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                    </group>
                    {/* Coupling after Hex Nipple */}
                    <group position={[0, 0, -e * 1.875]}>
                      <Coupling position={[0, 0, -actualWallDist + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                    </group>
                    <group position={[0, 0, -e * 3.0]}>
                      <Flange position={[0, 0, -actualWallDist]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                    </group>
                    <group position={[0, 0, 0]}>
                      {isTop ? (
                        <Elbow position={[0, 0, 0]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
                      ) : isBottom ? (
                        <Elbow position={[0, 0, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                      ) : (
                        <TFitting position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                      )}
                    </group>
                  </group>
                  {!isTop && (
                    <group position={[0, e * 1.5, 0]}>
                      <Pipe start={[0, 2, 0]} end={[0, levelInterval - 2, 0]} showLabel={showLabel} colorOption={colorOption} />
                    </group>
                  )}
                </group>
              ))}
            </group>
          );
        })}
      </group>
    );
  }
  if (skuType === 'sku117') {
    const e = explode * 3;
    const zWall = -wallDistance;

    return (
      <group position={[0, height, 0]}>
        {/* Left Side Group */}
        <group position={[-e, 0, 0]}>
          <group position={[0, 0, -e * 1.5]}>
            <Flange position={[leftX, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} colorOption={colorOption} showLabel={showLabel} />
          </group>
          {/* Hex Nipple from wall */}
          <group position={[0, 0, -e * 1.1]}>
            <HexNipple position={[leftX, 0, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Coupling after Hex Nipple */}
          <group position={[0, 0, -e * 0.8]}>
            <Coupling position={[leftX, 0, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[leftX, 0, zWall + 4.35]} end={[leftX, 0, -2.2]} colorOption={colorOption} showLabel={showLabel} />
          </group>
          <group position={[0, 0, e]}>
            <Elbow position={[leftX, 0, 0]} rotation={[0, Math.PI, -Math.PI / 2]} colorOption={colorOption} showLabel={showLabel} />
          </group>
        </group>

        {/* Right Side Group */}
        <group position={[e, 0, 0]}>
          <group position={[0, 0, -e * 1.5]}>
            <Flange position={[rightX, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} colorOption={colorOption} showLabel={showLabel} />
          </group>
          {/* Hex Nipple from wall */}
          <group position={[0, 0, -e * 1.1]}>
            <HexNipple position={[rightX, 0, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Coupling after Hex Nipple */}
          <group position={[0, 0, -e * 0.8]}>
            <Coupling position={[rightX, 0, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[rightX, 0, zWall + 4.35]} end={[rightX, 0, -2.2]} colorOption={colorOption} showLabel={showLabel} />
          </group>
          <group position={[0, 0, e]}>
            <Elbow position={[rightX, 0, 0]} rotation={[0, Math.PI, Math.PI / 2]} colorOption={colorOption} showLabel={showLabel} />
          </group>
        </group>

        {/* Horizontal Rail */}
        <group position={[0, 0, e * 1.5]}>
          {(() => {
            const hPipes = getPipesForLength(length);
            const railL_base = leftX + 2.2;
            const railR_base = rightX - 2.2;
            const totalW = railR_base - railL_base;

            const pipeGap = hPipes.length > 1 ? e * 2 : 0;
            const segW = totalW / hPipes.length;

            return (
              <group>
                {hPipes.map((p, idx) => {
                  const startX_n = railL_base + (idx * segW);
                  const endX_n = railL_base + ((idx + 1) * segW);

                  const centerSep = (idx - (hPipes.length - 1) / 2) * pipeGap;
                  const startX = startX_n + centerSep + (idx === 0 ? -e : idx === hPipes.length - 1 ? e : 0);
                  const endX = endX_n + centerSep + (idx === 0 ? -e : idx === hPipes.length - 1 ? e : 0);

                  return (
                    <group key={idx}>
                      <Pipe start={[startX, 0, 0]} end={[endX, 0, 0]} colorOption={colorOption} showLabel={showLabel} />
                      {idx < hPipes.length - 1 && (
                        <Coupling position={[endX + pipeGap / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} colorOption={colorOption} showLabel={showLabel} />
                      )}
                    </group>
                  );
                })}
              </group>
            );
          })()}
        </group>
      </group>
    );
  }

  if (skuType === 'sku118') {
    const e = explode * 5;
    const zWall = -wallDistance;

    return (
      <group position={[0, height, 0]}>
        {/* Support Assembly (Separates Backwards) */}
        <group>
          {/* Left Support */}
          <group position={[-e, 0, 0]}>
            <group position={[0, 0, -e * 1.5]}>
              <Flange position={[leftX, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} colorOption={colorOption} showLabel={showLabel} />
            </group>
            {/* Hex Nipple from wall */}
            <group position={[0, 0, -e * 1.1]}>
              <HexNipple position={[leftX, 0, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            {/* Coupling after Hex Nipple */}
            <group position={[0, 0, -e * 0.8]}>
              <Coupling position={[leftX, 0, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[0, 0, -e * 0.5]}>
              <Pipe start={[leftX, 0, zWall + 4.35]} end={[leftX, 0, -2.2]} colorOption={colorOption} showLabel={showLabel} />
            </group>
          </group>
          {/* Right Support */}
          <group position={[e, 0, 0]}>
            <group position={[0, 0, -e * 1.5]}>
              <Flange position={[rightX, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} colorOption={colorOption} showLabel={showLabel} />
            </group>
            {/* Hex Nipple from wall */}
            <group position={[0, 0, -e * 1.1]}>
              <HexNipple position={[rightX, 0, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            {/* Coupling after Hex Nipple */}
            <group position={[0, 0, -e * 0.8]}>
              <Coupling position={[rightX, 0, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[0, 0, -e * 0.5]}>
              <Pipe start={[rightX, 0, zWall + 4.35]} end={[rightX, 0, -2.2]} colorOption={colorOption} showLabel={showLabel} />
            </group>
          </group>
        </group>

        {/* Grab Bar Assembly (Entire unit moves forward together) */}
        <group position={[0, 0, e]}>
          {/* Left Side Unit (Tee + End Cap) */}
          <group position={[-e, 0, 0]}>
            <TFitting position={[leftX, 0, 0]} rotation={[0, 0, Math.PI / 2]} colorOption={colorOption} showLabel={showLabel} />
            {/* End Cap separates even further sideways */}
            <group position={[-e, 0, 0]}>
              <EndCap position={[leftX - 1.8, 0, 0]} rotation={[0, 0, Math.PI / 2]} colorOption={colorOption} showLabel={showLabel} />
            </group>
          </group>

          {/* Right Side Unit (Tee + End Cap) */}
          <group position={[e, 0, 0]}>
            <TFitting position={[rightX, 0, 0]} rotation={[0, 0, Math.PI / 2]} colorOption={colorOption} showLabel={showLabel} />
            <group position={[e, 0, 0]}>
              <EndCap position={[rightX + 1.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]} colorOption={colorOption} showLabel={showLabel} />
            </group>
          </group>

          {/* Middle Rail Assembly (Stay in Center, Disconnect from Tees) */}
          <group>
            {(() => {
              const hPipes = getPipesForLength(length);
              const railL_base = leftX + 2.2;
              const railR_base = rightX - 2.2;
              const totalW = railR_base - railL_base;

              const pipeGap = hPipes.length > 1 ? e * 2 : 0;
              const segW = totalW / hPipes.length;

              return (
                <group>
                  {hPipes.map((p, idx) => {
                    const startX_n = railL_base + (idx * segW);
                    const endX_n = railL_base + ((idx + 1) * segW);

                    const centerSep = (idx - (hPipes.length - 1) / 2) * pipeGap;
                    const startX = startX_n + centerSep;
                    const endX = endX_n + centerSep;

                    return (
                      <group key={idx}>
                        <Pipe start={[startX, 0, 0]} end={[endX, 0, 0]} colorOption={colorOption} showLabel={showLabel} />
                        {idx < hPipes.length - 1 && (
                          <Coupling position={[endX + pipeGap / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} colorOption={colorOption} showLabel={showLabel} />
                        )}
                      </group>
                    );
                  })}
                </group>
              );
            })()}
          </group>
        </group>
      </group>
    );
  }

  if (skuType === 'sku119') {
    const e = explode * 4;
    const drop = height;
    const zWall = -wallDistance;

    return (
      <group position={[0, -drop / 2, zWall]}>
        {/* Left Side Support */}
        <group position={[-e, 0, 0]}>
          <group position={[0, e * 2, zWall]}>
            <Flange position={[leftX, drop, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e, zWall]}>
            <Pipe start={[leftX, drop - 2.2, 0]} end={[leftX, 2.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, zWall]}>
            <Elbow position={[leftX, 0, 0]} rotation={[Math.PI, Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* Right Side Support */}
        <group position={[e, 0, 0]}>
          <group position={[0, e * 2, zWall]}>
            <Flange position={[rightX, drop, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e, zWall]}>
            <Pipe start={[rightX, drop - 2.2, 0]} end={[rightX, 2.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, zWall]}>
            <Elbow position={[rightX, 0, 0]} rotation={[Math.PI, -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* Horizontal Rail Assembly */}
        <group position={[0, -e, zWall]}>
          {(() => {
            const hPipes = getPipesForLength(length);
            const railL = leftX + 2.2;
            const railR = rightX - 2.2;
            const totalW = railR - railL;

            const pipeGap = hPipes.length > 1 ? e * 2 : 0;
            const segW = totalW / hPipes.length;

            return (
              <group>
                {hPipes.map((p, idx) => {
                  const startX_n = railL + (idx * segW);
                  const endX_n = railL + ((idx + 1) * segW);

                  const centerSep = (idx - (hPipes.length - 1) / 2) * pipeGap;
                  const startX = startX_n + centerSep + (idx === 0 ? -e : idx === hPipes.length - 1 ? e : 0);
                  const endX = endX_n + centerSep + (idx === 0 ? -e : idx === hPipes.length - 1 ? e : 0);

                  return (
                    <group key={idx}>
                      <Pipe start={[startX, 0, 0]} end={[endX, 0, 0]} colorOption={colorOption} showLabel={showLabel} />
                      {idx < hPipes.length - 1 && (
                        <Coupling position={[endX + pipeGap / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} colorOption={colorOption} showLabel={showLabel} />
                      )}
                    </group>
                  );
                })}
              </group>
            );
          })()}
        </group>
      </group>
    );
  }

  if (skuType === 'sku120') {
    // Acrylic rod: 33mm diameter (1.65cm radius in scene units), height = configurable
    // Floor flange at bottom, top flange at top
    const rodRadius = 1.65;
    const flangeRadius = 4.5;
    const flangeHeight = 1.2;
    const e = explode * 3;
    const metalColor = colorOption.pipeColor;

    return (
      <group position={[0, -height / 2, 0]}>
        {/* Acrylic rod */}
        <group position={[0, e * 0.5, 0]}>
          <mesh position={[0, height / 2, 0]}>
            <cylinderGeometry args={[rodRadius, rodRadius, height, 32]} />
            <meshPhysicalMaterial
              color="#ffffff"
              transparent
              opacity={0.25}
              roughness={0}
              metalness={0}
              transmission={0.95}
              thickness={2}
            />
          </mesh>
        </group>

        {/* Bottom floor flange */}
        <group position={[0, -e, 0]}>
          {/* Flange disc */}
          <mesh position={[0, flangeHeight / 2, 0]}>
            <cylinderGeometry args={[flangeRadius, flangeRadius, flangeHeight, 32]} />
            <meshStandardMaterial color={metalColor} metalness={0.85} roughness={0.15} />
          </mesh>
          {/* Collar around rod bottom */}
          <mesh position={[0, flangeHeight + 1.0, 0]}>
            <cylinderGeometry args={[rodRadius + 0.6, rodRadius + 0.6, 2.0, 32]} />
            <meshStandardMaterial color={metalColor} metalness={0.85} roughness={0.15} />
          </mesh>
        </group>

        {/* Top flange */}
        <group position={[0, e, 0]}>
          {/* Collar around rod top */}
          <mesh position={[0, height - flangeHeight - 1.0, 0]}>
            <cylinderGeometry args={[rodRadius + 0.6, rodRadius + 0.6, 2.0, 32]} />
            <meshStandardMaterial color={metalColor} metalness={0.85} roughness={0.15} />
          </mesh>
          {/* Flange disc */}
          <mesh position={[0, height - flangeHeight / 2, 0]}>
            <cylinderGeometry args={[flangeRadius, flangeRadius, flangeHeight, 32]} />
            <meshStandardMaterial color={metalColor} metalness={0.85} roughness={0.15} />
          </mesh>
        </group>
      </group>
    );
  }

  if (skuType === 'sku121') {
    // Ceiling-hung U-bar: 2 ceiling flanges, 2 vertical drops, 2 elbows, 1 horizontal rail
    // Mirrors sku116's coordinate system exactly (topY = height/2, bottomY = -height/2)
    const e = explode * 1.5;
    const topY = height / 2;
    const bottomY = -height / 2;

    const buildSide121 = (x: number, side: 'left' | 'right') => {
      const sideX = side === 'left' ? -e : e;
      // Left elbow: pipe comes down, turns right → rotation [Math.PI, Math.PI/2, 0]
      // Right elbow: pipe comes down, turns left → rotation [Math.PI, -Math.PI/2, 0]
      const elbowRot: [number, number, number] = side === 'left'
        ? [Math.PI, Math.PI / 2, 0]
        : [Math.PI, -Math.PI / 2, 0];

      return (
        <group key={side} position={[sideX, 0, 0]}>
          {/* Ceiling Flange */}
          <group position={[0, e * 2, 0]}>
            <Flange position={[x, topY, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Vertical Drop Pipe */}
          <group position={[0, e, 0]}>
            <Pipe start={[x, topY - 2.2, 0]} end={[x, bottomY + 2.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Elbow at bottom — turns inward toward horizontal rail */}
          <group position={[0, -e, 0]}>
            <Elbow position={[x, bottomY, 0]} rotation={elbowRot} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      );
    };

    return (
      <group position={[0, height / 2, 0]}>
        {buildSide121(leftX, 'left')}
        {buildSide121(rightX, 'right')}

        {/* Horizontal clothing rail */}
        <group position={[0, -e * 2, 0]}>
          {(() => {
            const hPipes = getPipesForLength(length);
            const railL = leftX + 2.2;
            const railR = rightX - 2.2;
            const totalW = railR - railL;
            const pipeGap = hPipes.length > 1 ? e * 2 : 0;
            const segW = totalW / hPipes.length;
            return (
              <group>
                {hPipes.map((p, idx) => {
                  const startX_n = railL + idx * segW;
                  const endX_n = railL + (idx + 1) * segW;
                  const centerSep = (idx - (hPipes.length - 1) / 2) * pipeGap;
                  return (
                    <group key={idx}>
                      <Pipe start={[startX_n + centerSep, bottomY, 0]} end={[endX_n + centerSep, bottomY, 0]} colorOption={colorOption} showLabel={showLabel} />
                      {idx < hPipes.length - 1 && (
                        <Coupling position={[endX_n + centerSep + pipeGap / 2, bottomY, 0]} rotation={[0, 0, Math.PI / 2]} colorOption={colorOption} showLabel={showLabel} />
                      )}
                    </group>
                  );
                })}
              </group>
            );
          })()}
        </group>
      </group>
    );
  }

  if (skuType === 'sku122') {
    // Candle holder: floor flange → nipple → cross (in-caps on sides) → nipple → top flange
    const nippleLen = Math.max(2, height); // visual separation distance in cm
    const crossY = 1.6 + nippleLen + 1.6; // 1.6cm flange base + nipple + 1.6cm fitting gap
    const topY = crossY + 1.6 + nippleLen + 1.6;
    const e = explode * 2;

    return (
      <group position={[0, -topY / 2, 0]}>

        {/* Bottom floor flange */}
        <group position={[0, -e, 0]}>
          <Flange position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Lower nipple pipe */}
        <group position={[0, -e * 0.5, 0]}>
          <Pipe start={[0, 1.2, 0]} end={[0, crossY - 1.5, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Cross Fitting — rotation [0,0,0] gives top/bottom in Y, left/right in X */}
        <CrossFitting position={[0, crossY, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />

        {/* Left In-Cap — rotation [0,0,Math.PI/2] = pointing along -X */}
        <group position={[-e, 0, 0]}>
          <EndCap position={[-1.8, crossY, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Right In-Cap — rotation [0,0,-Math.PI/2] = pointing along +X */}
        <group position={[e, 0, 0]}>
          <EndCap position={[1.8, crossY, 0]} rotation={[0, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Upper nipple pipe */}
        <group position={[0, e * 0.5, 0]}>
          <Pipe start={[0, crossY + 1.5, 0]} end={[0, topY - 1.2, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Top flange — inverted (disc faces up as candle plate) */}
        <group position={[0, e, 0]}>
          <Flange position={[0, topY, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

      </group>
    );
  }
  if (skuType === 'sku123') {
    // Freestanding 3-leg double rack
    const e = explode * 1.5;
    const baseArmHeight = 5.5;
    const spreadArm = 23;
    const sideStub = 5;


    const buildPole123 = (x: number, type: 'left' | 'right' | 'center') => {
      const isCenter = type === 'center';
      const sideX = type === 'left' ? -e : type === 'right' ? e : 0;

      return (
        <group key={type} position={[sideX, 0, 0]}>
          {/* Main vertical pole */}
          <group position={[0, e * 0.5, 0]}>
            <Pipe
              start={[x, baseArmHeight + 1.8, 0]}
              end={[x, height - 2.2, 0]}
              showLabel={showLabel}
              colorOption={colorOption}
            />
          </group>

          {isCenter ? (
            /* Middle support spread base (H-base) */
            <group position={[0, 0, 0]}>
              <group position={[0, baseArmHeight, 0]}>
                <TFitting
                  position={[x, 0, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                  showLabel={showLabel}
                  colorOption={colorOption}
                />
              </group>

              {/* Forward Arm (23cm) */}
              <group position={[0, 0, e * 0.5]}>
                <Pipe start={[x, baseArmHeight, 1.8]} end={[x, baseArmHeight, 1.8 + spreadArm]} showLabel={showLabel} colorOption={colorOption} />
                <group position={[x, 0, 1.8 + spreadArm + 0.3]}>
                  <Elbow position={[0, baseArmHeight, 0]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
                  <group position={[0, -e * 0.5, 0]}>
                    <Pipe start={[0, baseArmHeight - 1.5, 0]} end={[0, 0.6, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, -e, 0]}>
                    <Flange position={[0, -0.25, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              </group>

              {/* Backward Arm (23cm) */}
              <group position={[0, 0, -e * 0.5]}>
                <Pipe start={[x, baseArmHeight, -1.8]} end={[x, baseArmHeight, -1.8 - spreadArm]} showLabel={showLabel} colorOption={colorOption} />
                <group position={[x, 0, -1.8 - spreadArm - 0.3]}>
                  <Elbow position={[0, baseArmHeight, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  <group position={[0, -e * 0.5, 0]}>
                    <Pipe start={[0, baseArmHeight - 1.5, 0]} end={[0, 0.6, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, -e, 0]}>
                    <Flange position={[0, -0.25, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              </group>
            </group>
          ) : (
            /* Left/Right Tripod Base */
            <group position={[0, 0, 0]}>
              {/* Central Fitting - 4-way corner */}
              <group position={[0, baseArmHeight, 0]}>
                <SideOutletTee
                  position={[x, 0, 0]}
                  rotation={[Math.PI, type === 'left' ? -Math.PI / 2 : Math.PI / 2, 0]}
                  showLabel={showLabel}
                  colorOption={colorOption}
                />
              </group>

              {/* Forward Arm (23cm) */}
              <group position={[0, 0, e * 0.5]}>
                <Pipe start={[x, baseArmHeight, 1.8]} end={[x, baseArmHeight, 1.8 + spreadArm]} showLabel={showLabel} colorOption={colorOption} />
                <group position={[x, 0, 1.8 + spreadArm + 0.3]}>
                  <Elbow position={[0, baseArmHeight, 0]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
                  <group position={[0, -e * 0.5, 0]}>
                    <Pipe start={[0, baseArmHeight - 1.5, 0]} end={[0, 0.6, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, -e, 0]}>
                    <Flange position={[0, -0.25, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              </group>

              {/* Backward Arm (23cm) */}
              <group position={[0, 0, -e * 0.5]}>
                <Pipe start={[x, baseArmHeight, -1.8]} end={[x, baseArmHeight, -1.8 - spreadArm]} showLabel={showLabel} colorOption={colorOption} />
                <group position={[x, 0, -1.8 - spreadArm - 0.3]}>
                  <Elbow position={[0, baseArmHeight, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  <group position={[0, -e * 0.5, 0]}>
                    <Pipe start={[0, baseArmHeight - 1.5, 0]} end={[0, 0.6, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, -e, 0]}>
                    <Flange position={[0, -0.25, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              </group>

              {/* Side Stub Arm (5cm) - Pointing Outward */}
              <group position={[type === 'left' ? -e * 0.5 : e * 0.5, 0, 0]}>
                <Pipe
                  start={[x + (type === 'left' ? -1.8 : 1.8), baseArmHeight, 0]}
                  end={[x + (type === 'left' ? -1.8 - sideStub : 1.8 + sideStub), baseArmHeight, 0]}
                  showLabel={showLabel}
                  colorOption={colorOption}
                />
                <group position={[x + (type === 'left' ? -1.8 - sideStub - 0.3 : 1.8 + sideStub + 0.3), 0, 0]}>
                  <Elbow
                    position={[0, baseArmHeight, 0]}
                    rotation={[0, type === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
                    showLabel={showLabel}
                    colorOption={colorOption}
                  />
                  <group position={[0, -e * 0.5, 0]}>
                    <Pipe start={[0, baseArmHeight - 1.5, 0]} end={[0, 0.6, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, -e, 0]}>
                    <Flange position={[0, -0.25, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              </group>
            </group>
          )}
        </group>
      );
    };

    return (
      <group position={[0, -height / 2, 0]}>
        {buildPole123(leftX, 'left')}
        {buildPole123(0, 'center')}
        {buildPole123(rightX, 'right')}

        {/* Top Rail Components */}
        <group position={[0, e * 1.5, 0]}>
          <Elbow position={[leftX, height, 0]} rotation={[0, Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
          {/* Top center T-fitting: rotated so through-pipe is along X and branch is pointing DOWN (-Y) */}
          <TFitting position={[0, height, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          <Elbow position={[rightX, height, 0]} rotation={[0, -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />

          <Pipe start={[leftX + 2.2, height, 0]} end={[-2.2, height, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Pipe start={[2.2, height, 0]} end={[rightX - 2.2, height, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku124') {
    // Wall-mounted triple support rack
    const e = explode * 1.5;
    const zWall = -wallDistance;

    const buildSupport = (x: number) => {
      // For SKU124, the horizontal rail is at Y=0 (centered visually)
      return (
        <group position={[0, 0, 0]}>
          {/* Wall Flange */}
          <group position={[0, 0, -e * 1.5]}>
            <Flange position={[x, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Hex Nipple from wall */}
          <group position={[0, 0, -e * 1.1]}>
            <HexNipple position={[x, 0, zWall + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Coupling after Hex Nipple */}
          <group position={[0, 0, -e * 0.8]}>
            <Coupling position={[x, 0, zWall + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Depth Pipe (23cm pole) */}
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[x, 0, zWall + 4.35]} end={[x, 0, -2.2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* T-Fitting at each support arm connection */}
          <TFitting position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      );
    };

    return (
      <group position={[0, height / 4, 0]}>
        {buildSupport(leftX)}
        {buildSupport(0)}
        {buildSupport(rightX)}

        {/* Railing Pipes */}
        <group position={[0, 0, e]}>
          <Pipe start={[leftX + 2.2, 0, 0]} end={[-2.2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Pipe start={[2.2, 0, 0]} end={[rightX - 2.2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku126') {
    // Large freestanding rack with independent T-frame bases.
    // Base uses SideOutletTee for a 4-way center, NO bottom cross rail support.
    const e = explode * 1.5;
    const baseArmHeight = 5.75;
    const spreadArm = 23;
    const couplingHeight = height * 0.5;

    const buildLeg126 = (x: number, type: 'left' | 'right') => {
      const isLeft = type === 'left';
      const sideX = isLeft ? -e : e;
      const innerDir = isLeft ? -1 : 1;

      const junctionRot: [number, number, number] = isLeft
        ? [Math.PI / 2, Math.PI / 2, 0]
        : [Math.PI / 2, -Math.PI / 2, 0];

      return (
        <group key={type} position={[sideX, 0, 0]}>
          {/* Top Corner Elbow */}
          <group position={[0, e * 3, 0]}>
            <Elbow position={[x, height, 0]} rotation={[0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Vertical Pole - Top Half */}
          <group position={[0, e * 2, 0]}>
            <Pipe start={[x, height - 1.2, 0]} end={[x, couplingHeight + 1.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Coupling */}
          <group position={[0, e * 1.5, 0]}>
            <Coupling position={[x, couplingHeight, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Vertical Pole - Bottom Half */}
          <group position={[0, e, 0]}>
            <Pipe start={[x, couplingHeight - 1.2, 0]} end={[x, baseArmHeight + 1.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* 4-Way Junction H-Base (Vertical + Front + Back + Inward) */}
          <group position={[0, 0, 0]}>
            <SideOutletTee position={[x, baseArmHeight, 0]} rotation={junctionRot} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Outward Stabilizer Arm & Foot (Hex Nipple horizontally + Drop) */}
          <group position={[innerDir * e * 0.5, 0, 0]}>
            <HexNipple position={[x + innerDir * 2.875, baseArmHeight, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
            <group position={[x + innerDir * 5.75, baseArmHeight, 0]}>
              <group position={[innerDir * e * 0.5, 0, 0]}>
                <Elbow position={[0, 0, 0]} rotation={[0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
                <group position={[0, -e * 0.5, 0]}>
                  <HexNipple position={[0, -2.875, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  <group position={[0, -e * 0.5, 0]}>
                    <Flange position={[0, -5.75, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              </group>
            </group>
          </group>

          {/* Forward Stabilizer Arm & Foot */}
          <group position={[0, 0, e * 0.5]}>
            <Pipe start={[x, baseArmHeight, 2.0]} end={[x, baseArmHeight, spreadArm - 2.0]} showLabel={showLabel} colorOption={colorOption} />
            <group position={[x, baseArmHeight, spreadArm]}>
              <group position={[0, 0, e * 0.5]}>
                <Elbow position={[0, 0, 0]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
                <group position={[0, -e * 0.5, 0]}>
                  <HexNipple position={[0, -2.875, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  <group position={[0, -e * 0.5, 0]}>
                    <Flange position={[0, -5.75, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              </group>
            </group>
          </group>

          {/* Backward Stabilizer Arm & Foot */}
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[x, baseArmHeight, -2.0]} end={[x, baseArmHeight, -spreadArm + 2.0]} showLabel={showLabel} colorOption={colorOption} />
            <group position={[x, baseArmHeight, -spreadArm]}>
              <group position={[0, 0, -e * 0.5]}>
                <Elbow position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                <group position={[0, -e * 0.5, 0]}>
                  <HexNipple position={[0, -2.875, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  <group position={[0, -e * 0.5, 0]}>
                    <Flange position={[0, -5.75, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      );
    }

    return (
      <group position={[0, -height / 2 + 5, 0]}>
        {buildLeg126(leftX, 'left')}
        {buildLeg126(rightX, 'right')}

        {/* Top Rail */}
        <group position={[0, e * 3.5, 0]}>
          <Pipe start={[leftX + 1.2, height, 0]} end={[rightX - 1.2, height, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku128') {
    // Wall-mounted shelf with top-rail frame
    // Photo shows:
    //   • 2 wall flanges at back-bottom (left & right)
    //   • Horizontal depth pipes from wall → front
    //   • Elbows at front-bottom turning upward  [rotation π,0,0 → -Z arm + +Y arm]
    //   • Vertical posts rising from elbows to top
    //   • T-fittings at top with symmetric side overhangs (both left & right)
    //     TFitting default: through Y (+Y/-Y), branch -Z
    //     We need: through X (-X/+X), branch -Y (down into post)
    //     → rotation [-π/2, π/2, 0] achieves this
    //   • Top horizontal rail connecting the two T-fittings
    //   • Bottom front cross-bar connecting the two front elbows (horizontal, under shelf)
    //   • Wood shelf sitting on the structure

    const e = explode * 1.5;
    const overhang = 8; // short symmetric overhang on both sides at top

    const depthPipe = wallDistance;      // e.g. 28 cm — how far from wall to front posts
    const baseY = -height / 2;       // bottom level (flanges & depth pipes)
    const topY = height / 2;       // top rail level
    const wallZ = -depthPipe;        // back (wall)
    const frontZ = 0;               // front (vertical posts)

    const eL = -e;   // left explode X
    const eR = e;   // right explode X

    // Elbow bottom-front: connects depth pipe (from -Z) to vertical post (going +Y)
    // Default elbow arms: +Z collar, -Y collar
    // rotate [π,0,0] → -Z collar, +Y collar  ✓
    const bottomElbowRot: [number, number, number] = [Math.PI, 0, 0];

    // T-fitting at top: through-axis X (left overhang ←→ right overhang), branch -Y (down to post)
    // Default TFitting: through Y (+Y/-Y), branch -Z
    // rotate [-π/2, π/2, 0]:
    //   R_x(-π/2): +Y→-Z, -Y→+Z, -Z→-Y
    //   R_y( π/2): +Z→+X, -Z→-X, -Y stays -Y
    //   Result: original+Y→-X, original-Y→+X, original branch(-Z)→-Y  ✓
    const topTRot: [number, number, number] = [-Math.PI / 2, Math.PI / 2, 0];

    // CornerFitting default arms:
    //   side='left':  -Y (down to post),  -Z (toward wall), +X (rail going right)
    //   side='right': -Y (down to post),  -Z (toward wall), -X (rail going left)
    const wallArmLength = 15; // cm — arm going toward the wall from each top corner

    return (
      <group>

        {/* ── LEFT ARM ────────────────────────────────────────────────── */}
        <group position={[eL, 0, 0]}>
          {/* Wall flange – back bottom */}
          <group position={[0, 0, -e * 0.8]}>
            <Flange position={[leftX, baseY, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Depth pipe: wall → front bottom (collar offset = 2.2) */}
          <group position={[0, 0, -e * 0.4]}>
            <Pipe start={[leftX, baseY, wallZ + 1.2]} end={[leftX, baseY, frontZ - 2.2]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Bottom-front 3-way CornerFitting: -Z in (depth pipe), +Y out (post), +X (cross-bar) */}
          {/* R_x(π/2): -Y→-Z, -Z→+Y, +X→+X ✓ */}
          <CornerFitting position={[leftX, baseY, frontZ]} side="left" rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />

          {/* Vertical post (collar offset = 2.2) */}
          <group position={[0, e * 0.4, 0]}>
            <Pipe start={[leftX, baseY + 2.2, frontZ]} end={[leftX, topY - 2.2, frontZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Top-left CornerFitting: +X (rail right), -Z (wall arm), -Y (post down) */}
          <group position={[0, e, 0]}>
            <CornerFitting position={[leftX, topY, frontZ]} side="left" showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* 15cm arm toward wall (-Z) — collar offset = 2.2 */}
          <group position={[0, e, -e * 0.4]}>
            <Pipe start={[leftX, topY, frontZ - 2.2]} end={[leftX, topY, frontZ - wallArmLength]} showLabel={showLabel} colorOption={colorOption} />
            <EndCap position={[leftX, topY, frontZ - wallArmLength - 0.65]} rotation={[-Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* ── RIGHT ARM ───────────────────────────────────────────────── */}
        <group position={[eR, 0, 0]}>
          {/* Wall flange – back bottom */}
          <group position={[0, 0, -e * 0.8]}>
            <Flange position={[rightX, baseY, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Depth pipe: wall → front bottom (collar offset = 2.2) */}
          <group position={[0, 0, -e * 0.4]}>
            <Pipe start={[rightX, baseY, wallZ + 1.2]} end={[rightX, baseY, frontZ - 2.2]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Bottom-front 3-way CornerFitting: -Z in (depth pipe), +Y out (post), -X (cross-bar) */}
          {/* R_x(π/2) on side='right': -Y→-Z, -Z→+Y, -X→-X ✓ */}
          <CornerFitting position={[rightX, baseY, frontZ]} side="right" rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />

          {/* Vertical post (collar offset = 2.2) */}
          <group position={[0, e * 0.4, 0]}>
            <Pipe start={[rightX, baseY + 2.2, frontZ]} end={[rightX, topY - 2.2, frontZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Top-right CornerFitting: -X (rail left), -Z (wall arm), -Y (post down) */}
          <group position={[0, e, 0]}>
            <CornerFitting position={[rightX, topY, frontZ]} side="right" showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* 15cm arm toward wall (-Z) — collar offset = 2.2 */}
          <group position={[0, e, -e * 0.4]}>
            <Pipe start={[rightX, topY, frontZ - 2.2]} end={[rightX, topY, frontZ - wallArmLength]} showLabel={showLabel} colorOption={colorOption} />
            <EndCap position={[rightX, topY, frontZ - wallArmLength - 0.65]} rotation={[-Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* ── TOP RAIL (collar offset = 2.2 each side) ───────────────── */}
        <group position={[0, e, 0]}>
          <Pipe start={[leftX + 2.2 + eL, topY, frontZ]} end={[rightX - 2.2 + eR, topY, frontZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* ── BOTTOM FRONT CROSS-BAR (collar offset = 2.2 to meet CornerFitting collars) ── */}
        <group position={[0, 0, 0]}>
          <Pipe start={[leftX + 2.2 + eL, baseY, frontZ]} end={[rightX - 2.2 + eR, baseY, frontZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* ── WOOD SHELF – sits on the depth-pipe arms ────────────────── */}
        {hasShelves && (
          <group position={[0, baseY + 1.5, wallZ / 2]}>
            <Shelf position={[0, 0, 0]} length={length} depth={depthPipe} woodColor={woodColor} highlightFront={false} />
          </group>
        )}

      </group>
    );
  }

  if (skuType === 'sku129') {
    // Multi-tier wall-mounted continuous profile
    const e = explode * 1.5;
    const numShelves = tiers || 3;
    const numLevels = numShelves + 1; // e.g. 4 (3 shelves + 1 bottom crossbar)
    const tierSpacing = height / numShelves;

    const topY = height / 2;
    const bottomY = topY - numShelves * tierSpacing; // -height/2
    const levelYs = Array.from({ length: numLevels }, (_, i) => topY - i * tierSpacing);

    const depthArms = levelYs.map((y, i) => {
      const isBottom = i === numShelves;
      return { y, isBottom, eShift: e * (0.1 + i * 0.05) };
    });

    const frontZ = 0;
    const wallZ = -wallDistance;
    const eL = -e;
    const eR = e;

    return (
      <group>
        {/* ── LEFT POST ─────────────────────────────────────────────── */}
        <group position={[eL, 0, 0]}>
          {depthArms.map(({ y, isBottom, eShift }, i) => (
            <group key={`l-arm-${i}`}>
              <group position={[0, -eShift, 0]}>
                {isBottom ? (
                  <CornerFitting position={[leftX, y, frontZ]} side="left" rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                ) : (
                  <TFitting position={[leftX, y, frontZ]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                )}
              </group>
              <group position={[0, -eShift, -e * 0.4]}>
                <Pipe start={[leftX, y, frontZ - 2.2]} end={[leftX, y, wallZ + 1.2]} showLabel={showLabel} colorOption={colorOption} />
                <Flange position={[leftX, y, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
            </group>
          ))}

          {/* Linking pipes */}
          {depthArms.slice(0, -1).map(({ y }, i) => {
            const nextY = depthArms[i + 1].y;
            return (
              <group key={`l-vert-${i}`} position={[0, -e * 0.1 * (i + 0.5), 0]}>
                <Pipe start={[leftX, y - 2.2, frontZ]} end={[leftX, nextY + 2.2, frontZ]} showLabel={showLabel} colorOption={colorOption} />
              </group>
            );
          })}

          {/* Top vertical stub + EndCap */}
          <group position={[0, e * 0.1, 0]}>
            <Pipe start={[leftX, topY + 2.2, frontZ]} end={[leftX, topY + 7.2, frontZ]} showLabel={showLabel} colorOption={colorOption} />
            <EndCap position={[leftX, topY + 7.85, frontZ]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* ── RIGHT POST ────────────────────────────────────────────── */}
        <group position={[eR, 0, 0]}>
          {depthArms.map(({ y, isBottom, eShift }, i) => (
            <group key={`r-arm-${i}`}>
              <group position={[0, -eShift, 0]}>
                {isBottom ? (
                  <CornerFitting position={[rightX, y, frontZ]} side="right" rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                ) : (
                  <TFitting position={[rightX, y, frontZ]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                )}
              </group>
              <group position={[0, -eShift, -e * 0.4]}>
                <Pipe start={[rightX, y, frontZ - 2.2]} end={[rightX, y, wallZ + 1.2]} showLabel={showLabel} colorOption={colorOption} />
                <Flange position={[rightX, y, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
            </group>
          ))}

          {/* Linking pipes */}
          {depthArms.slice(0, -1).map(({ y }, i) => {
            const nextY = depthArms[i + 1].y;
            return (
              <group key={`r-vert-${i}`} position={[0, -e * 0.1 * (i + 0.5), 0]}>
                <Pipe start={[rightX, y - 2.2, frontZ]} end={[rightX, nextY + 2.2, frontZ]} showLabel={showLabel} colorOption={colorOption} />
              </group>
            );
          })}

          {/* Top vertical stub + EndCap */}
          <group position={[0, e * 0.1, 0]}>
            <Pipe start={[rightX, topY + 2.2, frontZ]} end={[rightX, topY + 7.2, frontZ]} showLabel={showLabel} colorOption={colorOption} />
            <EndCap position={[rightX, topY + 7.85, frontZ]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* ── BOTTOM HORIZONTAL CROSSBAR ─────────────────────────────────── */}
        <group position={[0, -depthArms[numShelves].eShift, 0]}>
          <Pipe start={[leftX + 2.2 + eL, bottomY, frontZ]} end={[rightX - 2.2 + eR, bottomY, frontZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* ── WOOD SHELVES (sitting on depth arms) ────────────────────── */}
        {hasShelves && depthArms.slice(0, -1).map(({ y }, i) => (
          <group key={`shelf-${i}`} position={[0, y + 1.5, wallZ / 2]}>
            <Shelf position={[0, 0, 0]} length={length} depth={wallDistance} woodColor={woodColor} highlightFront={false} />
          </group>
        ))}
      </group>
    );
  }

  if (skuType === 'sku130') {
    // L-shaped clothing rail with an angled display hook
    const e = explode * 1.5;
    const topY = height / 2;
    const bottomY = -height / 2;
    const eL = -e;
    const eR = e;

    // Position of the hook (exactly in the middle vertically)
    const hookY = topY / 2 + bottomY / 2; // Basically 0, meaning precisely in the middle
    const frontZ = 0;
    const wallZ = -wallDistance;

    return (
      <group>
        {/* ── RIGHT POST ─────────────────────────────────────────────── */}
        <group position={[eR, 0, 0]}>
          {/* Floor Flange */}
          <group position={[0, -e * 0.8, 0]}>
            <Flange position={[rightX, bottomY, frontZ]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Lower vertical pipe (floor to hook) */}
          <group position={[0, -e * 0.4, 0]}>
            <Pipe start={[rightX, bottomY + 1.2, frontZ]} end={[rightX, hookY - 2.2, frontZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Hook Assembly (Middle) */}
          <group position={[0, 0, 0]}>
            <TFitting position={[rightX, hookY, frontZ]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />

            {/* Hook: HexNipple -> FortyFiveElbow -> HexNipple -> EndCap */}
            <group position={[0, 0, e * 0.2]}>
              <HexNipple position={[rightX, hookY, frontZ + 3.2]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[0, 0, e * 0.4]}>
              <FortyFiveElbow position={[rightX, hookY, frontZ + 6.2]} rotation={[-Math.PI / 2, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[0, e * 0.2, e * 0.6]}>
              <HexNipple position={[rightX, hookY + 2.121, frontZ + 8.321]} rotation={[Math.PI / 4, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[0, e * 0.4, e * 0.8]}>
              <EndCap position={[rightX, hookY + 3.394, frontZ + 9.594]} rotation={[Math.PI / 4, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          </group>

          {/* Upper vertical pipe (hook to top corner) */}
          <group position={[0, e * 0.4, 0]}>
            <Pipe start={[rightX, hookY + 2.2, frontZ]} end={[rightX, topY - 2.2, frontZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Top Corner Fitting */}
          <group position={[0, e * 0.8, 0]}>
            {/* Corner fitting side="right" connects -Y, -X, -Z */}
            <CornerFitting position={[rightX, topY, frontZ]} side="right" rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Top right depth arm to wall (-Z) */}
          <group position={[0, e * 0.8, -e * 0.4]}>
            <Pipe start={[rightX, topY, frontZ - 2.2]} end={[rightX, topY, wallZ + 1.2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 0.8, -e * 0.8]}>
            <Flange position={[rightX, topY, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* ── LEFT WALL MOUNT ────────────────────────────────────────── */}
        <group position={[eL, e * 0.8, 0]}>
          <group position={[0, 0, 0]}>
            <Elbow position={[leftX, topY, frontZ]} rotation={[Math.PI / 2, Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.4]}>
            <Pipe start={[leftX, topY, frontZ - 2.2]} end={[leftX, topY, wallZ + 1.2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.8]}>
            <Flange position={[leftX, topY, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* ── HORIZONTAL RAIL ────────────────────────────────────────── */}
        <group position={[0, e * 0.8, 0]}>
          <Pipe start={[leftX + 2.2, topY, frontZ]} end={[rightX - 2.2, topY, frontZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku131') {
    // 2-post freestanding-like rack with 1 bottom shelf and a top rail, mounted to wall
    const e = explode * 1.5;
    const topY = height / 2;
    const bottomY = -height / 2;
    const shelfY = bottomY + height * 0.33;
    const wallZ = -wallDistance;
    const frontZ = 0;

    // Middle coupling Y position
    const couplingY = shelfY + (topY - shelfY) / 2;

    const buildSide = (x: number, isLeft: boolean) => {
      const eX = isLeft ? -e : e;
      const cornerRot: [number, number, number] = isLeft ? [0, Math.PI / 2, 0] : [0, -Math.PI / 2, 0];

      return (
        <group position={[eX, 0, 0]}>
          {/* Floor Flange */}
          <group position={[0, -e * 0.8, 0]}>
            <Flange position={[x, bottomY, frontZ]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Lower Pipe */}
          <group position={[0, -e * 0.4, 0]}>
            <Pipe start={[x, bottomY + 1.2, frontZ]} end={[x, shelfY - 2.2, frontZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Shelf T-Fitting (branch pointing -Z) */}
          <group position={[0, 0, 0]}>
            <TFitting position={[x, shelfY, frontZ]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Shelf Wall Pipe */}
          <group position={[0, 0, -e * 0.4]}>
            <Pipe start={[x, shelfY, frontZ - 2.2]} end={[x, shelfY, wallZ + 1.2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.8]}>
            <Flange position={[x, shelfY, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Upper Pipe */}
          <group position={[0, e * 0.4, 0]}>
            <Pipe start={[x, shelfY + 2.2, frontZ]} end={[x, topY - 2.2, frontZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Top Corner Fitting */}
          <group position={[0, e * 0.8, 0]}>
            <CornerFitting position={[x, topY, frontZ]} side={isLeft ? 'left' : 'right'} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Top Wall Pipe */}
          <group position={[0, e * 0.8, -e * 0.4]}>
            <Pipe start={[x, topY, frontZ - 2.2]} end={[x, topY, wallZ + 1.2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 0.8, -e * 0.8]}>
            <Flange position={[x, topY, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      );
    };

    return (
      <group>
        {buildSide(leftX, true)}
        {buildSide(rightX, false)}

        {/* Top Horizontal Rail */}
        <group position={[0, e * 0.8, 0]}>
          <Pipe start={[leftX + 2.2, topY, frontZ]} end={[rightX - 2.2, topY, frontZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Wood Shelf */}
        {hasShelves && (
          <group position={[0, 0, -e * 0.4]}>
            <Shelf
              position={[0, shelfY + 1.5, wallZ / 2]}
              length={length + 10}
              depth={wallDistance}
              woodColor={woodColor}
            />
          </group>
        )}
      </group>
    );
  }

  if (skuType === 'sku132') {
    // L-shaped: 2 floor posts + 2 wall flanges at top, coupling at mid of each leg
    // Left top: CornerFitting (down=leg, back=wall arm, right=horizontal rail)
    // Right top: Elbow (down=leg, back=wall arm)
    const e = explode * 1.5;
    const topY = height / 2;
    const bottomY = -height / 2;

    // Mathematically perfectly split the leg pipe so upper and lower segments are absolutely identical lengths.
    const pipeSpan = (topY - 2.2) - (bottomY + 1.2);
    const pipeLen = (pipeSpan - 2.4) / 2; // Subtract Coupling space
    const couplingY = bottomY + 1.2 + pipeLen + 1.2;

    const frontZ = 0;
    const wallZ = -wallDistance;

    const buildLeg = (x: number, isLeft: boolean) => {
      const eX = isLeft ? -e : e;
      return (
        <group position={[eX, 0, 0]}>
          {/* Floor Flange */}
          <group position={[0, -e * 0.6, 0]}>
            <Flange position={[x, bottomY, frontZ]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Lower Pipe: floor flange top → coupling bottom */}
          <group position={[0, -e * 0.3, 0]}>
            <Pipe start={[x, bottomY + 1.2, frontZ]} end={[x, couplingY - 1.2, frontZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Coupling at exact mid-leg */}
          <group position={[0, 0, 0]}>
            <Coupling position={[x, couplingY, frontZ]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Upper Pipe: coupling top → top fitting bottom */}
          <group position={[0, e * 0.3, 0]}>
            <Pipe start={[x, couplingY + 1.2, frontZ]} end={[x, topY - 2.2, frontZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      );
    };

    return (
      <group>
        {buildLeg(leftX, true)}
        {buildLeg(rightX, false)}

        {/* LEFT TOP: CornerFitting — opens down (leg), back (wall arm), right (horizontal rail) */}
        <group position={[-e, e * 0.8, 0]}>
          <CornerFitting
            position={[leftX, topY, frontZ]}
            side="left"
            rotation={[0, 0, 0]}
            showLabel={showLabel}
            colorOption={colorOption}
          />
        </group>

        {/* Left wall arm */}
        <group position={[-e, e * 0.8, -e * 0.4]}>
          <Pipe start={[leftX, topY, frontZ - 2.2]} end={[leftX, topY, wallZ + 1.2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-e, e * 0.8, -e * 0.8]}>
          <Flange position={[leftX, topY, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* RIGHT TOP: CornerFitting — opens down (leg), back (wall arm), left (horizontal rail) */}
        <group position={[e, e * 0.8, 0]}>
          <CornerFitting
            position={[rightX, topY, frontZ]}
            side="right"
            rotation={[0, 0, 0]}
            showLabel={showLabel}
            colorOption={colorOption}
          />
        </group>

        {/* Right wall arm */}
        <group position={[e, e * 0.8, -e * 0.4]}>
          <Pipe start={[rightX, topY, frontZ - 2.2]} end={[rightX, topY, wallZ + 1.2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[e, e * 0.8, -e * 0.8]}>
          <Flange position={[rightX, topY, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Horizontal rail */}
        <group position={[0, e * 0.8, 0]}>
          <Pipe start={[leftX + 2.2, topY, frontZ]} end={[rightX - 2.2, topY, frontZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku133') {
    // 2 independent wall brackets
    const e = explode * 1.5;
    const wallZ = -wallDistance;
    const midZ = -wallDistance / 2;
    const frontZ = 0;

    // Top surface of the shelf wood (assumes 5cm standoff pipe + 1.2 flange thickness + 1.5 board thickness)
    const standoffPipeLen = Math.max(height, 2); // ensure at least 2cm pipe
    const flangeY = 2.2 + standoffPipeLen + 1.2;

    const buildBracket = (x: number, isLeft: boolean) => {
      const gX = isLeft ? -e : e;
      return (
        <group position={[gX, 0, 0]}>
          {/* Wall Flange */}
          <group position={[0, 0, -e * 0.8]}>
            <Flange position={[x, 0, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Back Pipe */}
          <group position={[0, 0, -e * 0.4]}>
            <Pipe start={[x, 0, wallZ + 1.2]} end={[x, 0, midZ - 2.2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Mid T-Fitting */}
          <group position={[0, 0, 0]}>
            <TFitting position={[x, 0, midZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Front Pipe */}
          <group position={[0, 0, e * 0.4]}>
            <Pipe start={[x, 0, midZ + 2.2]} end={[x, 0, frontZ - 2.2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Front Elbow */}
          <group position={[0, 0, e * 0.8]}>
            <Elbow position={[x, 0, frontZ]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* STANDOFFS from Mid T-Fitting */}
          <group position={[0, e * 0.4, 0]}>
            <Pipe start={[x, 2.2, midZ]} end={[x, 2.2 + standoffPipeLen, midZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 0.8, 0]}>
            <Flange position={[x, flangeY, midZ]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* STANDOFFS from Front Elbow */}
          <group position={[0, e * 0.4, e * 0.8]}>
            <Pipe start={[x, 2.2, frontZ]} end={[x, 2.2 + standoffPipeLen, frontZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 0.8, e * 0.8]}>
            <Flange position={[x, flangeY, frontZ]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      );
    };

    return (
      <group>
        {buildBracket(leftX, true)}
        {buildBracket(rightX, false)}

        {hasShelves && (
          <group position={[0, e * 0.8, 0]}>
            <Shelf
              position={[0, flangeY + 1.5, wallZ / 2]}
              length={length + 10}
              depth={wallDistance}
              woodColor={woodColor}
            />
          </group>
        )}
      </group>
    );
  }

  if (skuType === 'sku134') {
    const e = explode * 1.5;
    const wallZ = -wallDistance;
    const frontZ = 0;

    return (
      <group>
        {/* Wall Flange */}
        <group position={[0, 0, -e]}>
          <Flange position={[0, 0, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Wall Arm Pipe */}
        <group position={[0, 0, -e * 0.5]}>
          <Pipe start={[0, 0, wallZ + 1.2]} end={[0, 0, frontZ - 2.2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Middle Elbow (receives from back (-Z) and goes down (-Y)) */}
        <group position={[0, 0, 0]}>
          <Elbow position={[0, 0, frontZ]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Hex Nipple connecting Elbow and TFitting */}
        <group position={[0, -e * 0.5, 0]}>
          <HexNipple position={[0, -2.2, frontZ]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Center T-Fitting (receives from UP (+Y) and splits left/right (-X/+X)) */}
        <group position={[0, -e, 0]}>
          <TFitting position={[0, -4.4, frontZ]} rotation={[Math.PI / 2, Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Left Pipe from TFitting left collar (-1.8) to End Elbow */}
        <group position={[-e * 0.5, -e, 0]}>
          <Pipe start={[leftX + 2.2, -4.4, frontZ]} end={[-1.8, -4.4, frontZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Right Pipe */}
        <group position={[e * 0.5, -e, 0]}>
          <Pipe start={[1.8, -4.4, frontZ]} end={[rightX - 2.2, -4.4, frontZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Left End Elbow (pointing UP) */}
        {/* Receives from Right (+X) and points UP (+Y) */}
        <group position={[-e, -e, 0]}>
          <Elbow position={[leftX, -4.4, frontZ]} rotation={[0, Math.PI / 2, Math.PI]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Right End Elbow (pointing UP) */}
        {/* Receives from Left (-X) and points UP (+Y) */}
        <group position={[e, -e, 0]}>
          <Elbow position={[rightX, -4.4, frontZ]} rotation={[0, -Math.PI / 2, Math.PI]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku135') {
    const e = explode * 1.5;
    return (
      <group>
        {/* Wall Flange (Left) */}
        <group position={[-e, 0, 0]}>
          <Flange position={[leftX, 0, 0]} rotation={[0, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Horizontal Pipe */}
        <group position={[0, 0, 0]}>
          <Pipe start={[leftX + 1.2, 0, 0]} end={[rightX - 2.2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Connection Elbow: receiving from left (-X) and going up (+Y) */}
        {/* Test said RIGHT ELBOW for sku134 (needs -X and +Y): [0, -Math.PI / 2, Math.PI]. Wait, let's verify if that works for horizontal right elbow. */}
        <group position={[e, -e, 0]}>
          <Elbow position={[rightX, 0, 0]} rotation={[0, -Math.PI / 2, Math.PI]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Vertical Pipe from ceiling down to elbow */}
        <group position={[e, 0, 0]}>
          <Pipe start={[rightX, 2.2, 0]} end={[rightX, height - 1.2, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Ceiling Flange */}
        <group position={[e, e, 0]}>
          <Flange position={[rightX, height, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku136') {
    const e = explode * 1.5;
    const rodRadius = 1.6;
    const bracketZ = -wallDistance; // Distance from wall to the ROD center
    const rodZ = bracketZ + e * 0.5;

    // Brackets 15cm from each end
    const bracketOffset = 15;
    const bracketXPositions = [leftX + bracketOffset, rightX - bracketOffset];
    const midLength = Math.max(0, length - bracketOffset * 2);

    let numMiddleSegs = 0;
    let segLen = 0;
    if (midLength > 0) {
      const maxLuciteLen = 120;
      numMiddleSegs = Math.ceil(midLength / maxLuciteLen);
      segLen = midLength / numMiddleSegs;

      const startX = leftX + bracketOffset;
      for (let i = 1; i < numMiddleSegs; i++) {
        bracketXPositions.push(startX + i * segLen);
      }
    }

    const materialProps = {
      color: "#ffffff",
      transparent: true,
      opacity: 0.15,
      roughness: 0.02,
      metalness: 0.0,
      transmission: 0.98,
      thickness: 2.0,
      ior: 1.49,
      envMapIntensity: 1
    };

    return (
      <group position={[0, 0, rodZ]}>

        {/* === Left 15cm Rod === */}
        <group position={[leftX + 7.5 - e * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[rodRadius, rodRadius, 15, 32]} />
            <meshPhysicalMaterial {...materialProps} />
          </mesh>
          {showLabel && <Label text={`15.0 cm Lucite Rod`} type="pipe" lineClass="h-8" />}
        </group>

        {/* === Right 15cm Rod === */}
        <group position={[rightX - 7.5 + e * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[rodRadius, rodRadius, 15, 32]} />
            <meshPhysicalMaterial {...materialProps} />
          </mesh>
          {showLabel && <Label text={`15.0 cm Lucite Rod`} type="pipe" lineClass="h-8" />}
        </group>

        {/* === Middle Rod(s) === */}
        {(() => {
          if (midLength <= 0 || numMiddleSegs <= 0) return null;

          const segments = [];
          const startX = leftX + bracketOffset;

          for (let i = 0; i < numMiddleSegs; i++) {
            const segCenterX = startX + (i * segLen) + (segLen / 2);
            // Explode away from true center
            const explodeX = numMiddleSegs > 1 ? (Math.sign(segCenterX) * e * 0.25) : 0;

            segments.push(
              <group key={`mid-rod-${i}`} position={[segCenterX + explodeX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh castShadow receiveShadow>
                  <cylinderGeometry args={[rodRadius, rodRadius, segLen, 32]} />
                  <meshPhysicalMaterial {...materialProps} />
                </mesh>
                {showLabel && <Label text={`${segLen.toFixed(1)} cm Lucite Rod`} type="pipe" lineClass="h-8" />}
              </group>
            );
          }
          return <group position={[0, 0, 0]}>{segments}</group>;
        })()}

        {/* End Caps (Metal) - Explode outwards along the rod axis */}
        <group position={[leftX - e, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
            <cylinderGeometry args={[rodRadius + 0.15, rodRadius + 0.15, 2.0, 32]} />
            <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={colorOption.roughness - 0.2} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 2.0, 0]}>
            <sphereGeometry args={[rodRadius + 0.15, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={colorOption.roughness - 0.2} />
          </mesh>
          {showLabel && <group position={[0, 1.0, 0]}><Label text="Metal End Cap (rod)" type="fitting" lineClass="h-8" /></group>}
        </group>

        <group position={[rightX + e, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
            <cylinderGeometry args={[rodRadius + 0.15, rodRadius + 0.15, 2.0, 32]} />
            <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={colorOption.roughness - 0.2} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 2.0, 0]}>
            <sphereGeometry args={[rodRadius + 0.15, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={colorOption.roughness - 0.2} />
          </mesh>
          {showLabel && <group position={[0, 1.0, 0]}><Label text="Metal End Cap (rod)" type="fitting" lineClass="h-8" /></group>}
        </group>

        {/* Custom Brackets - Do not explode to stay fixed behind rods */}
        {bracketXPositions.map((bx, idx) => (
          <group key={idx} position={[bx, 0, 0]}>
            <HandrailBracket position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        ))}
      </group>
    );
  }

  if (skuType === 'sku137') {
    const e = explode * 1.5;
    const rodRadius = 1.6;
    const bracketZ = -wallDistance;
    const rodZ = bracketZ + e * 0.5;

    const maxLuciteLen = 120;
    const numSegs = Math.ceil(length / maxLuciteLen) || 1;
    const segLen = length / numSegs;

    const bracketXPositions = [];
    for (let i = 0; i <= numSegs; i++) {
      bracketXPositions.push(leftX + (i * segLen));
    }

    const materialProps = {
      color: "#ffffff",
      transparent: true,
      opacity: 0.15,
      roughness: 0.02,
      metalness: 0.0,
      transmission: 0.98,
      thickness: 2.0,
      ior: 1.49,
      envMapIntensity: 1
    };

    return (
      <group position={[0, 0, rodZ]}>

        {/* Lucite Rod Segments */}
        {(() => {
          const segments = [];
          for (let i = 0; i < numSegs; i++) {
            const segCenterX = leftX + (i * segLen) + (segLen / 2);
            const explodeX = numSegs > 1 ? (Math.sign(segCenterX) * e * 0.25) : 0;

            segments.push(
              <group key={`rod-${i}`} position={[segCenterX + explodeX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh castShadow receiveShadow>
                  <cylinderGeometry args={[rodRadius, rodRadius, segLen, 32]} />
                  <meshPhysicalMaterial {...materialProps} />
                </mesh>
                {showLabel && <Label text={`${segLen.toFixed(1)} cm Lucite Rod`} type="pipe" lineClass="h-8" />}
              </group>
            );
          }
          return <group position={[0, 0, 0]}>{segments}</group>;
        })()}

        {/* End Caps (Metal) conditionally added if hasShelves (Include End Caps) is true */}
        {hasShelves && (
          <>
            <group position={[leftX - e, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
                <cylinderGeometry args={[rodRadius + 0.15, rodRadius + 0.15, 2.0, 32]} />
                <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={colorOption.roughness - 0.2} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 2.0, 0]}>
                <sphereGeometry args={[rodRadius + 0.15, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={colorOption.roughness - 0.2} />
              </mesh>
              {showLabel && <group position={[0, 1.0, 0]}><Label text="Metal End Cap (rod)" type="fitting" lineClass="h-8" /></group>}
            </group>

            <group position={[rightX + e, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
                <cylinderGeometry args={[rodRadius + 0.15, rodRadius + 0.15, 2.0, 32]} />
                <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={colorOption.roughness - 0.2} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 2.0, 0]}>
                <sphereGeometry args={[rodRadius + 0.15, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.3} roughness={colorOption.roughness - 0.2} />
              </mesh>
              {showLabel && <group position={[0, 1.0, 0]}><Label text="Metal End Cap (rod)" type="fitting" lineClass="h-8" /></group>}
            </group>
          </>
        )}

        {/* Straight Handrail Brackets */}
        {bracketXPositions.map((bx, idx) => (
          <group key={idx} position={[bx, 0, 0]}>
            <StraightHandrailBracket position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        ))}
      </group>
    );
  }

  if (skuType === 'sku138') {
    const e = explode * 1.5;
    const rodRadius = 1.6;
    const bracketZ = -wallDistance;
    const rodZ = bracketZ + e * 0.5;

    const materialProps = {
      color: "#ffffff",
      transparent: true,
      opacity: 0.15,
      roughness: 0.02,
      metalness: 0.0,
      transmission: 0.98,
      thickness: 2.0,
      ior: 1.49,
      envMapIntensity: 1
    };

    return (
      <group position={[0, height / 2, rodZ]}>

        {/* The dynamic vertical Lucite Rod */}
        <group position={[0, 0, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[rodRadius, rodRadius, length, 32]} />
            <meshPhysicalMaterial {...materialProps} />
          </mesh>
          {showLabel && <Label text={`${length.toFixed(1)} cm Lucite Rod`} type="pipe" lineClass="h-8" />}
        </group>

        {/* Straight Handrail Bracket - Vertical orientation */}
        <group position={[0, 0, -e * 0.5]}>
          <StraightHandrailBracket position={[0, 0, 0]} rotation={[0, 0, 0]} orientation="vertical" showLabel={showLabel} colorOption={colorOption} />
        </group>

      </group>
    );
  }


  if (skuType === 'sku127') {
    const e = explode * 1.5;
    const legPipeLength = 20; // 20cm exact pipe requested
    const shelfDepth = 23; // Shelf perfectly at 23cm depth
    // Base wood properties
    const bottomWoodY = legPipeLength + 2.4; // 22.4 (pipe + 2 flanges)
    const shelfY = bottomWoodY + 1.5; // 23.9
    const topWoodY = shelfY + 1.5; // 25.4
    const xInset = 10;
    const zInset = 4;
    const lx = leftX + xInset;
    const rx = rightX - xInset;
    const zFront = shelfDepth / 2 - zInset;
    const zBack = -shelfDepth / 2 + zInset;

    const buildBottomLeg = (x: number, z: number, isLeft: boolean, isFront: boolean) => {
      const xExp = isLeft ? -e : e;
      const zExp = isFront ? e * 0.5 : -e * 0.5;
      return (
        <group key={`leg-${x}-${z}`} position={[xExp, -e * 0.5, zExp]}>
          <Flange position={[x, 0, z]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Pipe start={[x, 1.2, z]} end={[x, bottomWoodY - 1.2, z]} showLabel={showLabel} colorOption={colorOption} />
          <Flange position={[x, bottomWoodY, z]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      );
    };

    const buildTopLeg = (x: number, isLeft: boolean) => {
      const xExp = isLeft ? -e : e;
      return (
        <group key={`topleg-${x}`} position={[xExp, hasShelves ? e * 0.5 : 0, 0]}>
          <Flange position={[x, topWoodY, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Pipe start={[x, topWoodY + 1.2, 0]} end={[x, height - 1.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Elbow position={[x, height, 0]} rotation={[0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      );
    };

    return (
      <group position={[0, -height / 2 + 5, 0]}>
        {/* Bottom Legs & Shelf */}
        {buildBottomLeg(lx, zFront, true, true)}
        {buildBottomLeg(lx, zBack, true, false)}
        {buildBottomLeg(rx, zFront, false, true)}
        {buildBottomLeg(rx, zBack, false, false)}

        {hasShelves && (
          <group position={[0, 0, 0]}>
            <Shelf position={[0, shelfY, 0]} length={length} depth={shelfDepth} woodColor={woodColor} highlightFront={true} />
          </group>
        )}

        {/* Top Legs */}
        {buildTopLeg(lx, true)}
        {buildTopLeg(rx, false)}

        {/* Top Cross Rail */}
        <group position={[0, hasShelves ? e * 1.5 : e, 0]}>
          <Pipe start={[lx + 1.2, height, 0]} end={[rx - 1.2, height, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku125') {
    // Wall-mounted industrial hook (Flange -> Hex Nipple -> T-Fitting -> Hex Nipples -> Caps)
    const e = explode * 1.5;
    const wallZ = -5.4; // Hardware assembly depth

    return (
      <group position={[0, height / 4, 0]}>
        {/* Wall Connection Group */}
        <group>
          {/* Wall Flange */}
          <group position={[0, 0, -e * 1.5]}>
            <Flange position={[0, 0, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          {/* Hex Nipple from wall */}
          <group position={[0, 0, -e * 1.0]}>
            <HexNipple position={[0, 0, wallZ + 2.75]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* T-Fitting connects directly to wall nipple */}
        <TFitting position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />

        {/* Top Hook Assembly */}
        <group position={[0, e * 0.75, 0]}>
          <group position={[0, e * 0.5, 0]}>
            <HexNipple position={[0, 3.2, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 1.2, 0]}>
            <EndCap position={[0, 4.4, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* Bottom Hook Assembly */}
        <group position={[0, -e * 0.75, 0]}>
          <group position={[0, -e * 0.5, 0]}>
            <HexNipple position={[0, -3.2, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, -e * 1.2, 0]}>
            <EndCap position={[0, -4.4, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      </group>
    );
  }


  if (skuType === 'sku140') {
    const e = explode * 1.5;
    const bracketZ = -wallDistance;
    const railZ = bracketZ + 6.6; // wall distance - 6.6
    const leftX = -(length / 2);
    const rightX = (length / 2);
    const midX = 0;

    return (
      <group position={[0, height / 2, -wallDistance / 2]}>
        {/* Wall Flanges */}
        <group position={[-e, 0, -e]}>
          <Flange position={[leftX + 2.5, 0, bracketZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, 0, -e]}>
          <Flange position={[midX, 0, bracketZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[e, 0, -e]}>
          <Flange position={[rightX - 2.5, 0, bracketZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Support Arms */}
        <group position={[-e, 0, -e * 0.5]}>
          <Pipe start={[leftX + 2.5, 0, bracketZ + 1.2]} end={[leftX + 2.5, 0, railZ - 1.5]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, 0, -e * 0.5]}>
          <Pipe start={[midX, 0, bracketZ + 1.2]} end={[midX, 0, railZ - 1.5]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[e, 0, -e * 0.5]}>
          <Pipe start={[rightX - 2.5, 0, bracketZ + 1.2]} end={[rightX - 2.5, 0, railZ - 1.5]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Front Rail */}
        <group position={[0, 0, e * 0.5]}>
          {/* Middle Tee */}
          <TFitting position={[midX, 0, railZ]} rotation={[-Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          {/* Left Elbow */}
          <Elbow position={[leftX + 2.5, 0, railZ]} rotation={[0, Math.PI, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          {/* Right Elbow */}
          <Elbow position={[rightX - 2.5, 0, railZ]} rotation={[0, Math.PI, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          {/* Rail Pipes */}
          <Pipe start={[leftX + 4.0, 0, railZ]} end={[midX - 1.5, 0, railZ]} showLabel={showLabel} colorOption={colorOption} />
          <Pipe start={[midX + 1.5, 0, railZ]} end={[rightX - 4.0, 0, railZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku141') {
    const e = explode * 1.5;
    const leftX = -(length / 2);
    const rightX = (length / 2);
    const zFront = wallDistance / 2;
    const zBack = -wallDistance / 2;

    const buildLeg = (x: number, z: number, isLeft: boolean, isFront: boolean) => {
      const xExp = isLeft ? -e : e;
      const zExp = isFront ? e : -e;
      return (
        <group key={`leg-${x}-${z}`} position={[xExp, 0, zExp]}>
          <Flange position={[x, 0, z]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Pipe start={[x, 1.2, z]} end={[x, height - 1.2, z]} showLabel={showLabel} colorOption={colorOption} />
          <Flange position={[x, height, z]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      );
    };

    return (
      <group position={[0, 0, 0]}>
        {buildLeg(leftX + 6, zFront, true, true)}
        {buildLeg(leftX + 6, zBack, true, false)}
        {buildLeg(rightX - 6, zFront, false, true)}
        {buildLeg(rightX - 6, zBack, false, false)}
      </group>
    );
  }

  if (skuType === 'sku142' || skuType === 'sku171') {
    const e = explode * 1.5;
    const bracketZ = -wallDistance;
    const railZ = 0;
    const leftX = -(length / 2);
    const rightX = (length / 2);

    return (
      <group position={[0, height / 2, -wallDistance / 2]}>
        {/* Left Arm */}
        <group position={[-e, 0, 0]}>
          <Flange position={[leftX + 2.2, 0, bracketZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Pipe start={[leftX + 2.2, 0, bracketZ + 1.2]} end={[leftX + 2.2, 0, railZ - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          <Elbow position={[leftX + 2.2, 0, railZ]} rotation={[0, Math.PI, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Right Arm */}
        <group position={[e, 0, 0]}>
          <Flange position={[rightX - 2.2, 0, bracketZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Pipe start={[rightX - 2.2, 0, bracketZ + 1.2]} end={[rightX - 2.2, 0, railZ - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          <Elbow position={[rightX - 2.2, 0, railZ]} rotation={[0, Math.PI, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Horizontal Rail */}
        <group position={[0, 0, e]}>
          <Pipe start={[leftX + 3.7, 0, railZ]} end={[rightX - 3.7, 0, railZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku175') {
    const e = explode * 1.5;
    const wallZ = -wallDistance; // -5 normally
    const baseZ = 0;

    return (
      <group position={[0, height / 2, 0]}>
        {/* Wall Flange */}
        <group position={[0, 0, -e]}>
          <Flange position={[0, 0, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* 5cm Wall Pipe */}
        <group position={[0, 0, -e * 0.5]}>
          <Pipe start={[0, 0, wallZ + 1.2]} end={[0, 0, baseZ - 1.5]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Lower T-Fitting: Rotation [0, 0, 0] means side port points to -Z */}
        <group position={[0, 0, 0]}>
          <TFitting position={[0, 0, baseZ]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          {/* Bottom In-cap to close the lower through-port */}
          <EndCap position={[0, baseZ - 2.2, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Hex Nipple going UP (+Y) */}
        <group position={[0, e * 0.5, 0]}>
          <HexNipple position={[0, baseZ + 2.2, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Upper T-Fitting: Rotated exactly 90 degrees (Math.PI / 2). Side port (-Z) moves to -X */}
        <group position={[0, e, 0]}>
          <TFitting position={[0, baseZ + 4.4, 0]} rotation={[0, Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
          {/* Top In-cap to close the upper through-port */}
          <EndCap position={[0, baseZ + 4.4 + 2.2, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* 15cm pole pointing left (-X) */}
        <group position={[-e, e, 0]}>
          <Pipe start={[-1.5, baseZ + 4.4, 0]} end={[-16.5, baseZ + 4.4, 0]} showLabel={showLabel} colorOption={colorOption} />
          {/* End cap for the peg */}
          <EndCap position={[-16.5, baseZ + 4.4, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku176') {
    const bracketZ = -wallDistance;

    return (
      <group position={[0, height / 2, 0]}>
        <group position={[0, 0, -explode]}>
          <Flange position={[0, 0, bracketZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, 0, explode]}>
          <HexNipple position={[0, 0, bracketZ + 2.2]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Elbow position={[0, 0, bracketZ + 4.4]} rotation={[0, Math.PI, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          <HexNipple position={[2.2, 0, bracketZ + 4.4]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          <EndCap position={[4.4, 0, bracketZ + 4.4]} rotation={[0, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku177') {
    const e = explode * 1.5;
    const numRails = Math.max(2, tiers || 3);
    const leftX = -(length / 2) + 2.5;
    const rightX = (length / 2) - 2.5;
    const zBase = -wallDistance;
    const zRail = zBase + wallDistance; // Usually 0

    const bottomY = 15;
    const vertLength = 20;
    const topY = bottomY + (numRails - 1) * vertLength;

    // Draw horizontal wall pipes and flanges
    const drawSupports = (x: number, isLeft: boolean) => {
      let parts = [];
      const xExp = isLeft ? -e : e;
      for (let i = 0; i < numRails; i++) {
        const y = bottomY + i * vertLength;
        parts.push(
          <group key={`supp-${i}-${isLeft}`} position={[xExp, y, -e]}>
            <Flange position={[x, 0, zBase]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            <Pipe start={[x, 0, zBase + 1.2]} end={[x, 0, zRail - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        );
      }
      return parts;
    };

    // Draw vertical poles
    const drawVerticals = (x: number, isLeft: boolean) => {
      let parts = [];
      const xExp = isLeft ? -e : e;
      
      // Fitting at bottomY - CORNER ELBOW AS PER REQUEST
      parts.push(
         <group key={`c-bot-${isLeft}`} position={[xExp, bottomY, e]}>
            <CornerFitting position={[x, 0, zRail]} rotation={[Math.PI / 2, isLeft ? 0 : -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} side={isLeft ? 'left' : 'right'} />
         </group>
      );

      // Verticals between rails
      for (let i = 0; i < numRails - 1; i++) {
        const yStart = bottomY + i * vertLength;
        const yEnd = bottomY + (i + 1) * vertLength;
        parts.push(
          <group key={`vert-${i}-${isLeft}`} position={[xExp, 0, e]}>
            <Pipe start={[x, yStart + 1.5, zRail]} end={[x, yEnd - 1.5, zRail]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        );
        
        // Fitting at yEnd (which is a T-fitting unless it's top and we wanted something else)
        if (i < numRails - 2) {
           parts.push(
             <group key={`t-${i + 1}-${isLeft}`} position={[xExp, yEnd, e]}>
                <TFitting position={[x, 0, zRail]} rotation={[-Math.PI / 2, isLeft ? Math.PI : 0, 0]} showLabel={showLabel} colorOption={colorOption} />
             </group>
           );
        }
      }
      
      // Fitting at topY
      parts.push(
         <group key={`t-top-${isLeft}`} position={[xExp, topY, e]}>
            <TFitting position={[x, 0, zRail]} rotation={[-Math.PI / 2, isLeft ? Math.PI : 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            {/* Top stub */}
            <Pipe start={[x, 1.5, zRail]} end={[x, 5 - 1.0, zRail]} showLabel={showLabel} colorOption={colorOption} />
            <EndCap position={[x, 5, zRail]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
         </group>
      );
      
      return parts;
    };

    // Calculate dynamic total height for centering visually
    const totalHeightRendered = topY + 5.0 - bottomY;

    return (
      <group position={[0, -totalHeightRendered / 2, -wallDistance / 2]}>
         {drawSupports(leftX, true)}
         {drawSupports(rightX, false)}
         {drawVerticals(leftX, true)}
         {drawVerticals(rightX, false)}
         
         {/* Bottom Horizontal Rail */}
         <group position={[0, bottomY, e]}>
            <Pipe start={[leftX + 1.5, 0, zRail]} end={[rightX - 1.5, 0, zRail]} showLabel={showLabel} colorOption={colorOption} />
         </group>

         {hasShelves && (
            <group position={[0, topY + 1.5 + e * 0.5, 0]}>
               <Shelf position={[0, 0, zBase / 2]} length={length} depth={wallDistance} woodColor={woodColor} />
            </group>
         )}
      </group>
    );
  }

  const buildSide = (x: number, side: 'left' | 'right') => {
    const midY = 75 + (height - 75) / 2;
    const e = explode * 1.5;
    const sideX = side === 'left' ? -e : e;
    const wallZ = -wallDistance;
    const actualWallDist = wallDistance;
    const renderVerticalPipe = (startY: number) => {
      const pipeLength = height - startY;
      if (pipeLength > 120) {
        const splitY = startY + pipeLength / 2;
        return (
          <>
            <group position={[sideX, e * 0.5, 0]}>
              <Pipe start={[x, startY, 0]} end={[x, splitY, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[sideX, e * 1.0, 0]}>
              <Coupling position={[x, splitY, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[sideX, e * 1.5, 0]}>
              <Pipe start={[x, splitY, 0]} end={[x, height, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          </>
        );
      }
      return (
        <group position={[sideX, e * 0.5, 0]}>
          <Pipe start={[x, startY, 0]} end={[x, height, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      );
    };

    return (
      <group key={side}>
        {isFreestanding ? (
          <>
            <group position={[sideX, -e, e * 0.5]}>
              <Flange position={[x, 0, 15]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[sideX, -e, -e * 0.5]}>
              <Flange position={[x, 0, -15]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[sideX, -e * 0.5, e * 0.5]}>
              <Pipe start={[x, 1.5, 15]} end={[x, 4, 15]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[sideX, -e * 0.5, -e * 0.5]}>
              <Pipe start={[x, 1.5, -15]} end={[x, 4, -15]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[sideX, 0, e * 0.5]}>
              <Elbow position={[x, 5.5, 15]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[sideX, 0, -e * 0.5]}>
              <Elbow position={[x, 5.5, -15]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[sideX, 0, e * 0.25]}>
              <Pipe start={[x, 5.5, 1.5]} end={[x, 5.5, 13.5]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[sideX, 0, -e * 0.25]}>
              <Pipe start={[x, 5.5, -1.5]} end={[x, 5.5, -13.5]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[sideX, 0, 0]}>
              <TFitting position={[x, 5.5, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            {renderVerticalPipe(7)}
          </>
        ) : (
          <>
            <group position={[sideX, -e, 0]}>
              <Flange position={[x, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>

            {hasShelves ? (
              <>
                <group position={[sideX, -e * 0.5, 0]}>
                  <Pipe start={[x, 1.5, 0]} end={[x, 35, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                <group position={[sideX, 0, 0]}>
                  <TFitting position={[x, 35, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                <group position={[sideX, 0, -e * 0.5]}>
                  <Pipe start={[x, 35, -actualWallDist + 4.35]} end={[x, 35, -1.5]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                {/* Hex Nipple */}
                <group position={[sideX, 0, -e * 0.75]}>
                  <HexNipple position={[x, 35, -actualWallDist + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                {/* Coupling */}
                <group position={[sideX, 0, -e * 0.625]}>
                  <Coupling position={[x, 35, -actualWallDist + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                <group position={[sideX, 0, -e]}>
                  <Flange position={[x, 35, -actualWallDist]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>

                <group position={[sideX, e * 0.5, 0]}>
                  <Pipe start={[x, 35, 0]} end={[x, 75, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                <group position={[sideX, e, 0]}>
                  <TFitting position={[x, 75, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                <group position={[sideX, e, -e * 0.5]}>
                  <Pipe start={[x, 75, -actualWallDist + 4.35]} end={[x, 75, -1.5]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                {/* Hex Nipple */}
                <group position={[sideX, e, -e * 0.75]}>
                  <HexNipple position={[x, 75, -actualWallDist + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                {/* Coupling */}
                <group position={[sideX, e, -e * 0.625]}>
                  <Coupling position={[x, 75, -actualWallDist + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                <group position={[sideX, e, -e]}>
                  <Flange position={[x, 75, -actualWallDist]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>

                <group position={[sideX, e * 1.5, 0]}>
                  <Pipe start={[x, 75, 0]} end={[x, midY, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
              </>
            ) : (
              renderVerticalPipe(1.5)
            )}
          </>
        )}

        {hasShelves ? (
          <>
            <group position={[sideX, e * 2, 0]}>
              <Coupling position={[x, midY, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[sideX, e * 2.5, 0]}>
              <Pipe start={[x, midY, 0]} end={[x, height, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          </>
        ) : null}

        <group position={[sideX, e * 3, 0]}>
          {isFreestanding ? (
            <Elbow position={[x, height, 0]} rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
          ) : (
            <CornerFitting position={[x, height, 0]} side={side} showLabel={showLabel} colorOption={colorOption} />
          )}
        </group>

        {!isFreestanding && hasShelves && (
          <>
            <group position={[sideX, e * 3, -e * 0.5]}>
              <Pipe start={[x, height, wallZ + 4.35]} end={[x, height, -1.5]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            <group position={[sideX, e * 3, -e * 1.5]}>
              <Flange position={[x, height, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            {/* Hex Nipple from wall */}
            <group position={[sideX, e * 3, -e * 1.1]}>
              <HexNipple position={[x, height, wallZ + 2.65]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
            {/* Coupling after Hex Nipple */}
            <group position={[sideX, e * 3, -e * 0.8]}>
              <Coupling position={[x, height, wallZ + 4.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          </>
        )}
      </group>
    );
  };

  const shelfDepth = wallDistance + 5;
  const shelfZ = -wallDistance / 2 + 3.5;

  return (
    <group>
      {buildSide(leftX, 'left')}
      {buildSide(rightX, 'right')}

      {length > 120 ? (
        <>
          <group position={[-explode * 0.75, explode * 4.5, 0]}>
            <Pipe start={[leftX + 1.5, height, 0]} end={[0, height, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, explode * 4.5, 0]}>
            <Coupling position={[0, height, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[explode * 0.75, explode * 4.5, 0]}>
            <Pipe start={[0, height, 0]} end={[rightX - 1.5, height, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </>
      ) : (
        <group position={[0, explode * 4.5, 0]}>
          <Pipe start={[leftX + 1.5, height, 0]} end={[rightX - 1.5, height, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      )}



      {!isFreestanding && hasShelves && (
        <>
          <group position={[0, explode * 0.75, 0]}>
            <Shelf position={[0, 37.75, shelfZ]} length={length} depth={shelfDepth} woodColor={woodColor} />
          </group>
          <group position={[0, explode * 2.25, 0]}>
            <Shelf position={[0, 77.75, shelfZ]} length={length} depth={shelfDepth} woodColor={woodColor} />
          </group>
        </>
      )}

    </group>
  );
};

const Scene = React.memo(({ length, height, wallDistance, explode, hasShelves, isFreestanding, colorOption, skuType, woodColor, cameraState, tiers = 4 }: { length: number, height: number, wallDistance: number, explode: number, hasShelves: boolean, isFreestanding: boolean, colorOption: ColorOption, skuType: 'standard' | 'sku777' | 'sku000' | 'sku100' | 'sku200' | 'sku102' | 'sku103' | 'sku104' | 'sku4210' | 'sku300' | 'sku105' | 'sku106' | 'sku107' | 'sku108' | 'sku109' | 'sku110' | 'sku111' | 'sku112' | 'sku113' | 'sku114' | 'sku115' | 'sku116' | 'sku117' | 'sku118' | 'sku119' | 'sku120' | 'sku121' | 'sku122' | 'sku123' | 'sku124' | 'sku125' | 'sku126' | 'sku127' | 'sku128' | 'sku129' | 'sku130' | 'sku131' | 'sku132' | 'sku133' | 'sku134' | 'sku135' | 'sku136' | 'sku137' | 'sku138' | 'sku140' | 'sku141' | 'sku142' | 'sku143' | 'sku144' | 'sku145' | 'sku146' | 'sku147' | 'sku148' | 'sku149' | 'sku150' | 'sku151' | 'sku152' | 'sku153' | 'sku154' | 'sku155' | 'sku156' | 'sku157' | 'sku158' | 'sku159' | 'sku160' | 'sku161' | 'sku162' | 'sku163' | 'sku164' | 'sku165' | 'sku166' | 'sku167' | 'sku168' | 'sku169' | 'sku170' | 'sku171' | 'sku172' | 'sku173' | 'sku174' | 'sku175' | 'sku176' | 'sku177' | 'sku888', woodColor: string, cameraState?: any, tiers?: number }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={cameraState?.position || [0, 100, 250]} fov={50} />
      <OrbitControls
        target={cameraState?.target || [0, 100, 0]}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 + 0.1}
        onChange={(e) => {
          if (e && e.target) {
            const controls = e.target as any;
            const cam = controls.object;
            const target = controls.target;
            (window as any).__LATEST_CAMERA = {
              position: [cam.position.x, cam.position.y, cam.position.z],
              target: [target.x, target.y, target.z]
            };
          }
        }}
      />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[100, 200, 100]}
        intensity={1.0}
      />
      <pointLight position={[-50, 100, 50]} intensity={0.5} />
      <pointLight position={[0, 50, 200]} intensity={0.8} />

      <Rack length={length} height={height} wallDistance={wallDistance} explode={explode} hasShelves={hasShelves} isFreestanding={isFreestanding} colorOption={colorOption} skuType={skuType} woodColor={woodColor} tiers={tiers} />
    </>
  );
});

// Lazy wrapper: only mounts the Canvas when the card is in (or near) the viewport,
// so we never exceed the browser's WebGL context limit (~8-16 contexts).
const LazyPreviewScene = ({ sku }: { sku: any }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '150px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full">
      {inView && <PreviewScene sku={sku} />}
    </div>
  );
};

const PreviewScene = ({ sku }: { sku: any }) => {
  return (
    <Canvas
      className="w-full h-full"
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [250, 150, 400], fov: 35 }}
    >
      <Suspense fallback={null}>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1} />
        <ambientLight intensity={1.5} />
        <spotLight position={[100, 100, 100]} angle={0.15} penumbra={1} intensity={2} />
        <pointLight position={[-100, -100, -100]} intensity={0.5} />
        <Center top>
          <Rack
            length={sku.length}
            height={sku.height}
            wallDistance={sku.wallDistance}
            explode={0}
            hasShelves={sku.hasShelves}
            isFreestanding={sku.isFreestanding}
            colorOption={COLORS[sku.colorName || 'Raw grey']}
            skuType={sku.skuType || 'standard'}
            woodColor={sku.woodColor || 'Natural Oak'}
            tiers={sku.tiers || 4}
          />
        </Center>
      </Suspense>
    </Canvas>
  );
};



export { Scene, PreviewScene, LazyPreviewScene };
