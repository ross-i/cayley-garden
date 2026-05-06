import { graphHighlight, triangleState, tableHighlight, ballsState, clearAll } from './animState.js';

// D₃ element keys
const E   = '0,1,2';
const R   = '2,0,1';
const R2  = '1,2,0';
const F   = '0,2,1';
const RF  = '1,0,2';
const R2F = '2,1,0';

const ALL_NODES = new Set([E, R, R2, F, RF, R2F]);

// Edge id format: "<sourceId>-><targetId>:<genIdx>"  (gen 0=r blue, gen 1=f red)
const E_TO_R    = `${E}->${R}:0`;
const E_TO_F    = `${E}->${F}:1`;
const R_TO_R2   = `${R}->${R2}:0`;
const R_TO_R2F  = `${R}->${R2F}:1`;
const F_TO_RF   = `${F}->${RF}:0`;
const R2_TO_E   = `${R2}->${E}:0`;
const R2_TO_RF  = `${R2}->${RF}:1`;
const RF_TO_R2F = `${RF}->${R2F}:0`;
const R2F_TO_F  = `${R2F}->${F}:0`;

const R_EDGES = new Set([E_TO_R, R_TO_R2, R2_TO_E]);          // rotation cycle (blue)
const F_EDGES = new Set([E_TO_F, R_TO_R2F, R2_TO_RF]);        // flip edges (red)
const ALL_EDGES = new Set([...R_EDGES, ...F_EDGES, F_TO_RF, RF_TO_R2F, R2F_TO_F]);

export const animations = {

  // ── Component entry/exit — CSS handles the column slide; stores just reset ──

  // Graph is introduced alongside the portrait: light up the whole graph so the
  // viewer's eye is drawn to it as "this is a Cayley graph."
  portraitSlideIn: () => {
    graphHighlight.set({ nodes: ALL_NODES, edges: ALL_EDGES });
  },

  // Portrait exits; graph re-centres — return to neutral state.
  portraitSlideOut: clearAll,

  // Triangle enters on the left — both components appear clean.
  triangleSlideIn: clearAll,

  // Table enters on the right — clear any path highlight from the previous stage.
  tableSlideIn: clearAll,

  // All three components fly off; blank stage before the balls section.
  flyOffRight: clearAll,

  // Balls appear in static arrangement.
  ballsAppear: clearAll,

  // S₄ graph fades in — no store state needed.
  s4GraphReveal: clearAll,

  // Labeled triangle re-enters for the permutation-group section.
  labeledTriangleIn: () => {
    clearAll();
    triangleState.set({ rotation: 0, showAxis: false, labeled: true, flipTick: 0 });
  },

  // Garden intro — everything exits, screen goes blank.
  triangleOut: clearAll,

  // ── Graph highlighting ─────────────────────────────────────────────────────

  // Stage 3: nodes-intro — highlight all 6 nodes to show "elements of the group".
  highlightAllNodes: () => {
    graphHighlight.set({ nodes: ALL_NODES, edges: new Set() });
  },

  // Stage 4: generators-intro — highlight r-edges (blue) and f-edges (red) to
  // show which edges come from which generator.
  highlightGeneratorEdges: () => {
    graphHighlight.set({ nodes: ALL_NODES, edges: ALL_EDGES });
  },

  // Stage 7: e is the identity — highlight e, reset triangle to rest.
  highlightE: () => {
    graphHighlight.set({ nodes: new Set([E]), edges: new Set() });
    triangleState.update(s => ({ ...s, showAxis: false, rotation: 0 }));
  },

  // Stage 8: f is the flip — highlight f, show the vertical axis, and animate
  // the triangle flipping over it (flipTick increment retriggers the animation).
  highlightF: () => {
    graphHighlight.set({ nodes: new Set([F]), edges: new Set() });
    triangleState.update(s => ({
      ...s,
      rotation: 0,
      showAxis: true,
      flipTick: s.flipTick + 1,
    }));
  },

  // Stage 9: r is rotation — highlight r, rotate triangle by exactly 120° CW.
  // Absolute (not cumulative) so re-visiting the stage gives the same result.
  highlightR: () => {
    graphHighlight.set({ nodes: new Set([R]), edges: new Set() });
    triangleState.update(s => ({ ...s, rotation: 120, showAxis: false }));
  },

  // Stage 11: rf path — highlight nodes e→r→rf and the two edges between them;
  // triangle stays at 120° to show the rotation has been applied.
  highlightRFPath: () => {
    graphHighlight.set({
      nodes: new Set([E, F, RF]),
      edges: new Set([E_TO_F, F_TO_RF]),
    });
    // TODO: multi-stage animation of triangle
    // 1.) rotate 120, 2.) show vertical axis and flip over it,
    // 3.) show axis through lower right vertex and flip over it
    triangleState.update(s => ({
      ...s,
      // rotation: 120,
      showAxis: true,
      // flipTick: s.flipTick + 1,
    }));
  },

  // ── Table highlighting ─────────────────────────────────────────────────────

  // Stage 13: row r, column f → cell rf.
  highlightTableRF: () => {
    tableHighlight.set({ row: R, col: F, cell: RF });
  },

  // Stage 14: row f, column r → cell r²f (non-abelian: order matters).
  highlightTableR2F: () => {
    tableHighlight.set({ row: F, col: R, cell: R2F });
  },

  // ── Ball animations ────────────────────────────────────────────────────────

  ballSwap12:   () => ballsState.set({ animation: 'swap12' }),
  ballCycle123: () => ballsState.set({ animation: 'cycle123' }),

  // ── Labeled-triangle section (stages 24–25) ────────────────────────────────

  // Stage 24: flip over vertical axis → show axis and animate the flip.
  labeledFlipAxis: () => {
    triangleState.update(s => ({
      ...s,
      rotation: 0,
      showAxis: true,
      labeled: true,
      flipTick: s.flipTick + 1,
    }));
  },

  // Stage 25: rotation → triangle rotates to 120° with vertex labels visible.
  labeledRotation: () => {
    triangleState.update(s => ({ ...s, rotation: 120, labeled: true }));
  },
};
