/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useState, useEffect, useMemo, useRef, useDeferredValue } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrderDetailsView, getCutlistItems, calculatePrice, CutlistItem } from './OrderDetailsView';
import { OrbitControls, PerspectiveCamera, Html, View, Preload, Center } from '@react-three/drei';
import * as THREE from 'three';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { COLORS, WOOD_COLORS, ColorOption, getPipesForLength, getExtraCouplings, getEqualSplitPipes } from './utils';
import { fetchOrders, saveOrders } from './api';

// --- Components ---

const Navbar = ({ view, setView, ordersCount, currentSku, skuType, configSearch, setConfigSearch, onSearchSKU, syncStatus }: { view: string, setView: (v: any) => void, ordersCount: number, currentSku?: any, skuType?: string, configSearch?: string, setConfigSearch?: (v: string) => void, onSearchSKU?: () => void, syncStatus?: string }) => {
  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center gap-3 cursor-pointer w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3" onClick={() => setView('configurator')}>
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center min-w-[32px]">
            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight flex items-center gap-2 md:gap-4 flex-wrap">
            RackBuilder
            {view === 'configurator' && (
              <div className="flex items-center gap-2 border-l-2 border-gray-100 pl-2 md:pl-4">
                {currentSku && (
                  <div className="bg-emerald-100 text-emerald-700 px-2 md:px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider h-fit truncate max-w-[100px] md:max-w-none">
                    {currentSku.name}
                  </div>
                )}
                <div className="bg-gray-100 px-2 md:px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-wider h-fit">
                  {skuType}
                </div>
              </div>
            )}
          </span>
        </div>

        {view === 'configurator' && setConfigSearch && (
          <div className="relative w-full sm:w-auto sm:ml-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              type="text"
              placeholder="Search SKU..."
              value={configSearch}
              onChange={(e) => setConfigSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onSearchSKU) {
                  onSearchSKU();
                }
              }}
              className="w-full sm:w-48 lg:w-64 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-sm font-medium placeholder:font-normal placeholder:text-gray-400"
            />
          </div>
        )}
      </div>

      <div className="w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
        <nav className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 min-w-max">
          <button
            onClick={() => setView('library')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'library' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
            Library
          </button>
          <button
            onClick={() => setView('configurator')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'configurator' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><path d="M3 12h18" /><path d="m3 6 3-3 3 3" /><path d="m3 18 3 3 3-3" /><path d="m15 6 3-3 3 3" /><path d="m15 18 3 3 3-3" /></svg>
            Configurator
          </button>
          <button
            onClick={() => setView('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'orders' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            Orders
            {ordersCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${view === 'orders' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>
                {ordersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setView('inventory')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'inventory' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H4V4h16v16Z" /><path d="M4 9h16" /><path d="M4 15h16" /><path d="M10 4v16" /></svg>
            Inventory
          </button>
          <button
            onClick={() => setView('preparation')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'preparation' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /></svg>
            Preparation
          </button>
        </nav>
      </div>

      <div className="w-full md:w-auto flex justify-between md:justify-end items-center gap-3">
        {syncStatus && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
              syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' :
                syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'
              }`}></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {syncStatus === 'synced' ? 'Cloud Synced' :
                syncStatus === 'syncing' ? 'Syncing...' :
                  syncStatus === 'error' ? 'Sync Error' : 'Disconnected'}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};



const LabelContext = React.createContext({ size: 11, distance: 40 });

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

const Pipe = ({ start, end, radius = 1.6, showLabel, colorOption = COLORS['Raw grey'], overrideLabel }: { start: [number, number, number], end: [number, number, number], radius?: number, showLabel?: boolean, colorOption?: ColorOption, overrideLabel?: string }) => {
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
            {showLabel && <Label text={overrideLabel ? overrideLabel : `${pipeLen.toFixed(1)} cm`} type="pipe" lineClass="h-8" />}
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
        <cylinderGeometry args={[1.65, 1.65, 4.8, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Top Collar */}
      <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Bottom Collar */}
      <mesh castShadow receiveShadow position={[0, -2.2, 0]}>
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
        <cylinderGeometry args={[1.65, 1.65, 4.8, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.65, 1.65, 4.8, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* 4 Collars for the 4 sockets */}
      <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -2.2, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[-2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="Cross Fitting" type="fitting" lineClass="h-20" />}
    </group>
  );
};

const FiveWayFitting = ({ position, rotation = [0, 0, 0], showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.75, 16, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Top/Bottom (Y axis) */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.65, 1.65, 4.8, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Front/Back (Z axis) */}
      <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 4.8, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {/* Side Branch (X axis) */}
      <mesh castShadow receiveShadow position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.65, 1.65, 2.4, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>

      {/* 5 Collars */}
      <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -2.2, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="5-Way Fitting" type="fitting" lineClass="h-20" />}
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
        <cylinderGeometry args={[1.65, 1.65, 4.8, 16]} />
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
      <mesh castShadow receiveShadow position={[2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[-2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
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
      {showLabel && <Label text="End Cap" type="fitting" lineClass="h-8" />}
    </group>
  );
};

const Reducer = ({ position, rotation = [0, 0, 0], showLabel, colorOption = COLORS['Raw grey'] }: { position: [number, number, number], rotation?: [number, number, number], showLabel?: boolean, colorOption?: ColorOption }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow position={[0, -1.0, 0]}>
        <cylinderGeometry args={[1.65, 3.5, 3.0, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.95, 1.95, 0.7, 16]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -2.5, 0]}>
        <cylinderGeometry args={[3.7, 3.7, 0.5, 24]} />
        <meshStandardMaterial color={colorOption.fittingColor} metalness={colorOption.metalness + 0.2} roughness={colorOption.roughness - 0.1} />
      </mesh>
      {showLabel && <Label text="Reducer" type="fitting" lineClass="h-10" />}
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

const Rack = ({ length, height, wallDistance, explode, hasShelves = true, isFreestanding = false, colorOption = COLORS['Raw grey'], skuType = 'standard', woodColor = 'Natural Oak', tiers = 4, tubeType = 'round' }: { length: number, height: number, wallDistance: number, explode: number, hasShelves?: boolean, isFreestanding?: boolean, colorOption?: ColorOption, skuType?: 'standard' | 'sku777' | 'sku000' | 'sku100' | 'sku200' | 'sku102' | 'sku103' | 'sku104' | 'sku4210' | 'sku300' | 'sku105' | 'sku106' | 'sku107' | 'sku108' | 'sku109' | 'sku110' | 'sku111' | 'sku112' | 'sku113' | 'sku114' | 'sku115' | 'sku116' | 'sku117' | 'sku118' | 'sku119' | 'sku120' | 'sku121' | 'sku122' | 'sku123' | 'sku124' | 'sku125' | 'sku126' | 'sku127' | 'sku128' | 'sku129' | 'sku130' | 'sku131' | 'sku132' | 'sku133' | 'sku134' | 'sku135' | 'sku136' | 'sku137' | 'sku138' | 'sku140' | 'sku141' | 'sku142' | 'sku143' | 'sku144' | 'sku145' | 'sku146' | 'sku147' | 'sku148' | 'sku149' | 'sku150' | 'sku151' | 'sku152' | 'sku153' | 'sku154' | 'sku155' | 'sku156' | 'sku157' | 'sku158' | 'sku159' | 'sku160' | 'sku161' | 'sku162' | 'sku163' | 'sku164' | 'sku165' | 'sku166' | 'sku167' | 'sku168' | 'sku169' | 'sku170' | 'sku171' | 'sku172' | 'sku173' | 'sku174' | 'sku175' | 'sku176' | 'sku177' | 'sku178' | 'sku888', woodColor?: string, tiers?: number, tubeType?: 'round' | 'square' }) => {
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

  if (skuType === 'sku156' || skuType === 'sku157') {
    const e = explode * 1.5;
    const numRails = Math.max(2, tiers || 3);
    const shelfDepth = 23;
    const zFront = shelfDepth / 2 - 3.5;
    const zBack = -shelfDepth / 2 + 3.5;
    const leftX = -(length / 2) + 12;
    const rightX = (length / 2) - 12;

    const shelfSpacing = 26; // Approx 23cm + flanges
    const baseHeight = 9.5; // Reducer/Flange + Pipe + Flange
    const bottomY = 0;

    const totalHeight = baseHeight + 1.5 + ((numRails - 1) * shelfSpacing);

    const getEY = (i: number) => {
      const maxIdx = numRails - 1;
      if (maxIdx === 0) return 0;
      return ((i / maxIdx) * 2 - 1) * e * 0.5;
    };

    const buildFoot = (x: number, z: number, isLeft: boolean, isFront: boolean) => {
      const xExp = isLeft ? -e : e;
      const zExp = isFront ? e : -e;
      const eY = getEY(0); // bottom feet explode calculation
      return (
        <group key={`foot-${x}-${z}`} position={[xExp, bottomY - totalHeight / 2 + eY, z + zExp * 0.5]}>
          {skuType === 'sku157' ? (
            <Reducer position={[x, 2.5, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          ) : (
            <Flange position={[x, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          )}
          <Pipe start={[x, skuType === 'sku157' ? 3.0 : 1.2, 0]} end={[x, 8.0, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Flange position={[x, 9.5, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      );
    }

    const buildPole = (x: number, isLeft: boolean) => {
      const xExp = isLeft ? -e : e;
      let parts = [];
      for (let i = 0; i < numRails - 1; i++) {
        const tierY = bottomY - totalHeight / 2 + baseHeight + 1.5 + (i * shelfSpacing);
        const eY = getEY(i + 1); // pole explodes with the upper tier
        parts.push(
          <group key={`pole-${i}-${x}`} position={[xExp, tierY + eY * 0.9, 0]}> {/* slightly offset explode to show joint */}
            <Flange position={[x, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            <Pipe start={[x, 1.2, 0]} end={[x, 24.5, 0]} showLabel={showLabel} colorOption={colorOption} />
            <Flange position={[x, 26, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        );
      }
      return parts;
    };

    return (
      <group position={[0, 0, 0]}>
        {/* 4 Bottom Feet */}
        {buildFoot(leftX, zFront, true, true)}
        {buildFoot(leftX, zBack, true, false)}
        {buildFoot(rightX, zFront, false, true)}
        {buildFoot(rightX, zBack, false, false)}

        {/* 2 Middle Pillars */}
        {buildPole(leftX, true)}
        {buildPole(rightX, false)}

        {hasShelves && Array.from({ length: numRails }).map((_, i) => {
          const tierY = bottomY - totalHeight / 2 + baseHeight + (i * shelfSpacing);
          const eY = getEY(i);
          return (
            <group key={`shelf-${i}`} position={[0, tierY + 0.75 + eY, 0]}>
              <Shelf position={[0, 0, 0]} length={length} depth={shelfDepth} woodColor={woodColor} highlightFront={true} />
            </group>
          );
        })}
      </group>
    );
  }

  if (skuType === 'sku152') {
    const e = explode * 1.5;
    const poleLength = 15;

    return (
      <group position={[0, 1.4, 0]}>
        {/* Wall branch moves linearly backward toward the wall */}
        <group position={[0, 0, -e]}>
          <Flange position={[0, 0, -5.0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          {/* 5cm pipe connects Flange socket (-3.8) to Elbow 1 back socket (-1.2) */}
          <Pipe start={[0, 0, -3.8]} end={[0, 0, -1.2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Elbow 1 serves as the static anchor point */}
        <group position={[0, 0, 0]}>
          <Elbow position={[0, 0, 0]} rotation={[0, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Hex Nipple drops down out of Elbow 1 */}
        <group position={[0, -e * 0.5, 0]}>
          <HexNipple position={[0, -2.9, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Elbow 2 drops down out of Hex Nipple */}
        {/* Center is at -5.8 because its UP socket reaches to -5.8 + 2.4 = -3.4 */}
        <group position={[0, -e, 0]}>
          <Elbow position={[0, -5.8, 0]} rotation={[0, Math.PI / 2, Math.PI]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Horizontal 15cm pole drops with Elbow 2 AND moves right out of Elbow 2 */}
        <group position={[e, -e, 0]}>
          <Pipe start={[1.2, -5.8, 0]} end={[1.2 + poleLength, -5.8, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* End cap drops with Elbow 2, moves right with pole, and pushes further right out of the pole */}
        <group position={[e * 2, -e, 0]}>
          <EndCap position={[1.2 + poleLength, -5.8, 0]} rotation={[0, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku153' || skuType === 'sku154') {
    const e = explode * 1.5;
    const isPackOf4 = skuType === 'sku153';

    const legPositions = isPackOf4
      ? [[-15, 0, -15], [15, 0, -15], [-15, 0, 15], [15, 0, 15]]
      : [[0, 0, 0]];

    return (
      <group position={[0, 0, 0]}>
        {legPositions.map(([x, y, z], i) => (
          <group key={`leg-${i}`} position={[x, y, z]}>
            <group position={[0, -e, 0]}>
              <Flange position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel && i === 0} colorOption={colorOption} />
            </group>
            <Pipe start={[0, 1.2, 0]} end={[0, length + 1.2, 0]} showLabel={showLabel && i === 0} colorOption={colorOption} />
            <group position={[0, e, 0]}>
              <Flange position={[0, length + 2.4, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel && i === 0} colorOption={colorOption} />
            </group>
          </group>
        ))}
      </group>
    );
  }


  if (skuType === 'sku155') {
    // Wall-mounted double rail with unions
    const e = explode * 1.5;
    const leftX = -(length / 2) + 5;
    const rightX = (length / 2) - 5;

    // Fixed depth structure
    const wallZ = -10;
    const zTee = wallZ + 11.2; // exactly 10cm pipe + flange (+1.2 into fitting limit)
    const zUnion = zTee + 4.8; // Exact spacing for Hex Nipples
    const zElbow = zUnion + 4.8;

    const buildSupport = (x: number, isLeft: boolean) => {
      const expX = isLeft ? -e : e;

      const rotTee: [number, number, number] = isLeft
        ? [-Math.PI / 2, -Math.PI / 2, 0]
        : [-Math.PI / 2, Math.PI / 2, 0];

      const rotElbow: [number, number, number] = isLeft
        ? [Math.PI / 2, Math.PI / 2, 0]
        : [Math.PI / 2, -Math.PI / 2, 0];

      return (
        <group key={`support-${x}`}>
          <group position={[expX, 0, -e * 1.5]}>
            <Flange position={[x, 0, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[expX, 0, -e * 1.0]}>
            <Pipe start={[x, 0, wallZ + 0.5]} end={[x, 0, zTee - 1.2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[expX, 0, -e * 0.5]}>
            <TFitting position={[x, 0, zTee]} rotation={rotTee} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[expX, 0, 0]}>
            <HexNipple position={[x, 0, (zTee + zUnion) / 2]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[expX, 0, e * 0.5]}>
            <Union position={[x, 0, zUnion]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[expX, 0, e * 1.0]}>
            <HexNipple position={[x, 0, (zUnion + zElbow) / 2]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[expX, 0, e * 1.5]}>
            <Elbow position={[x, 0, zElbow]} rotation={rotElbow} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      );
    };

    return (
      <group position={[0, 0, 0]}>
        {buildSupport(leftX, true)}
        {buildSupport(rightX, false)}

        {/* Horizontal Rail 1 */}
        <group position={[0, 0, -e * 0.5]}>
          <Pipe start={[leftX + 1.2, 0, zTee]} end={[rightX - 1.2, 0, zTee]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Horizontal Rail 2 */}
        <group position={[0, 0, e * 1.5]}>
          <Pipe start={[leftX + 1.2, 0, zElbow]} end={[rightX - 1.2, 0, zElbow]} showLabel={showLabel} colorOption={colorOption} />
        </group>
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
    // Exact requested adjustments for drawing visually perfectly
    const adjLength = length - 10;
    const adjHeight = height - 5;
    const adjWallDistance = wallDistance - 5;

    const lX = -adjLength / 2;
    const rX = adjLength / 2;

    const e = explode * 1.5;
    const topY = adjHeight / 2;
    const bottomY = -adjHeight / 2;

    const frontZ = 0;
    const wallZ = -adjWallDistance;

    const buildLeg = (x: number, isLeft: boolean) => {
      const eX = isLeft ? -e : e;
      return (
        <group position={[eX, 0, 0]}>
          <group position={[0, -e, 0]}>
            <Flange position={[x, bottomY, frontZ]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, -e * 0.5, 0]}>
            <Pipe start={[x, bottomY, frontZ]} end={[x, topY, frontZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      );
    };

    return (
      <group>
        {buildLeg(lX, true)}
        {buildLeg(rX, false)}

        {/* LEFT TOP: CornerFitting */}
        <group position={[-e, e * 0.5, 0]}>
          <CornerFitting position={[lX, topY, frontZ]} side="left" rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Left wall arm */}
        <group position={[-e, e * 0.5, -e * 0.5]}>
          <Pipe start={[lX, topY, frontZ]} end={[lX, topY, wallZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-e, e * 0.5, -e]}>
          <Flange position={[lX, topY, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* RIGHT TOP: CornerFitting */}
        <group position={[e, e * 0.5, 0]}>
          <CornerFitting position={[rX, topY, frontZ]} side="right" rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Right wall arm */}
        <group position={[e, e * 0.5, -e * 0.5]}>
          <Pipe start={[rX, topY, frontZ]} end={[rX, topY, wallZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[e, e * 0.5, -e]}>
          <Flange position={[rX, topY, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Horizontal rail */}
        <group position={[0, e * 0.5, 0]}>
          <Pipe start={[lX, topY, frontZ]} end={[rX, topY, frontZ]} showLabel={showLabel} colorOption={colorOption} />
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
    const is142 = skuType === 'sku142';
    const e = explode * 1.5;
    // user requested 23cm pole for SKU 142 (so wallDistance is ~25.7)
    const bracketZ = is142 ? -25.7 : -wallDistance;
    const railZ = 0;
    const leftX = -(length / 2);
    const rightX = (length / 2);

    return (
      <group position={[0, height / 2, bracketZ / 2]}>
        {/* Left Arm */}
        <group position={[-e, 0, -e]}>
          <Flange position={[leftX + 2.2, 0, bracketZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-e, 0, -e * 0.5]}>
          <Pipe start={[leftX + 2.2, 0, bracketZ + 1.2]} end={[leftX + 2.2, 0, railZ - 1.5]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-e, 0, 0]}>
          <Elbow position={[leftX + 2.2, 0, railZ]} rotation={[0, Math.PI, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Right Arm */}
        <group position={[e, 0, -e]}>
          <Flange position={[rightX - 2.2, 0, bracketZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[e, 0, -e * 0.5]}>
          <Pipe start={[rightX - 2.2, 0, bracketZ + 1.2]} end={[rightX - 2.2, 0, railZ - 1.5]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[e, 0, 0]}>
          <Elbow position={[rightX - 2.2, 0, railZ]} rotation={[0, Math.PI, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Horizontal Rail */}
        <group position={[0, 0, 0]}>
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
    const leftX = -(length / 2) - 1.5;
    const rightX = (length / 2) + 1.5;
    const zBase = -wallDistance;
    const zRail = zBase + wallDistance; // Usually 0

    const bottomY = 15;
    const vertLength = 23;
    const topY = bottomY + (numRails - 1) * vertLength;

    const getEY = (i: number) => {
      const maxIdx = numRails - 1;
      if (maxIdx === 0) return 0;
      const normalized = (i / maxIdx) * 2 - 1;
      return normalized * e * 0.5;
    };

    // Draw horizontal wall pipes and flanges
    const drawSupports = (x: number, isLeft: boolean) => {
      let parts = [];
      const xExp = isLeft ? -e : e;
      for (let i = 0; i < numRails; i++) {
        const y = bottomY + i * vertLength;
        const eY = getEY(i);
        parts.push(
          <group key={`supp-${i}-${isLeft}`} position={[xExp, y + eY, -e]}>
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
        <group key={`c-bot-${isLeft}`} position={[xExp, bottomY + getEY(0), e]}>
          <CornerFitting position={[x, 0, zRail]} rotation={[0, 0, isLeft ? Math.PI / 2 : -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} side={isLeft ? 'left' : 'right'} />
        </group>
      );

      // Verticals between rails
      for (let i = 0; i < numRails - 1; i++) {
        const yStart = bottomY + i * vertLength;
        const yEnd = bottomY + (i + 1) * vertLength;
        const eY1 = getEY(i);
        const eY2 = getEY(i + 1);
        const eYMid = (eY1 + eY2) / 2;

        parts.push(
          <group key={`vert-${i}-${isLeft}`} position={[xExp, 0, e]}>
            <Pipe start={[x, yStart + 1.5 + eYMid, zRail]} end={[x, yEnd - 1.5 + eYMid, zRail]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        );

        // Fitting at yEnd (which is a T-fitting unless it's top and we wanted something else)
        if (i < numRails - 2) {
          parts.push(
            <group key={`t-${i + 1}-${isLeft}`} position={[xExp, yEnd + getEY(i + 1), e]}>
              <TFitting position={[x, 0, zRail]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          );
        }
      }

      // Fitting at topY
      parts.push(
        <group key={`t-top-${isLeft}`} position={[xExp, topY + getEY(numRails - 1), e]}>
          <TFitting position={[x, 0, zRail]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          {/* Top stub */}
          <Pipe start={[x, 1.5 + e * 0.2, zRail]} end={[x, 5 - 1.0 + e * 0.2, zRail]} showLabel={showLabel} colorOption={colorOption} />
          <EndCap position={[x, 5 + e * 0.4, zRail]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
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
        <group position={[0, bottomY + getEY(0), e]}>
          <Pipe start={[leftX + 1.5, 0, zRail]} end={[rightX - 1.5, 0, zRail]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Shelves for all tiers except bottom rail */}
        {hasShelves && Array.from({ length: numRails - 1 }).map((_, i) => {
          const tierIdx = i + 1;
          const y = bottomY + tierIdx * vertLength;
          const eY = getEY(tierIdx);
          return (
            <group key={`shelf-${i}`} position={[0, y + 1.5 + eY + e * 0.4, -e * 0.5]}>
              <Shelf position={[0, 0, zBase / 2]} length={length} depth={wallDistance} woodColor={woodColor} />
            </group>
          );
        })}
      </group>
    );
  }

  if (skuType === 'sku158') {
    const e = explode * 1.5;
    const zWallSurface = -wallDistance;
    // Exactly center the 23cm shelf (23 / 2 = 11.5)
    const zTee = zWallSurface + 11.5;
    const zElbow = 0;
    const yTee = 0;
    // 5cm pipe means collars (1.5 + 1.0) + pipe (5.0) = 7.5cm total height
    const yFlangeTop = yTee + 7.5;

    return (
      <group position={[0, -height / 2 + 10, 0]}>
        {/* Left Side */}
        <group position={[leftX + 3.5, 0, 0]}>
          <group position={[0, 0, -e]}>
            <Flange position={[0, yTee, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[0, yTee, zWallSurface + 1.5]} end={[0, yTee, zTee - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, 0]}>
            <TFitting position={[0, yTee, zTee]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 0.5, 0]}>
            <Pipe start={[0, yTee + 1.5, zTee]} end={[0, yFlangeTop - 1.0, zTee]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 1.0, 0]}>
            <Flange position={[0, yFlangeTop, zTee]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, e * 0.5]}>
            <Pipe start={[0, yTee, zTee + 1.5]} end={[0, yTee, zElbow - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, e * 1.0]}>
            <Elbow position={[0, yTee, zElbow]} rotation={[0, Math.PI, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* Right Side */}
        <group position={[rightX - 3.5, 0, 0]}>
          <group position={[0, 0, -e]}>
            <Flange position={[0, yTee, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[0, yTee, zWallSurface + 1.5]} end={[0, yTee, zTee - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, 0]}>
            <TFitting position={[0, yTee, zTee]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 0.5, 0]}>
            <Pipe start={[0, yTee + 1.5, zTee]} end={[0, yFlangeTop - 1.0, zTee]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, e * 1.0, 0]}>
            <Flange position={[0, yFlangeTop, zTee]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, e * 0.5]}>
            <Pipe start={[0, yTee, zTee + 1.5]} end={[0, yTee, zElbow - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, e * 1.0]}>
            <Elbow position={[0, yTee, zElbow]} rotation={[0, Math.PI, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* Horizontal Bar */}
        <group position={[0, 0, e * 1.0]}>
          <Pipe start={[leftX + 3.5 + 1.5, yTee, zElbow]} end={[rightX - 3.5 - 1.5, yTee, zElbow]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Shelf */}
        {hasShelves && (
          <group position={[0, e * 1.5, 0]}>
            <Shelf position={[0, yFlangeTop, zWallSurface + 11.5]} length={length} depth={23} woodColor={woodColor} highlightFront={false} />
          </group>
        )}
      </group>
    );
  }

  if (skuType === 'sku159') {
    const e = explode * 1.5;

    const zElbow = 0;
    const zWallSurface = -33.4;
    const yTee = 0;

    const split = getPipesForLength(Math.max(0, length - 25));
    const L_pipes = split.reduce((a, b) => a + b, 0);

    const leftTx = -(L_pipes + 3.6) / 2;
    const rightTx = (L_pipes + 3.6) / 2;

    const lX = leftTx - 5.0;
    const rX = rightTx + 5.0;

    const eZ = zWallSurface + 4.4; // 1.2 flange + 3.2 nipple = 4.4
    const eY = eZ;

    const diagTopY = yTee - 1.556;
    const diagTopZ = zElbow - 1.556;

    const diagBotY = eY + 1.414;
    const diagBotZ = eZ + 1.414;

    return (
      <group position={[0, -height / 2 + 10, 0]}>
        {/* Left Side */}
        <group position={[-e, 0, 0]}>
          <group position={[0, 0, -e]}>
            <Flange position={[lX, yTee, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[lX, yTee, zWallSurface + 1.5]} end={[lX, yTee, zElbow - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, 0]}>
            <Elbow position={[lX, yTee, zElbow]} rotation={[0, Math.PI, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          <group position={[e * 0.25, 0, 0]}>
            <Pipe start={[lX + 1.5, yTee, zElbow]} end={[leftTx - 1.5, yTee, zElbow]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[e * 0.5, 0, 0]}>
            <TFitting position={[leftTx, yTee, zElbow]} rotation={[-Math.PI / 4, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          <group position={[e * 0.5, -e * 0.5, -e * 0.5]}>
            <Pipe start={[leftTx, diagTopY, diagTopZ]} end={[leftTx, diagBotY, diagBotZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[e * 0.5, -e * 1.0, -e * 1.0]}>
            <FortyFiveElbow position={[leftTx, eY, eZ]} rotation={[Math.PI / 2, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[e * 0.5, -e * 1.2, -e * 1.5]}>
            <HexNipple position={[leftTx, eY, zWallSurface + 1.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[e * 0.5, -e * 1.5, -e * 2.0]}>
            <Flange position={[leftTx, eY, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* Right Side */}
        <group position={[e, 0, 0]}>
          <group position={[0, 0, -e]}>
            <Flange position={[rX, yTee, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, -e * 0.5]}>
            <Pipe start={[rX, yTee, zWallSurface + 1.5]} end={[rX, yTee, zElbow - 1.5]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, 0, 0]}>
            <Elbow position={[rX, yTee, zElbow]} rotation={[0, Math.PI, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          <group position={[-e * 0.25, 0, 0]}>
            <Pipe start={[rightTx + 1.5, yTee, zElbow]} end={[rX - 1.5, yTee, zElbow]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[-e * 0.5, 0, 0]}>
            <TFitting position={[rightTx, yTee, zElbow]} rotation={[-Math.PI / 4, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          <group position={[-e * 0.5, -e * 0.5, -e * 0.5]}>
            <Pipe start={[rightTx, diagTopY, diagTopZ]} end={[rightTx, diagBotY, diagBotZ]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[-e * 0.5, -e * 1.0, -e * 1.0]}>
            <FortyFiveElbow position={[rightTx, eY, eZ]} rotation={[Math.PI / 2, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[-e * 0.5, -e * 1.2, -e * 1.5]}>
            <HexNipple position={[rightTx, eY, zWallSurface + 1.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
          <group position={[0, -e * 1.5, -e * 2.0]}>
            <Flange position={[rightTx, eY, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>

        {/* Horizontal Bar */}
        <group position={[0, 0, 0]}>
          {(() => {
            const hPipes = split;
            const railL_base = leftTx + 1.8;

            let currentX = railL_base;
            return hPipes.map((pLen, idx) => {
              const startX = currentX;
              const endX = currentX + pLen;
              currentX = endX;

              const xLeft = startX + (idx > 0 ? e : 0);
              const xRight = endX - (idx < hPipes.length - 1 ? e : 0);

              return (
                <group key={`h-${idx}`}>
                  <Pipe start={[xLeft, yTee, zElbow]} end={[xRight, yTee, zElbow]} showLabel={showLabel} colorOption={colorOption} />
                  {idx < hPipes.length - 1 && (
                    <Coupling position={[endX, yTee, zElbow]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
                  )}
                </group>
              );
            });
          })()}
        </group>
      </group>
    );
  }

  if (skuType === 'sku160') {
    const e = explode * 1.5;

    const zElbow = 0;
    const zWallSurface = -33.0; // Math constraint guaranteeing 30.0cm side poles
    const yTee = 0;

    let numSegments = 2; // Always at least 1 middle bracket required
    while ((length - 15) / numSegments > 120) {
      numSegments++;
    }
    const split = getEqualSplitPipes(Math.max(0, length - 15), numSegments);

    const bracketX: number[] = [0];
    for (let i = 0; i < split.length; i++) {
      bracketX.push(bracketX[i] + split[i] + 3.6);
    }
    const totalWidth = bracketX[bracketX.length - 1];
    const offsetX = -totalWidth / 2;
    for (let i = 0; i < bracketX.length; i++) {
      bracketX[i] += offsetX;
    }

    // Exact Mathematical Precision for 35cm pole
    const diagTopY = yTee + 1.556;
    const diagTopZ = zElbow - 1.556;
    const delta = 35 / Math.SQRT2; // 24.7487 for a strict 35cm angled pipe

    const diagBotY = diagTopY + delta;
    const diagBotZ = diagTopZ - delta;

    const eY = diagBotY + 1.414;
    const eZ = diagBotZ - 1.414;

    const nippleZ = eZ - 3.6; // Anchor Nipple center precisely to elbow downward 2.0 extension
    const flangeZ = eZ - 5.7; // Anchor Flange center precisely to back of Nipple

    const getBracketExplode = (i: number) => bracketX.length === 1 ? 0 : (-e * 0.5) + (i / (bracketX.length - 1)) * e;

    return (
      <group position={[0, -height / 2 + 10, 0]}>
        {bracketX.map((bx, idx) => {
          const isLeft = idx === 0;
          const isRight = idx === bracketX.length - 1;
          const isMiddle = !isLeft && !isRight;
          const groupX = getBracketExplode(idx);
          const lX = isLeft ? bx - 5.0 : bx;
          const rX = isRight ? bx + 5.0 : bx;

          return (
            <group key={`bracket-${idx}`}>
              {/* Straight Mount (Left Only) - 90 deg elbow */}
              {isLeft && (
                <group position={[groupX - e * 0.5, 0, 0]}>
                  <group position={[0, 0, -e * 1.5]}>
                    <Flange position={[lX, yTee, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, 0, -e * 0.5]}>
                    <Pipe start={[lX, yTee, zWallSurface + 1.5]} end={[lX, yTee, zElbow - 1.5]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, 0, e * 0.5]}>
                    <Elbow position={[lX, yTee, zElbow]} rotation={[0, Math.PI, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              )}

              {/* Straight Mount (Right Only) - 90 deg elbow */}
              {isRight && (
                <group position={[groupX + e * 0.5, 0, 0]}>
                  <group position={[0, 0, -e * 1.5]}>
                    <Flange position={[rX, yTee, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, 0, -e * 0.5]}>
                    <Pipe start={[rX, yTee, zWallSurface + 1.5]} end={[rX, yTee, zElbow - 1.5]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, 0, e * 0.5]}>
                    <Elbow position={[rX, yTee, zElbow]} rotation={[0, Math.PI, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              )}

              {/* Middle Diagonal Mounts (Middle Only) */}
              {isMiddle && (
                <group position={[groupX, 0, 0]}>
                  <group position={[0, 0, e * 0.5]}>
                    <TFitting position={[bx, yTee, zElbow]} rotation={[Math.PI / 4, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, e * 0.5, e * 0.5 - e * 0.5]}>
                    <Pipe start={[bx, diagTopY, diagTopZ]} end={[bx, diagBotY, diagBotZ]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, e * 1.0, e * 0.5 - e * 1.0]}>
                    <FortyFiveElbow position={[bx, eY, eZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, e * 1.0, e * 0.5 - e * 1.5]}>
                    <HexNipple position={[bx, eY, nippleZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, e * 1.0, e * 0.5 - e * 2.0]}>
                    <Flange position={[bx, eY, flangeZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              )}
            </group>
          );
        })}

        {/* Horizontal Bars */}
        <group position={[0, 0, 0]}>
          {split.map((pLen, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === split.length - 1;

            const lX = bracketX[idx];
            const rX = bracketX[idx + 1];

            // Outer brackets have a 90 deg elbow (-1.5 clearance + -5.0 offset earlier) -> length adjusts based on inner/outer
            const startX = isFirst ? lX - 5.0 + 1.5 : lX + 1.8;
            const endX = isLast ? rX + 5.0 - 1.5 : rX - 1.8;
            const explX = (getBracketExplode(idx) + getBracketExplode(idx + 1)) / 2;

            return (
              <group key={`h-${idx}`} position={[explX, 0, e * 1.0]}>
                <Pipe start={[startX, yTee, zElbow]} end={[endX, yTee, zElbow]} showLabel={showLabel} colorOption={colorOption} />
              </group>
            );
          })}
        </group>
      </group>
    );
  }

  if (skuType === 'sku161') {
    const e = explode * 1.5;

    const zElbow = 0;
    const zWallSurface = -33.4;
    const yTee = 0;

    let numSegments = 1;
    while ((length - (20 + numSegments * 5)) / numSegments > 120) {
      numSegments++;
    }
    const split = getEqualSplitPipes(Math.max(0, length - (20 + numSegments * 5)), numSegments);

    const bracketX: number[] = [0];
    for (let i = 0; i < split.length; i++) {
      bracketX.push(bracketX[i] + split[i] + 3.6);
    }
    const totalWidth = bracketX[bracketX.length - 1];
    const offsetX = -totalWidth / 2;
    for (let i = 0; i < bracketX.length; i++) {
      bracketX[i] += offsetX;
    }

    const eZ = zWallSurface + 4.4; // 1.2 flange + 3.2 nipple = 4.4
    const eY = eZ;

    const diagTopY = yTee - 1.556;
    const diagTopZ = zElbow - 1.556;

    const diagBotY = eY + 1.414;
    const diagBotZ = eZ + 1.414;

    const getBracketExplode = (i: number) => bracketX.length === 1 ? 0 : (-e * 0.5) + (i / (bracketX.length - 1)) * e;

    return (
      <group position={[0, -height / 2 + 10, 0]}>
        {bracketX.map((bx, idx) => {
          const isLeft = idx === 0;
          const isRight = idx === bracketX.length - 1;
          const groupX = getBracketExplode(idx);
          const lX = isLeft ? bx - 5.0 : bx;
          const rX = isRight ? bx + 5.0 : bx;

          return (
            <group key={`bracket-${idx}`}>
              {/* Straight Mount (Left Only) */}
              {isLeft && (
                <group position={[groupX - e * 0.5, 0, 0]}>
                  <group position={[0, 0, -e * 1.5]}>
                    <Flange position={[lX, yTee, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, 0, -e * 0.5]}>
                    <Pipe start={[lX, yTee, zWallSurface + 1.5]} end={[lX, yTee, zElbow - 1.5]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, 0, e * 0.5]}>
                    <Elbow position={[lX, yTee, zElbow]} rotation={[0, Math.PI, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[e * 0.25, 0, e * 0.5]}>
                    <Pipe start={[lX + 1.5, yTee, zElbow]} end={[bx - 1.5, yTee, zElbow]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              )}

              {/* Straight Mount (Right Only) */}
              {isRight && (
                <group position={[groupX + e * 0.5, 0, 0]}>
                  <group position={[0, 0, -e * 1.5]}>
                    <Flange position={[rX, yTee, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, 0, -e * 0.5]}>
                    <Pipe start={[rX, yTee, zWallSurface + 1.5]} end={[rX, yTee, zElbow - 1.5]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[0, 0, e * 0.5]}>
                    <Elbow position={[rX, yTee, zElbow]} rotation={[0, Math.PI, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                  <group position={[-e * 0.25, 0, e * 0.5]}>
                    <Pipe start={[bx + 1.5, yTee, zElbow]} end={[rX - 1.5, yTee, zElbow]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                </group>
              )}

              {/* T-Fitting and Angled Mount (All Brackets) */}
              <group position={[groupX, 0, e * 0.5]}>
                <TFitting position={[bx, yTee, zElbow]} rotation={[-Math.PI / 4, 0, isLeft ? -Math.PI / 2 : (isRight ? Math.PI / 2 : -Math.PI / 2)]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              <group position={[groupX, -e * 0.5, e * 0.5 - e * 0.5]}>
                <Pipe start={[bx, diagTopY, diagTopZ]} end={[bx, diagBotY, diagBotZ]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              <group position={[groupX, -e * 1.0, e * 0.5 - e * 1.0]}>
                <FortyFiveElbow position={[bx, eY, eZ]} rotation={[Math.PI / 2, Math.PI, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              <group position={[groupX, -e * 1.0, e * 0.5 - e * 1.5]}>
                <HexNipple position={[bx, eY, zWallSurface + 1.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              <group position={[groupX, -e * 1.0, e * 0.5 - e * 2.0]}>
                <Flange position={[bx, eY, zWallSurface + 0.5]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
            </group>
          );
        })}

        {/* Horizontal Bars */}
        <group position={[0, 0, 0]}>
          {split.map((pLen, idx) => {
            const startX = bracketX[idx] + 1.8;
            const endX = bracketX[idx + 1] - 1.8;
            const explX = (getBracketExplode(idx) + getBracketExplode(idx + 1)) / 2;

            return (
              <group key={`h-${idx}`} position={[explX, 0, e * 1.0]}>
                <Pipe start={[startX, yTee, zElbow]} end={[endX, yTee, zElbow]} showLabel={showLabel} colorOption={colorOption} />
              </group>
            );
          })}
        </group>
      </group>
    );
  }

  if (skuType === 'sku162') {
    return (
      <group position={[0, height / 2, 0]}>
        <Shelf position={[0, -1.5, 0]} length={length} depth={wallDistance} woodColor={woodColor} highlightFront={true} />
      </group>
    );
  }

  if (skuType === 'sku163' || skuType === 'sku164') {
    const e = explode * 1.5;
    return (
      <group position={[0, -height / 2, 0]}>
        <group position={[0, e, 0]}>
          <Shelf position={[0, height + 1.5, 0]} length={length} depth={wallDistance} woodColor={woodColor} highlightFront={true} />
        </group>
        <group position={[-e, 0, 0]}>
          <Flange position={[-(length / 2) + 5, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Pipe start={[-(length / 2) + 5, 1.2, 0]} end={[-(length / 2) + 5, height - 1.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Flange position={[-(length / 2) + 5, height, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[e, 0, 0]}>
          <Flange position={[(length / 2) - 5, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Pipe start={[(length / 2) - 5, 1.2, 0]} end={[(length / 2) - 5, height - 1.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Flange position={[(length / 2) - 5, height, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku167') {
    const e = explode * 1.5;
    const zWall = -(length / 2) - 1.2;
    return (
      <group position={[0, height / 2, 0]}>
        <group position={[0, 0, -e]}>
          <Flange position={[0, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, 0, 0]}>
          <Pipe start={[0, 0, zWall + 1.2]} end={[0, 0, zWall + 1.2 + length]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, 0, e]}>
          <Flange position={[0, 0, zWall + 1.2 + length]} rotation={[-Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku172') {
    const e = explode * 1.5;
    const zWall = -wallDistance;
    return (
      <group position={[0, height / 2, 0]}>
        <group position={[0, 0, -e]}>
          <Flange position={[0, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, 0, 0]}>
          <Pipe start={[0, 0, zWall + 1.2]} end={[0, 0, zWall + 1.2 + length]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, 0, e]}>
          <EndCap position={[0, 0, zWall + 1.2 + length]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku174') {
    const e = explode * 1.5;
    // We add 2.7 because the flange clips 1.2 and the elbow clips 1.5. 
    // This allows the visual pipe distance to span exactly `length` mathematically.
    const pipeLength = Math.max(0.1, length + 2.7);
    const zWall = -pipeLength;

    return (
      <group position={[0, height / 2, pipeLength / 2]}>
        <group position={[0, 0, -e]}>
          <Flange position={[0, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, 0, 0]}>
          <Pipe start={[0, 0, zWall + 1.2]} end={[0, 0, -1.5]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, 0, e]}>
          <Elbow position={[0, 0, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, e * 0.5, e]}>
          <HexNipple position={[0, 2.7, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, e * 1.5, e]}>
          <EndCap position={[0, 4.2, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku143' || skuType === 'sku169') {
    // Brackets every 120cm max (matching max pipe length)
    const numMounts = Math.max(2, Math.ceil(length / 120) + 1);
    const e = explode * 1.5;
    const wallZ = -8;          // wall face position in Z
    const railZ = wallZ + 5;   // rail at 5cm out from wall (Z = -3)

    const startX = -length / 2;
    const endX = length / 2;
    const startY = height / 2;   // high end (top of stairs)
    const endY = -height / 2;   // low end (bottom of stairs)

    const isThin = tubeType === 'square';
    const railRad = isThin ? 1.35 : 1.65;

    // Slope angle θ of the rail in the XY plane
    const θ = Math.atan2(endY - startY, endX - startX);

    // Wall bracket alignment: 
    // They extend straight down exactly perpendicular to the slope θ.
    const perpDirX = Math.sin(θ);
    const perpDirY = -Math.cos(θ);

    const startElbowRot: [number, number, number] = [0, Math.PI / 2, θ];
    const endElbowRot: [number, number, number] = [0, -Math.PI / 2, θ];
    const tFitRot: [number, number, number] = [0, -Math.PI / 2, θ - Math.PI / 2];
    const perpNippleRot: [number, number, number] = [0, 0, θ - Math.PI];
    const baseElbowRot: [number, number, number] = [0, Math.PI, θ - Math.PI];

    return (
      <group position={[0, height / 2, -wallZ / 2]}>
        {/* --- Wall Brackets --- */}
        {Array.from({ length: numMounts }).map((_, i) => {
          const t = i / (numMounts - 1);
          const mx = startX + t * (endX - startX);
          const my = startY + t * (endY - startY);

          const isFirst = i === 0;
          const isLast = i === numMounts - 1;

          const nx = mx + 2.7 * perpDirX;
          const ny = my + 2.7 * perpDirY;

          const ex = mx + 5.4 * perpDirX;
          const ey = my + 5.4 * perpDirY;

          // Explode along actual connection paths to prevent sideways disjointing
          const pushXY = e * 0.5;
          const expNx = pushXY * 0.5 * perpDirX;
          const expNy = pushXY * 0.5 * perpDirY;

          const expEx = pushXY * perpDirX;
          const expEy = pushXY * perpDirY;

          return (
            <group key={`mount-${i}`} position={[0, 0, 0]}>
              <group position={[expEx, expEy, -e * 0.5]}>
                <Flange position={[ex, ey, wallZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              <group position={[expEx, expEy, -e * 0.25]}>
                <HexNipple position={[ex, ey, wallZ + 2.35]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>

              <group position={[expEx, expEy, 0]}>
                <group position={[ex, ey, railZ]} rotation={[0, 0, θ]}>
                  <Elbow position={[0, 0, 0]} rotation={[Math.PI, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
              </group>

              <group position={[expNx, expNy, 0]}>
                <group position={[nx, ny, railZ]} rotation={[0, 0, θ]}>
                  <HexNipple position={[0, 0, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
              </group>

              <group position={[mx, my, railZ]}>
                {isFirst ? (
                  <group rotation={[0, 0, θ]}>
                    <Elbow position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                ) : isLast ? (
                  <group rotation={[0, 0, θ]}>
                    <Elbow position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                ) : (
                  <group rotation={[0, 0, θ - Math.PI / 2]}>
                    <TFitting position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
                  </group>
                )}
              </group>
            </group>
          );
        })}

        {/* --- Diagonal Rail Pipes --- */}
        {Array.from({ length: numMounts - 1 }).map((_, i) => {
          const t1 = i / (numMounts - 1);
          const t2 = (i + 1) / (numMounts - 1);

          const sx = startX + t1 * (endX - startX);
          const sy = startY + t1 * (endY - startY);
          const ex = startX + t2 * (endX - startX);
          const ey = startY + t2 * (endY - startY);

          // Push pipe ends 1.7cm into fitting collars so no gap
          const segLen = Math.hypot(ex - sx, ey - sy);
          const f = 1.7 / segLen;

          return (
            <group key={`rail-${i}`} position={[0, 0, 0]}>
              <Pipe
                radius={railRad}
                start={[sx + (ex - sx) * f, sy + (ey - sy) * f, railZ]}
                end={[ex - (ex - sx) * f, ey - (ey - sy) * f, railZ]}
                showLabel={showLabel}
                colorOption={colorOption}
              />
            </group>
          );
        })}
      </group>
    );
  }
  if (skuType === 'sku170') {
    const dropHeight = 10;
    const numMounts = Math.max(3, Math.ceil(length / 120) + 1);
    const bracketSpan = length - 5;
    const railLength = Math.max(0, length - (numMounts * 5));
    const railPipes = getEqualSplitPipes(railLength, numMounts - 1);

    const mtX: number[] = [];
    let currX = -bracketSpan / 2;
    mtX.push(currX);
    for (const rp of railPipes) {
      currX += rp + 5;
      mtX.push(currX);
    }

    const e = explode * 1.5;
    const zWall = -wallDistance;

    return (
      <group position={[0, height / 2, 0]}>
        {Array.from({ length: numMounts }).map((_, i) => {
          const x = mtX[i];
          const isEnd = i === 0 || i === numMounts - 1;
          const spanScale = numMounts > 1 ? (i / (numMounts - 1)) : 0;
          const xExp = -e + (spanScale * (2 * e));

          return (
            <group key={i} position={[xExp, 0, 0]}>
              <group position={[0, 0, -e]}>
                <Flange position={[x, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              <group position={[0, 0, -e * 0.5]}>
                <Pipe start={[x, 0, zWall + 1.2]} end={[x, 0, -2.2]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              <group position={[0, 0, 0]}>
                <Elbow position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              <group position={[0, -e * 0.5, 0]}>
                <Pipe start={[x, -2.2, 0]} end={[x, -dropHeight + 2.2, 0]} showLabel={showLabel} colorOption={colorOption} />
              </group>
              <group position={[0, -e, 0]}>
                {isEnd ? (
                  <Elbow position={[x, -dropHeight, 0]} rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI]} showLabel={showLabel} colorOption={colorOption} />
                ) : (
                  <TFitting position={[x, -dropHeight, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
                )}
              </group>
            </group>
          );
        })}
        {railPipes.map((pipeLen, i) => {
          const startX = mtX[i];
          const endX = mtX[i + 1];
          const spanScale = numMounts > 1 ? ((i + 0.5) / (numMounts - 1)) : 0;
          const railXExp = -e + (spanScale * (2 * e));

          return (
            <group key={'rail' + i} position={[railXExp, -e, 0]}>
              <Pipe start={[startX + 2.5, -dropHeight, 0]} end={[endX - 2.5, -dropHeight, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          );
        })}
      </group>
    );
  }

  if (skuType === 'sku178') {
    // Flipped version of SKU 170: flanges at bottom, rail at top
    const dropHeight = 10;
    const numMounts = Math.max(3, Math.ceil(length / 120) + 1);
    const bracketSpan = length - 5;
    const railLength = Math.max(0, length - (numMounts * 5));
    const railPipes = getEqualSplitPipes(railLength, numMounts - 1);

    const mtX: number[] = [];
    let currX = -bracketSpan / 2;
    mtX.push(currX);
    for (const rp of railPipes) {
      currX += rp + 5;
      mtX.push(currX);
    }

    const e = explode * 1.5;
    const zWall = -wallDistance;

    return (
      <group position={[0, height / 2, 0]}>
        {Array.from({ length: numMounts }).map((_, i) => {
          const x = mtX[i];
          const isEnd = i === 0 || i === numMounts - 1;
          const spanScale = numMounts > 1 ? (i / (numMounts - 1)) : 0;
          const xExp = -e + (spanScale * (2 * e));

          if (isEnd) {
            return (
              <group key={i} position={[xExp, 0, 0]}>
                {/* Top Wall flange */}
                <group position={[0, e, -e]}>
                  <Flange position={[x, dropHeight, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                {/* Horizontal stem pipe from wall */}
                <group position={[0, e, -e * 0.5]}>
                  <Pipe start={[x, dropHeight, zWall + 1.2]} end={[x, dropHeight, -2.2]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                {/* Top elbow turning DOWN */}
                <group position={[0, e, 0]}>
                  <Elbow position={[x, dropHeight, 0]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                {/* Vertical drop pipe going DOWN */}
                <group position={[0, e * 0.5, 0]}>
                  <Pipe start={[x, 2.2, 0]} end={[x, dropHeight - 2.2, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                {/* Bottom elbow at ends turning INTO RAIL */}
                <group position={[0, 0, 0]}>
                  <Elbow position={[x, 0, 0]} rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI]} showLabel={showLabel} colorOption={colorOption} />
                </group>
              </group>
            );
          } else {
            return (
              <group key={i} position={[xExp, 0, 0]}>
                {/* Bottom Wall flange */}
                <group position={[0, 0, -e]}>
                  <Flange position={[x, 0, zWall]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                {/* Horizontal stem pipe from wall straight to rail */}
                <group position={[0, 0, -e * 0.5]}>
                  <Pipe start={[x, 0, zWall + 1.2]} end={[x, 0, -2.2]} showLabel={showLabel} colorOption={colorOption} />
                </group>
                {/* Bottom T-fitting joining rail and stem */}
                <group position={[0, 0, 0]}>
                  <TFitting position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
                </group>
              </group>
            );
          }
        })}
        {/* Horizontal rail pipes at bottom */}
        {railPipes.map((pipeLen, i) => {
          const startX = mtX[i];
          const endX = mtX[i + 1];
          const spanScale = numMounts > 1 ? ((i + 0.5) / (numMounts - 1)) : 0;
          const railXExp = -e + (spanScale * (2 * e));

          return (
            <group key={'rail' + i} position={[railXExp, 0, 0]}>
              <Pipe start={[startX + 2.5, 0, 0]} end={[endX - 2.5, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
            </group>
          );
        })}
      </group>
    );
  }

  if (skuType === 'sku165') {
    const e = explode * 1.5;
    const bracketZ = -wallDistance;
    const actualPipeHeight = height - 5;
    const barY = -height / 2 + 3.4 + actualPipeHeight;
    const railLength = (length - 4.4) / 2;

    return (
      <group position={[0, 0, 0]}>
        <group position={[0, 0, e]}>
          <Flange position={[0, -height / 2, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          <Pipe start={[0, -height / 2 + 1.2, 0]} end={[0, barY - 2.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          <TFitting position={[0, barY, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Rails */}
        <group position={[-e, 0, e]}>
          <Pipe start={[-2.2, barY, 0]} end={[-railLength - 2.2, barY, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[-e * 2.0, 0, e]}>
          <Elbow position={[-railLength - 4.4, barY, 0]} rotation={[Math.PI, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        <group position={[e, 0, e]}>
          <Pipe start={[2.2, barY, 0]} end={[railLength + 2.2, barY, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[e * 2.0, 0, e]}>
          <Elbow position={[railLength + 4.4, barY, 0]} rotation={[Math.PI, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Wall connectors */}
        <group position={[-e * 2.0, 0, -e]}>
          <Pipe start={[-railLength - 4.4, barY, -2.2]} end={[-railLength - 4.4, barY, bracketZ + 1.2]} showLabel={showLabel} colorOption={colorOption} />
          <Flange position={[-railLength - 4.4, barY, bracketZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[e * 2.0, 0, -e]}>
          <Pipe start={[railLength + 4.4, barY, -2.2]} end={[railLength + 4.4, barY, bracketZ + 1.2]} showLabel={showLabel} colorOption={colorOption} />
          <Flange position={[railLength + 4.4, barY, bracketZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku166') {
    const e = explode * 1.5;
    const bracketZ = -wallDistance; // actually uses 5cm pipe
    return (
      <group position={[0, height / 2, 0]}>
        <group position={[0, 0, -e]}>
          <Flange position={[0, 0, bracketZ]} rotation={[Math.PI / 2, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, 0, -e * 0.5]}>
          <Pipe start={[0, 0, bracketZ + 1.2]} end={[0, 0, -2.2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[0, 0, 0]}>
          <CornerFitting position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} side="left" showLabel={showLabel} colorOption={colorOption} />
        </group>
        {/* Horns */}
        <group position={[-e, e, 0]}>
          <Pipe start={[-1.5, 1.5, 0]} end={[-10.6, 10.6, 0]} showLabel={showLabel} colorOption={colorOption} />
          <group position={[-e * 0.707, e * 0.707, 0]}>
            <EndCap position={[-10.6, 10.6, 0]} rotation={[0, 0, Math.PI / 4]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
        <group position={[e, e, 0]}>
          <Pipe start={[1.5, 1.5, 0]} end={[10.6, 10.6, 0]} showLabel={showLabel} colorOption={colorOption} />
          <group position={[e * 0.707, e * 0.707, 0]}>
            <EndCap position={[10.6, 10.6, 0]} rotation={[0, 0, -Math.PI / 4]} showLabel={showLabel} colorOption={colorOption} />
          </group>
        </group>
      </group>
    );
  }

  if (skuType === 'sku168') {
    // Modular freestanding rack with 5-Way Hub bases.
    const e = explode * 1.5;
    const baseArmHeight = 5.75;
    const spreadArm = 23; // wallDistance / 2 ... wait, sku126 uses 23. sku168 cutlist uses spreadArm = wallDistance / 2.
    // Let's use wallDistance / 2
    const unionHeight = (height + baseArmHeight) / 2;

    const buildLeg = (x, type) => {
      const isLeft = type === 'left';
      const sideX = isLeft ? -e : e;
      const innerDir = isLeft ? 1 : -1;
      const outerDir = isLeft ? -1 : 1;

      // 5-Way Hub rotation: the "side" branch (+X locally) rotated by 90deg Z becomes UP (+Y)
      // Local +Y becomes -X (left). Local -Y becomes +X (right).
      const hubRot: [number, number, number] = [0, 0, Math.PI / 2];

      return (
        <group key={type} position={[sideX, 0, 0]}>
          {/* Top Corner Elbow */}
          <group position={[0, e * 3, 0]}>
            <Elbow position={[x, height, 0]} rotation={[0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Vertical Pole - Top Half */}
          <group position={[0, e * 2, 0]}>
            <Pipe start={[x, height - 1.2, 0]} end={[x, unionHeight + 1.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Union */}
          <group position={[0, e * 1.5, 0]}>
            <Union position={[x, unionHeight, 0]} rotation={[0, 0, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Vertical Pole - Bottom Half */}
          <group position={[0, e, 0]}>
            <Pipe start={[x, unionHeight - 1.2, 0]} end={[x, baseArmHeight + 1.2, 0]} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* 5-Way Junction Base */}
          <group position={[0, 0, 0]}>
            <FiveWayFitting position={[x, baseArmHeight, 0]} rotation={hubRot} showLabel={showLabel} colorOption={colorOption} />
          </group>

          {/* Outward Stabilizer Arm & Foot (Hex Nipple horizontally + Drop) */}
          <group position={[outerDir * e * 0.5, 0, 0]}>
            <HexNipple position={[x + outerDir * 2.875, baseArmHeight, 0]} rotation={[0, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
            <group position={[x + outerDir * 5.75, baseArmHeight, 0]}>
              <group position={[outerDir * e * 0.5, 0, 0]}>
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
      <group position={[0, -height / 2, 0]}>
        {buildLeg(-(length / 2 - 1.5), 'left')}
        {buildLeg((length / 2 - 1.5), 'right')}

        {/* Top Rail */}
        <group position={[0, e * 3, 0]}>
          <Pipe start={[-(length / 2 - 3.0), height, 0]} end={[(length / 2 - 3.0), height, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Bottom Rail connecting 5-Way Hubs */}
        <group position={[0, 0, 0]}>
          <Pipe start={[-(length / 2 - 3.0), baseArmHeight, 0]} end={[(length / 2 - 3.0), baseArmHeight, 0]} showLabel={showLabel} colorOption={colorOption} />
        </group>
      </group>
    );
  }

  if (skuType === 'sku173') {
    const e = explode * 2.0;
    const bracketZ = -wallDistance;
    const lHalf = length / 2;

    const lxElbow = -lHalf + 2;
    const rxElbow = lHalf - 2;

    // Vector from left elbow to left wall is (-0.7071, 0, -0.7071)
    const lxHex = lxElbow - 2.6 * 0.7071;
    const lzHex = bracketZ - 2.6 * 0.7071;
    const lxFlange = lxElbow - 3.6 * 0.7071;
    const lzFlange = bracketZ - 3.6 * 0.7071;

    // Vector from right elbow to right wall is (0.7071, 0, -0.7071)
    const rxHex = rxElbow + 2.6 * 0.7071;
    const rzHex = bracketZ - 2.6 * 0.7071;
    const rxFlange = rxElbow + 3.6 * 0.7071;
    const rzFlange = bracketZ - 3.6 * 0.7071;

    // Explode offsets
    const lHexExpX = -e - e * 0.7071;
    const lHexExpZ = -e * 0.7071;
    const lFlangeExpX = -e - e * 1.4142;
    const lFlangeExpZ = -e * 1.4142;

    const rHexExpX = e + e * 0.7071;
    const rHexExpZ = -e * 0.7071;
    const rFlangeExpX = e + e * 1.4142;
    const rFlangeExpZ = -e * 1.4142;

    return (
      <group position={[0, height / 2, 0]}>
        {/* Left Side Components */}
        <group position={[-e, 0, 0]}>
          <FortyFiveElbow position={[lxElbow, 0, bracketZ]} rotation={[-Math.PI, 0, Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[lHexExpX, 0, lHexExpZ]}>
          <HexNipple position={[lxHex, 0, lzHex]} rotation={[0.9553, -0.5236, -0.9553]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[lFlangeExpX, 0, lFlangeExpZ]}>
          <Flange position={[lxFlange, 0, lzFlange]} rotation={[0.9553, -0.5236, -0.9553]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Right Side Components */}
        <group position={[e, 0, 0]}>
          <FortyFiveElbow position={[rxElbow, 0, bracketZ]} rotation={[-Math.PI, 0, -Math.PI / 2]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[rHexExpX, 0, rHexExpZ]}>
          <HexNipple position={[rxHex, 0, rzHex]} rotation={[0.9553, 0.5236, 0.9553]} showLabel={showLabel} colorOption={colorOption} />
        </group>
        <group position={[rFlangeExpX, 0, rFlangeExpZ]}>
          <Flange position={[rxFlange, 0, rzFlange]} rotation={[0.9553, 0.5236, 0.9553]} showLabel={showLabel} colorOption={colorOption} />
        </group>

        {/* Center Diagonal Pipe */}
        <group position={[0, 0, 0]}>
          <Pipe start={[lxElbow + 0.8, 0, bracketZ]} end={[rxElbow - 0.8, 0, bracketZ]} showLabel={showLabel} colorOption={colorOption} />
        </group>
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

const Scene = React.memo(({ length, height, wallDistance, explode, hasShelves, isFreestanding, colorOption, skuType, woodColor, cameraState, tiers = 4, tubeType = 'round' }: { length: number, height: number, wallDistance: number, explode: number, hasShelves: boolean, isFreestanding: boolean, colorOption: ColorOption, skuType: 'standard' | 'sku777' | 'sku000' | 'sku100' | 'sku200' | 'sku102' | 'sku103' | 'sku104' | 'sku4210' | 'sku300' | 'sku105' | 'sku106' | 'sku107' | 'sku108' | 'sku109' | 'sku110' | 'sku111' | 'sku112' | 'sku113' | 'sku114' | 'sku115' | 'sku116' | 'sku117' | 'sku118' | 'sku119' | 'sku120' | 'sku121' | 'sku122' | 'sku123' | 'sku124' | 'sku125' | 'sku126' | 'sku127' | 'sku128' | 'sku129' | 'sku130' | 'sku131' | 'sku132' | 'sku133' | 'sku134' | 'sku135' | 'sku136' | 'sku137' | 'sku138' | 'sku140' | 'sku141' | 'sku142' | 'sku143' | 'sku144' | 'sku145' | 'sku146' | 'sku147' | 'sku148' | 'sku149' | 'sku150' | 'sku151' | 'sku152' | 'sku153' | 'sku154' | 'sku155' | 'sku156' | 'sku157' | 'sku158' | 'sku159' | 'sku160' | 'sku161' | 'sku162' | 'sku163' | 'sku164' | 'sku165' | 'sku166' | 'sku167' | 'sku168' | 'sku169' | 'sku170' | 'sku171' | 'sku172' | 'sku173' | 'sku174' | 'sku175' | 'sku176' | 'sku177' | 'sku178' | 'sku888', woodColor: string, cameraState?: any, tiers?: number, tubeType?: 'round' | 'square' }) => {
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

      <Rack
        length={length}
        height={height}
        wallDistance={wallDistance}
        explode={explode}
        hasShelves={hasShelves}
        isFreestanding={isFreestanding}
        colorOption={colorOption}
        skuType={skuType}
        woodColor={woodColor}
        tiers={tiers}
        tubeType={tubeType}
      />
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


const CutlistDisplay = ({ config, pickedItems, onToggleItem, packedBy, onPackedByChange, order, onOrderChange }: any) => {
  const { length, height, wallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, quantity, tiers } = config;

  const rawCutlistItems = getCutlistItems(config);
  const aggregatedParts: Record<string, CutlistItem> = {};

  rawCutlistItems.forEach(item => {
    const key = `${item.partName}-${item.color}`;
    if (!aggregatedParts[key]) {
      aggregatedParts[key] = { ...item, qty: 0 };
    }
    aggregatedParts[key].qty += item.qty;
  });

  const cutlistItems = Object.values(aggregatedParts);

  const pipes = cutlistItems.filter((i: any) => i.type === 'pipe').sort((a: any, b: any) => parseFloat(a.partName) - parseFloat(b.partName) || 0);
  const fittings = cutlistItems.filter((i: any) => i.type === 'fitting');
  const woods = cutlistItems.filter((i: any) => i.type === 'wood');

  const renderItem = (id: string, label: string, value: string) => {
    if (!pickedItems) {
      return (
        <li key={id} className="flex justify-between">
          <span>{label}</span>
          <span>{value}</span>
        </li>
      );
    }

    const isPicked = pickedItems[id] || false;
    return (
      <li key={id} className="flex items-center gap-3 py-1">
        <button
          onClick={() => onToggleItem(id)}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isPicked ? 'bg-black border-black' : 'border-gray-300 hover:border-gray-400'}`}
        >
          {isPicked && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
        </button>
        <div className={`flex-1 flex justify-between ${isPicked ? 'opacity-50 line-through' : ''}`}>
          <span>{label}</span>
          <span>{value}</span>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">Pipe Color:</span>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: COLORS[colorName]?.pipeColor }}></span>
            <span className="text-sm font-medium text-gray-800">{colorName}</span>
          </div>
        </div>
        {woods.length > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Wood Color:</span>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: WOOD_COLORS[woodColor] }}></span>
              <span className="text-sm font-medium text-gray-800">{woodColor}</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">Pipes</h3>
        <ul className="text-sm space-y-1 text-gray-600 font-mono">
          {pipes.map((p: any) => renderItem(p.id, p.partName, `${p.qty} pcs`))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">Fittings</h3>
        <ul className="text-sm space-y-1 text-gray-600 font-mono">
          {fittings.map((f: any) => renderItem(f.id, f.partName, `${f.qty} pcs`))}
        </ul>
      </div>

      {woods.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">Wood Shelves</h3>
          <ul className="text-sm space-y-1 text-gray-600 font-mono">
            {woods.map((w: any) => renderItem(w.id, w.partName, `${w.qty} pcs`))}
          </ul>
        </div>
      )}

      {onPackedByChange && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Shipping & Sign-off</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Packed By (Sign-off)</label>
              <input
                type="text"
                placeholder="Sign off name..."
                value={packedBy || ''}
                onChange={(e) => onPackedByChange(e.target.value)}
                className="w-full text-sm border-gray-200 rounded-md bg-white p-2 border focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            {order && onOrderChange && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Shipped Date</label>
                  <input
                    type="date"
                    value={order.shippedDate || ''}
                    onChange={(e) => onOrderChange({ ...order, shippedDate: e.target.value })}
                    className="w-full text-sm border-gray-200 rounded-md bg-white p-2 border focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Shipped To (Buyer)</label>
                  <input
                    type="text"
                    value={order.buyerName || ''}
                    onChange={(e) => onOrderChange({ ...order, buyerName: e.target.value })}
                    className="w-full text-sm border-gray-200 rounded-md bg-white p-2 border focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export type Order = {
  id: string;
  orderNumber: string;
  buyerName: string;
  date: string;
  status: 'Pending' | 'Processing' | 'Prepared' | 'Dispatched' | 'Archived';
  priority: 'Normal' | 'Urgent';
  dispatcher: string;
  items: any[];
  packedBy?: string;
  pickedItems?: Record<string, boolean>;
  shippedDate?: string;
  restoredFrom?: string;
};

const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
  <div className="group relative inline-block ml-1.5 align-middle">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl font-medium">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
    </div>
  </div>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-gray-600 transition-colors cursor-help">
    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
  </svg>
);

export default function App() {
  const appRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'configurator' | 'library' | 'orders' | 'inventory' | 'preparation'>('library');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [length, setLength] = useState(100);
  const [height, setHeight] = useState(180);
  const [wallDistance, setWallDistance] = useState(30);
  const [explode, setExplode] = useState(0);
  const [hasShelves, setHasShelves] = useState(true);
  const [isFreestanding, setIsFreestanding] = useState(false);
  const [colorName, setColorName] = useState('Raw grey');
  const [woodColor, setWoodColor] = useState('Natural Oak');
  const [skuType, setSkuType] = useState<'standard' | 'sku777' | 'sku000' | 'sku100' | 'sku200' | 'sku102' | 'sku103' | 'sku104' | 'sku4210' | 'sku300' | 'sku105' | 'sku106' | 'sku107' | 'sku108' | 'sku109' | 'sku110' | 'sku111' | 'sku112' | 'sku113' | 'sku114' | 'sku115' | 'sku116' | 'sku117' | 'sku118' | 'sku119' | 'sku120' | 'sku121' | 'sku122' | 'sku123' | 'sku124' | 'sku125' | 'sku126' | 'sku127' | 'sku128' | 'sku129' | 'sku130' | 'sku131' | 'sku132' | 'sku133' | 'sku134' | 'sku135' | 'sku136' | 'sku137' | 'sku138' | 'sku140' | 'sku141' | 'sku142' | 'sku143' | 'sku144' | 'sku145' | 'sku146' | 'sku147' | 'sku148' | 'sku149' | 'sku150' | 'sku151' | 'sku152' | 'sku153' | 'sku154' | 'sku155' | 'sku156' | 'sku157' | 'sku158' | 'sku159' | 'sku160' | 'sku161' | 'sku162' | 'sku163' | 'sku164' | 'sku165' | 'sku166' | 'sku167' | 'sku168' | 'sku169' | 'sku170' | 'sku171' | 'sku172' | 'sku173' | 'sku174' | 'sku175' | 'sku176' | 'sku177' | 'sku178' | 'sku888'>('standard');
  const [tiers, setTiers] = useState(4);
  const [tubeType, setTubeType] = useState<'round' | 'square'>('round');
  const [quantity, setQuantity] = useState(1);
  const [pendingAutoDownload, setPendingAutoDownload] = useState(false);
  const downloadQueueRef = useRef<{ config: any, itemIndex: number, totalItems: number, orderNumber: string }[]>([]);

  const deferredLength = useDeferredValue(length);
  const deferredHeight = useDeferredValue(height);
  const deferredWallDistance = useDeferredValue(wallDistance);
  const deferredTiers = useDeferredValue(tiers);
  const labelSize = 16 + explode * 1.5;
  const labelDistance = 30 + explode * 8;
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const libraryScrollRef = useRef<HTMLDivElement>(null);
  const [configSearch, setConfigSearch] = useState('');
  const [libraryCategory, setLibraryCategory] = useState<'All' | 'Standard' | 'Shelves' | 'Freestanding' | 'Special'>('All');
  const [selectedSKUs, setSelectedSKUs] = useState<string[]>([]);

  const [orderNumber, setOrderNumber] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [addingToOrderId, setAddingToOrderId] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('orders');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    // Migration: convert configuration to items array
    return parsed.map((o: any) => {
      if (o.configuration && !o.items) {
        const { configuration, ...rest } = o;
        return { ...rest, items: [configuration] };
      }
      return o;
    });
  });
  const [showHistory, setShowHistory] = useState(false);
  const [prepColorFilter, setPrepColorFilter] = useState<string>('All');
  const [orderViewMode, setOrderViewMode] = useState<'grid' | 'list'>('grid');
  const [orderSortBy, setOrderSortBy] = useState<'date-desc' | 'date-asc' | 'status'>('date-desc');
  const [orderColorFilter, setOrderColorFilter] = useState<string>('All');
  const [prepTab, setPrepTab] = useState<'active' | 'prepared'>('active');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'disconnected'>('syncing');
  const lastSyncRef = useRef<string>('');

  type SavedSKU = { name: string; length: number; height: number; wallDistance: number; hasShelves: boolean; isFreestanding: boolean; colorName: string; woodColor?: string; skuType?: 'standard' | 'sku777' | 'sku000' | 'sku100' | 'sku200' | 'sku102' | 'sku103' | 'sku104' | 'sku4210' | 'sku300' | 'sku105' | 'sku106' | 'sku107' | 'sku108' | 'sku109' | 'sku110' | 'sku111' | 'sku112' | 'sku113' | 'sku114' | 'sku115' | 'sku116' | 'sku117' | 'sku118' | 'sku119' | 'sku120' | 'sku121' | 'sku122' | 'sku123' | 'sku124' | 'sku125' | 'sku126' | 'sku127' | 'sku128' | 'sku129' | 'sku130' | 'sku131' | 'sku132' | 'sku133' | 'sku134' | 'sku135' | 'sku136' | 'sku137' | 'sku138' | 'sku140' | 'sku141' | 'sku142' | 'sku143' | 'sku144' | 'sku145' | 'sku146' | 'sku147' | 'sku148' | 'sku149' | 'sku150' | 'sku151' | 'sku152' | 'sku153' | 'sku154' | 'sku155' | 'sku156' | 'sku157' | 'sku158' | 'sku159' | 'sku160' | 'sku161' | 'sku162' | 'sku163' | 'sku164' | 'sku165' | 'sku166' | 'sku167' | 'sku168' | 'sku169' | 'sku170' | 'sku171' | 'sku172' | 'sku173' | 'sku174' | 'sku175' | 'sku176' | 'sku177' | 'sku178' | 'sku888'; tiers?: number; tubeType?: 'round' | 'square' };

  const [savedSKUs, setSavedSKUs] = useState<SavedSKU[]>(() => {

    // Cache bust to force users to see the new SKUs
    const APP_VERSION = 'v6_sku177';
    if (localStorage.getItem('app_cache_version') !== APP_VERSION) {
      localStorage.removeItem('savedSKUs');
      localStorage.setItem('app_cache_version', APP_VERSION);
    }

    const default4210: SavedSKU = { name: 'SKU 4210', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Raw grey', woodColor: 'Natural Oak', skuType: 'sku4210' };
    const default300: SavedSKU = { name: 'SKU 300', length: 120, height: 10, wallDistance: 8, hasShelves: false, isFreestanding: false, colorName: 'Raw grey', woodColor: 'Natural Oak', skuType: 'sku300' };
    const default103: SavedSKU = { name: 'SKU 103', length: 120, height: 10, wallDistance: 15, hasShelves: false, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku103' };
    const default105: SavedSKU = { name: 'SKU 105', length: 15, height: 15, wallDistance: 20, hasShelves: false, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku105' };
    const default155: SavedSKU = { name: 'SKU 155', length: 100, height: 0, wallDistance: 35, hasShelves: false, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku155' };
    const default106: SavedSKU = { name: 'SKU 106', length: 120, height: 92, wallDistance: 23, hasShelves: true, isFreestanding: true, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku106', tiers: 4 };
    const default156: SavedSKU = { name: 'SKU 156', length: 150, height: 92, wallDistance: 23, hasShelves: true, isFreestanding: true, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku156', tiers: 4 };
    const default157: SavedSKU = { name: 'SKU 157', length: 150, height: 92, wallDistance: 23, hasShelves: true, isFreestanding: true, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku157', tiers: 3 };
    const default107: SavedSKU = { name: 'SKU 107', length: 120, height: 92, wallDistance: 23, hasShelves: true, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku107', tiers: 4 };
    const default108: SavedSKU = { name: 'SKU 108', length: 100, height: 86, wallDistance: 15, hasShelves: true, isFreestanding: true, colorName: 'Black', woodColor: 'Black', skuType: 'sku108' };
    const default109: SavedSKU = { name: 'SKU 109', length: 100, height: 86, wallDistance: 23, hasShelves: true, isFreestanding: true, colorName: 'Black', woodColor: 'Black', skuType: 'sku109' };
    const default110: SavedSKU = { name: 'SKU 110', length: 120, height: 10, wallDistance: 23, hasShelves: true, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku110' };
    const default111: SavedSKU = { name: 'SKU 111', length: 60, height: 5, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku111' };
    const default112: SavedSKU = { name: 'SKU 112', length: 240, height: 200, wallDistance: 23, hasShelves: false, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku112' };
    const default113: SavedSKU = { name: 'SKU 113', length: 30, height: 13, wallDistance: 12, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku113' };
    const default114: SavedSKU = { name: 'SKU 114', length: 25, height: 100, wallDistance: 11, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku114' };
    const default115: SavedSKU = { name: 'SKU 115', length: 90, height: 20, wallDistance: 25, hasShelves: true, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku115' };
    const default116: SavedSKU = { name: 'SKU 116', length: 120, height: 60, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku116' };
    const default117: SavedSKU = { name: 'SKU 117', length: 60, height: 160, wallDistance: 8, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku117' };
    const default118: SavedSKU = { name: 'SKU 118', length: 60, height: 160, wallDistance: 8, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku118' };
    const default119: SavedSKU = { name: 'SKU 119', length: 120, height: 60, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Gold', skuType: 'sku119' };
    const default120: SavedSKU = { name: 'SKU 120', length: 33, height: 100, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Gold', skuType: 'sku120' };
    const default121: SavedSKU = { name: 'SKU 121', length: 100, height: 60, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku121' };
    const default122: SavedSKU = { name: 'SKU 122', length: 10, height: 3, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku122' };
    const default123: SavedSKU = { name: 'SKU 123', length: 200, height: 160, wallDistance: 0, hasShelves: false, isFreestanding: true, colorName: 'Black', skuType: 'sku123' };
    const default124: SavedSKU = { name: 'SKU 124', length: 200, height: 0, wallDistance: 26.4, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku124' };
    const default125: SavedSKU = { name: 'SKU 125', length: 15, height: 0, wallDistance: 15, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku125' };
    const default126: SavedSKU = { name: 'SKU 126', length: 120, height: 180, wallDistance: 30, hasShelves: false, isFreestanding: true, colorName: 'Black', skuType: 'sku126' };
    const default127: SavedSKU = { name: 'SKU 127', length: 120, height: 160, wallDistance: 0, hasShelves: true, isFreestanding: true, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku127' };
    const default128: SavedSKU = { name: 'SKU 128', length: 100, height: 30, wallDistance: 28, hasShelves: true, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku128' };
    const default129: SavedSKU = { name: 'SKU 129', length: 100, height: 70, wallDistance: 23, hasShelves: true, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku129', tiers: 3 };
    const default130: SavedSKU = { name: 'SKU 130', length: 100, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku130' };
    const default131: SavedSKU = { name: 'SKU 131', length: 100, height: 160, wallDistance: 30, hasShelves: true, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku131' };
    const default132: SavedSKU = { name: 'SKU 132', length: 100, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku132' };
    const default133: SavedSKU = { name: 'SKU 133', length: 60, height: 5, wallDistance: 20, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku133', woodColor: 'Natural Oak' };
    const default134: SavedSKU = { name: 'SKU 134', length: 50, height: 0, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku134' };
    const default135: SavedSKU = { name: 'SKU 135', length: 120, height: 100, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku135' };
    const default136: SavedSKU = { name: 'SKU 136', length: 100, height: 0, wallDistance: 10, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku136' };
    const default137: SavedSKU = { name: 'SKU 137', length: 100, height: 0, wallDistance: 10, hasShelves: true, isFreestanding: false, colorName: 'Black', skuType: 'sku137' };
    const default138: SavedSKU = { name: 'SKU 138', length: 12, height: 0, wallDistance: 10, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku138' };
    const default140: SavedSKU = { name: 'SKU 140', length: 200, height: 0, wallDistance: 26.4, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku140' };
    const default141: SavedSKU = { name: 'SKU 141', length: 120, height: 80, wallDistance: 40, hasShelves: false, isFreestanding: true, colorName: 'Black', skuType: 'sku141' };
    const default142: SavedSKU = { name: 'SKU 142', length: 100, height: 0, wallDistance: 20, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku142' };
    const default143: SavedSKU = { name: 'SKU 143', length: 200, height: 100, wallDistance: 8, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku143' };
    const default152: SavedSKU = { name: 'SKU 152', length: 15, height: 0, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku152' };
    const default161: SavedSKU = { name: 'SKU 161', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: true, colorName: 'Black', skuType: 'sku161' };
    const default162: SavedSKU = { name: 'SKU 162', length: 100, height: 0, wallDistance: 23, hasShelves: true, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku162' };
    const default163: SavedSKU = { name: 'SKU 163', length: 120, height: 90, wallDistance: 23, hasShelves: false, isFreestanding: true, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku163', tiers: 2 };
    const default164: SavedSKU = { name: 'SKU 164', length: 120, height: 90, wallDistance: 15, hasShelves: false, isFreestanding: true, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku164', tiers: 2 };
    const default165: SavedSKU = { name: 'SKU 165', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku165' };
    const default166: SavedSKU = { name: 'SKU 166', length: 15, height: 0, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku166' };
    const default167: SavedSKU = { name: 'SKU 167', length: 30, height: 0, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku167' };
    const default168: SavedSKU = { name: 'SKU 168', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: true, colorName: 'Black', skuType: 'sku168' };
    const default169: SavedSKU = { name: 'SKU 169', length: 200, height: 100, wallDistance: 8, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku169' };
    const default170: SavedSKU = { name: 'SKU 170', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku170' };
    const default171: SavedSKU = { name: 'SKU 171', length: 100, height: 0, wallDistance: 25, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku171' };
    const default172: SavedSKU = { name: 'SKU 172', length: 20, height: 0, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku172' };
    const default173: SavedSKU = { name: 'SKU 173', length: 100, height: 0, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku173' };
    const default174: SavedSKU = { name: 'SKU 174', length: 15, height: 0, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku174' };
    const default175: SavedSKU = { name: 'SKU 175', length: 15, height: 0, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku175' };
    const default176: SavedSKU = { name: 'SKU 176', length: 15, height: 0, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku176' };
    const default177: SavedSKU = { name: 'SKU 177', length: 120, height: 160, wallDistance: 15, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku177', tiers: 3 };
    const default178: SavedSKU = { name: 'SKU 178', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku178' };

    const allDefaults = [
      default4210, default300, default103, default105, default106, default107, default108, default109, default110, default111, default112, default113, default114, default115, default116, default117, default118, default119, default120, default121, default122, default123, default124, default125, default126, default127, default128, default129, default130, default131, default132, default133, default134, default135, default136, default137, default138,
      default140, default141, default142, default143, default152, default155, default156, default157, default161, default162, default163, default164, default165, default166, default167, default168, default169, default170, default171, default172, default173, default174, default175, default176, default177, default178
    ];

    const saved = localStorage.getItem('savedSKUs');
    if (saved) {
      let parsed: SavedSKU[] = JSON.parse(saved);

      // Build a name -> expected skuType map from all defaults
      const nameToExpectedType: Record<string, string> = {};
      for (const def of allDefaults) {
        nameToExpectedType[def.name.toUpperCase().replace(/[^A-Z0-9]/g, '')] = def.skuType || 'standard';
      }

      // Drop stale entries: same name as a default but wrong skuType
      parsed = parsed.filter(s => {
        const nameKey = s.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const expected = nameToExpectedType[nameKey];
        if (expected && s.skuType !== expected) return false;
        return true;
      });

      // Deduplicate by skuType — keep first occurrence (skip for 'standard' as users can have many custom ones)
      const seenTypes = new Set<string>();
      parsed = parsed.filter(s => {
        const key = s.skuType || 'standard';
        if (key === 'standard') return true;

        if (seenTypes.has(key)) return false;
        seenTypes.add(key);
        return true;
      });

      // Deduplicate by name — keep first occurrence
      const seenNames = new Set<string>();
      parsed = parsed.filter(s => {
        const key = s.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (seenNames.has(key)) return false;
        seenNames.add(key);
        return true;
      });

      // Strip descriptive suffix from names — keep just "SKU XXX"
      parsed = parsed.map(s => {
        const match = s.name.match(/^(SKU\s[\w\d]+)/i);
        if (match && s.name !== match[0]) {
          return { ...s, name: match[0] };
        }
        return s;
      });

      // Inject any missing default SKUs
      for (const def of allDefaults) {
        if (def.skuType === 'standard' || !def.skuType) {
          if (!parsed.find(s => s.name.toUpperCase().replace(/[^A-Z0-9]/g, '') === def.name.toUpperCase().replace(/[^A-Z0-9]/g, ''))) {
            parsed.push(def);
          }
        } else {
          if (!parsed.find(s => s.skuType === def.skuType)) {
            parsed.push(def);
          }
        }
      }

      return parsed;
    }

    return [
      { name: 'SKU 100', length: 120, height: 200, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku100' },
      { name: 'SKU 89', length: 100, height: 180, wallDistance: 30, hasShelves: false, isFreestanding: true, colorName: 'Raw grey', woodColor: 'Natural Oak', skuType: 'standard' },
      { name: 'SKU 777', length: 150, height: 180, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Rustic silver', woodColor: 'Natural Oak', skuType: 'sku777' },
      { name: 'SKU 000', length: 100, height: 80, wallDistance: 30, hasShelves: true, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku000' },
      { name: 'SKU 102', length: 120, height: 0, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Raw grey', woodColor: 'Natural Oak', skuType: 'sku102' },
      { name: 'SKU 200', length: 80, height: 0, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Raw grey', woodColor: 'Natural Oak', skuType: 'sku200' },
      { name: 'SKU 137', length: 100, height: 0, wallDistance: 10, hasShelves: true, isFreestanding: false, colorName: 'Black', skuType: 'sku137' },
      ...allDefaults
    ];
  });

  useEffect(() => {
    if (pendingAutoDownload) {
      // Wait for the 3D canvas to render properly before downloading
      // It takes about 1.5 seconds for React Three Fiber to fully initialize and render
      setTimeout(async () => {
        await handleDownloadAssembly();

        const nextQueue = [...downloadQueueRef.current];
        if (nextQueue.length > 0) {
          const nextJob = nextQueue.shift()!;
          downloadQueueRef.current = nextQueue;

          setLength(nextJob.config.length);
          setHeight(nextJob.config.height);
          setWallDistance(nextJob.config.wallDistance);
          setSkuType(nextJob.config.skuType || 'standard');
          setWoodColor(nextJob.config.woodColor || 'Natural Oak');
          setColorName(nextJob.config.colorName || 'Raw grey');
          setTubeType(nextJob.config.tubeType || 'round');
          setHasShelves(nextJob.config.hasShelves);
          setIsFreestanding(nextJob.config.isFreestanding);
          setQuantity(nextJob.config.quantity || 1);

          (window as any).__ACTIVE_ASSEMBLY_ORDER = `${nextJob.orderNumber} (Item ${nextJob.itemIndex}/${nextJob.totalItems})`;
          (window as any).__ACTIVE_ASSEMBLY_CAMERA = nextJob.config.cameraState;

          setPendingAutoDownload(false);
          setTimeout(() => {
            setPendingAutoDownload(true);
          }, 100);
        } else {
          setPendingAutoDownload(false);
        }
      }, 1500);
    }
  }, [pendingAutoDownload]);

  useEffect(() => {
    const dataStr = JSON.stringify(orders);
    if (dataStr !== lastSyncRef.current && lastSyncRef.current !== '') {
      saveOrders(orders).then(() => {
        lastSyncRef.current = dataStr;
        setSyncStatus('synced');
      }).catch(() => setSyncStatus('error'));
    }
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('savedSKUs', JSON.stringify(savedSKUs));
  }, [savedSKUs]);

  // Initial cloud fetch
  useEffect(() => {
    const initFetch = async () => {
      try {
        const cloudOrders = await fetchOrders();
        setOrders(cloudOrders);
        lastSyncRef.current = JSON.stringify(cloudOrders);
        setSyncStatus('synced');
      } catch (e) {
        setSyncStatus('error');
      }
    };
    initFetch();
  }, []);

  // Real-time polling for updates from other sessions
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const cloudOrders = await fetchOrders();
        const cloudStr = JSON.stringify(cloudOrders);

        if (cloudStr !== JSON.stringify(orders)) {
          console.log('Detected cloud changes, syncing...');
          setSyncStatus('syncing');
          setOrders(cloudOrders);
          lastSyncRef.current = cloudStr;
          setTimeout(() => setSyncStatus('synced'), 1000);
        } else {
          setSyncStatus('synced');
        }
      } catch (e) {
        setSyncStatus('error');
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [orders]);

  // Handle URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cfg = params.get('config');
    if (cfg) {
      try {
        const parsed = JSON.parse(atob(cfg));
        if (parsed.length) setLength(parsed.length);
        if (parsed.height) setHeight(parsed.height);
        if (parsed.wallDistance) setWallDistance(parsed.wallDistance);
        if (parsed.hasShelves !== undefined) setHasShelves(parsed.hasShelves);
        if (parsed.isFreestanding !== undefined) setIsFreestanding(parsed.isFreestanding);
        if (parsed.colorName) setColorName(parsed.colorName);
        if (parsed.woodColor) setWoodColor(parsed.woodColor);
        if (parsed.skuType) setSkuType(parsed.skuType);
        if (parsed.tiers) setTiers(parsed.tiers);
        if (parsed.tubeType) setTubeType(parsed.tubeType);

        // Clear param after loading to prevent sticky config on refresh
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error('Failed to parse share config', e);
      }
    }
  }, []);

  const handleShare = () => {
    const config = {
      length, height, wallDistance, hasShelves, isFreestanding,
      colorName, woodColor, skuType, tiers, tubeType
    };
    const b64 = btoa(JSON.stringify(config));
    const url = `${window.location.origin}${window.location.pathname}?config=${b64}`;
    navigator.clipboard.writeText(url);
    alert('Shareable URL copied to clipboard!');
  };

  const exportOrders = () => {
    const data = JSON.stringify(orders, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importOrders = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (re: any) => {
        try {
          const imported = JSON.parse(re.target.result);
          if (Array.isArray(imported)) {
            if (confirm(`Import ${imported.length} orders? This will overwrite your current orders.`)) {
              setOrders(imported);
            }
          }
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const inventoryData = useMemo(() => {
    const parts: Record<string, { name: string, color: string, qty: number, type: string }> = {};
    orders.forEach(order => {
      if (order.status !== 'Archived') {
        order.items.forEach(config => {
          const cutlist = getCutlistItems(config);
          cutlist.forEach(item => {
            const key = `${item.partName}-${item.color}`;
            if (!parts[key]) {
              parts[key] = { name: item.partName, color: item.color || 'N/A', qty: 0, type: item.type };
            }
            parts[key].qty += item.qty;
          });
        });
      }
    });
    return Object.values(parts);
  }, [orders]);

  const preparationData = useMemo(() => {
    if (prepTab === 'active') {
      return orders.filter(o => o.status === 'Pending' || o.status === 'Processing');
    } else {
      return orders.filter(o => o.status === 'Prepared');
    }
  }, [orders, prepTab]);

  const availablePrepColors = useMemo(() => {
    const colors = new Set<string>();
    preparationData.forEach(order => {
      order.items.forEach(config => {
        const cutlist = getCutlistItems(config);
        cutlist.forEach(item => {
          if (item.color) colors.add(item.color);
        });
      });
    });
    return ['All', ...Array.from(colors).sort()];
  }, [preparationData]);

  const currentSku = useMemo(() => {
    return savedSKUs.find(s =>
      s.length === length &&
      s.height === height &&
      s.wallDistance === wallDistance &&
      s.hasShelves === hasShelves &&
      s.isFreestanding === isFreestanding &&
      s.colorName === colorName &&
      (s.woodColor === woodColor || (!s.woodColor && woodColor === 'Natural Oak')) &&
      (s.skuType === skuType || (!s.skuType && skuType === 'standard'))
    );
  }, [length, height, wallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, savedSKUs]);

  const pipePreparationSummary = useMemo(() => {
    const parts: Record<string, { name: string, color: string, qty: number, type: string }> = {};
    preparationData.forEach(order => {
      order.items.forEach(config => {
        const cutlist = getCutlistItems(config);
        cutlist.forEach(item => {
          if (item.type === 'wood') return;
          // Filter by color if not 'All'
          if (prepColorFilter !== 'All' && item.color !== prepColorFilter) return;

          const key = `${item.partName}-${item.color}`;
          if (!parts[key]) {
            parts[key] = { name: item.partName, color: item.color || 'N/A', qty: 0, type: item.type };
          }
          parts[key].qty += item.qty;
        });
      });
    });
    return Object.values(parts);
  }, [preparationData, prepColorFilter]);

  const woodPreparationSummary = useMemo(() => {
    const parts: Record<string, { name: string, color: string, qty: number, type: string }> = {};
    preparationData.forEach(order => {
      order.items.forEach(config => {
        const cutlist = getCutlistItems(config);
        cutlist.forEach(item => {
          if (item.type !== 'wood') return;
          // Filter by color if not 'All'
          if (prepColorFilter !== 'All' && item.color !== prepColorFilter) return;

          const key = `${item.partName}-${item.color}`;
          if (!parts[key]) {
            parts[key] = { name: item.partName, color: item.color || 'N/A', qty: 0, type: item.type };
          }
          parts[key].qty += item.qty;
        });
      });
    });
    return Object.values(parts);
  }, [preparationData, prepColorFilter]);

  const woodSummary = useMemo(() => {
    const parts: Record<string, { name: string, color: string, qty: number, type: string }> = {};
    preparationData.forEach(order => {
      order.items.forEach(config => {
        const cutlist = getCutlistItems(config);
        cutlist.forEach(item => {
          if (item.type === 'wood') {
            const key = `${item.partName}-${item.color}`;
            if (!parts[key]) {
              parts[key] = { name: item.partName, color: item.color || 'N/A', qty: 0, type: item.type };
            }
            parts[key].qty += item.qty;
          }
        });
      });
    });
    return Object.values(parts);
  }, [preparationData]);

  const handleDownloadAssembly = async () => {
    (window as any).__PDF_MODE = true;
    try {
      // If we're off-screen downloading, the container will be the hidden one
      let container = document.getElementById('assembly-canvas-container-hidden');
      if (!container) {
        container = document.getElementById('assembly-canvas-container');
      }
      if (!container) {
        alert("Failed to find the 3D canvas container to take a picture of.");
        return;
      }

      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null // Transparent background
      });

      // Automatically crop transparency to tightly bound the 3D model
      let croppedCanvas = canvas;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const l = pixels.data.length;
        let bound = { top: canvas.height, left: canvas.width, bottom: 0, right: 0 };

        let hasVisiblePixels = false;
        for (let i = 0; i < l; i += 4) {
          if (pixels.data[i + 3] > 10) { // Ignore faint artifacts like shadows
            hasVisiblePixels = true;
            const x = (i / 4) % canvas.width;
            const y = ~~((i / 4) / canvas.width);
            if (x < bound.left) bound.left = x;
            if (y < bound.top) bound.top = y;
            if (x > bound.right) bound.right = x;
            if (y > bound.bottom) bound.bottom = y;
          }
        }

        if (hasVisiblePixels) {
          const pad = 20;
          bound.top = Math.max(0, bound.top - pad);
          bound.left = Math.max(0, bound.left - pad);
          bound.right = Math.min(canvas.width, bound.right + pad);
          bound.bottom = Math.min(canvas.height, bound.bottom + pad);

          const trimWidth = bound.right - bound.left;
          const trimHeight = bound.bottom - bound.top;

          if (trimWidth > 0 && trimHeight > 0 && (trimWidth < canvas.width || trimHeight < canvas.height)) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = trimWidth;
            tempCanvas.height = trimHeight;
            const cCtx = tempCanvas.getContext('2d');
            if (cCtx) {
              cCtx.putImageData(ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight), 0, 0);
              croppedCanvas = tempCanvas; // Replace original with the trimmed canvas
            }
          }
        } else {
          console.warn("The canvas appears to be completely empty. The generated PDF will likely be blank.");
        }
      }

      const imgData = croppedCanvas.toDataURL('image/png');
      const doc = new jsPDF('l', 'mm', 'a4');

      const activeOrderNum = (window as any).__ACTIVE_ASSEMBLY_ORDER;
      doc.setFontSize(22);
      doc.text(`Assembly Guide: ${skuType.toUpperCase()}${activeOrderNum ? ` | Order #${activeOrderNum}` : ''}`, 14, 20);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Pipe Color: ${colorName}${hasShelves ? ` | Wood Finish: ${woodColor}` : ''}`, 14, 27);

      // Calculate Image Dimensions to fit strictly in the left 2/3rds of the page
      const MAX_IMG_WIDTH = 195;
      const MAX_IMG_HEIGHT = 170;

      let imgRenderWidth = MAX_IMG_WIDTH;
      let imgRenderHeight = (croppedCanvas.height * imgRenderWidth) / croppedCanvas.width;

      if (imgRenderHeight > MAX_IMG_HEIGHT) {
        imgRenderHeight = MAX_IMG_HEIGHT;
        imgRenderWidth = (croppedCanvas.width * imgRenderHeight) / croppedCanvas.height;
      }

      // Align image to center vertically and horizontally within the left block
      const xOffset = 14 + (MAX_IMG_WIDTH - imgRenderWidth) / 2;
      const yOffset = Math.max(32, (210 - imgRenderHeight) / 2); // Ensure it doesn't overlap the title
      doc.addImage(imgData, 'PNG', xOffset, yOffset, imgRenderWidth, imgRenderHeight);

      // Add cutlist table on the right side
      const items = getCutlistItems({
        length,
        height,
        wallDistance,
        hasShelves,
        isFreestanding,
        colorName,
        woodColor,
        skuType,
        quantity,
        tubeType,
        tiers
      });

      const tableData = items.map(item => [
        item.partName,
        item.qty.toString(),
        (item as any).dimension || '-',
        (item as any).note || '-'
      ]);

      autoTable(doc, {
        startY: 20,
        margin: { left: 215, right: 14 },
        head: [['Part', 'Qty', 'Size', 'Note']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [220, 220, 220] },
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] }
      });

      console.log('PDF Generated smoothly, saving...');
      doc.save(`Assembly_Guide_${skuType}.pdf`);
    } catch (e: any) {
      console.error('Failure in handleDownloadAssembly:', e);
      alert(`Failed to generate assembly guide. ${e.message || 'Please try again.'}`);
    } finally {
      (window as any).__PDF_MODE = false;
    }
  };

  const downloadPreparationPDF = () => {
    const doc = new jsPDF();
    const colorsToProcess = prepColorFilter === 'All'
      ? availablePrepColors.filter(c => c !== 'All')
      : [prepColorFilter];

    let isFirstPage = true;

    colorsToProcess.forEach((color) => {
      const pipeTableData: any[] = [];
      const squarePipeTableData: any[] = [];
      const woodTableData: any[] = [];
      const pipeSummary: Record<string, number> = {};
      const squarePipeSummary: Record<string, number> = {};
      const woodSummary: Record<string, number> = {};

      preparationData.forEach(order => {
        order.items.forEach(config => {
          const items = getCutlistItems(config);
          items.forEach(item => {
            if (item.color === color) {
              const row = [
                new Date(order.date).toLocaleDateString(),
                order.orderNumber,
                order.buyerName,
                item.partName,
                item.qty,
                order.status
              ];

              if (item.type === 'wood') {
                woodTableData.push(row);
                woodSummary[item.partName] = (woodSummary[item.partName] || 0) + item.qty;
              } else {
                if (item.partName.toLowerCase().includes('square')) {
                  squarePipeTableData.push(row);
                  squarePipeSummary[item.partName] = (squarePipeSummary[item.partName] || 0) + item.qty;
                } else {
                  pipeTableData.push(row);
                  pipeSummary[item.partName] = (pipeSummary[item.partName] || 0) + item.qty;
                }
              }
            }
          });
        });
      });

      if (pipeTableData.length > 0 || squarePipeTableData.length > 0 || woodTableData.length > 0) {
        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;

        doc.setFontSize(20);
        doc.setTextColor(0);
        doc.text(`Preparation List (${prepTab === 'active' ? 'To Prepare' : 'Prepared'}) - ${color}`, 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);

        let currentY = 40;

        // Round Pipes & Fittings Section
        if (pipeTableData.length > 0) {
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text('Round Pipes & Fittings', 14, currentY);
          currentY += 5;

          const summaryData = Object.entries(pipeSummary).map(([name, qty]) => [name, qty]);
          autoTable(doc, {
            startY: currentY,
            head: [['Part Name', 'Total Qty']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [60, 60, 60] }
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;

          autoTable(doc, {
            startY: currentY,
            head: [['Date', 'Order #', 'Buyer', 'Part Name', 'Qty', 'Status']],
            body: pipeTableData,
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 0] }
          });

          currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        // Square Pipes & Fittings Section
        if (squarePipeTableData.length > 0) {
          if (currentY > 240) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text('Square Pipes & Fittings', 14, currentY);
          currentY += 5;

          const summaryData = Object.entries(squarePipeSummary).map(([name, qty]) => [name, qty]);
          autoTable(doc, {
            startY: currentY,
            head: [['Part Name', 'Total Qty']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [60, 60, 60] }
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;

          autoTable(doc, {
            startY: currentY,
            head: [['Date', 'Order #', 'Buyer', 'Part Name', 'Qty', 'Status']],
            body: squarePipeTableData,
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 0] }
          });

          currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        // Wood Section
        if (woodTableData.length > 0) {
          if (currentY > 240) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text('Wood Parts', 14, currentY);
          currentY += 5;

          const summaryData = Object.entries(woodSummary).map(([name, qty]) => [name, qty]);
          autoTable(doc, {
            startY: currentY,
            head: [['Wood Part', 'Total Qty']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [139, 69, 19] }
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;

          autoTable(doc, {
            startY: currentY,
            head: [['Date', 'Order #', 'Buyer', 'Part Name', 'Qty', 'Status']],
            body: woodTableData,
            theme: 'grid',
            headStyles: { fillColor: [101, 67, 33] }
          });
        }
      }
    });

    if (isFirstPage) {
      doc.setFontSize(12);
      doc.text('No items found for the selected color filter.', 14, 22);
    }

    doc.save(`Prep_${prepTab}_${prepColorFilter.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleSave = () => {
    const name = prompt('Enter SKU name:', `SKU ${110 + savedSKUs.length}`);
    if (name) {
      const normalizedName = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const existingIndex = savedSKUs.findIndex(s => s.name.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalizedName);
      const newSku = { name, length, height, wallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, tiers };

      if (existingIndex >= 0) {
        if (confirm(`SKU "${name}" already exists. Do you want to overwrite it?`)) {
          const newSkus = [...savedSKUs];
          newSkus[existingIndex] = newSku;
          setSavedSKUs(newSkus);
        }
      } else {
        setSavedSKUs([...savedSKUs, newSku]);
      }
    }
  };

  const handleDeleteSKU = (nameToRemove: string) => {
    setSavedSKUs(prev => prev.filter(s => s.name !== nameToRemove));
  };

  const handleSearchSKU = () => {
    const searchVal = configSearch.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const found = savedSKUs.find(s => s.name.toUpperCase().replace(/[^A-Z0-9]/g, '').includes(searchVal));
    if (found) {
      setLength(found.length);
      setHeight(found.height);
      setWallDistance(found.wallDistance);
      setHasShelves(found.hasShelves);
      setIsFreestanding(found.isFreestanding);
      setColorName(found.colorName || 'Raw grey');
      setWoodColor(found.woodColor || 'Natural Oak');
      setSkuType(found.skuType || 'standard');
      if (found.tiers) setTiers(found.tiers);
      if (found.tubeType) setTubeType(found.tubeType);
      setConfigSearch('');
    } else {
      alert('SKU not found');
    }
  };

  // Hidden canvas strictly for PDF generation from other views. We make it very large to prevent drawn HTML labels from spilling out of bounds and getting clipped by html2canvas
  const hiddenCanvasHtml = pendingAutoDownload && view !== 'configurator' ? (
    <div id="assembly-canvas-container-hidden" className="fixed top-0 left-0 w-[2000px] h-[1500px] pointer-events-none z-[-50] opacity-100">
      <Canvas gl={{ preserveDrawingBuffer: true, alpha: true }}>
        <LabelContext.Provider value={{ size: labelSize, distance: labelDistance }}>
          <Suspense fallback={null}>
            <Scene length={length} height={height} wallDistance={wallDistance} explode={0.7} hasShelves={hasShelves} isFreestanding={isFreestanding} colorOption={COLORS[colorName]} skuType={skuType} woodColor={woodColor} cameraState={(window as any).__ACTIVE_ASSEMBLY_CAMERA} tiers={tiers} tubeType={tubeType} />
          </Suspense>
        </LabelContext.Provider>
      </Canvas>
    </div>
  ) : null;

  if (view === 'orders') {
    const activeOrders = orders.filter(o => o.status !== 'Archived');
    const historyOrders = orders.filter(o => o.status === 'Archived');
    const displayOrders = showHistory ? historyOrders : activeOrders;

    const pendingCount = activeOrders.filter(o => o.status === 'Pending').length;
    const processingCount = activeOrders.filter(o => o.status === 'Processing').length;
    const preparedCount = activeOrders.filter(o => o.status === 'Prepared').length;
    const dispatchedCount = activeOrders.filter(o => o.status === 'Dispatched').length;

    let filteredOrders = displayOrders;
    if (orderColorFilter !== 'All') {
      filteredOrders = filteredOrders.filter(order =>
        order.items.some((item: any) => item.colorName === orderColorFilter)
      );
    }

    let sortedOrders = [...filteredOrders];
    if (orderSortBy === 'date-desc') {
      sortedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (orderSortBy === 'date-asc') {
      sortedOrders.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (orderSortBy === 'status') {
      const statusOrder: Record<string, number> = { 'Pending': 1, 'Processing': 2, 'Prepared': 3, 'Dispatched': 4, 'Archived': 5 };
      sortedOrders.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
    }

    const availableOrderColors = ['All', ...Array.from(new Set(displayOrders.flatMap(o => o.items.map((i: any) => i.colorName))))];

    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Navbar view={view} setView={setView} ordersCount={orders.filter(o => o.status !== 'Archived').length} currentSku={currentSku} skuType={skuType} syncStatus={syncStatus} />

        <div className="bg-white border-b border-gray-100 p-4 md:px-8 md:py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-[73px] z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full md:w-auto">
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">{showHistory ? 'Order History' : 'Active Orders'}</h1>
              <span className="text-xs md:text-sm font-medium text-gray-500 bg-gray-100 px-2 lg:px-2.5 py-1 rounded-full whitespace-nowrap">{filteredOrders.length} total</span>
            </div>
            <nav className="flex gap-2 min-w-max pb-1 sm:pb-0 overflow-x-auto scrollbar-hide w-full sm:w-auto">
              <button
                onClick={() => setShowHistory(false)}
                className={`text-xs md:text-sm font-semibold px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all whitespace-nowrap ${!showHistory ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                Active
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`text-xs md:text-sm font-semibold px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all whitespace-nowrap ${showHistory ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                History
              </button>
            </nav>
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button
              onClick={importOrders}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold text-xs md:text-sm transition-all border border-gray-200 flex items-center justify-center flex-1 md:flex-none gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-4 md:h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
              <span>Import<span className="hidden sm:inline"> Orders</span></span>
            </button>
            <button
              onClick={exportOrders}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold text-xs md:text-sm transition-all border border-gray-200 flex items-center justify-center flex-1 md:flex-none gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-4 md:h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
              Export
            </button>
          </div>
        </div>

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          {expandedOrderId ? (
            <OrderDetailsView
              order={orders.find(o => o.id === expandedOrderId)}
              renderPreview={(sku: any) => <PreviewScene sku={sku} />}
              onBack={() => setExpandedOrderId(null)}
              onOrderChange={(updatedOrder: Order) => {
                const newOrders = [...orders];
                const idx = newOrders.findIndex(o => o.id === updatedOrder.id);
                if (idx > -1) {
                  newOrders[idx] = updatedOrder;
                  setOrders(newOrders);
                }
              }}
              onAddSubOrder={() => {
                setAddingToOrderId(expandedOrderId);
                setView('configurator');
              }}
              onViewAssemblyGuide={(config: any) => {
                setLength(config.length);
                setHeight(config.height);
                setWallDistance(config.wallDistance);
                setSkuType(config.skuType || 'standard');
                setWoodColor(config.woodColor || 'Natural Oak');
                setColorName(config.colorName || 'Raw grey');
                setTubeType(config.tubeType || 'round');
                setHasShelves(config.hasShelves);
                setIsFreestanding(config.isFreestanding);
                setQuantity(config.quantity || 1);

                // Set order number first so the filename generator picks it up correctly
                const order = orders.find(o => o.id === expandedOrderId);
                if (order) {
                  (window as any).__ACTIVE_ASSEMBLY_ORDER = order.orderNumber;
                }

                (window as any).__ACTIVE_ASSEMBLY_CAMERA = config.cameraState;
                setPendingAutoDownload(true);
              }}
              onDownloadAllAssemblies={(items: any[], orderNumber: string) => {
                if (!items || items.length === 0) return;

                const first = items[0];
                const rest = items.slice(1).map((config, i) => ({
                  config,
                  orderNumber,
                  itemIndex: i + 2,
                  totalItems: items.length
                }));

                downloadQueueRef.current = rest;

                setLength(first.length);
                setHeight(first.height);
                setWallDistance(first.wallDistance);
                setSkuType(first.skuType || 'standard');
                setWoodColor(first.woodColor || 'Natural Oak');
                setColorName(first.colorName || 'Raw grey');
                setTubeType(first.tubeType || 'round');
                setHasShelves(first.hasShelves);
                setIsFreestanding(first.isFreestanding);
                setQuantity(first.quantity || 1);

                (window as any).__ACTIVE_ASSEMBLY_ORDER = items.length > 1 ? `${orderNumber} (Item 1/${items.length})` : orderNumber;
                (window as any).__ACTIVE_ASSEMBLY_CAMERA = first.cameraState;
                setPendingAutoDownload(true);
              }}
              pendingAutoDownload={pendingAutoDownload}
              onOpenInConfigurator={(config: any) => {
                setLength(config.length);
                setHeight(config.height);
                setWallDistance(config.wallDistance);
                setSkuType(config.skuType || 'standard');
                setWoodColor(config.woodColor || 'Natural Oak');
                setColorName(config.colorName || 'Raw grey');
                setTubeType(config.tubeType || 'round');
                setHasShelves(config.hasShelves);
                setIsFreestanding(config.isFreestanding);
                setQuantity(config.quantity || 1);
                setView('configurator');
              }}
            />
          ) : (
            <>
              {!showHistory && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8">
                  <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <div className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Active</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{activeOrders.length}</div>
                  </div>
                  <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <div className="text-[10px] md:text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">Pending</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{pendingCount}</div>
                  </div>
                  <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <div className="text-[10px] md:text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">Processing</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{processingCount}</div>
                  </div>
                  <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <div className="text-[10px] md:text-xs font-semibold text-purple-500 uppercase tracking-wider mb-1">Prepared</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{preparedCount}</div>
                  </div>
                  <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center col-span-2 md:col-span-1">
                    <div className="text-[10px] md:text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">Dispatched</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{dispatchedCount}</div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
                <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm w-max">
                  <button
                    onClick={() => setOrderViewMode('grid')}
                    className={`p-1.5 px-3 sm:px-1.5 rounded-md transition-colors flex items-center justify-center ${orderViewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Grid View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                  </button>
                  <button
                    onClick={() => setOrderViewMode('list')}
                    className={`p-1.5 px-3 sm:px-1.5 rounded-md transition-colors flex items-center justify-center ${orderViewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                    title="List View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center gap-2 justify-between w-full sm:w-auto">
                    <span className="text-sm font-medium text-gray-500 min-w-max">Color:</span>
                    <select
                      value={orderColorFilter}
                      onChange={(e) => setOrderColorFilter(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-black shadow-sm flex-1 sm:flex-none sm:min-w-[120px]"
                    >
                      {availableOrderColors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 justify-between w-full sm:w-auto">
                    <span className="text-sm font-medium text-gray-500 min-w-max">Sort by:</span>
                    <select
                      value={orderSortBy}
                      onChange={(e) => setOrderSortBy(e.target.value as any)}
                      className="border border-gray-200 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-black shadow-sm flex-1 sm:flex-none sm:min-w-[140px]"
                    >
                      <option value="date-desc">Newest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                </div>
              </div>

              {sortedOrders.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{showHistory ? 'No History' : 'No Active Orders'}</h3>
                  <p className="text-gray-500 text-sm">{showHistory ? 'Orders moved to history will appear here.' : 'Create an order from the configurator to see it here.'}</p>
                </div>
              ) : (
                <div className={orderViewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                  {sortedOrders.map(order => {
                    const orderColors = Array.from(new Set(order.items.map((item: any) => item.colorName)));
                    return (
                      <div
                        key={order.id}
                        className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group relative ${orderViewMode === 'list' ? 'flex items-center gap-4' : 'flex flex-col'}`}
                        onClick={() => setExpandedOrderId(order.id)}
                      >
                        {/* Status + action buttons */}
                        <div className={`flex justify-between items-start ${orderViewMode === 'list' ? 'shrink-0 w-44' : 'mb-4'}`}>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${order.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            order.status === 'Processing' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              order.status === 'Prepared' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                order.status === 'Dispatched' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  'bg-gray-50 text-gray-700 border border-gray-100'
                            }`}>
                            {order.status}
                          </span>
                          <div className="flex gap-1.5">
                            {order.status === 'Dispatched' && !showHistory && (
                              <button onClick={(e) => { e.stopPropagation(); setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'Archived' as const } : o)); }} className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors" title="Move to History">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                              </button>
                            )}
                            {showHistory && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'Dispatched' as const } : o)); }} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="Restore Order">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure you want to permanently delete this order?')) setOrders(orders.filter(o => o.id !== order.id)); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Delete Permanently">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 3D Preview — grid mode only */}
                        {orderViewMode === 'grid' && order.items[0] && (
                          <div className="w-full aspect-video bg-gray-50 rounded-xl mb-4 overflow-hidden relative border border-gray-100 shadow-inner group-hover:scale-[1.02] transition-transform">
                            <PreviewScene sku={order.items[0]} />
                          </div>
                        )}

                        {/* Order info */}
                        <div className={`flex-1 ${orderViewMode === 'list' ? 'flex items-center gap-8' : ''}`}>
                          <div className={orderViewMode === 'list' ? 'w-48 shrink-0' : 'mb-3'}>
                            <h3 className="font-bold text-lg text-gray-900 tracking-tight">{order.orderNumber}</h3>
                            <div className="text-sm font-medium text-gray-500">{order.buyerName}</div>
                          </div>
                          <div className={`flex items-center gap-2 ${orderViewMode === 'list' ? 'w-32' : 'mb-3'}`}>
                            {orderColors.map((color: any) => (
                              <div key={color} className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: COLORS[color as keyof typeof COLORS]?.pipeColor || '#ccc' }} title={color as string} />
                            ))}
                            <span className="text-xs font-medium text-gray-400 ml-1">{order.items.length} items</span>
                          </div>
                          <div className={`flex items-center gap-2 text-xs font-medium text-gray-400 ${orderViewMode === 'list' ? 'w-36' : 'mb-5'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            {new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>

                        {/* View Details button */}
                        <button className={`${orderViewMode === 'list' ? 'px-6 shrink-0' : 'w-full'} py-2.5 flex items-center justify-center gap-2 bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 group-hover:bg-black group-hover:text-white transition-colors mt-auto`}>
                          View Details
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
        {hiddenCanvasHtml}
      </div >
    );
  }

  if (view === 'inventory') {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Navbar view={view} setView={setView} ordersCount={orders.filter(o => o.status !== 'Archived').length} currentSku={currentSku} skuType={skuType} syncStatus={syncStatus} />
        <header className="bg-white border-b border-gray-100 p-4 md:px-8 md:py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-[73px] z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full md:w-auto">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Inventory Database</h1>
            <span className="text-xs md:text-sm font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{inventoryData.length} unique parts</span>
          </div>
        </header>
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Part Name</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Color</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventoryData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-gray-900">{item.name}</td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-700">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.type === 'wood' ? WOOD_COLORS[item.color] : COLORS[item.color]?.pipeColor }}></span>
                        {item.color}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-500 capitalize">{item.type}</td>
                    <td className="px-8 py-5 text-right font-mono font-bold text-blue-600 text-lg">{item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'preparation') {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Navbar view={view} setView={setView} ordersCount={orders.filter(o => o.status !== 'Archived').length} currentSku={currentSku} skuType={skuType} syncStatus={syncStatus} />
        <header className="bg-white border-b border-gray-100 p-4 md:px-8 md:py-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sticky top-[73px] z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Preparation List</h1>
              <span className="text-xs md:text-sm font-medium text-gray-500 bg-gray-100 px-2 lg:px-2.5 py-1 rounded-full whitespace-nowrap">{preparationData.length} orders</span>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setPrepTab('active')}
                className={`px-3 py-1.5 md:py-1 text-xs md:text-sm font-bold rounded-md transition-all flex-1 sm:flex-none whitespace-nowrap ${prepTab === 'active' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                To Prepare
              </button>
              <button
                onClick={() => setPrepTab('prepared')}
                className={`px-3 py-1.5 md:py-1 text-xs md:text-sm font-bold rounded-md transition-all flex-1 sm:flex-none whitespace-nowrap ${prepTab === 'prepared' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Prepared
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center justify-between sm:justify-end gap-2 bg-gray-50 p-1.5 md:p-1 rounded-xl border border-gray-100">
              <span className="text-[10px] md:text-xs font-bold text-gray-400 px-2 uppercase tracking-wider whitespace-nowrap">Filter Color:</span>
              <select
                value={prepColorFilter}
                onChange={(e) => setPrepColorFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-black flex-1 sm:flex-none"
              >
                {availablePrepColors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {prepTab === 'active' && preparationData.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to mark all these orders as prepared? They will be moved to the Prepared tab.')) {
                      const prepIds = new Set(preparationData.map(o => o.id));
                      const newOrders = orders.map(o => prepIds.has(o.id) ? { ...o, status: 'Prepared' as const } : o);
                      setOrders(newOrders);
                    }
                  }}
                  className="flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 bg-purple-50 text-purple-700 rounded-xl md:rounded-full hover:bg-purple-100 font-medium text-xs md:text-sm transition-all shadow-sm flex items-center justify-center gap-2 border border-purple-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 6 9 17l-5-5" /><path d="m20 12-8.5 8.5-1.5-1.5" /><path d="m11.5 11.5-3-3" /></svg>
                  <span className="whitespace-nowrap">Mark All Prepared</span>
                </button>
              )}
              <button
                onClick={downloadPreparationPDF}
                className="flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 bg-emerald-600 text-white rounded-xl md:rounded-full hover:bg-emerald-700 font-medium text-xs md:text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                <span className="whitespace-nowrap">Download PDF</span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {preparationData.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Orders to Prepare</h3>
              <p className="text-gray-500 text-sm">All orders are either dispatched or archived.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Wood Summary Section */}
              {woodSummary.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-amber-800 text-white rounded-lg flex items-center justify-center font-bold text-sm">W</div>
                    <h2 className="text-xl font-bold text-gray-900">Wood Summary (All Quantity)</h2>
                  </div>
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-amber-50 border-b border-amber-100">
                        <tr>
                          <th className="px-8 py-4 text-xs font-bold text-amber-800 uppercase tracking-wider">Wood Part</th>
                          <th className="px-8 py-4 text-xs font-bold text-amber-800 uppercase tracking-wider">Finish</th>
                          <th className="px-8 py-4 text-xs font-bold text-amber-800 uppercase tracking-wider text-right">Total Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {woodSummary.map((item, idx) => (
                          <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                            <td className="px-8 py-4 font-bold text-gray-900">{item.name}</td>
                            <td className="px-8 py-4">
                              <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100/50 rounded-full text-xs font-bold text-amber-900">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: WOOD_COLORS[item.color] }}></span>
                                {item.color}
                              </span>
                            </td>
                            <td className="px-8 py-4 text-right font-mono font-bold text-amber-700 text-lg">{item.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Summary Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-sm">Σ</div>
                    <h2 className="text-xl font-bold text-gray-900">Pipes & Fittings Summary</h2>
                  </div>
                  {prepColorFilter !== 'All' && (
                    <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      Filtered by: {prepColorFilter}
                    </span>
                  )}
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Part Name</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Color</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pipePreparationSummary.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-8 py-12 text-center text-gray-500 italic">No pipes or fittings found for this color.</td>
                        </tr>
                      ) : pipePreparationSummary.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-4 font-bold text-gray-900">{item.name}</td>
                          <td className="px-8 py-4">
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-700">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.type === 'wood' ? WOOD_COLORS[item.color] : COLORS[item.color]?.pipeColor }}></span>
                              {item.color}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-right font-mono font-bold text-emerald-600 text-lg">{item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Wood Summary (Filtered) */}
              {woodPreparationSummary.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-800 text-white rounded-lg flex items-center justify-center font-bold text-sm">W</div>
                      <h2 className="text-xl font-bold text-gray-900">Wood Summary (Filtered)</h2>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-amber-50 border-b border-amber-100">
                        <tr>
                          <th className="px-8 py-4 text-xs font-bold text-amber-800 uppercase tracking-wider">Wood Part</th>
                          <th className="px-8 py-4 text-xs font-bold text-amber-800 uppercase tracking-wider">Finish</th>
                          <th className="px-8 py-4 text-xs font-bold text-amber-800 uppercase tracking-wider text-right">Total Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {woodPreparationSummary.map((item, idx) => (
                          <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                            <td className="px-8 py-4 font-bold text-gray-900">{item.name}</td>
                            <td className="px-8 py-4">
                              <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100/50 rounded-full text-xs font-bold text-amber-900">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: WOOD_COLORS[item.color] }}></span>
                                {item.color}
                              </span>
                            </td>
                            <td className="px-8 py-4 text-right font-mono font-bold text-amber-700 text-lg">{item.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Detailed Orders Section */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Breakdown by Order</h2>
                </div>
                <div className="space-y-6">
                  {preparationData.map(order => {
                    const allItems: any[] = [];
                    order.items.forEach(config => {
                      allItems.push(...getCutlistItems(config));
                    });

                    const items = allItems.filter(item =>
                      prepColorFilter === 'All' || item.color === prepColorFilter
                    );

                    if (items.length === 0) return null;

                    return (
                      <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                        <div className="px-8 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-xl border border-gray-100 overflow-hidden relative shadow-inner">
                              <PreviewScene sku={order.items[0]} />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Order #{order.orderNumber}</span>
                              <h3 className="text-lg font-bold text-gray-900">{order.buyerName}</h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                              order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                              {order.status}
                            </span>
                            <button
                              onClick={() => {
                                const newOrders = orders.map(o => o.id === order.id ? { ...o, status: 'Prepared' as const } : o);
                                setOrders(newOrders);
                              }}
                              className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-100 transition-colors border border-purple-100 flex items-center gap-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                              Mark as Prepared
                            </button>
                          </div>
                        </div>
                        <div className="p-6 space-y-8">
                          {/* Pipes & Fittings Breakdown */}
                          {items.filter(i => i.type !== 'wood').length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pipes & Fittings</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {items.filter(i => i.type !== 'wood').map((item, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div>
                                      <div className="text-sm font-bold text-gray-900">{item.partName}</div>
                                      <div className="text-xs text-gray-500">{item.color}</div>
                                    </div>
                                    <div className="text-xl font-mono font-bold text-black">×{item.qty}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Wood Breakdown */}
                          {items.filter(i => i.type === 'wood').length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">Wood Parts</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {items.filter(i => i.type === 'wood').map((item, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
                                    <div>
                                      <div className="text-sm font-bold text-gray-900">{item.partName}</div>
                                      <div className="text-xs text-gray-500">{item.color}</div>
                                    </div>
                                    <div className="text-xl font-mono font-bold text-amber-900">×{item.qty}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </main>
      </div >
    );
  }

  return (
    <div ref={appRef} className="w-full h-screen bg-white flex flex-col overflow-hidden relative">


      <Navbar
        view={view}
        setView={setView}
        ordersCount={orders.filter(o => o.status !== 'Archived').length}
        currentSku={currentSku}
        skuType={skuType}
        configSearch={configSearch}
        setConfigSearch={setConfigSearch}
        onSearchSKU={handleSearchSKU}
        syncStatus={syncStatus}
      />

      {/* SKU Library View */}
      {view === 'library' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          <div className="p-8 border-b border-gray-200 bg-white flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">SKU Library</h2>
                <p className="text-gray-500 text-sm mt-1">Browse and select models to configure.</p>
              </div>
              <div className="relative max-w-md w-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                <input
                  type="text"
                  placeholder="Search SKUs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(['All', 'Standard', 'Shelves', 'Freestanding', 'Special'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLibraryCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${libraryCategory === cat
                    ? 'bg-black text-white shadow-lg'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  {cat}
                </button>
              ))}
              {savedSKUs.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const filtered = savedSKUs.filter(sku => {
                      const matchesSearch = sku.name.toLowerCase().includes(searchQuery.toLowerCase());
                      if (!matchesSearch) return false;
                      if (libraryCategory === 'All') return true;
                      if (libraryCategory === 'Shelves') return sku.hasShelves || sku.skuType === 'sku000';
                      if (libraryCategory === 'Freestanding') return sku.isFreestanding;
                      if (libraryCategory === 'Standard') return sku.skuType === 'standard' && !sku.hasShelves && !sku.isFreestanding;
                      if (libraryCategory === 'Special') return sku.skuType !== 'standard' && sku.skuType !== 'sku000';
                      return true;
                    });
                    if (selectedSKUs.length === filtered.length && filtered.length > 0) {
                      setSelectedSKUs([]);
                    } else {
                      setSelectedSKUs(filtered.map(s => s.name));
                    }
                  }}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ml-auto ${selectedSKUs.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  {selectedSKUs.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
              )}
              {selectedSKUs.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete ${selectedSKUs.length} selected SKU(s)?`)) {
                      setSavedSKUs(prev => prev.filter(s => !selectedSKUs.includes(s.name)));
                      setSelectedSKUs([]);
                    }
                  }}
                  className="px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap bg-red-600 text-white shadow-lg hover:bg-red-700"
                >
                  Delete Selected ({selectedSKUs.length})
                </button>
              )}
            </div>
          </div>

          <div ref={libraryScrollRef} className="p-8 overflow-y-auto flex-1 pb-32 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {savedSKUs
                .filter(sku => {
                  const matchesSearch = sku.name.toLowerCase().includes(searchQuery.toLowerCase());
                  if (!matchesSearch) return false;

                  if (libraryCategory === 'All') return true;
                  if (libraryCategory === 'Shelves') return sku.hasShelves || sku.skuType === 'sku000';
                  if (libraryCategory === 'Freestanding') return sku.isFreestanding;
                  if (libraryCategory === 'Standard') return sku.skuType === 'standard' && !sku.hasShelves && !sku.isFreestanding;
                  if (libraryCategory === 'Special') return sku.skuType !== 'standard' && sku.skuType !== 'sku000';
                  return true;
                })
                .map((sku) => (
                  <div
                    key={sku.name}
                    className="group bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer flex flex-col shadow-sm"
                    onClick={() => {
                      setLength(sku.length);
                      setHeight(sku.height);
                      setWallDistance(sku.wallDistance);
                      setHasShelves(sku.hasShelves);
                      setIsFreestanding(sku.isFreestanding);
                      setColorName(sku.colorName || 'Raw grey');
                      setWoodColor(sku.woodColor || 'Natural Oak');
                      setSkuType(sku.skuType || 'standard');
                      if (sku.tiers) setTiers(sku.tiers);
                      setView('configurator');
                    }}
                  >
                    <div className="aspect-[4/3] bg-white relative overflow-hidden border-b border-gray-100 group-hover:bg-gray-50 transition-colors">
                      <div className="w-full h-full relative z-10">
                        <LazyPreviewScene sku={sku} />
                      </div>
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                        {sku.hasShelves && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-sm w-fit border border-amber-200/50 backdrop-blur-sm">Shelves</span>
                        )}
                        {sku.isFreestanding && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-sm w-fit border border-blue-200/50 backdrop-blur-sm">Freestanding</span>
                        )}
                      </div>
                      <div className="absolute top-4 right-4 z-20">
                        <label
                          className="flex items-center justify-center w-8 h-8 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSKUs.includes(sku.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSKUs(prev => [...prev, sku.name]);
                              } else {
                                setSelectedSKUs(prev => prev.filter(n => n !== sku.name));
                              }
                            }}
                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-xl text-gray-900 leading-tight group-hover:text-black transition-colors">{sku.name}</h3>
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">
                            {sku.skuType || 'Standard'}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete ${sku.name}?`)) {
                              handleDeleteSKU(sku.name);
                            }
                          }}
                          className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-gray-50 p-2 rounded-xl text-center">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Width</div>
                          <div className="text-sm font-bold text-gray-700">{sku.length}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl text-center">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Height</div>
                          <div className="text-sm font-bold text-gray-700">{sku.height}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl text-center">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Depth</div>
                          <div className="text-sm font-bold text-gray-700">{sku.wallDistance}</div>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex -space-x-2">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: COLORS[sku.colorName || 'Raw grey']?.pipeColor }}
                            title={`Pipe: ${sku.colorName}`}
                          />
                          {sku.hasShelves && (
                            <div
                              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: WOOD_COLORS[sku.woodColor || 'Natural Oak'] }}
                              title={`Wood: ${sku.woodColor}`}
                            />
                          )}
                        </div>
                        <span className="text-sm font-bold text-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Configure
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {savedSKUs.filter(sku => {
              const matchesSearch = sku.name.toLowerCase().includes(searchQuery.toLowerCase());
              if (!matchesSearch) return false;
              if (libraryCategory === 'All') return true;
              if (libraryCategory === 'Shelves') return sku.hasShelves || sku.skuType === 'sku000';
              if (libraryCategory === 'Freestanding') return sku.isFreestanding;
              if (libraryCategory === 'Standard') return sku.skuType === 'standard' && !sku.hasShelves && !sku.isFreestanding;
              if (libraryCategory === 'Special') return sku.skuType !== 'standard' && sku.skuType !== 'sku000';
              return true;
            }).length === 0 && (
                <div className="text-center py-32 bg-white rounded-[40px] border border-gray-100 shadow-sm max-w-7xl mx-auto">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No SKUs found</h3>
                  <p className="text-gray-500">Try adjusting your search or category filter.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setLibraryCategory('All'); }}
                    className="mt-6 text-sm font-bold text-black underline underline-offset-4"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
          </div>
        </div>
      )}

      {view === 'configurator' && (
        <div className="flex-1 relative flex flex-col lg:block overflow-y-auto lg:overflow-hidden bg-gray-50 lg:bg-transparent custom-scrollbar">
          {/* Configuration Panel */}
          <div className="lg:absolute lg:top-6 lg:left-6 z-10 bg-white/90 lg:backdrop-blur-xl lg:rounded-[32px] lg:shadow-2xl w-full lg:w-[340px] border-b lg:border border-gray-200 lg:border-white/40 flex flex-col lg:max-h-[calc(100vh-3rem)] overflow-visible lg:overflow-hidden order-2 lg:order-none shrink-0 rounded-none shadow-sm">
            {/* Sticky Header */}
            <div className="p-4 lg:p-6 border-b border-gray-100/50 flex justify-between items-center bg-white sticky top-0 z-20 lg:bg-white/50 lg:static">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Configuration</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Editor</span>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">


              {/* Dimensions Section */}
              <section className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Dimensions</label>
                  <Tooltip text="Adjust the physical size of the rack">
                    <InfoIcon />
                  </Tooltip>
                </div>

                <div className="space-y-6">
                  {skuType !== 'sku114' && skuType !== 'sku120' && skuType !== 'sku122' && skuType !== 'sku152' && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-gray-700">Length</label>
                        <span className="text-xs font-mono font-bold text-black">{length} cm</span>
                      </div>
                      <input
                        type="range"
                        min={skuType === 'sku153' || skuType === 'sku154' ? 5 : skuType === 'sku116' || skuType === 'sku160' ? 50 : 30} max={(skuType === 'sku136' || skuType === 'sku137') ? "600" : "400"} step="5"
                        value={length}
                        onChange={(e) => setLength(Number(e.target.value))}
                        className="w-full accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}

                  {(skuType === 'sku106' || skuType === 'sku107' || skuType === 'sku129' || skuType === 'sku156' || skuType === 'sku157' || skuType === 'sku177') && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-gray-700">Tiers</label>
                        <span className="text-xs font-mono font-bold text-black">{tiers}</span>
                      </div>
                      <input
                        type="range"
                        min="2" max="10" step="1"
                        value={tiers}
                        onChange={(e) => setTiers(Number(e.target.value))}
                        className="w-full accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}

                  {((skuType as string) === 'standard' || skuType === 'sku000' || skuType === 'sku100' || skuType === 'sku4210' || skuType === 'sku105' || skuType === 'sku114' || skuType === 'sku116' || skuType === 'sku112' || skuType === 'sku111' || skuType === 'sku113' || skuType === 'sku117' || skuType === 'sku118' || skuType === 'sku119' || skuType === 'sku120' || skuType === 'sku121' || skuType === 'sku122' || skuType === 'sku123' || skuType === 'sku126' || skuType === 'sku127' || skuType === 'sku128' || skuType === 'sku130' || skuType === 'sku131' || skuType === 'sku132' || skuType === 'sku133' || skuType === 'sku135') && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-gray-700">Height</label>
                        <span className="text-xs font-mono font-bold text-black">{height} cm</span>
                      </div>
                      <input
                        type="range"
                        min={skuType === 'sku119' ? 5 : skuType === 'sku116' || skuType === 'sku133' ? 5 : skuType === 'sku122' ? 2 : skuType === 'sku128' ? 15 : 20} max={skuType === 'sku122' ? 10 : skuType === 'sku133' ? 30 : skuType === 'sku128' ? 100 : 250} step={skuType === 'sku122' || skuType === 'sku133' ? 1 : 5}
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}

                  {skuType !== 'sku108' && skuType !== 'sku109' && skuType !== 'sku110' && skuType !== 'sku111' && skuType !== 'sku113' && skuType !== 'sku116' && skuType !== 'sku119' && skuType !== 'sku120' && skuType !== 'sku121' && skuType !== 'sku122' && skuType !== 'sku123' && skuType !== 'sku143' && skuType !== 'sku153' && skuType !== 'sku154' && skuType !== 'sku155' && skuType !== 'sku156' && skuType !== 'sku157' && skuType !== 'sku169' && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-gray-700">{((skuType as string) === 'sku000' || (skuType as string) === 'sku106' || (skuType as string) === 'sku107' || (skuType as string) === 'sku129') ? 'Shelf Depth' : ((skuType as string) === 'sku111' || (skuType as string) === 'sku113' || (skuType as string) === 'sku116' || (skuType as string) === 'sku119' || (skuType as string) === 'sku124' || (skuType as string) === 'sku125') ? 'Drop Depth' : 'Depth'}</label>
                        <span className="text-xs font-mono font-bold text-black">{wallDistance} cm</span>
                      </div>
                      {skuType === 'sku000' || skuType === 'sku129' || skuType === 'sku162' ? (
                        <input
                          type="range"
                          min="15" max="23" step="8"
                          value={wallDistance}
                          onChange={(e) => setWallDistance(Number(e.target.value))}
                          className="w-full accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      ) : (skuType === 'sku106' || skuType === 'sku107') ? (
                        <input
                          type="range"
                          min="15" max="60" step="1"
                          value={wallDistance}
                          onChange={(e) => setWallDistance(Number(e.target.value))}
                          className="w-full accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      ) : ((skuType as string) === 'sku300' || (skuType as string) === 'sku103' || (skuType as string) === 'sku114' || (skuType as string) === 'sku115' || (skuType as string) === 'sku112' || (skuType as string) === 'sku117' || (skuType as string) === 'sku118' || (skuType as string) === 'sku119' || (skuType as string) === 'sku124' || (skuType as string) === 'sku125') ? (
                        <input
                          type="range"
                          min="8" max="60" step="1"
                          value={wallDistance}
                          onChange={(e) => setWallDistance(Number(e.target.value))}
                          className="w-full accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      ) : (skuType === 'sku200' || skuType === 'sku4210') ? (
                        <input
                          type="range"
                          min="20" max="60" step="5"
                          value={wallDistance}
                          onChange={(e) => setWallDistance(Math.max(20, Number(e.target.value)))}
                          className="w-full accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      ) : (skuType === 'sku102') ? (
                        <input
                          type="range"
                          min="25" max="60" step="5"
                          value={wallDistance}
                          onChange={(e) => setWallDistance(Math.max(25, Number(e.target.value)))}
                          className="w-full accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      ) : (
                        <input
                          type="range"
                          min="15" max="60" step="5"
                          value={wallDistance}
                          onChange={(e) => setWallDistance(Number(e.target.value))}
                          className="w-full accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Visualization Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Visualization</label>
                  <Tooltip text="See how the parts fit together">
                    <InfoIcon />
                  </Tooltip>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-gray-700">Exploded View</label>
                    <span className="text-xs font-mono font-bold text-black">{explode}</span>
                  </div>
                  <input
                    type="range"
                    min="0" max="20"
                    value={explode}
                    onChange={(e) => setExplode(Number(e.target.value))}
                    className="w-full accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </section>

              {/* Structure Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Structure</label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-700">
                      {(skuType === 'sku143' || skuType === 'sku169') ? 'Handrail Diameter' : 'Tube Type'}
                    </label>
                    <Tooltip text={(skuType === 'sku143' || skuType === 'sku169') ? "Select 33mm or 27mm handrail diameter" : "Select round or square tubes"}>
                      <InfoIcon />
                    </Tooltip>
                  </div>
                  <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => setTubeType('round')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${tubeType === 'round' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      {(skuType === 'sku143' || skuType === 'sku169') ? '33mm' : 'Round'}
                    </button>
                    <button
                      onClick={() => setTubeType('square')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${tubeType === 'square' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      {(skuType === 'sku143' || skuType === 'sku169') ? '27mm' : 'Square'}
                    </button>
                  </div>
                </div>

                {(skuType === 'standard' || skuType === 'sku107' || skuType === 'sku108' || skuType === 'sku109' || skuType === 'sku110' || skuType === 'sku115' || skuType === 'sku127' || skuType === 'sku128' || skuType === 'sku131' || skuType === 'sku133' || skuType === 'sku137' || skuType === 'sku156' || skuType === 'sku157' || skuType === 'sku158' || skuType === 'sku177') && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-700">{skuType === 'sku137' ? 'Include End Caps' : 'Include Shelves'}</label>
                        <Tooltip text="Add wooden shelves to the rack">
                          <InfoIcon />
                        </Tooltip>
                      </div>
                      <button
                        onClick={() => {
                          setHasShelves(!hasShelves);
                          if (!hasShelves) setIsFreestanding(false);
                        }}
                        className={`w-10 h-5 rounded-full transition-colors relative ${hasShelves ? 'bg-black' : 'bg-gray-300'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-transform ${hasShelves ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-700">Freestanding</label>
                        <Tooltip text="Self-supporting design (no wall mounting)">
                          <InfoIcon />
                        </Tooltip>
                      </div>
                      <button
                        onClick={() => {
                          setIsFreestanding(!isFreestanding);
                          if (!isFreestanding) setHasShelves(false);
                        }}
                        className={`w-10 h-5 rounded-full transition-colors relative ${isFreestanding ? 'bg-black' : 'bg-gray-300'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-transform ${isFreestanding ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </>
                )}
              </section>

              {/* Style Section */}
              <section className="space-y-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Style</label>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-3">Pipe Color</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(COLORS).map(color => (
                      <button
                        key={color}
                        onClick={() => setColorName(color)}
                        className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${colorName === color ? 'border-black scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: COLORS[color].pipeColor }}
                        title={color}
                      >
                        {colorName === color && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                      </button>
                    ))}
                  </div>
                </div>

                {getCutlistItems({ length, height, wallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, quantity, tiers, tubeType }).some(i => i.type === 'wood') && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-3">Wood Color</label>
                    <div className="flex flex-wrap gap-3">
                      {Object.keys(WOOD_COLORS).map(color => (
                        <button
                          key={color}
                          onClick={() => setWoodColor(color)}
                          className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${woodColor === color ? 'border-black scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: WOOD_COLORS[color] }}
                          title={color}
                        >
                          {woodColor === color && <div className="w-1.5 h-1.5 rounded-full bg-white/50" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Order Section */}
              <section className="pt-4 border-t border-gray-100 space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Order & Save</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-700 font-bold text-xs"
                    >-</button>
                    <span className="font-mono text-sm font-bold w-6 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-700 font-bold text-xs"
                    >+</button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleSave}
                    className="text-[10px] bg-gray-100 text-gray-800 px-2 py-3 rounded-2xl hover:bg-gray-200 transition-colors font-bold flex flex-col items-center justify-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
                    Save
                  </button>
                  <button
                    onClick={handleShare}
                    className="text-[10px] bg-gray-100 text-gray-800 px-2 py-3 rounded-2xl hover:bg-gray-200 transition-colors font-bold flex flex-col items-center justify-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
                    Share
                  </button>
                  {addingToOrderId ? (
                    <button
                      onClick={() => {
                        const newOrders = [...orders];
                        const orderIdx = newOrders.findIndex(o => o.id === addingToOrderId);
                        if (orderIdx > -1) {
                          newOrders[orderIdx].items.push({ length, height, wallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, quantity, tiers, cameraState: (window as any).__LATEST_CAMERA });
                          setOrders(newOrders);
                          setAddingToOrderId(null);
                          setView('orders');
                          setExpandedOrderId(addingToOrderId);
                          alert('Sub-order added successfully!');
                        }
                      }}
                      className="text-[10px] bg-emerald-600 text-white px-2 py-3 rounded-2xl hover:bg-emerald-700 transition-colors font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-600/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                      Add to #{addingToOrderId.slice(0, 4)}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCart([...cart, { length, height, wallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, quantity, tiers, cameraState: (window as any).__LATEST_CAMERA }]);
                        alert('Sub-order added!');
                      }}
                      className="text-[10px] bg-black text-white px-2 py-3 rounded-2xl hover:bg-gray-800 transition-colors font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-black/10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                      + Sub-order
                    </button>
                  )}
                </div>

                <button
                  onClick={handleDownloadAssembly}
                  className="w-full mt-3 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-3 rounded-2xl hover:bg-indigo-100 transition-colors font-bold flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                  Download Assembly Guide
                </button>

                {addingToOrderId && (
                  <button
                    onClick={() => {
                      setAddingToOrderId(null);
                      setView('orders');
                      setExpandedOrderId(addingToOrderId);
                    }}
                    className="w-full text-xs bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    Cancel Adding Sub-order
                  </button>
                )}

                {!addingToOrderId && (
                  <div className="bg-emerald-50/50 p-4 rounded-[24px] border border-emerald-100/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sub-orders ({cart.length})</div>
                      {cart.length > 0 && (
                        <button
                          onClick={() => setCart([])}
                          className="text-[10px] font-bold text-emerald-600 hover:underline"
                        >Clear</button>
                      )}
                    </div>

                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Order Number"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        className="w-full text-sm font-bold border-emerald-400 text-center rounded-xl bg-white p-3 border-2 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all placeholder:font-normal placeholder:text-gray-400"
                      />
                    </div>

                    {cart.length === 0 ? (
                      <div className="text-[10px] text-emerald-600/70 text-center py-2 font-medium">
                        No sub-orders added yet. Configure an item and click "Add Sub-order".
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                          {cart.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-xl border border-emerald-100 text-[10px] shadow-sm">
                              <span className="font-bold text-gray-700 truncate max-w-[140px]">
                                {item.quantity}x {item.length}cm {item.skuType}
                              </span>
                              <button
                                onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-4 pt-3 border-t border-emerald-100/50">
                          <button
                            onClick={() => {
                              if (!orderNumber.trim()) {
                                alert('Please enter an Order Number');
                                return;
                              }
                              if (cart.length === 0) {
                                alert('Add at least one item to the order builder first');
                                return;
                              }

                              const newOrder: Order = {
                                id: Math.random().toString(36).substr(2, 9),
                                orderNumber,
                                buyerName, date: new Date().toISOString(),
                                status: 'Pending',
                                priority: 'Normal',
                                dispatcher: 'Unassigned',
                                items: [...cart],
                                packedBy: '',
                                pickedItems: {},
                                shippedDate: ''
                              };

                              setOrders([newOrder, ...orders]);
                              setOrderNumber('');
                              setBuyerName('');
                              setCart([]);
                              alert('Order created successfully!');
                            }}
                            className="w-full text-xs bg-emerald-600 text-white px-3 py-2 rounded-xl hover:bg-emerald-700 transition-colors font-bold flex justify-center items-center gap-2 shadow-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17 4 12" /></svg>
                            Finalize Order
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {addingToOrderId && (
                  <div className="bg-blue-50/50 p-4 rounded-[24px] border border-blue-100/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Existing Sub-orders</div>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                      {orders.find(o => o.id === addingToOrderId)?.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-xl border border-blue-100 text-[10px] shadow-sm">
                          <span className="font-bold text-gray-700 truncate max-w-[140px]">
                            {item.quantity || 1}x {item.length}cm {item.skuType || 'Standard'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Cutlist Panel */}
          <div className="lg:absolute lg:top-20 lg:right-6 z-10 bg-white lg:bg-white/80 lg:backdrop-blur-xl p-4 lg:p-6 lg:rounded-3xl shadow-sm lg:shadow-2xl w-full lg:w-80 border-t lg:border border-gray-200 lg:border-white/40 lg:max-h-[calc(100vh-6rem)] overflow-y-auto order-3 lg:order-none shrink-0 mt-4 lg:mt-0 lg:block">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">Cutlist</h2>
              <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                ${calculatePrice(getCutlistItems({ length: deferredLength, height: deferredHeight, wallDistance: deferredWallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, quantity, tiers: deferredTiers, tubeType })).toFixed(2)}
              </span>
            </div>
            <CutlistDisplay config={{ length: deferredLength, height: deferredHeight, wallDistance: deferredWallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, quantity, tiers: deferredTiers, tubeType }} />
          </div>

          <div id="assembly-canvas-container" className="h-[60vh] min-h-[400px] lg:h-full lg:min-h-0 w-full relative order-1 lg:order-none shrink-0 bg-transparent">
            <Canvas gl={{ preserveDrawingBuffer: true, alpha: true }}>
              <LabelContext.Provider value={{ size: labelSize, distance: labelDistance }}>
                <Suspense fallback={null}>
                  <Scene length={deferredLength} height={deferredHeight} wallDistance={deferredWallDistance} explode={explode} hasShelves={hasShelves} isFreestanding={isFreestanding} colorOption={COLORS[colorName]} skuType={skuType} woodColor={woodColor} tiers={deferredTiers} tubeType={tubeType} />
                </Suspense>
              </LabelContext.Provider>
            </Canvas>
          </div>
        </div>
      )}
    </div>
  );
}
