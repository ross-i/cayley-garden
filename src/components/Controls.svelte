<script>
  // Generate / Step Forward / Reset buttons and the frame slider.
  // Also houses the ghost-mode toggle.

  import { generators, frames, currentFrame, applied,
           allNodes, allEdges, ghostMode, n, isStable,
           fitSignal, viewBoxFitSignal } from '../stores.js';
  import { generate, stepForward, initialState } from '../lib/cayley.js';
  import { identity, toKey } from '../lib/permutations.js';

  const STEP_DELAY_MS = 500;
  let animationTimer = null;

  // Generate button: runs generate() to completion.
  // Always restarts from scratch (resets allNodes, allEdges, applied).
  // Writes the returned { frames, nodes, edges } to the corresponding stores,
  // advances currentFrame to the last frame, and sets isStable.
  // Disabled when no generators are selected.
  function handleGenerate() {
    if (!$n || $generators.length === 0) return;
    if (animationTimer) { clearInterval(animationTimer); animationTimer = null; }

    const { frames: newFrames, nodes, edges } = generate($n, $generators);
    allNodes.set(nodes);
    allEdges.set(edges);
    applied.set(new Set());
    frames.set(newFrames);
    currentFrame.set(0);
    isStable.set(true);

    // Animate through frames one step at a time.
    let f = 0;
    animationTimer = setInterval(() => {
      f++;
      currentFrame.set(f);
      if (f >= newFrames.length - 1) {
        clearInterval(animationTimer);
        animationTimer = null;
        fitSignal.update(s => s + 1);
      }
    }, STEP_DELAY_MS);
  }

  // Step Forward button: runs one stepForward() call.
  // Reads allNodes/allEdges/applied from stores, assembles the state object,
  // calls stepForward (which mutates state and applied in place), then calls
  // .set() on each store to trigger Svelte reactivity (in-place mutation alone
  // does not notify subscribers). Appends the delta to frames, advances
  // currentFrame, and sets isStable when the delta is empty.
  // Disabled when no generators are selected or the graph is already stable.
  function handleStepForward() {
    if (!$n || $generators.length === 0 || $isStable) return;
    const state = { nodes: $allNodes, edges: $allEdges };
    const delta = stepForward(state, $generators, $applied);
    allNodes.set($allNodes);
    allEdges.set($allEdges);
    applied.set($applied);
    frames.update(f => [...f, delta]);
    currentFrame.update(c => c + 1);
    if (delta.addedNodeIds.length === 0) isStable.set(true);
    viewBoxFitSignal.update(s => s + 1);
  }

  // Reset button: clears all generation state and returns to the identity-only graph.
  // Does not clear the selected generators.
  function handleReset() {
    if (animationTimer) { clearInterval(animationTimer); animationTimer = null; }
    if (!$n) return;
    const { nodes, edges } = initialState($n);
    allNodes.set(nodes);
    allEdges.set(edges);
    applied.set(new Set());
    const identityId = toKey(identity($n));
    frames.set([{ addedNodeIds: [identityId], addedEdgeIds: [] }]);
    currentFrame.set(0);
    isStable.set(false);
  }

  // Auto-initialize the seed frame whenever n is set and frames is empty.
  // This fires after group selection and after generator toggles (which clear frames),
  // ensuring the identity node is always visible as the starting state.
  $: if ($n && $frames.length === 0) handleReset();

  // Whether Step Forward / Generate should be disabled.
  $: noGenerators = $generators.length === 0;

  // Whether the slider should be shown (only after at least one step).
  $: hasFrames = $frames.length > 1;
</script>

<div class="controls">

  <div class="buttons">
    <button on:click={handleGenerate} disabled={noGenerators}>
      Generate
    </button>
    <button on:click={handleStepForward} disabled={noGenerators || $isStable}>
      Step Forward
    </button>
    <button on:click={handleReset}>
      Reset
    </button>
  </div>

  {#if hasFrames}
    <div class="slider-row">
      <label for="frame-slider">Step:</label>
      <input
        id="frame-slider"
        type="range"
        min="0"
        max={$frames.length - 1}
        bind:value={$currentFrame}
        on:change={() => viewBoxFitSignal.update(s => s + 1)}
      />
      <span>{$currentFrame} / {$frames.length - 1}</span>
    </div>
  {/if}

  <label class="ghost-toggle">
    <input
      type="checkbox"
      bind:checked={$ghostMode}
    />
    Show all elements of S{$n != null ? String.fromCodePoint(0x2080 + $n) : '?'}
    <!-- {#if $ghostMode && $n === 5}<span class="disabled-note">(edges hidden for S₅)</span>{/if} -->
  </label>

</div>

<style>
  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .buttons {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .slider-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .slider-row input {
    flex: 1;
  }
  .ghost-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.875rem;
  }
  .disabled-note {
    color: #888;
    font-size: 0.8rem;
  }
</style>
