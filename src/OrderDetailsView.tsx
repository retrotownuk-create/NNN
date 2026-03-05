import React, { useMemo } from 'react';
import { COLORS, WOOD_COLORS, getPipesForLength, getExtraCouplings } from './utils';

export type CutlistItem = {
  id: string;
  partName: string;
  qty: number;
  type: 'pipe' | 'fitting' | 'wood';
  color?: string;
  dimension?: string;
  note?: string;
};

export const getCutlistItems = (config: any): CutlistItem[] => {
  const { length, height, wallDistance, hasShelves, isFreestanding, colorName, woodColor, skuType, quantity, tubeType = 'round', tiers = 4 } = config;
  const items: CutlistItem[] = [];

  const addPipes = (target: number, count: number, labelPrefix: string) => {
    const pipes = getPipesForLength(target);
    const counts: Record<number, number> = {};
    pipes.forEach(p => {
      counts[p] = (counts[p] || 0) + (count * quantity);
    });
    Object.entries(counts).forEach(([size, c]) => {
      items.push({
        id: `pipe-${size}-${labelPrefix}`,
        partName: `${size} cm ${tubeType === 'square' ? 'square ' : ''}pipe`,
        qty: c,
        type: 'pipe',
        color: colorName
      });
    });
  };

  const addFitting = (id: string, name: string, qty: number) => {
    if (qty > 0) {
      items.push({
        id,
        partName: tubeType === 'square' ? `Square ${name}` : name,
        qty,
        type: 'fitting',
        color: colorName
      });
    }
  };

  const addWood = (id: string, name: string, qty: number, dimensions: string) => {
    if (qty > 0) {
      items.push({
        id,
        partName: `${name} (${dimensions})`,
        qty,
        type: 'wood',
        color: woodColor
      });
    }
  };

  const getTotalExtraCouplings = () => {
    let extra = 0;
    if (skuType === 'sku777') {
      extra += getExtraCouplings(8, length > 120 ? 6 : 4);
      extra += getExtraCouplings(wallDistance - 6.6, length > 120 ? 6 : 4);
      if (length > 120) {
        extra += getExtraCouplings(length / 2 - 3.5, 2);
      } else {
        extra += getExtraCouplings(length - 3, 1);
      }
    } else if (skuType === 'sku100') {
      extra += getExtraCouplings(height / 2, 2);
      extra += getExtraCouplings(height / 2 - 5, 2);
      extra += getExtraCouplings(5, 2);
      extra += getExtraCouplings(wallDistance - 6.6, 2);
      if (length > 120) {
        extra += getExtraCouplings((length - 3) / 2, 4);
      } else {
        extra += getExtraCouplings(length - 3, 2);
      }
    } else if (skuType === 'sku200') {
      extra += getExtraCouplings(wallDistance - 15, length > 120 ? 3 : 2);
      extra += getExtraCouplings(15, length > 120 ? 3 : 2);
      if (length > 120) {
        extra += getExtraCouplings(length / 2, 4);
      } else {
        extra += getExtraCouplings(length, 2);
      }
    } else if (skuType === 'sku102') {
      extra += getExtraCouplings(10, length > 120 ? 3 : 2);
      extra += getExtraCouplings((wallDistance - 20) / 2, (length > 120 ? 3 : 2) * 2);
      if (length > 120) {
        extra += getExtraCouplings((length - 3) / 2, 4);
      } else {
        extra += getExtraCouplings(length - 3, 2);
      }
    } else if (skuType === 'sku4210') {
      extra += getExtraCouplings(wallDistance - 3, 2);
      extra += getExtraCouplings(height - 10 - 1.5, 2);
      extra += getExtraCouplings(10, 2);
      if (length > 120) {
        extra += getExtraCouplings((length - 3) / 2, 2);
      } else {
        extra += getExtraCouplings(length - 3, 1);
      }
    } else if (skuType === 'sku300') {
      const numPipes = Math.ceil(length / 120);
      const numMounts = numPipes + 1;
      extra += getExtraCouplings(wallDistance - 6.6, numMounts);
    } else if (skuType === 'sku103') {
      const numPipes = Math.ceil(length / 120);
      const numMounts = numPipes + 1;
      extra += getExtraCouplings(wallDistance - 6.6, numMounts);
    } else if (skuType === 'sku105' || skuType === 'sku113') {
      extra = 0;
    } else if (skuType === 'sku114') {
      extra += getExtraCouplings(wallDistance - 6.6, 4);
      extra += getExtraCouplings(height - 3, 2);
    } else if (skuType === 'sku115') {
      const numSupports = length > 180 ? 3 : 2;
      extra += getExtraCouplings(wallDistance - 6.6, numSupports * 2);
      extra += getExtraCouplings(5, numSupports * 3); // 5cm pipes per support (3 each)
      if (length > 180) {
        extra += getExtraCouplings((length - 3) / 2, 2);
      } else {
        extra += getExtraCouplings(length - 3, 1);
      }
    } else if (skuType === 'sku116') {
      const numSupports = 3; // Always exactly 3 supports for sku116
      extra += getExtraCouplings(height, numSupports);
      extra += getExtraCouplings((length - 3) / 2, 2);
    } else if (skuType === 'sku112') {
      const numLegs = 3;
      const numSegments = numLegs + 1;
      const segmentLength = length / numSegments;
      extra += getExtraCouplings(wallDistance - 6.6, numLegs + 2); // all wall pipes
      extra += getExtraCouplings(height - 3, numLegs); // vertical legs
      extra += getExtraCouplings(segmentLength - 3, numSegments); // 4 horizontal segments
    } else if (skuType === 'sku117' || skuType === 'sku118' || skuType === 'sku119') {
      extra += getExtraCouplings(skuType === 'sku119' ? height - 4.4 : wallDistance - 4.4, 2);
      if (length > 120) {
        extra += getExtraCouplings((length - 4.4) / 2, 2);
      } else {
        extra += getExtraCouplings(length - 4.4, 1);
      }
    } else {
      if (hasShelves) {
        extra += getExtraCouplings(33.5, 2);
        extra += getExtraCouplings(40.0, 2);
        extra += getExtraCouplings((height - 75) / 2, 4);
        extra += getExtraCouplings(wallDistance - 6.6, 6);
      } else {
        extra += getExtraCouplings(height - (isFreestanding ? 7 : 1.5), 2);
      }
      if (length > 120) {
        extra += getExtraCouplings((length - 3) / 2, 2);
      } else {
        extra += getExtraCouplings(length - 3, 1);
      }
    }
    return extra;
  };

  // Pipes
  if (skuType === 'sku777') {
    addPipes(8.0, length > 120 ? 6 : 4, 'p-short-vert');
    addPipes(wallDistance - 6.6, length > 120 ? 6 : 4, 'p-wall-conn');
    if (length > 120) addPipes(length / 2 - 3.5, 2, 'p-horiz-bar');
    else addPipes(length - 3, 1, 'p-horiz-bar');
  } else if (skuType === 'sku000') {
    addPipes(height, 2, 'p-vert');
  } else if (skuType === 'sku100') {
    addPipes(height / 2, 2, 'p-vert-bot');
    addPipes(height / 2 - 5, 2, 'p-vert-top');
    addPipes(5, 2, 'p-vert-top-short');
    addPipes(wallDistance - 6.6, 2, 'p-wall-conn');
    if (length > 120) addPipes((length - 3) / 2, 4, 'p-horiz-bars');
    else addPipes(length - 3, 2, 'p-horiz-bars');
  } else if (skuType === 'sku106') {
    addPipes(23, 2 * (tiers - 1), 'p-vert-tier');
  } else if (skuType === 'sku107') {
    addPipes(23, 2 * tiers, 'p-vert-tier');
    addPipes(27 - 6.6, 2 * (tiers + 1), 'p-wall-conn');
  } else if (skuType === 'sku200') {
    addPipes(wallDistance - 6.6, length > 120 ? 3 : 2, 'p-wall-conn');
    addPipes(15, length > 120 ? 3 : 2, 'p-front-conn');
    if (length > 120) {
      addPipes(length / 2, 4, 'p-horiz-bars');
    } else {
      addPipes(length, 2, 'p-horiz-bars');
    }
  } else if (skuType === 'sku102') {
    addPipes(10 - 6.6, length > 120 ? 3 : 2, 'p-wall-conn');
    addPipes((wallDistance - 20) / 2, (length > 120 ? 3 : 2) * 2, 'p-fwd-conn');
    if (length > 120) {
      addPipes((length - 3) / 2, 4, 'p-horiz-rail');
    } else {
      addPipes(length - 3, 2, 'p-horiz-rail');
    }
  } else if (hasShelves && skuType !== 'sku108' && skuType !== 'sku109' && skuType !== 'sku110' && skuType !== 'sku111' && skuType !== 'sku112' && skuType !== 'sku113' && skuType !== 'sku114' && skuType !== 'sku115' && skuType !== 'sku116' && skuType !== 'sku117' && skuType !== 'sku118' && skuType !== 'sku119' && skuType !== 'sku120' && skuType !== 'sku121' && skuType !== 'sku122' && skuType !== 'sku123' && skuType !== 'sku124' && skuType !== 'sku125' && skuType !== 'sku126' && skuType !== 'sku127' && skuType !== 'sku128' && skuType !== 'sku129' && skuType !== 'sku130' && skuType !== 'sku131') {
    addPipes(33.5, 2, 'p-vert-bot');
    addPipes(40.0, 2, 'p-vert-mid');
    addPipes((height - 75) / 2, 2, 'p-vert-top1');
    addPipes((height - 75) / 2, 2, 'p-vert-top2');
    addPipes(wallDistance - 6.6, 6, 'p-wall-conn');
  } else if (skuType === 'sku117' || skuType === 'sku118') {
    addPipes(wallDistance - 6.6, 2, 'p-wall-conn');
    addPipes(height - 1.5 - (skuType === 'sku118' ? 1.5 : 0), 2, 'p-vert');
    if (length > 120) addPipes((length - 4.4) / 2, 2, 'p-horiz-bar');
    else addPipes(length - 4.4, 1, 'p-horiz-bar');
  } else if (skuType === 'sku119') {
    const numPipes = Math.ceil(length / 120);
    const numMounts = numPipes + 1;
    addPipes(wallDistance - 6.6, numMounts, 'p-wall-conn');
    const pipes = getPipesForLength(length);
    pipes.forEach((p, i) => addPipes(p, 1, `p-horiz-${i}`));
  } else if (skuType === 'sku4210') {
    addPipes(wallDistance - 6.6, 2, 'p-wall-conn');
    addPipes(height - 10 - 1.5, 2, 'p-vert-bot');
    addPipes(10, 2, 'p-vert-top');
    if (length > 120) addPipes((length - 3) / 2, 2, 'p-horiz-bar');
    else addPipes(length - 3, 1, 'p-horiz-bar');
  } else if (skuType === 'sku300') {
    const numPipes = Math.ceil(length / 120);
    const numMounts = numPipes + 1;
    addPipes(wallDistance - 6.6, numMounts, 'p-wall-conn');
    const pipes = getPipesForLength(length);
    pipes.forEach((p, i) => addPipes(p, 1, `p-horiz-${i}`));
  } else if (skuType === 'sku103') {
    const numPipes = Math.ceil(length / 120);
    const numMounts = numPipes + 1;
    addPipes(wallDistance - 6.6, numMounts, 'p-wall-conn');
    addPipes(5, numMounts, 'p-tee-to-union');
    addPipes(5, numMounts, 'p-union-to-elbow');
    const pipes = getPipesForLength(length);
    pipes.forEach((p, i) => {
      addPipes(p, 2, `p-horiz-${i}`);
    });
  } else if (skuType === 'sku105') {
    if (length > 11) {
      addPipes((length - 11) / 2, 2, 'p-horiz');
    }
  } else if (skuType === 'sku111') {
    addPipes(wallDistance, 2, 'p-wall-conn');
    addPipes(height, 2, 'p-vert-drop');
    if (length > 120) addPipes((length - 3) / 2, 2, 'p-horiz-bar');
    else addPipes(length - 3, 1, 'p-horiz-bar');
  } else if (skuType === 'sku113') {
    addPipes(wallDistance - 6.6, 1, 'p-wall-conn');
    addPipes(height - 3, 1, 'p-vert-drop');
    if (length > 120) addPipes((length - 3) / 2, 2, 'p-horiz-bar');
    else addPipes(length - 3, 1, 'p-horiz-bar');
  } else if (skuType === 'sku114') {
    addPipes(wallDistance - 6.6, 4, 'p-wall-conn');
    addPipes(height - 3, 2, 'p-vert-drop');
  } else if (skuType === 'sku115') {
    const numSupports = length > 180 ? 3 : 2;
    addPipes(wallDistance - 6.6, numSupports * 2, 'p-wall-conn');
    addPipes(5, numSupports * 3, 'p-5cm'); // 3 pieces of 5cm pipe per support
    if (length > 180) {
      addPipes((length - 3) / 2, 2, 'p-horiz-rail');
    } else {
      addPipes(length - 3, 1, 'p-horiz-rail');
    }
  } else if (skuType === 'sku116') {
    const numSupports = 3;
    addPipes(height, numSupports, 'p-vert-drop');
    addPipes((length - 3) / 2, 2, 'p-horiz-rail');
  } else if (skuType === 'sku112') {
    const numLegs = 3;
    const numSegments = numLegs + 1; // 4 horizontal segments
    const segmentLength = length / numSegments;

    // 3 vertical floor legs
    addPipes(height - 3, numLegs, 'p-vert-leg');
    // 5 wall pipes (3 from legs + 2 from ends)
    addPipes(wallDistance - 6.6, numLegs + 2, 'p-wall-conn');
    // 4 horizontal rail segments
    addPipes(segmentLength - 3, numSegments, 'p-horiz-rail');
  } else if (skuType === 'sku111' || skuType === 'sku113' || skuType === 'sku117' || skuType === 'sku118' || skuType === 'sku119') {
    if (skuType === 'sku111' || skuType === 'sku113' || skuType === 'sku119') {
      addPipes(height - 4.4, (skuType === 'sku113' ? 1 : 2), 'p-vert-drop');
    } else {
      // SKU 117, 118: Wall-mounted rails with hex nipple connections
      addPipes(wallDistance - 6.6, 2, 'p-wall-conn');
      addFitting('f-hex-nipples', 'Hex Nipples', quantity * 2);
      addFitting('f-couplings', 'Couplings', quantity * 2);
    }
    if (length > 120) addPipes((length - 4.4) / 2, 2, 'p-horiz-bar');
    else addPipes(length - 4.4, 1, 'p-horiz-bar');
  } else if (skuType !== 'sku108' && skuType !== 'sku109' && skuType !== 'sku110' && skuType !== 'sku111' && skuType !== 'sku112' && skuType !== 'sku113' && skuType !== 'sku114' && skuType !== 'sku115' && skuType !== 'sku116' && skuType !== 'sku117' && skuType !== 'sku118' && skuType !== 'sku119' && skuType !== 'sku120' && skuType !== 'sku121' && skuType !== 'sku122' && skuType !== 'sku123' && skuType !== 'sku124' && skuType !== 'sku125' && skuType !== 'sku126' && skuType !== 'sku127' && skuType !== 'sku128') {
    addPipes(height - (isFreestanding ? 7 : 1.5), 2, 'p-vert');
  }
  if (skuType === 'standard') {
    if (length > 120) addPipes((length - 3) / 2, 2, 'p-horiz-bar');
    else addPipes(length - 3, 1, 'p-horiz-bar');
  }

  // Fittings
  if (skuType === 'sku777') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * (length > 120 ? 6 : 4));
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * (length > 120 ? 6 : 4));
    addFitting('f-couplings', 'Couplings', quantity * (length > 120 ? 6 : 4));
    addFitting('f-90-elbows', '90° Elbows', quantity * (length > 120 ? 6 : 4));
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    if (length > 120) addFitting('f-cross-fittings', 'Cross Fittings', quantity * 1);
    addFitting('f-couplings', 'Couplings', quantity * getTotalExtraCouplings());
  } else if (skuType === 'sku000') {
    addFitting('f-ceil-flanges', 'Ceiling Flanges', quantity * 2);
    addFitting('f-shelf-flanges', 'Shelf Flanges', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * getTotalExtraCouplings());
  } else if (skuType === 'sku100') {
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 2);
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * (2 + getTotalExtraCouplings()));
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    addFitting('f-corner-elbows', 'Corner Elbows', quantity * 2);
    addFitting('f-union', 'Union', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * getTotalExtraCouplings());
  } else if (skuType === 'sku200') {
    const numWallMounts = length > 120 ? 3 : 2;
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * numWallMounts);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * numWallMounts);
    addFitting('f-couplings', 'Couplings', quantity * (numWallMounts + getTotalExtraCouplings()));
    addFitting('f-t-fittings', 'T-Fittings', quantity * numWallMounts);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    if (length > 120) addFitting('f-cross-fittings', 'Cross Fittings', quantity * 1);
  } else if (skuType === 'sku102') {
    const numWallMounts = length > 120 ? 3 : 2;
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * numWallMounts);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * numWallMounts);
    addFitting('f-couplings', 'Couplings', quantity * (numWallMounts + getTotalExtraCouplings()));
    addFitting('f-t-fittings', 'T-Fittings', quantity * numWallMounts);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    if (length > 120) addFitting('f-t-fittings', 'T-Fittings (Front)', quantity * 1);
    addFitting('f-union', 'Union', quantity * numWallMounts);
    if (length > 120) addFitting('f-cross-fittings', 'Cross Fittings (Back Mid)', quantity * 1);
  } else if (skuType === 'sku4210') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 2);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * (2 + (length > 120 ? 1 : 0) + getTotalExtraCouplings()));
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
  } else if (skuType === 'sku300') {
    const numPipes = Math.ceil(length / 120);
    const numMounts = numPipes + 1;
    const numMiddleMounts = numPipes - 1;
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * numMounts);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * numMounts);
    addFitting('f-couplings', 'Couplings', quantity * (numMounts + getTotalExtraCouplings()));
    addFitting('f-end-caps', 'In caps', quantity * 2);
    if (numMiddleMounts > 0) addFitting('f-connector-bracket', 'Connector Bracket', quantity * numMiddleMounts);
  } else if (skuType === 'sku103') {
    const numPipes = Math.ceil(length / 120);
    const numMounts = numPipes + 1;
    const numMiddleMounts = numPipes - 1;
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * numMounts);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * numMounts);
    addFitting('f-couplings', 'Couplings', quantity * numMounts);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-unions', 'Unions', quantity * numMounts);
    if (numMiddleMounts > 0) {
      addFitting('f-t-fittings', 'T-Fittings', quantity * (2 + numMiddleMounts)); // 2 back corners + front middles
      addFitting('f-cross-fittings', 'Cross Fittings', quantity * numMiddleMounts);
    } else {
      addFitting('f-t-fittings', 'T-Fittings', quantity * 2); // 2 back corners
    }

    // Couplings for horizontal bars
    const hPipes = getPipesForLength(length);
    if (hPipes.length > 1) {
      addFitting('f-couplings', 'Couplings', quantity * (hPipes.length - 1) * 2);
    }
  } else if (skuType === 'sku105') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-90-elbows', '90° Elbows', quantity * 4);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 8);
    addFitting('f-couplings', 'Couplings', quantity * 3);
  } else if (skuType === 'sku106') {
    addFitting('f-wall-flanges', 'Flanges', quantity * 4 * (tiers - 1));
    if (tiers > 1) {
      addFitting('f-t-fittings', 'T-Fittings', quantity * 2 * (tiers - 1));
    }
  } else if (skuType === 'sku107') {
    const numWallMounts = 2 * (tiers + 1);
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * numWallMounts);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * numWallMounts);
    addFitting('f-couplings', 'Couplings', quantity * numWallMounts);
    addFitting('f-90-elbows', '90° Elbows', quantity * 4);
    if (tiers > 1) {
      addFitting('f-t-fittings', 'T-Fittings', quantity * 2 * (tiers - 1));
    }
  } else if (skuType === 'sku108' || skuType === 'sku109') {
    addFitting('f-hairpin-legs', 'Hairpin Legs (86cm)', quantity * 2);
  } else if (skuType === 'sku110') {
    addFitting('f-shelf-brackets', 'L Brackets 23.9cm', quantity * 2);
  } else if (skuType === 'sku111') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * 2);
    addFitting('f-90-elbows', '90° Elbows', quantity * 4);
    addPipes(height - 6.6, 2, 'p-vert-drop');
    if (length > 120) addPipes((length - 4.4) / 2, 2, 'p-horiz-bar');
    else addPipes(length - 4.4, 1, 'p-horiz-bar');
  } else if (skuType === 'sku113') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 1);
    addFitting('f-couplings', 'Couplings', quantity * (1 + (length > 120 ? 1 : 0)));
    addFitting('f-t-fittings', 'T-Fittings', quantity * 1);
  } else if (skuType === 'sku114') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 4);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 4);
    addFitting('f-couplings', 'Couplings', quantity * (4 + getTotalExtraCouplings()));
    addFitting('f-90-elbows', '90° Elbows', quantity * 4);
  } else if (skuType === 'sku115') {
    const numSupports = length > 180 ? 3 : 2;
    const isMid = length > 180;
    const numWallMounts = numSupports * 2;
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * numWallMounts);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * numWallMounts);
    addFitting('f-couplings', 'Couplings', quantity * (numWallMounts + getTotalExtraCouplings()));
    addFitting('f-t-fittings', 'T-Fittings', quantity * (numSupports + 2)); // Top tees + Side mid tees
    addFitting('f-end-caps', 'End Caps', quantity * numSupports);
    addFitting('f-90-elbows', '90° Elbows', quantity * numSupports); // Bottom elbows
    if (isMid) {
      addFitting('f-cross-fittings', 'Cross Fittings', quantity * 1); // Mid center cross
    }
  } else if (skuType === 'sku116') {
    addFitting('f-ceiling-flanges', 'Ceiling Flanges', quantity * 3);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 3);
    addFitting('f-couplings', 'Couplings', quantity * (3 + getTotalExtraCouplings()));
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 1);
    addPipes(height - 6.6, 3, 'p-vert-drop');
    if (length > 120) addPipes((length - 4.4) / 2, 2, 'p-horiz-bar');
    else addPipes(length - 4.4, 1, 'p-horiz-bar');
  } else if (skuType === 'sku112') {
    const numLegs = 3;
    const numWallMounts = numLegs + 2;

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * numWallMounts);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * numWallMounts);
    addFitting('f-couplings', 'Couplings', quantity * (numWallMounts + getTotalExtraCouplings()));
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
  } else if (skuType === 'sku117' || skuType === 'sku118') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * (2 + getTotalExtraCouplings()));
    if (skuType === 'sku118') {
      addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
      addFitting('f-end-caps', 'In caps', quantity * 2);
    } else {
      addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    }
  } else if (skuType === 'sku119') {
    addFitting('f-ceil-flanges', 'Ceiling Flanges', quantity * 2);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * getTotalExtraCouplings());
  } else if (skuType === 'sku120') {
    // Acrylic rod: floor flange + top flange
    items.push({ id: 'acrylic-rod', partName: `Acrylic Rod 33mm ×${height}cm`, qty: quantity, type: 'fitting', color: colorName });
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 1);
    addFitting('f-top-flanges', 'Top Flanges', quantity * 1);
  } else if (skuType === 'sku121') {
    // Ceiling U-bar: 2 ceiling flanges, 2 vertical drops, 2 elbows, 1 horiz rail
    addPipes(height - 1.5, 2, 'p-vert-drop');
    if (length > 120) addPipes((length - 4.4) / 2, 2, 'p-horiz-rail');
    else addPipes(length - 4.4, 1, 'p-horiz-rail');
    addFitting('f-ceil-flanges', 'Ceiling Flanges', quantity * 2);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    if (length > 120) addFitting('f-couplings', 'Couplings', quantity * 1);
  } else if (skuType === 'sku123') {
    // 3 legs: Left/Right have 4-way bases (2x23cm, 1x5cm), Middle has H-base (2x23cm)
    const baseArmHeight = 5.5;
    addPipes(height - baseArmHeight - 1.8, 3, 'p-vertical-pole'); // All 3 legs now start at baseArmHeight
    addPipes((length - 4.4) / 2, 2, 'p-top-rail');
    addPipes(23, 6, 'p-tripod-base-arm'); // 4 side arms + 2 center arms
    addPipes(5, 2, 'p-tripod-side-stub');
    addPipes(baseArmHeight - 3.0, 8, 'p-tripod-drop'); // 3 feet/side * 2 + 2 feet center
    addFitting('f-4way-fittings', '4-Way Fittings', quantity * 2);
    addFitting('f-90-elbows', '90° Elbows', quantity * 10); // 6 side + 2 center + 2 top
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2); // 1 base center + 1 top center
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 8); // 3 side * 2 + 2 center
  } else if (skuType === 'sku126') {
    const baseArmHeight = 5.75;
    const spreadArm = 23;
    const couplingHeight = height * 0.5;

    // Vertical Poles
    addPipes(height - 1.5 - (couplingHeight + 1.7), 2, 'p-leg-top');
    addPipes(couplingHeight - 1.7 - (baseArmHeight + 2.0), 2, 'p-leg-bot');

    // Top Rail (No bottom width rail)
    addPipes(length - 3, 1, 'p-top-rail');

    // Stabilizer Arms (Front and Back only)
    addPipes(spreadArm - 2.0, 4, 'p-stabilizer-arm');

    // Short Foot Adapters (Hex Nipples)
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 8); // 3 drops per leg + 1 inward extension per leg

    // Fittings
    addFitting('f-90-elbows', '90° Elbows', quantity * 8); // 2 top + 6 on base (3 per leg)
    addFitting('f-couplings', 'Couplings', quantity * 2); // 2 on legs
    addFitting('f-4way-fittings', '4-Way Fittings', quantity * 2); // 2 Base 4-way junctions
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 6); // 6 feet total (3 per side)
  } else if (skuType === 'sku124') {
    // Wall-mounted triple support rack: 3 depth pipes, 2 rail pipes
    addPipes(wallDistance - 6.6, 3, 'p-support-arm');
    addPipes(length / 2 - 4.4, 2, 'p-horizontal-rail');
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 3);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 3);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 3);
    addFitting('f-couplings', 'Couplings', quantity * 3);
  } else if (skuType === 'sku125') {
    // Wall-mounted industrial hook (Single arm) - Direct Hex Nipple Connection
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 3);
    addFitting('f-in-caps', 'In caps', quantity * 2);
  } else if (skuType === 'sku127') {
    // Freestanding open base with a wooden shelf and short legs underneath
    const legPipeLength = 20; // 20cm base pipes exactly
    const topWoodY = legPipeLength + 5.4; // 25.4cm (2.4 base flanges + 3cm wood total thickness)

    // Top Rail (Total length - 20cm inset - 2.4cm fitting allowance)
    addPipes(length - 22.4, 1, 'p-top-rail');

    // Main vertical poles
    addPipes(height - topWoodY - 2.4, 2, 'p-vertical-pole');

    // Bottom short poles
    addPipes(legPipeLength, 4, 'p-base-leg');

    // Fittings (Always using identical hardware)
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-floor-flanges', 'Flanges', quantity * 10); // 4 floor, 4 under wood, 2 over wood
  } else if (skuType === 'sku128') {
    // Depth pipes: wall flange (1.2cm) → bottom 3-way fitting (2.2cm collar)
    addPipes(wallDistance - 3.4, 2, 'p-depth-pipe');

    // Vertical posts: bottom 3-way (2.2) → top 3-way (2.2)
    addPipes(height - 4.4, 2, 'p-vertical-pole');

    // Top rail: left top 3-way (2.2) → right top 3-way (2.2)
    addPipes(length - 4.4, 1, 'p-top-rail');

    // Bottom cross-bar: left bottom 3-way (2.2) → right bottom 3-way (2.2)
    addPipes(length - 4.4, 1, 'p-bottom-bar');

    // Top wall arms: top 3-way collar (2.2) → end cap — nominal 15cm arm
    addPipes(15 - 2.2, 2, 'p-wall-arm');

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-corner-elbows', '3-Way Fitting', quantity * 4); // Top & Bottom
    addFitting('f-end-caps', 'End Caps', quantity * 2); // Wall arm end caps
  } else if (skuType === 'sku129') {
    const numShelves = tiers || 3;
    const numLevels = numShelves + 1;
    const tierSpacing = height / numShelves;

    // Depth pipes: from wall to front vertical posts
    addPipes(wallDistance, numLevels * 2, 'p-depth-pipe');

    // Vertical pipes between tiers
    addPipes(tierSpacing - 4.4, numShelves * 2, 'p-vertical-pole');

    // Top vertical stubs (5cm default)
    addPipes(5, 2, 'p-top-stub');

    // Bottom horizontal crossbar
    addPipes(length - 4.4, 1, 'p-crossbar');

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * (numLevels * 2));
    addFitting('f-t-fittings', 'T-Fittings', quantity * (numShelves * 2));
    addFitting('f-corner-elbows', '3-Way Fitting', quantity * 2);
    addFitting('f-end-caps', 'End Caps', quantity * 2);
  } else if (skuType === 'sku130') {
    // Post pipes
    addPipes((height * 0.5) - 3.4, 1, 'p-post-lower');
    addPipes((height * 0.5) - 4.4, 1, 'p-post-upper');

    // Horizontal clothing rail
    addPipes(length - 4.4, 1, 'p-rail');

    // Wall arms (Top left and Top right)
    addPipes(wallDistance - 3.4, 2, 'p-wall-arm');

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 1);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 1);
    addFitting('f-corner-elbows', '3-Way Fitting', quantity * 1);
    addFitting('f-90-elbows', '90° Elbows', quantity * 1);
    addFitting('f-45-elbows', '45° Elbows', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 2);
    addFitting('f-end-caps', 'End Caps', quantity * 1);
  } else if (skuType === 'sku131') {
    // Post pipes
    const topY = height / 2;
    const bottomY = -height / 2;
    const shelfY = bottomY + height * 0.33;
    // Length calculations based on connection points (2.2 offset for Corner Elbow / TFitting / Flange, 1.2 for coupling and flanges)
    const lowerLen = (shelfY - 2.2) - (bottomY + 1.2);
    const upperLen = (topY - 2.2) - (shelfY + 2.2);

    const lowerPipes = getPipesForLength(lowerLen);
    lowerPipes.forEach((p, i) => addPipes(p, 2, `p-post-lower-${i}`));

    const upperPipes = getPipesForLength(upperLen);
    upperPipes.forEach((p, i) => addPipes(p, 2, `p-post-upper-${i}`));

    // Horizontal clothing rail
    const horizPipes = getPipesForLength(length - 4.4);
    horizPipes.forEach((p, i) => addPipes(p, 1, `p-rail-${i}`));

    // Wall arms (Shelf and Top)
    addPipes(wallDistance - 3.4, 4, 'p-wall-arm'); // 2 for shelf, 2 for top

    const totalCouplings = ((lowerPipes.length - 1) * 2) + ((upperPipes.length - 1) * 2) + (horizPipes.length - 1);

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 4); // 2 at top, 2 at shelf
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 2);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    addFitting('f-corner-elbows', '3-Way Fitting', quantity * 2);
    if (totalCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * totalCouplings);
    }
  } else if (skuType !== 'sku108' && skuType !== 'sku109' && skuType !== 'sku110' && skuType !== 'sku111' && skuType !== 'sku113' && skuType !== 'sku116' && skuType !== 'sku119' && skuType !== 'sku120' && skuType !== 'sku121' && skuType !== 'sku122' && skuType !== 'sku123' && skuType !== 'sku124' && skuType !== 'sku125' && skuType !== 'sku126' && skuType !== 'sku127' && skuType !== 'sku128' && skuType !== 'sku129' && skuType !== 'sku130' && skuType !== 'sku131') {
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * (isFreestanding ? 4 : 2));
    if (hasShelves && !isFreestanding) {
      addFitting('f-wall-flanges', 'Wall Flanges', quantity * 6);
      addFitting('f-hex-nipples', 'Hex Nipples', quantity * 6);
      addFitting('f-t-fittings', 'T-Fittings', quantity * 4);
    }
    if (isFreestanding) {
      addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
      addFitting('f-90-elbows', '90° Elbows', quantity * 6);
    }
    if (!isFreestanding) addFitting('f-corner-elbows', 'Corner Elbows', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * ((hasShelves && !isFreestanding ? 6 : (hasShelves ? 2 : 0)) + (length > 120 ? 1 : 0) + getTotalExtraCouplings()));
  }

  // Wood
  if (!isFreestanding && hasShelves && skuType === 'standard') {
    addWood('w-bottom-shelf', 'Bottom Shelf', quantity, `${length + 40} × ${wallDistance + 5} cm`);
    addWood('w-top-shelf', 'Top Shelf', quantity, `${length + 40} × ${wallDistance + 5} cm`);
  }
  if (skuType === 'sku000') {
    addWood('w-shelf', 'Shelf', quantity, `${length} × ${wallDistance} cm`);
  }
  if ((skuType === 'sku106' || skuType === 'sku107') && hasShelves) {
    addWood('w-shelf', 'Shelf', quantity, `${length} × 23 cm`);
    addWood('w-shelf-tier', 'Tier Shelf', quantity * tiers, `${length} × ${wallDistance} cm`);
  }
  if (skuType === 'sku131' && hasShelves) {
    addWood('w-shelf', 'Shelf', quantity, `${length + 10} × ${wallDistance} cm`);
  }
  if (skuType === 'sku108' && hasShelves) {
    addWood('w-shelf', 'Console Shelf', quantity, `${length} × 15 cm`);
  }
  if (skuType === 'sku109' && hasShelves) {
    addWood('w-shelf', 'Hallway Shelf', quantity, `${length} × 23 cm`);
  }
  if (skuType === 'sku110' && hasShelves) {
    addWood('w-shelf', 'Bracket Shelf', quantity, `${length} × 23 cm`);
  }
  if (skuType === 'sku115' && hasShelves) {
    addWood('w-shelf', 'Top Shelf', quantity, `${length} × ${wallDistance + 2} cm`);
  }

  if (skuType === 'sku127' && hasShelves) {
    addWood('w-shelf', 'Base Shelf', quantity, `${length} × 23 cm`);
  }
  if (skuType === 'sku128' && hasShelves) {
    addWood('w-shelf', 'Shelf', quantity, `${length} × ${wallDistance} cm`);
  }
  if (skuType === 'sku129' && hasShelves) {
    const numShelves = tiers || 3;
    addWood('w-shelf', 'Shelf', quantity * numShelves, `${length} × ${wallDistance} cm`);
  }

  return items;
};

