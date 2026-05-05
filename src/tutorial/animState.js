import { writable } from 'svelte/store';

// Node/edge highlight sets for the D₃ Cayley graph.
// nodes: Set of node id strings (e.g. '0,1,2')
// edges: Set of edge id strings (e.g. '0,1,2->2,0,1:0')
export const graphHighlight = writable({ nodes: new Set(), edges: new Set() });

// State for the equilateral triangle animation.
// rotation: total degrees CW (CSS transform; transitions smoothly)
// showAxis: draw the vertical flip axis
// labeled: show vertex labels 1, 2, 3
// flipTick: increment to trigger one flip animation cycle
export const triangleState = writable({ rotation: 0, showAxis: false, labeled: false, flipTick: 0 });

// Highlight state for the D₃ Cayley table.
// row/col/cell: element key string (e.g. '2,0,1') or null
export const tableHighlight = writable({ row: null, col: null, cell: null });

// Current animation for the balls component.
// null = static; 'swap12' = swap balls 1&2; 'cycle123' = cycle balls 1,2,3
export const ballsState = writable({ animation: null });

export function clearAll() {
  graphHighlight.set({ nodes: new Set(), edges: new Set() });
  triangleState.set({ rotation: 0, showAxis: false, labeled: false, flipTick: 0 });
  tableHighlight.set({ row: null, col: null, cell: null });
  ballsState.set({ animation: null });
}
