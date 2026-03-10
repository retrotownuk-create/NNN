import React, { useMemo } from 'react';
import { COLORS, WOOD_COLORS, getPipesForLength, getExtraCouplings, getEqualSplitPipes } from './utils';

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
    } else if (skuType === 'sku105' || skuType === 'sku113' || skuType === 'sku136' || skuType === 'sku137' || skuType === 'sku138') {
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
      extra += getExtraCouplings(skuType === 'sku119' ? height - 4.4 : wallDistance - 3.7, 2);
      if (length > 120) {
        extra += getExtraCouplings((length - 4.4) / 2, 2);
      } else {
        extra += getExtraCouplings(length - 4.4, 1);
      }
    } else if (skuType === 'sku153' || skuType === 'sku154' || skuType === 'sku155') {
      // Couplings calculation handled directly inside the SKU block
    } else if (skuType === 'sku158') {
      if (length > 120) {
        extra += getExtraCouplings((length - 8) / 2, 2);
      } else {
        extra += getExtraCouplings(length - 8, 1);
      }
    } else if (skuType === 'sku159') {
      extra += getExtraCouplings(Math.max(0, length - 25), 1);
    } else if (skuType === 'sku160') {
      extra += getExtraCouplings(Math.max(0, (length / 2) - 2.2), 2);
    } else if (skuType === 'sku161' || skuType === 'sku162' || skuType === 'sku163' || skuType === 'sku164' || skuType === 'sku165' || skuType === 'sku166' || skuType === 'sku167' || skuType === 'sku168') {
      extra = 0;
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
  } else if (skuType === 'sku156') {
    addPipes(23, 2 * (tiers - 1), 'p-vert-tier');
    addPipes(5, 4, 'p-feet');
  } else if (skuType === 'sku157') {
    addPipes(23, 2 * (tiers - 1), 'p-vert-tier');
    addPipes(5, 4, 'p-feet');
  } else if (skuType === 'sku158') {
    addPipes(8, 2, 'p-wall-conn');
    addPipes(Math.max(0, wallDistance - 14.5), 2, 'p-fwd-conn'); // from Tee to Elbow
    addPipes(5, 2, 'p-up-conn'); // from Tee to top Flange
    addPipes(length - 10, 1, 'p-horiz-bar');
  } else if (skuType === 'sku159') {
    addPipes(30, 2, 'p-wall-conn');
    addPipes(35, 2, 'p-angled');
    if (length > 120) {
      const split = getPipesForLength(Math.max(0, length - 25));
      split.forEach((p, idx) => addPipes(p, 1, `p-horiz-${idx}`));
    } else {
      addPipes(Math.max(0, length - 25), 1, 'p-horiz-bar');
    }
  } else if (skuType === 'sku155') {
    addPipes(10, 2, 'p-wall-conn'); // 10cm pipe
    addPipes(length - 10, 2, 'p-horiz-bars');
  } else if (skuType === 'sku160') {
    let numSegments = 2; // Always at least 1 middle bracket
    while ((length - 15) / numSegments > 120) {
      numSegments++;
    }
    const split = getEqualSplitPipes(Math.max(0, length - 15), numSegments);
    addPipes(30, 2, 'p-wall-conn');
    addPipes(35, numSegments - 1, 'p-angled');
    split.forEach((p, idx) => addPipes(p, 1, `p-horiz-${idx}`));
  } else if (skuType === 'sku161') {
    let numSegments = 1;
    while ((length - (20 + numSegments * 5)) / numSegments > 120) {
      numSegments++;
    }
    const split = getEqualSplitPipes(Math.max(0, length - (20 + numSegments * 5)), numSegments);
    addPipes(30, 2, 'p-wall-conn');
    addPipes(35, numSegments + 1, 'p-angled');
    split.forEach((p, idx) => addPipes(p, 1, `p-horiz-${idx}`));
  } else if (skuType === 'sku162') {
    // Only shelf
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
  } else if (hasShelves && skuType !== 'sku108' && skuType !== 'sku109' && skuType !== 'sku110' && skuType !== 'sku111' && skuType !== 'sku112' && skuType !== 'sku113' && skuType !== 'sku114' && skuType !== 'sku115' && skuType !== 'sku116' && skuType !== 'sku117' && skuType !== 'sku118' && skuType !== 'sku119' && skuType !== 'sku120' && skuType !== 'sku121' && skuType !== 'sku122' && skuType !== 'sku123' && skuType !== 'sku124' && skuType !== 'sku125' && skuType !== 'sku126' && skuType !== 'sku127' && skuType !== 'sku128' && skuType !== 'sku129' && skuType !== 'sku130' && skuType !== 'sku131' && skuType !== 'sku132' && skuType !== 'sku133' && skuType !== 'sku134' && skuType !== 'sku135' && skuType !== 'sku136' && skuType !== 'sku137' && skuType !== 'sku138' && skuType !== 'sku140' && skuType !== 'sku141' && skuType !== 'sku142' && skuType !== 'sku143' && skuType !== 'sku144' && skuType !== 'sku145' && skuType !== 'sku146' && skuType !== 'sku147' && skuType !== 'sku148' && skuType !== 'sku149' && skuType !== 'sku150' && skuType !== 'sku151' && skuType !== 'sku152' && skuType !== 'sku153' && skuType !== 'sku154' && skuType !== 'sku155' && skuType !== 'sku156' && skuType !== 'sku157' && skuType !== 'sku158' && skuType !== 'sku159' && skuType !== 'sku160' && skuType !== 'sku161' && skuType !== 'sku162' && skuType !== 'sku163' && skuType !== 'sku164' && skuType !== 'sku165' && skuType !== 'sku166' && skuType !== 'sku167' && skuType !== 'sku168' && skuType !== 'sku169' && skuType !== 'sku170' && skuType !== 'sku171' && skuType !== 'sku172' && skuType !== 'sku173' && skuType !== 'sku174' && skuType !== 'sku175' && skuType !== 'sku176' && skuType !== 'sku177' && skuType !== 'sku178' && skuType !== 'sku177' && skuType !== 'sku178') {
    addPipes(40.0, 2, 'p-vert-mid');
    addPipes((height - 75) / 2, 2, 'p-vert-top1');
    addPipes((height - 75) / 2, 2, 'p-vert-top2');
    addPipes(wallDistance - 6.6, 6, 'p-wall-conn');
  } else if (skuType === 'sku117' || skuType === 'sku118') {
    addPipes(wallDistance - 3.7, 2, 'p-wall-conn');
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
      // SKU 117, 118: Wall-mounted rails
      addPipes(wallDistance - 3.7, 2, 'p-wall-conn');
    }
    if (length > 120) addPipes((length - 4.4) / 2, 2, 'p-horiz-bar');
    else addPipes(length - 4.4, 1, 'p-horiz-bar');

  } else if (skuType !== 'sku108' && skuType !== 'sku109' && skuType !== 'sku110' && skuType !== 'sku111' && skuType !== 'sku112' && skuType !== 'sku113' && skuType !== 'sku114' && skuType !== 'sku115' && skuType !== 'sku116' && skuType !== 'sku117' && skuType !== 'sku118' && skuType !== 'sku119' && skuType !== 'sku120' && skuType !== 'sku121' && skuType !== 'sku122' && skuType !== 'sku123' && skuType !== 'sku124' && skuType !== 'sku125' && skuType !== 'sku126' && skuType !== 'sku127' && skuType !== 'sku128' && skuType !== 'sku129' && skuType !== 'sku130' && skuType !== 'sku131' && skuType !== 'sku132' && skuType !== 'sku133' && skuType !== 'sku134' && skuType !== 'sku135' && skuType !== 'sku136' && skuType !== 'sku137' && skuType !== 'sku138' && skuType !== 'sku140' && skuType !== 'sku141' && skuType !== 'sku142' && skuType !== 'sku143' && skuType !== 'sku144' && skuType !== 'sku145' && skuType !== 'sku146' && skuType !== 'sku147' && skuType !== 'sku148' && skuType !== 'sku149' && skuType !== 'sku150' && skuType !== 'sku151' && skuType !== 'sku152' && skuType !== 'sku153' && skuType !== 'sku154' && skuType !== 'sku155' && skuType !== 'sku156' && skuType !== 'sku157' && skuType !== 'sku158' && skuType !== 'sku159' && skuType !== 'sku160' && skuType !== 'sku161' && skuType !== 'sku162' && skuType !== 'sku163' && skuType !== 'sku164' && skuType !== 'sku165' && skuType !== 'sku166' && skuType !== 'sku167' && skuType !== 'sku168' && skuType !== 'sku169' && skuType !== 'sku170' && skuType !== 'sku171' && skuType !== 'sku172' && skuType !== 'sku173' && skuType !== 'sku174' && skuType !== 'sku175' && skuType !== 'sku176' && skuType !== 'sku177' && skuType !== 'sku178' && skuType !== 'sku177' && skuType !== 'sku178') {
    addPipes(height - (isFreestanding ? 7 : 1.5), 2, 'p-vert');
    addPipes(wallDistance - 6.6, 2, 'p-wall-conn');
    if (length > 120) addPipes((length - 3) / 2, 2, 'p-horiz-bar');
    else addPipes(length - 3, 1, 'p-horiz-bar');
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
  } else if (skuType === 'sku156') {
    addFitting('f-wall-flanges', 'Flanges', quantity * (4 * (tiers - 1) + 8));
  } else if (skuType === 'sku157') {
    addFitting('f-wall-flanges', 'Flanges', quantity * (4 * (tiers - 1) + 4));
    addFitting('f-reducers', 'Reducers', quantity * 4);
  } else if (skuType === 'sku158') {
    addFitting('f-wall-flanges', 'Flanges', quantity * 4);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
  } else if (skuType === 'sku155') {
    addFitting('f-wall-flanges', 'Flanges', quantity * 2);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 4); // To connect Tee -> Union -> Elbow
    addFitting('f-unions', 'Unions', quantity * 2);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
  } else if (skuType === 'sku159') {
    addFitting('f-wall-flanges', 'Flanges', quantity * 4);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    addFitting('f-45-elbows', '45° Elbows', quantity * 2);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-close-nipples', 'Close Nipples', quantity * 4);
  } else if (skuType === 'sku160') {
    let numSegments = 2; // Always at least 1 middle bracket
    while ((length - 15) / numSegments > 120) {
      numSegments++;
    }
    const numMiddles = numSegments - 1;
    addFitting('f-wall-flanges', 'Flanges', quantity * (2 + numMiddles));
    if (numMiddles > 0) {
      addFitting('f-t-fittings', 'T-Fittings', quantity * numMiddles);
      addFitting('f-45-elbows', '45° Elbows', quantity * numMiddles);
      addFitting('f-close-nipples', 'Close Nipples', quantity * numMiddles);
    }
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
  } else if (skuType === 'sku161') {
    let numSegments = 1;
    while ((length - (20 + numSegments * 5)) / numSegments > 120) {
      numSegments++;
    }
    addFitting('f-wall-flanges', 'Flanges', quantity * (numSegments + 3));
    addFitting('f-t-fittings', 'T-Fittings', quantity * (numSegments + 1));
    addFitting('f-45-elbows', '45° Elbows', quantity * (numSegments + 1));
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-close-nipples', 'Close Nipples', quantity * (numSegments + 3));
  } else if (skuType === 'sku162') {
    // Nothing, this SKU only has a shelf
  } else if (skuType === 'sku163' || skuType === 'sku164') {
    addPipes(height - 5, 2, 'p-legs');
    addFitting('f-floor-flanges', 'Flanges', quantity * 4);
    const legCouplings = getExtraCouplings(height - 5, 2);
    if (legCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * legCouplings);
    }
  } else if (skuType === 'sku165') {
    addPipes(height - 5, 1, 'p-down-leg');
    addPipes(wallDistance - 6.6, 2, 'p-wall-conn');
    const railLength = (length - 4.4) / 2;
    addPipes(railLength, 2, 'p-horiz-bar');

    addFitting('f-elbows', 'Elbows (90°)', quantity * 2);
    addFitting('f-tees', 'T-Fittings', quantity * 1);
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 1);

    const legCouplings = getExtraCouplings(height - 5, 1);
    const railCouplings = getExtraCouplings(railLength, 2);
    const totalCouplings = legCouplings + railCouplings;
    if (totalCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * totalCouplings);
    }
  } else if (skuType === 'sku166') {
    addPipes(5, 1, 'p-wall-conn');
    addPipes(15, 2, 'p-arms');

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-corner-elbows', 'Corner Elbows (3-way)', quantity * 1);
    addFitting('f-end-caps', 'End Caps', quantity * 2);
  } else if (skuType === 'sku167') {
    addPipes(length, 1, 'p-pole');
    addFitting('f-floor-flanges', 'Flanges', quantity * 2);

    // Calculate and add couplings if pipe gets split
    const railCouplings = getExtraCouplings(length, 1);
    if (railCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * railCouplings);
    }
  } else if (skuType === 'sku168') {
    const baseArmHeight = 5.75;
    const spreadArm = wallDistance / 2;
    const unionHeight = (height + baseArmHeight) / 2;

    // Pipes
    addPipes((height - baseArmHeight) / 2 - 3.6, 4, 'p-leg');
    addPipes(length - 3.0, 2, 'p-horiz-rail');
    addPipes(spreadArm - 2.0, 4, 'p-stabilizer-arm');

    // Fittings
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 8); // 6 down feet + 2 outward horizontal
    addFitting('f-90-elbows', '90° Elbows', quantity * 8);
    addFitting('f-unions', 'Unions', quantity * 2);
    addFitting('f-5way-fittings', '5-Way Fittings', quantity * 2);
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 6);

    // Couplings
    let couplings = 0;
    couplings += getExtraCouplings((height - baseArmHeight) / 2 - 3.6, 4);
    couplings += getExtraCouplings(length - 3.0, 2);
    couplings += getExtraCouplings(spreadArm - 2.0, 4);
    if (couplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * couplings);
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
  } else if (skuType === 'sku140') {
    // Wall-mounted triple support rack with Elbows at ends
    addPipes(wallDistance - 6.6, 3, 'p-support-arm');
    addPipes(length / 2 - 5.0, 2, 'p-horizontal-rail');
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 3);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 1);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 3);
    addFitting('f-couplings', 'Couplings', quantity * 3);
  } else if (skuType === 'sku141') {
    addPipes(Math.max(0.1, height - 5.2), 4, 'p-leg-vert'); // 4 vertical legs
    addPipes(wallDistance, 2, 'p-leg-depth'); // 2 depth crossbars

    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 4);
    addFitting('f-top-flanges', 'Top Flanges', quantity * 4);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 4);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 4);
  } else if (skuType === 'sku142') {
    addPipes(23, 2, 'p-wall-arms'); // 23cm pole requested
    addPipes(Math.max(0, length - 4.4), 1, 'p-horizontal-rail');

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * getExtraCouplings(Math.max(0, length - 4.4), 1));
  } else if (skuType === 'sku171') {
    addPipes(Math.max(0, wallDistance - 5), 2, 'p-wall-arms');
    addPipes(Math.max(0, length - 10), 1, 'p-horizontal-rail');

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * getExtraCouplings(Math.max(0, length - 10), 1));
  } else if (skuType === 'sku173') {
    addPipes(Math.max(0, length - 10), 1, 'p-diagonal');
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-45-elbows', '45° Elbows', quantity * 2);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * getExtraCouplings(Math.max(0, length - 10), 1));
  } else if (skuType === 'sku176') {
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-90-elbows', '90° Elbows', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 2);
    addFitting('f-end-caps', 'Metal End Caps (rod)', quantity * 1);
  } else if (skuType === 'sku177') {
    const numRails = Math.max(2, config.tiers || 3);
    const bottomY = 15;
    const topY = height;

    // The user requested 20cm pipes "inbetween"
    const vertLength = 20;

    // Vertical pipes: 2 poles, each has (numRails-1) segments + 1 top stub
    addPipes(vertLength, (numRails - 1) * 2, 'p-vert');
    addPipes(5, 2, 'p-stub-top');

    // Wall pipes: 2 poles * numRails
    addPipes(Math.max(0, wallDistance - 3.3), numRails * 2, 'p-wall-conn');

    // Bottom rail
    addPipes(Math.max(0, length), 1, 'p-bottom-rail');

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * numRails * 2);
    addFitting('f-corner-elbows', 'Corner Elbows', quantity * 2);

    if (numRails > 2) {
      addFitting('f-t-fittings', 'T-Fittings', quantity * (numRails - 2) * 2);
    }
    // Top uses T-fitting as well
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    addFitting('f-end-caps', 'End Caps', quantity * 2);

    if (hasShelves) {
      // Add wood shelves for all tiers except the bottom rail
      addWood('w-shelf', 'Wood Shelf', quantity * (numRails - 1), `${length} × ${wallDistance} cm`);
    }
  } else if (skuType === 'sku175') {
    addPipes(15, 1, 'p-peg');
    addPipes(5, 1, 'p-wall-conn');
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 1);
    addFitting('f-end-caps', 'End Caps', quantity * 2);
    addFitting('f-end-caps', 'Metal End Caps (rod)', quantity * 1);
  } else if (skuType === 'sku174') {
    addPipes(Math.max(0, length), 1, 'p-peg');
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-90-elbows', '90° Elbows', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 1);
    addFitting('f-end-caps', 'End Caps', quantity * 1);
  } else if (skuType === 'sku172') {
    addPipes(Math.max(0, length), 1, 'p-peg');
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-end-caps', 'End Caps', quantity * 1);
  } else if (skuType === 'sku143') {
    const numMounts = Math.max(2, Math.ceil(length / 120) + 1);
    const hd = config.handrailDiameter || (config.tubeType === 'square' ? '27mm' : '33mm');

    // Main handrail pipes (segments separated by T-fittings)
    const mountSpacing = length / (numMounts - 1);
    const railLength = Math.max(0, mountSpacing - 3.0);
    const railPipes = getPipesForLength(railLength);
    const railCounts: Record<number, number> = {};
    railPipes.forEach(p => railCounts[p] = (railCounts[p] || 0) + ((numMounts - 1) * quantity));

    Object.entries(railCounts).forEach(([size, c]) => {
      items.push({ id: `pipe-rail-${size}`, partName: `${size} cm pipe (${hd} Handrail)`, qty: c, type: 'pipe', color: colorName });
    });

    const numRailCouplings = Math.max(0, railPipes.length - 1) * (numMounts - 1);
    if (numRailCouplings > 0) {
      items.push({ id: `f-couplings-rail-${hd}`, partName: `Couplings (${hd} Handrail)`, qty: numRailCouplings * quantity, type: 'fitting', color: colorName });
    }

    // Fittings Bracket specifically uses explicit Hex Nipples + Base elbows instead of stem pipes
    items.push({ id: `f-wall-flanges-${hd}`, partName: `Wall Flanges (${hd})`, qty: numMounts * quantity, type: 'fitting', color: colorName });
    items.push({ id: `f-hex-nipples-${hd}`, partName: `Hex Nipples (${hd})`, qty: (numMounts * 2) * quantity, type: 'fitting', color: colorName }); // Out + vertical nipples
    items.push({ id: `f-90-elbows-${hd}`, partName: `90° Elbows (${hd})`, qty: (numMounts + 2) * quantity, type: 'fitting', color: colorName }); // Bracket bases + 2 rail ends

    if (numMounts > 2) {
      items.push({ id: `f-t-fittings-${hd}`, partName: `T-Fittings (${hd})`, qty: (numMounts - 2) * quantity, type: 'fitting', color: colorName });
    }
  } else if (skuType === 'sku169') {
    const numMounts = Math.max(2, Math.ceil(length / 120) + 1);
    const hd = config.handrailDiameter || (config.tubeType === 'square' ? '27mm' : '33mm');

    // Main diagonal handrail pipes (segments separated by T-fittings)
    const mountSpacing = length / (numMounts - 1);
    const railLength = Math.max(0, mountSpacing - 3.0);
    const railPipes = getPipesForLength(railLength);
    const railCounts: Record<number, number> = {};
    railPipes.forEach(p => railCounts[p] = (railCounts[p] || 0) + ((numMounts - 1) * quantity));

    Object.entries(railCounts).forEach(([size, c]) => {
      items.push({ id: `pipe-rail-${size}`, partName: `${size} cm pipe (${hd} Handrail)`, qty: c, type: 'pipe', color: colorName });
    });

    const numRailCouplings = Math.max(0, railPipes.length - 1) * (numMounts - 1);
    if (numRailCouplings > 0) {
      items.push({ id: `f-couplings-rail-${hd}`, partName: `Couplings (${hd} Handrail)`, qty: numRailCouplings * quantity, type: 'fitting', color: colorName });
    }

    // Fittings Bracket specifically uses explicit Hex Nipples + Base elbows instead of stem pipes
    items.push({ id: `f-wall-flanges-${hd}`, partName: `Wall Flanges (${hd})`, qty: numMounts * quantity, type: 'fitting', color: colorName });
    items.push({ id: `f-hex-nipples-${hd}`, partName: `Hex Nipples (${hd})`, qty: (numMounts * 2) * quantity, type: 'fitting', color: colorName }); // Down + Inward nipples
    items.push({ id: `f-90-elbows-${hd}`, partName: `90° Elbows (${hd})`, qty: (numMounts + 2) * quantity, type: 'fitting', color: colorName }); // Corner bases + 2 ends

    if (numMounts > 2) {
      items.push({ id: `f-t-fittings-${hd}`, partName: `T-Fittings (${hd})`, qty: (numMounts - 2) * quantity, type: 'fitting', color: colorName });
    }
  } else if (skuType === 'sku170') {
    const dropHeight = 10;
    const numMounts = Math.max(3, Math.ceil(length / 120) + 1);
    const railLength = Math.max(0, length - (numMounts * 5));
    const railPipes = getEqualSplitPipes(railLength, numMounts - 1);

    // Consolidate all pipes by size
    const allPipeCounts: Record<number, number> = {};
    const addToConsolidated = (size: number, count: number) => {
      allPipeCounts[size] = (allPipeCounts[size] || 0) + count;
    };

    // Wall stem pipes
    const wallStemPipes = getPipesForLength(wallDistance - 2);
    wallStemPipes.forEach(p => addToConsolidated(p, numMounts * quantity));

    // Drop pipes
    const dropPipes = getPipesForLength(Math.max(0, dropHeight - 5));
    dropPipes.forEach(p => addToConsolidated(p, numMounts * quantity));

    // Rail pipes (already split by getEqualSplitPipes)
    railPipes.forEach(rp => addToConsolidated(rp, quantity));

    // Push all consolidated pipes
    Object.entries(allPipeCounts).forEach(([size, c]) => {
      items.push({
        id: `pipe-${size}`,
        partName: `${size} cm ${tubeType === 'square' ? 'square ' : ''}pipe`,
        qty: c,
        type: 'pipe',
        color: colorName
      });
    });

    // Fittings
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * numMounts);
    addFitting('f-90-elbows', '90° Elbows', quantity * (numMounts + 2));
    addFitting('f-t-fittings', 'T-Fittings', quantity * (numMounts - 2));
  } else if (skuType === 'sku178') {
    // 2 top end mounted flanges with drop pipes, and bottom middle mounted flanges straight to rail
    const dropHeight = 10;
    const numMounts = Math.max(3, Math.ceil(length / 120) + 1);
    const railLength = Math.max(0, length - (numMounts * 5));
    const railPipes = getEqualSplitPipes(railLength, numMounts - 1);

    const allPipeCounts: Record<number, number> = {};
    const addToConsolidated178 = (size: number, count: number) => {
      allPipeCounts[size] = (allPipeCounts[size] || 0) + count;
    };

    const wallStemPipes = getPipesForLength(wallDistance - 2);
    wallStemPipes.forEach(p => addToConsolidated178(p, numMounts * quantity));

    const dropPipes = getPipesForLength(Math.max(0, dropHeight - 5));
    // Only 2 drop pipes (on the left and right end brackets)
    dropPipes.forEach(p => addToConsolidated178(p, 2 * quantity));

    railPipes.forEach(rp => addToConsolidated178(rp, quantity));

    Object.entries(allPipeCounts).forEach(([size, c]) => {
      items.push({
        id: `pipe-${size}`,
        partName: `${size} cm ${tubeType === 'square' ? 'square ' : ''}pipe`,
        qty: c,
        type: 'pipe',
        color: colorName
      });
    });

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * numMounts);
    // Ends have 2 elbows each = 4 total elbows always
    addFitting('f-90-elbows', '90° Elbows', quantity * 4);
    // Middle brackets each use a T-fitting instead of an elbow
    addFitting('f-t-fittings', 'T-Fittings', quantity * (numMounts - 2));

    // Couplings
    const stemCouplings = numMounts * getExtraCouplings(wallDistance - 2, 1);
    const dropCouplings = 2 * getExtraCouplings(Math.max(0, dropHeight - 5), 1);
    const totalCouplings = stemCouplings + dropCouplings;
    if (totalCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * totalCouplings);
    }
  } else if (skuType === 'sku144') {
    // Wall-mounted toilet paper holder (Flange -> Pipe -> T-Fitting -> Cap + Pipe/Cap)
    addPipes(Math.max(0, wallDistance - 2), 1, 'p-wall');
    addPipes(Math.max(0, length), 1, 'p-roll-holder');

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 1);
    addFitting('f-end-caps', 'End Caps', quantity * 2);
  } else if (skuType === 'sku145') {
    // Floor-to-wall clothing rack with 4 wall ties
    addPipes(Math.max(0, length - 4.4), 1, 'p-horiz');
    addPipes(Math.max(0, (height / 2) - 3), 2, 'p-vert-bot');
    addPipes(Math.max(0, (height / 2) - 4), 2, 'p-vert-top');
    addPipes(Math.max(0, wallDistance - 2), 4, 'p-wall-arms');

    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 2);
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 4);
    addFitting('f-3way-corner-elbows', '3-Way Corner Elbows', quantity * 2);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * getExtraCouplings(Math.max(0, length - 4.4), 1));
  } else if (skuType === 'sku146') {
    // Twin brackets supporting an optional shelf
    // Two pipes back to wall, two front pipes, and two vertical stubs under shelf
    const zCenter = -wallDistance / 2;
    const backLength = Math.max(0, Math.abs(-wallDistance + 1.25 - (zCenter - 2.2)));
    const frontLength = Math.max(0, Math.abs(-1.8 - (zCenter + 2.2)));

    addPipes(backLength, 2, 'p-bracket-back');
    addPipes(frontLength, 2, 'p-bracket-front');
    addPipes(2.3, 2, 'p-bracket-up'); // Standard short pipe underneath the shelf

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 4); // 2 wall, 2 shelf
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    addFitting('f-end-caps', 'End Caps', quantity * 2);

    if (hasShelves) {
      items.push({ id: `wood-shelf-${length}x${wallDistance}`, partName: `${length}x${wallDistance}x3cm Wooden Shelf`, qty: 1 * quantity, type: 'wood', color: woodColor });
    }
  } else if (skuType === 'sku147') {
    // Wall-mounted two-level rack (5cm drop gap between elbows and T-fitting)
    addPipes(Math.max(0, length - 10), 1, 'p-horiz');
    addPipes(Math.max(0, wallDistance - 2), 4, 'p-wall-arms');

    // The exact distance between 90-deg Elbow and T-Fitting is 5cm.
    addPipes(5, 4, 'p-vert-drop');

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 4);
    addFitting('f-90deg-elbows', '90° Elbows', quantity * 4);
    addFitting('f-tees', 'T-Fittings', quantity * 2);
    addFitting('f-couplings', 'Couplings', quantity * getExtraCouplings(Math.max(0, length - 10), 1));
  } else if (skuType === 'sku148') {
    // Single L-shaped Floor-to-Wall point
    addPipes(Math.max(0, height - 2.5), 1, 'p-vert');
    addPipes(Math.max(0, length - 2.5), 1, 'p-wall-conn');

    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 1);
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-90deg-elbows', '90° Elbows', quantity * 1);

    // Coupling calculation for potentially long pipes
    const vertCouplings = getExtraCouplings(Math.max(0, height - 2.5), 1);
    const horizCouplings = getExtraCouplings(Math.max(0, length - 2.5), 1);
    const totalCouplings = vertCouplings + horizCouplings;
    if (totalCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * totalCouplings);
    }
  } else if (skuType === 'sku149') {
    // Wall-mounted U-shaped rack
    // Exact user specifications: 10cm from wall, 23cm going down, user length
    const targetCutLength = length;
    const targetCutHeight = 23;
    const targetCutDepth = 10;

    addPipes(Math.max(0, targetCutLength), 1, 'p-horiz');
    addPipes(Math.max(0, targetCutDepth), 2, 'p-wall');
    addPipes(Math.max(0, targetCutHeight), 2, 'p-vert');

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-90-elbows', '90° Elbows', quantity * 4); // 2 top, 2 bottom

    const horizCouplings = getExtraCouplings(Math.max(0, targetCutLength), 1);
    const vertCouplings = getExtraCouplings(Math.max(0, targetCutHeight), 2);
    const depthCouplings = getExtraCouplings(Math.max(0, targetCutDepth), 2);
    const totalCouplings = horizCouplings + vertCouplings + depthCouplings;
    if (totalCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * totalCouplings);
    }
  } else if (skuType === 'sku150') {
    // Multi-leg floor-to-wall rack
    const legs = 3; // Hardcoded to 3 as requested
    const segments = 2;

    // Exact user specifications
    const cutLength = length - 15;
    const cutHeight = height - 5;
    const cutDepth = wallDistance - 5;

    // Asymmetrical split across available 5cm increments logic for horizontal pipe pieces
    const baseLen = Math.floor((Math.max(0, cutLength) / segments) / 5) * 5;
    const remLength = Math.max(0, cutLength) - (baseLen * segments);
    const spans = new Array(segments).fill(baseLen);
    for (let j = 0; j < Math.round(remLength / 5); j++) {
      spans[j % segments] += 5;
    }

    addPipes(Math.max(0, cutHeight), legs, 'p-vert');       // Vertical drops
    addPipes(Math.max(0, cutDepth), legs, 'p-wall'); // Wall standoffs
    spans.forEach((span, idx) => {
      addPipes(Math.max(0, span), 1, `p-horiz-${idx}`);
    });

    addFitting('f-floor-flanges', 'Floor Flanges', quantity * legs);
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * legs);
    addFitting('f-3way-corner-elbows', '3-Way Corner Elbows', quantity * 2);
    addFitting('f-4way-fittings', '4-Way Fittings', quantity * 1);

    // Couplings
    let horizCouplings = 0;
    spans.forEach(span => {
      horizCouplings += getExtraCouplings(Math.max(0, span), 1);
    });
    const vertCouplings = getExtraCouplings(Math.max(0, cutHeight), legs);
    const depthCouplings = getExtraCouplings(Math.max(0, cutDepth), legs);
    const totalCouplings = horizCouplings + vertCouplings + depthCouplings;
    if (totalCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * totalCouplings);
    }
  } else if (skuType === 'sku151') {
    // Ceiling light fixture - NO parts list exactly as requested!
    addFitting('f-ceiling-light', 'Ceiling Light', quantity);
  } else if (skuType === 'sku152') {
    // Wall-mounted toilet roll holder
    addPipes(5, 1, 'p-wall');
    addPipes(15, 1, 'p-horiz');

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 1);
    addFitting('f-end-caps', 'End Caps', quantity * 1);
  } else if (skuType === 'sku153') {
    // 4 Independent Table Legs
    addPipes(length, 4, 'p-vert');
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 8);

    const legCouplings = getExtraCouplings(length, 4);
    if (legCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * legCouplings);
    }
  } else if (skuType === 'sku154') {
    // 1 Independent Table Leg
    addPipes(length, 1, 'p-vert');
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 2);

    const legCouplings = getExtraCouplings(length, 1);
    if (legCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * legCouplings);
    }
  } else if (skuType === 'sku155') {
    // Wall-mounted Double Towel Rack: 4 horizontal bars total (2 inner + 2 outer), same length
    addPipes(wallDistance, 2, 'p-wall-conn');
    addPipes(Math.max(0, length - 4.4), 2, 'p-horiz'); // 2 bars: 1 inner, 1 outer

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 4);
    addFitting('f-unions', 'Unions', quantity * 2);
    addFitting('f-elbows', '90-degree Elbows', quantity * 2);

    // Couplings only needed when a single bar exceeds 120cm
    const horizBarCouplings = getExtraCouplings(Math.max(0, length - 4.4), 2);
    if (horizBarCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * horizBarCouplings);
    }
  } else if (skuType === 'sku125') {
    // Wall-mounted industrial hook (Single arm) - Direct Hex Nipple Connection
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 1);
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 3);
    addFitting('f-end-caps', 'End Caps', quantity * 2);
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
  } else if (skuType === 'sku132') {
    // Exact requested measurements directly forming the cutlist:
    const cutLength = length - 10;
    const cutHeight = height - 5;
    const cutDepth = wallDistance - 5;

    const vertPipes = getPipesForLength(cutHeight);
    vertPipes.forEach((p, i) => addPipes(p, 2, `p-leg-${i}`));

    const horizPipes = getPipesForLength(cutLength);
    horizPipes.forEach((p, i) => addPipes(p, 1, `p-rail-${i}`));

    const wallPipes = getPipesForLength(cutDepth);
    wallPipes.forEach((p, i) => addPipes(p, 2, `p-wall-arm-${i}`));

    const totalCouplings132 = ((vertPipes.length - 1) * 2) + (horizPipes.length - 1) + ((wallPipes.length - 1) * 2);
    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 2);
    addFitting('f-corner-elbows', '3-Way Fitting', quantity * 2);  // both top corners
    addFitting('f-couplings', 'Couplings', quantity * totalCouplings132);
  } else if (skuType === 'sku133') {
    // 2 independent wall brackets
    const standoffPipeLen = Math.max(height, 2);

    addPipes((wallDistance / 2) - 3.4, 2, 'p-wall-arm-back');
    addPipes((wallDistance / 2) - 4.4, 2, 'p-wall-arm-front');
    addPipes(standoffPipeLen, 4, 'p-standoff');

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 2);
    addFitting('f-floor-flanges', 'Floor Flanges', quantity * 4);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 2);
    addFitting('f-90-elbows', '90° Elbows', quantity * 2);
  } else if (skuType === 'sku134') {
    // Single T bar wall mount (1 flange -> wall pipe -> elbow -> hex nipple -> T-fitting -> 2 arm pipes -> 2 elbows up)
    addPipes(wallDistance - 3.4, 1, 'p-wall-arm'); // wall flange + elbow

    // Hanging bar is split exactly in half by the T-fitting.
    // T-fitting deduction = 1.8cm for each side. End Elbow = 2.2cm.
    // Total deduction per arm = left elbow(2.2) + T-fitting_left(1.8) = 4.0cm.
    const armLen = length / 2;
    const armPipes = getPipesForLength(armLen - 4.0); // T-fitting + end Elbow
    armPipes.forEach((p, i) => addPipes(p, 2, `p-hang-arm-${i}`));
    const extraCouplings = ((armPipes.length - 1) * 2);

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-t-fittings', 'T-Fittings', quantity * 1);
    addFitting('f-90-elbows', '90° Elbows', quantity * 3); // 2 ends + 1 center drop
    addFitting('f-hex-nipples', 'Hex Nipples', quantity * 1);

    if (extraCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * extraCouplings);
    }
  } else if (skuType === 'sku135') {
    // Ceiling-to-Wall L-bracket
    // Horizontal pipe from wall flange to elbow
    const horizPipes = getPipesForLength(length - 3.4);
    horizPipes.forEach(p => addPipes(p, 1, 'p-wall-arm'));

    // Vertical pipe from ceiling flange to elbow
    const vertPipes = getPipesForLength(height - 3.4);
    vertPipes.forEach(p => addPipes(p, 1, 'p-ceiling-drop'));

    const numCouplings = (horizPipes.length > 0 ? horizPipes.length - 1 : 0) + (vertPipes.length > 0 ? vertPipes.length - 1 : 0);

    addFitting('f-wall-flanges', 'Wall Flanges', quantity * 1);
    addFitting('f-floor-flanges', 'Ceiling Flanges (Floor/Wall type)', quantity * 1);
    addFitting('f-90-elbows', '90° Elbows', quantity * 1);

    if (numCouplings > 0) {
      addFitting('f-couplings', 'Couplings', quantity * numCouplings);
    }
  } else if (skuType === 'sku136') {
    // Lucite Handrail

    const addLucite = (size: number, count: number) => {
      items.push({
        id: `lucite-rod-${size.toFixed(1)}`,
        partName: `${size.toFixed(1)} cm Lucite Rod`,
        qty: count * quantity,
        type: 'pipe', // Renders in the "Pipes" section
        color: 'Clear' // Show clear as its special color
      });
    };

    // The Lucite Rod itself
    // Outer rods: two 15cm pieces
    addLucite(15, 2);

    // Middle rods
    const bracketOffset = 15;
    const middleLength = Math.max(0, length - bracketOffset * 2);
    let numBrackets = 2; // base 2 brackets (ends)

    if (middleLength > 0) {
      const maxLuciteLen = 120;
      const numMiddleSegs = Math.ceil(middleLength / maxLuciteLen);
      const segLen = middleLength / numMiddleSegs;

      numBrackets += (numMiddleSegs - 1);

      addLucite(segLen, numMiddleSegs);
    }

    // End caps for the rod
    addFitting('f-stop-end-caps', 'Metal End Caps (rod)', quantity * 2);

    // Consolidated bracket listing
    addFitting('f-handrail-brackets', 'Handrail Bracket', quantity * numBrackets);

  } else if (skuType === 'sku138') {
    items.push({
      id: `lucite-rod-${length.toFixed(1)}`,
      partName: `${length.toFixed(1)} cm Lucite Rod`,
      qty: 1 * quantity,
      type: 'pipe',
      color: 'Clear'
    });
    addFitting('f-straight-brackets', 'Straight Handrail Bracket', quantity * 1);

  } else if (skuType === 'sku137') {
    // Straight Lucite Handrail
    const addLucite = (size: number, count: number) => {
      items.push({
        id: `lucite-rod-${size.toFixed(1)}`,
        partName: `${size.toFixed(1)} cm Lucite Rod`,
        qty: count * quantity,
        type: 'pipe',
        color: 'Clear'
      });
    };

    const maxLuciteLen = 120;
    const numSegs = Math.ceil(length / maxLuciteLen) || 1;
    const segLen = length / numSegs;

    addLucite(segLen, numSegs);

    const numBrackets = numSegs + 1;
    addFitting('f-straight-brackets', 'Straight Handrail Bracket', quantity * numBrackets);

    if (hasShelves) {
      addFitting('f-stop-end-caps', 'Metal End Caps (rod)', quantity * 2);
    }

  } else if (skuType !== 'sku108' && skuType !== 'sku109' && skuType !== 'sku110' && skuType !== 'sku111' && skuType !== 'sku113' && skuType !== 'sku116' && skuType !== 'sku119' && skuType !== 'sku120' && skuType !== 'sku121' && skuType !== 'sku122' && skuType !== 'sku123' && skuType !== 'sku124' && skuType !== 'sku125' && skuType !== 'sku126' && skuType !== 'sku127' && skuType !== 'sku128' && skuType !== 'sku129' && skuType !== 'sku130' && skuType !== 'sku131' && skuType !== 'sku132' && skuType !== 'sku133' && skuType !== 'sku134' && skuType !== 'sku135' && skuType !== 'sku136' && skuType !== 'sku137' && skuType !== 'sku138' && skuType !== 'sku140' && skuType !== 'sku141' && skuType !== 'sku142' && skuType !== 'sku143' && skuType !== 'sku144' && skuType !== 'sku145' && skuType !== 'sku146' && skuType !== 'sku147' && skuType !== 'sku148' && skuType !== 'sku149' && skuType !== 'sku150' && skuType !== 'sku151' && skuType !== 'sku152' && skuType !== 'sku153' && skuType !== 'sku154' && skuType !== 'sku155' && skuType !== 'sku156' && skuType !== 'sku157' && skuType !== 'sku158' && skuType !== 'sku159' && skuType !== 'sku160' && skuType !== 'sku161' && skuType !== 'sku162' && skuType !== 'sku163' && skuType !== 'sku164' && skuType !== 'sku165' && skuType !== 'sku169' && skuType !== 'sku171' && skuType !== 'sku172' && skuType !== 'sku173' && skuType !== 'sku174' && skuType !== 'sku175' && skuType !== 'sku176' && skuType !== 'sku177' && skuType !== 'sku178') {
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
  if ((skuType === 'sku106' || skuType === 'sku156' || skuType === 'sku157' || skuType === 'sku107') && hasShelves) {
    const depth = skuType === 'sku157' ? 23 : wallDistance;
    addWood('w-shelf', 'Wood Shelf', quantity * tiers, `${length} × ${depth} cm`);
  }
  if (skuType === 'sku158' && hasShelves) {
    addWood('w-shelf', 'Wood Shelf', quantity, `${length} × ${wallDistance} cm`);
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
  if (skuType === 'sku133' && hasShelves) {
    addWood('w-shelf', 'Wood Shelf', quantity, `${length + 10} × ${wallDistance} cm`);
  }
  if (skuType === 'sku141' && hasShelves) {
    addWood('w-shelf', 'Bench Top', quantity, `${length + 20} × ${wallDistance + 20} cm`);
  }
  if (skuType === 'sku162') {
    addWood('w-shelf', 'Display Shelf', quantity, `${length} × ${wallDistance} cm`);
  }
  if (skuType === 'sku163' || skuType === 'sku164') {
    addWood('w-shelf', 'Console Shelf', quantity, `${length} × ${wallDistance} cm`);
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
                onClick={() => onOpenInConfigurator?.(order.items[0], 0)}
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
                        onClick={() => onOpenInConfigurator?.(config, idx)}
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
