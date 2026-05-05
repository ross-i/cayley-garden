import { writable, derived } from 'svelte/store';
import { toWordLabel, toCycleNotation } from './lib/permutations.js';

// ── Primary stores ───────────────────────────────────────────────

// Size of the symmetric group: 2, 3, 4, or 5. null before the user selects.
export const n = writable(null);

// Selected generators as permutation arrays.
export const generators = writable([]);

// Hex color string for each generator, parallel index to generators[].
export const generatorColors = writable([]);

// Single-letter name for each generator ('a', 'b', ...), parallel to generators[].
export const generatorNames = writable([]);

// When true, nodes are labeled as generator words; when false, cycle notation.
export const useNames = writable(false);

// When true, the full ghost graph of S_n is shown on a circle layout.
// Toggling this to true resets generation (enforced in Controls.svelte).
// Disabled at the UI level when n === 5 (S_5 has 120 nodes / 14 280 edges).
export const ghostMode = writable(false);

// When true, the Cayley table panel is rendered.
export const cayleyVisible = writable(false);

// Array of frame deltas. frames[0] seeds the identity node; subsequent
// entries are produced by successive stepForward calls.
// Shape: { addedNodeIds: string[], addedEdgeIds: string[] }[]
export const frames = writable([]);

// Slider position: index into frames[]. 0 = only the identity node visible.
export const currentFrame = writable(0);

// Tracks which (nodeId, genIdx) pairs have already been processed.
// Key format: "${nodeId}:${genIdx}" (see cayley.js for full spec).
// Persisted here so that manual Step Forward calls can resume mid-generation.
export const applied = writable(new Set());

// Master node map: id → node object. Populated as nodes are discovered.
// Note: mutating the Map object and calling .set(map) is required to trigger
// Svelte reactivity — do not rely on in-place mutation alone.
export const allNodes = writable(new Map());

// Master edge map: id → edge object. Populated as edges are discovered.
// Same reactivity caveat as allNodes.
export const allEdges = writable(new Map());

// True when stepForward returns an empty delta (no new nodes).
// Set to true by Controls.svelte after generate() or a stable stepForward.
// Reset to false by handleReset.
export const isStable = writable(false);

// Top-level view: which screen is the user on.
export const appView = writable('landing'); // 'landing' | 'tutorial' | 'app'

// ── Derived stores ───────────────────────────────────────────────

// All nodes whose ids appear in frames[0..currentFrame], with a reactive
// `.label` field computed from useNames / generatorNames so that toggling
// the name switch or editing a name updates labels without re-generating.
export const visibleNodes = derived(
  [frames, currentFrame, allNodes, useNames, generatorNames],
  ([$frames, $currentFrame, $allNodes, $useNames, $generatorNames]) => {
    const ids = new Set();
    for (let i = 0; i <= $currentFrame; i++) {
      if ($frames[i]) {
        for (const id of $frames[i].addedNodeIds) ids.add(id);
      }
    }
    return [...ids]
      .map(id => $allNodes.get(id))
      .filter(Boolean)
      .map(nd => ({
        ...nd,
        label: $useNames
          ? toWordLabel(nd.wordPath, $generatorNames)
          : toCycleNotation(nd.perm),
      }));
  }
);

// All edges whose ids appear in frames[0..currentFrame].
export const visibleEdges = derived(
  [frames, currentFrame, allEdges],
  ([$frames, $currentFrame, $allEdges]) => {
    const ids = new Set();
    for (let i = 0; i <= $currentFrame; i++) {
      if ($frames[i]) {
        for (const id of $frames[i].addedEdgeIds) ids.add(id);
      }
    }
    return [...ids].map(id => $allEdges.get(id)).filter(Boolean);
  }
);

// Whether the UI is in dark mode. Initialized from the system preference;
// the user can override via the toggle in the header.
export const darkMode = writable(false);

// Incremented by Controls when the Generate animation finishes its last frame.
// GraphView watches this to trigger a settle-and-refit pass.
export const fitSignal = writable(0);

// Incremented when the frame slider is released.
// GraphView fits the viewBox after a short delay, without a cola settle.
export const viewBoxFitSignal = writable(0);

// True when the graph is fully grown AND the slider is at the final frame.
// Drives the GroupMessage display.
export const generationComplete = derived(
  [isStable, frames, currentFrame],
  ([$isStable, $frames, $currentFrame]) =>
    $isStable && $frames.length > 1 && $currentFrame === $frames.length - 1
);