export const calculatePrice = (items: CutlistItem[]) => {
  let total = 0;
  items.forEach(item => {
    if (item.type === 'pipe') {
      const match = item.partName.match(/(\d+(\.\d+)?) cm/);
      if (match) {
        const length = parseFloat(match[1]);
        total += length * 0.10 * item.qty;
      }
    } else if (item.type === 'fitting') {
      if (item.partName.includes('Hairpin Legs')) {
        total += 12.00 * item.qty;
      } else if (item.partName.includes('L Brackets')) {
        total += 8.50 * item.qty;
      } else {
        total += 2.50 * item.qty;
      }
    } else if (item.type === 'wood') {
      total += 15.00 * item.qty;
    }
  });
  return total;
};

export const OrderDetailsView = ({ order, onBack, onOrderChange, onAddSubOrder, onViewAssemblyGuide, onOpenInConfigurator, pendingAutoDownload, onDownloadAllAssemblies, renderPreview }: any) => {
  const aggregatedItems = useMemo(() => {
    const parts: Record<string, CutlistItem> = {};
    order.items.forEach((config: any) => {
      const cutlist = getCutlistItems(config);
      cutlist.forEach(item => {
        const key = `${item.partName}-${item.color}`;
        if (!parts[key]) {
          parts[key] = { ...item, qty: 0 };
        }
        parts[key].qty += item.qty;
      });
    });
    return Object.values(parts);
  }, [order.items]);

  const totalPrice = useMemo(() => {
    let total = 0;
    order.items.forEach((config: any) => {
      total += calculatePrice(getCutlistItems(config));
    });
    return total;
  }, [order.items]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-[#f8f9fa] min-h-screen font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">#{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-gray-500">Order number - {order.orderNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {order.status === 'Archived' && (
            <button
              onClick={() => onOrderChange({ ...order, status: 'Dispatched' })}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
              Restore Order
            </button>
          )}
          <span className={`px-3 py-1 border rounded-full text-sm font-bold shadow-sm ${order.status === 'Pending' ? 'bg-amber-50 border-amber-100 text-amber-700' :
            order.status === 'Processing' ? 'bg-blue-50 border-blue-100 text-blue-700' :
              order.status === 'Prepared' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                order.status === 'Dispatched' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                  'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
            {order.status}
          </span>
          <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-sm font-bold shadow-sm">
            ${totalPrice.toFixed(2)}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            {Object.keys(order.pickedItems || {}).filter(k => order.pickedItems[k]).length}/{aggregatedItems.length} picked
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {order.items && order.items.length > 0 && (
            <div className="flex gap-4">
              <button
                onClick={() => !pendingAutoDownload && (onDownloadAllAssemblies ? onDownloadAllAssemblies(order.items, order.orderNumber) : onViewAssemblyGuide?.(order.items[0]))}
                className={`flex-1 py-4 flex items-center justify-center gap-2 ${pendingAutoDownload ? 'bg-indigo-100 text-indigo-500 cursor-not-allowed' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'} font-bold text-lg rounded-2xl border border-indigo-100 transition-colors shadow-sm`}
                disabled={pendingAutoDownload}
              >
                {pendingAutoDownload ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                    Download Assembly Guide
                  </>
                )}
              </button>
              <button
                onClick={() => onOpenInConfigurator?.(order.items[0])}
                className="flex-1 py-4 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 font-bold text-lg rounded-2xl border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Open in Configurator
              </button>
            </div>
          )}

          {/* Sub-orders Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                <h2 className="text-lg font-bold text-gray-900">Sub-orders ({order.items.length})</h2>
              </div>
              <button
                onClick={onAddSubOrder}
                className="text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                Add Sub-order
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((config: any, idx: number) => (
                <div key={idx} className="p-5 flex gap-6 items-center hover:bg-gray-50 transition-colors">
                  <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden relative shadow-inner flex-shrink-0">
                    {renderPreview ? renderPreview(config) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">No Preview</div>
                    )}
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900">Item #{idx + 1}: {config.skuType || 'Standard'}</div>
                      <div className="text-sm text-gray-500">{config.length}W × {config.height}H × {config.wallDistance}D cm | {config.colorName}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        ${calculatePrice(getCutlistItems(config)).toFixed(2)}
                      </div>
                      <button
                        onClick={() => onOpenInConfigurator?.(config)}
                        className="text-xs bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-bold flex items-center gap-1.5"
                        title="Open in Configurator"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Open
                      </button>
                      <button
                        onClick={() => !pendingAutoDownload && onViewAssemblyGuide?.(config)}
                        className={`text-xs ${pendingAutoDownload ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'} border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1.5`}
                        title="Download Assembly Guide"
                        disabled={pendingAutoDownload}
                      >
                        {pendingAutoDownload ? (
                          <svg className="animate-spin h-3 w-3 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                        )}
                        PDF
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to remove this sub-order?')) {
                            const newItems = order.items.filter((_: any, i: number) => i !== idx);
                            onOrderChange({ ...order, items: newItems });
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove Sub-order"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                <h2 className="text-lg font-bold text-gray-900">Total Picking List</h2>
              </div>
              <span className="text-sm font-medium text-gray-500">
                {Math.round((Object.keys(order.pickedItems || {}).filter(k => order.pickedItems[k]).length / aggregatedItems.length) * 100) || 0}% complete
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Pick</th>
                    <th className="px-6 py-4 font-medium">Part Name</th>
                    <th className="px-6 py-4 font-medium">Color</th>
                    <th className="px-6 py-4 font-medium">Total Qty</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {aggregatedItems.map((item) => {
                    const key = `${item.partName}-${item.color}`;
                    const isPicked = order.pickedItems?.[key];
                    return (
                      <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              const newPicked = { ...order.pickedItems, [key]: !isPicked };
                              onOrderChange({ ...order, pickedItems: newPicked });
                            }}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isPicked ? 'bg-black border-black' : 'border-gray-300 hover:border-gray-400'}`}
                          >
                            {isPicked && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                          </button>
                        </td>
                        <td className={`px-6 py-4 text-gray-700 font-medium ${isPicked ? 'line-through opacity-50' : ''}`}>{item.partName}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-800 border border-gray-200">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.type === 'wood' ? WOOD_COLORS[item.color || 'Natural Oak'] : COLORS[item.color || 'Raw grey']?.pipeColor }}></span>
                            {item.color}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-600">×{item.qty}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isPicked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {isPicked ? 'Picked' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* Order Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                <h3 className="font-bold text-gray-900">Order Information</h3>
              </div>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{order.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Status</label>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg bg-white p-2.5 outline-none focus:ring-2 focus:ring-black"
                  value={order.status}
                  onChange={(e) => onOrderChange({ ...order, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Prepared">Prepared</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Upload Date</label>
                <div className="text-sm font-medium text-gray-900 p-2.5">{new Date(order.date).toLocaleDateString()}</div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={order.priority === 'Urgent'}
                  onChange={(e) => onOrderChange({ ...order, priority: e.target.checked ? 'Urgent' : 'Normal' })}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                Normal Priority
              </label>
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <h3 className="font-bold text-gray-900">Assignment</h3>
              </div>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{order.dispatcher === 'Unassigned' ? 'Unassigned' : 'Assigned'}</span>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Assigned Dispatcher</label>
              <select
                className="w-full text-sm border border-gray-200 rounded-lg bg-white p-2.5 outline-none focus:ring-2 focus:ring-black"
                value={order.dispatcher}
                onChange={(e) => onOrderChange({ ...order, dispatcher: e.target.value })}
              >
                <option value="Unassigned">Select dispatcher</option>
                <option value="John Doe">John Doe</option>
                <option value="Jane Smith">Jane Smith</option>
              </select>
            </div>
          </div>

          {/* Shipping & Sign-off */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
                <h3 className="font-bold text-gray-900">Shipping & Sign-off</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Packed By (Sign-off)</label>
                <input
                  type="text"
                  placeholder="Sign off name..."
                  value={order.packedBy || ''}
                  onChange={(e) => onOrderChange({ ...order, packedBy: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg bg-white p-2.5 outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Shipped Date</label>
                <input
                  type="date"
                  value={order.shippedDate || ''}
                  onChange={(e) => onOrderChange({ ...order, shippedDate: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg bg-white p-2.5 outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Shipped To (Buyer)</label>
                <input
                  type="text"
                  value={order.buyerName || ''}
                  onChange={(e) => onOrderChange({ ...order, buyerName: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg bg-white p-2.5 outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
