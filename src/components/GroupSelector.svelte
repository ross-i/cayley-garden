<script>
  // Dropdown for picking the size of the symmetric group (S_2 through S_5).
  //
  // Going to a LARGER group: generators are embedded (fixed points appended) and
  // the existing graph is re-keyed to the new permutation representation, so the
  // user can keep building the same subgroup inside the bigger group.
  //
  // Going to a SMALLER group: generators that move elements >= newN are dropped.
  // If any were dropped the graph is reset; otherwise the graph is projected
  // (permutation arrays truncated, keys updated) and kept intact.
  //
  // Ghost mode is always preserved; renderGhostBase already skips edges for S₅.

  import { n, generators, generatorColors, generatorNames, frames,
           currentFrame, applied, isStable, allNodes, allEdges } from '../stores.js';
  import { toKey } from '../lib/permutations.js';

  const options = [2, 3, 4, 5];
  const sub = v => String.fromCodePoint(0x2080 + v);

  // Extend a permutation to length newN by appending fixed points.
  function embedPerm(perm, newN) {
    const result = [...perm];
    for (let i = perm.length; i < newN; i++) result.push(i);
    return result;
  }

  // True if perm (length > newN) is valid in S_newN:
  // every element at index >= newN must be a fixed point.
  function isValidInSmaller(perm, newN) {
    for (let i = newN; i < perm.length; i++) {
      if (perm[i] !== i) return false;
    }
    return true;
  }

  // Re-keys allNodes, allEdges, frames, and applied after transforming permutations.
  // transformPerm: (perm: number[]) => number[]
  function remapGraph(transformPerm) {
    if ($frames.length === 0) return;

    // Build old-key → new-key maps before mutating any store.
    const nodeKeyMap = new Map();
    $allNodes.forEach((node, oldKey) => {
      nodeKeyMap.set(oldKey, toKey(transformPerm(node.perm)));
    });

    const edgeKeyMap = new Map();
    $allEdges.forEach((edge, oldId) => {
      const src = nodeKeyMap.get(edge.sourceId);
      const tgt = nodeKeyMap.get(edge.targetId);
      edgeKeyMap.set(oldId, `${src}->${tgt}:${edge.generatorIndex}`);
    });

    const newNodes = new Map();
    $allNodes.forEach((node, oldKey) => {
      const newPerm = transformPerm(node.perm);
      const newKey  = nodeKeyMap.get(oldKey);
      newNodes.set(newKey, { ...node, id: newKey, perm: newPerm });
    });

    const newEdges = new Map();
    $allEdges.forEach((edge, oldId) => {
      const newId = edgeKeyMap.get(oldId);
      newEdges.set(newId, {
        ...edge, id: newId,
        sourceId: nodeKeyMap.get(edge.sourceId),
        targetId: nodeKeyMap.get(edge.targetId),
      });
    });

    const newFrames = $frames.map(f => ({
      addedNodeIds: f.addedNodeIds.map(id => nodeKeyMap.get(id) ?? id),
      addedEdgeIds: f.addedEdgeIds.map(id => edgeKeyMap.get(id) ?? id),
    }));

    // applied entries: "${nodeId}:${genIdx}" — split on last colon.
    const newApplied = new Set();
    $applied.forEach(key => {
      const c = key.lastIndexOf(':');
      const newNodeId = nodeKeyMap.get(key.substring(0, c));
      if (newNodeId) newApplied.add(`${newNodeId}:${key.substring(c + 1)}`);
    });

    allNodes.set(newNodes);
    allEdges.set(newEdges);
    frames.set(newFrames);
    applied.set(newApplied);
  }

  function handleSelect(newN) {
    if (newN === $n) return;
    const oldN = $n;
    n.set(newN);

    if (!oldN) {
      // First group selection — start fresh.
      generators.set([]);
      generatorColors.set([]);
      generatorNames.set([]);
      frames.set([]);
      currentFrame.set(0);
      applied.set(new Set());
      isStable.set(false);
      return;
    }

    if (newN > oldN) {
      // Embed generators (add fixed points) and re-key the graph.
      generators.set($generators.map(g => embedPerm(g, newN)));
      // generatorColors and generatorNames are unchanged.
      remapGraph(perm => embedPerm(perm, newN));
      // isStable preserved: same subgroup still fully generated (or still incomplete).

    } else {
      // Project generators; drop any that move elements >= newN.
      const keptGens = [], keptColors = [], keptNames = [];
      let anyRemoved = false;

      $generators.forEach((g, i) => {
        if (isValidInSmaller(g, newN)) {
          keptGens.push(g.slice(0, newN));
          keptColors.push($generatorColors[i]);
          keptNames.push($generatorNames[i]);
        } else {
          anyRemoved = true;
        }
      });

      generators.set(keptGens);
      generatorColors.set(keptColors);
      generatorNames.set(keptNames);

      if (anyRemoved) {
        // Reset graph — Controls.svelte will seed the identity via handleReset.
        frames.set([]);
        currentFrame.set(0);
        isStable.set(false);
      } else {
        // Project graph to new shorter representation; stability is preserved.
        remapGraph(perm => perm.slice(0, newN));
      }
    }
  }
</script>

<div class="group-selector">
  <span class="selector-label">Symmetric group:</span>
  <div class="group-buttons" role="group" aria-label="Symmetric group size">
    {#each options as size}
      <button
        class="group-btn"
        class:active={$n === size}
        on:click={() => handleSelect(size)}
      >S{sub(size)}</button>
    {/each}
  </div>
</div>

<style>
  .group-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.05rem;
  }
  .group-buttons {
    display: flex;
  }
  .group-btn {
    padding: 0.2em 0.55em;
    margin-left: -1px;
    border-radius: 0;
    font-size: 1em;
    transition: background-color 0.15s, color 0.15s, border-color 0.15s;
  }
  .group-btn:first-child { margin-left: 0; border-radius: 7px 0 0 7px; }
  .group-btn:last-child  { border-radius: 0 7px 7px 0; }

  /* Active (selected) state — light mode */
  .group-btn.active {
    background-color: #213547;
    color: #fff;
    border-color: #213547;
    position: relative;
    z-index: 1;
  }
  /* Keep hover z-index so border overlaps cleanly */
  .group-btn:not(.active):hover {
    position: relative;
    z-index: 1;
  }

  /* Active state — dark mode */
  :global(html[data-theme="dark"]) .group-btn.active {
    background-color: rgba(255, 255, 255, 0.87);
    color: #1a1a1a;
    border-color: rgba(255, 255, 255, 0.4);
  }
</style>
