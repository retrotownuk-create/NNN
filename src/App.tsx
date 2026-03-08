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
import { COLORS, WOOD_COLORS, ColorOption, getPipesForLength, getExtraCouplings } from './utils';
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





import { Scene, PreviewScene, LazyPreviewScene, LabelContext } from './RackComponents';

const CutlistDisplay = ({ config, pickedItems, onToggleItem, packedBy, onPackedByChange, order, onOrderChange }: any) => {
  const { length, height, wallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, quantity, tiers } = config;

  const cutlistItems = getCutlistItems(config);
  const pipes = cutlistItems.filter((i: any) => i.type === 'pipe');
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
  const [skuType, setSkuType] = useState<'standard' | 'sku777' | 'sku000' | 'sku100' | 'sku200' | 'sku102' | 'sku103' | 'sku104' | 'sku4210' | 'sku300' | 'sku105' | 'sku106' | 'sku107' | 'sku108' | 'sku109' | 'sku110' | 'sku111' | 'sku112' | 'sku113' | 'sku114' | 'sku115' | 'sku116' | 'sku117' | 'sku118' | 'sku119' | 'sku120' | 'sku121' | 'sku122' | 'sku123' | 'sku124' | 'sku125' | 'sku126' | 'sku127' | 'sku128' | 'sku129' | 'sku130' | 'sku131' | 'sku132' | 'sku133' | 'sku134' | 'sku135' | 'sku136' | 'sku137' | 'sku138' | 'sku140' | 'sku141' | 'sku142' | 'sku143' | 'sku144' | 'sku145' | 'sku146' | 'sku147' | 'sku148' | 'sku149' | 'sku150' | 'sku151' | 'sku152' | 'sku153' | 'sku154' | 'sku155' | 'sku156' | 'sku157' | 'sku158' | 'sku159' | 'sku160' | 'sku161' | 'sku162' | 'sku163' | 'sku164' | 'sku165' | 'sku166' | 'sku167' | 'sku168' | 'sku169' | 'sku170' | 'sku171' | 'sku172' | 'sku173' | 'sku174' | 'sku175' | 'sku176' | 'sku177' | 'sku888'>('standard');
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

  type SavedSKU = { name: string; length: number; height: number; wallDistance: number; hasShelves: boolean; isFreestanding: boolean; colorName: string; woodColor?: string; skuType?: 'standard' | 'sku777' | 'sku000' | 'sku100' | 'sku200' | 'sku102' | 'sku103' | 'sku104' | 'sku4210' | 'sku300' | 'sku105' | 'sku106' | 'sku107' | 'sku108' | 'sku109' | 'sku110' | 'sku111' | 'sku112' | 'sku113' | 'sku114' | 'sku115' | 'sku116' | 'sku117' | 'sku118' | 'sku119' | 'sku120' | 'sku121' | 'sku122' | 'sku123' | 'sku124' | 'sku125' | 'sku126' | 'sku127' | 'sku128' | 'sku129' | 'sku130' | 'sku131' | 'sku132' | 'sku133' | 'sku134' | 'sku135' | 'sku136' | 'sku137' | 'sku138' | 'sku140' | 'sku141' | 'sku142' | 'sku143' | 'sku144' | 'sku145' | 'sku146' | 'sku147' | 'sku148' | 'sku149' | 'sku150' | 'sku151' | 'sku152' | 'sku153' | 'sku154' | 'sku155' | 'sku156' | 'sku157' | 'sku158' | 'sku159' | 'sku160' | 'sku161' | 'sku162' | 'sku163' | 'sku164' | 'sku165' | 'sku166' | 'sku167' | 'sku168' | 'sku169' | 'sku170' | 'sku171' | 'sku172' | 'sku173' | 'sku174' | 'sku175' | 'sku176' | 'sku177' | 'sku888'; tiers?: number; tubeType?: 'round' | 'square' };

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
    const default106: SavedSKU = { name: 'SKU 106', length: 120, height: 92, wallDistance: 23, hasShelves: true, isFreestanding: true, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku106', tiers: 4 };
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
    const default143: SavedSKU = { name: 'SKU 143', length: 200, height: 100, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku143' };
    const default144: SavedSKU = { name: 'SKU 144', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku144' };
    const default145: SavedSKU = { name: 'SKU 145', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku145' };
    const default146: SavedSKU = { name: 'SKU 146', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku146' };
    const default147: SavedSKU = { name: 'SKU 147', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku147' };
    const default148: SavedSKU = { name: 'SKU 148', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku148' };
    const default149: SavedSKU = { name: 'SKU 149', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku149' };
    const default150: SavedSKU = { name: 'SKU 150', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku150' };
    const default151: SavedSKU = { name: 'SKU 151', length: 120, height: 160, wallDistance: 23, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku151' };
    const default152: SavedSKU = { name: 'SKU 152', length: 120, height: 160, wallDistance: 23, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku152' };
    const default153: SavedSKU = { name: 'SKU 153', length: 120, height: 160, wallDistance: 23, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku153' };
    const default154: SavedSKU = { name: 'SKU 154', length: 120, height: 160, wallDistance: 23, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku154' };
    const default155: SavedSKU = { name: 'SKU 155', length: 60, height: 0, wallDistance: 20, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku155' };
    const default156: SavedSKU = { name: 'SKU 156', length: 120, height: 92, wallDistance: 23, hasShelves: false, isFreestanding: true, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku156', tiers: 4 };
    const default157: SavedSKU = { name: 'SKU 157', length: 120, height: 92, wallDistance: 23, hasShelves: false, isFreestanding: true, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku157', tiers: 4 };
    const default158: SavedSKU = { name: 'SKU 158', length: 60, height: 0, wallDistance: 20, hasShelves: true, isFreestanding: false, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku158' };
    const default159: SavedSKU = { name: 'SKU 159', length: 100, height: 0, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku159' };
    const default160: SavedSKU = { name: 'SKU 160', length: 20, height: 0, wallDistance: 20, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku160' };
    const default161: SavedSKU = { name: 'SKU 161', length: 60, height: 0, wallDistance: 20, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku161' };
    const default162: SavedSKU = { name: 'SKU 162', length: 120, height: 100, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku162' };
    const default163: SavedSKU = { name: 'SKU 163', length: 120, height: 90, wallDistance: 23, hasShelves: false, isFreestanding: true, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku163', tiers: 2 };
    const default164: SavedSKU = { name: 'SKU 164', length: 120, height: 90, wallDistance: 15, hasShelves: false, isFreestanding: true, colorName: 'Black', woodColor: 'Natural Oak', skuType: 'sku164', tiers: 2 };
    const default165: SavedSKU = { name: 'SKU 165', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku165' };
    const default166: SavedSKU = { name: 'SKU 166', length: 15, height: 0, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku166' };
    const default167: SavedSKU = { name: 'SKU 167', length: 30, height: 0, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku167' };
    const default168: SavedSKU = { name: 'SKU 168', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: true, colorName: 'Black', skuType: 'sku168' };
    const default169: SavedSKU = { name: 'SKU 169', length: 200, height: 100, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku169' };
    const default170: SavedSKU = { name: 'SKU 170', length: 120, height: 160, wallDistance: 30, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku170' };
    const default171: SavedSKU = { name: 'SKU 171', length: 100, height: 0, wallDistance: 25, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku171' };
    const default172: SavedSKU = { name: 'SKU 172', length: 20, height: 0, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku172' };
    const default173: SavedSKU = { name: 'SKU 173', length: 100, height: 0, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku173' };
    const default174: SavedSKU = { name: 'SKU 174', length: 15, height: 0, wallDistance: 0, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku174' };
    const default175: SavedSKU = { name: 'SKU 175', length: 15, height: 0, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku175' };
    const default176: SavedSKU = { name: 'SKU 176', length: 15, height: 0, wallDistance: 5, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku176' };
    const default177: SavedSKU = { name: 'SKU 177', length: 120, height: 160, wallDistance: 15, hasShelves: false, isFreestanding: false, colorName: 'Black', skuType: 'sku177', tiers: 3 };

    const allDefaults = [
      default4210, default300, default103, default105, default106, default107, default108, default109, default110, default111, default112, default113, default114, default115, default116, default117, default118, default119, default120, default121, default122, default123, default124, default125, default126, default127, default128, default129, default130, default131, default132, default133, default134, default135, default136, default137, default138,
      default140, default141, default142, default143, default144, default145, default146, default147, default148, default149, default150, default151, default152, default153, default154, default155, default156, default157, default158, default159, default160, default161, default162, default163, default164, default165, default166, default167, default168, default169, default170, default171, default172, default173, default174, default175, default176, default177
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
            <Scene length={length} height={height} wallDistance={wallDistance} explode={0.7} hasShelves={hasShelves} isFreestanding={isFreestanding} colorOption={COLORS[colorName]} skuType={skuType} woodColor={woodColor} cameraState={(window as any).__ACTIVE_ASSEMBLY_CAMERA} tiers={tiers} />
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
                  {skuType !== 'sku114' && skuType !== 'sku120' && skuType !== 'sku122' && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-gray-700">Length</label>
                        <span className="text-xs font-mono font-bold text-black">{length} cm</span>
                      </div>
                      <input
                        type="range"
                        min={skuType === 'sku116' ? 50 : 30} max={(skuType === 'sku136' || skuType === 'sku137') ? "600" : "400"} step="5"
                        value={length}
                        onChange={(e) => setLength(Number(e.target.value))}
                        className="w-full accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}

                  {(skuType === 'sku106' || skuType === 'sku107' || skuType === 'sku129' || skuType === 'sku177') && (
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

                  {skuType !== 'sku108' && skuType !== 'sku109' && skuType !== 'sku110' && skuType !== 'sku111' && skuType !== 'sku113' && skuType !== 'sku116' && skuType !== 'sku119' && skuType !== 'sku120' && skuType !== 'sku121' && skuType !== 'sku122' && skuType !== 'sku123' && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-gray-700">{((skuType as string) === 'sku000' || (skuType as string) === 'sku106' || (skuType as string) === 'sku107' || (skuType as string) === 'sku129') ? 'Shelf Depth' : ((skuType as string) === 'sku111' || (skuType as string) === 'sku113' || (skuType as string) === 'sku116' || (skuType as string) === 'sku119' || (skuType as string) === 'sku124' || (skuType as string) === 'sku125') ? 'Drop Depth' : 'Depth'}</label>
                        <span className="text-xs font-mono font-bold text-black">{wallDistance} cm</span>
                      </div>
                      {skuType === 'sku000' || skuType === 'sku129' ? (
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
                    <label className="text-xs font-bold text-gray-700">Tube Type</label>
                    <Tooltip text="Select round or square tubes">
                      <InfoIcon />
                    </Tooltip>
                  </div>
                  <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => setTubeType('round')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${tubeType === 'round' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      Round
                    </button>
                    <button
                      onClick={() => setTubeType('square')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${tubeType === 'square' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      Square
                    </button>
                  </div>
                </div>

                {(skuType === 'standard' || skuType === 'sku107' || skuType === 'sku108' || skuType === 'sku109' || skuType === 'sku110' || skuType === 'sku115' || skuType === 'sku127' || skuType === 'sku128' || skuType === 'sku131' || skuType === 'sku133' || skuType === 'sku137') && (
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

                {getCutlistItems({ length, height, wallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, quantity, tiers }).some(i => i.type === 'wood') && (
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
                ${calculatePrice(getCutlistItems({ length: deferredLength, height: deferredHeight, wallDistance: deferredWallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, quantity, tiers: deferredTiers })).toFixed(2)}
              </span>
            </div>
            <CutlistDisplay config={{ length: deferredLength, height: deferredHeight, wallDistance: deferredWallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, quantity, tiers: deferredTiers }} />
          </div>

          <div id="assembly-canvas-container" className="h-[60vh] min-h-[400px] lg:h-full lg:min-h-0 w-full relative order-1 lg:order-none shrink-0 bg-transparent">
            <Canvas gl={{ preserveDrawingBuffer: true, alpha: true }}>
              <LabelContext.Provider value={{ size: labelSize, distance: labelDistance }}>
                <Suspense fallback={null}>
                  <Scene length={deferredLength} height={deferredHeight} wallDistance={deferredWallDistance} explode={explode} hasShelves={hasShelves} isFreestanding={isFreestanding} colorOption={COLORS[colorName]} skuType={skuType} woodColor={woodColor} tiers={deferredTiers} />
                </Suspense>
              </LabelContext.Provider>
            </Canvas>
          </div>
        </div>
      )}
    </div>
  );
}
