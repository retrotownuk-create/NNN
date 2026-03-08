export type ColorOption = {
  name: string;
  pipeColor: string;
  fittingColor: string;
  metalness: number;
  roughness: number;
};

export const COLORS: Record<string, ColorOption> = {
  'Black': { name: 'Black', pipeColor: '#222222', fittingColor: '#111111', metalness: 0.8, roughness: 0.5 },
  'White': { name: 'White', pipeColor: '#f0f0f0', fittingColor: '#e0e0e0', metalness: 0.1, roughness: 0.8 },
  'Gold': { name: 'Gold', pipeColor: '#d4af37', fittingColor: '#c5a017', metalness: 1.0, roughness: 0.3 },
  'Raw grey': { name: 'Raw grey', pipeColor: '#a0a0a0', fittingColor: '#555555', metalness: 0.6, roughness: 0.4 },
  'Rustic silver': { name: 'Rustic silver', pipeColor: '#b0b0b0', fittingColor: '#888888', metalness: 0.7, roughness: 0.6 },
  'Rustic Brass': { name: 'Rustic Brass', pipeColor: '#b5a642', fittingColor: '#8b7d3b', metalness: 0.8, roughness: 0.6 },
  'Rustic copper': { name: 'Rustic copper', pipeColor: '#b87333', fittingColor: '#8a5a2b', metalness: 0.8, roughness: 0.6 },
  'Silver': { name: 'Silver', pipeColor: '#c0c0c0', fittingColor: '#a0a0a0', metalness: 0.9, roughness: 0.2 },
};

export const WOOD_COLORS: Record<string, string> = {
  'Dark Oak': '#4a3728',
  'Natural Oak': '#d9b372',
  'Natural': '#f5deb3',
  'Black': '#1a1a1a',
  'Aged Oak': '#6b5c4a'
};

const AVAILABLE_PIPE_SIZES = [
  5, 8, 10, 12, 15, 17, 20, 23, 25,
  30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 120
];

export const getPipesForLength = (target: number): number[] => {
  if (target <= 0) return [];

  const numPipes = Math.ceil(target / 120);
  const idealLength = target / numPipes;

  const pipes: number[] = [];
  let remainingTarget = target;

  for (let i = 0; i < numPipes; i++) {
    if (i === numPipes - 1) {
      const closest = AVAILABLE_PIPE_SIZES.reduce((prev, curr) =>
        Math.abs(curr - remainingTarget) < Math.abs(prev - remainingTarget) ? curr : prev
      );
      pipes.push(closest);
    } else {
      const closest = AVAILABLE_PIPE_SIZES.reduce((prev, curr) =>
        Math.abs(curr - idealLength) < Math.abs(prev - idealLength) ? curr : prev
      );
      pipes.push(closest);
      remainingTarget -= closest;
    }
  }

  return pipes;
};

export const getExtraCouplings = (target: number, count: number) => {
  const pipes = getPipesForLength(target);
  return (pipes.length - 1) * count;
};
