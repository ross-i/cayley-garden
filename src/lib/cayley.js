// Graph generation for the Cayley graph.
//
// Node shape:
//   {
//     id: string,          // toKey(perm)
//     perm: number[],      // the group element this node represents
//     wordPath: number[],  // generator indices of the BFS path that first reached it
//     active: boolean,     // false for ghost-only nodes
//   }
//   Note: a `.label` field is NOT stored on the node. Labels are computed
//   reactively in the visibleNodes derived store (stores.js) so they update
//   whenever useNames or generatorNames changes.
//
// Edge shape:
//   {
//     id: string,              // "<sourceId>-><targetId>:<genIdx>"
//     sourceId: string,
//     targetId: string,
//     generatorIndex: number,  // index into the generators array; -1 for ghost edges
//     active: boolean,
//     bidirectional: boolean,  // true when generator is self-inverse and this edge
//                              // represents both v→g·v and g·v→v in one stroke
//   }
//
// Frame delta shape:
//   {
//     addedNodeIds: string[],
//     addedEdgeIds: string[],
//   }
//
// Applied-set key format:
//   Each processed (node, generator) pair is recorded in the `applied` Set
//   as the string "${nodeId}:${genIdx}" (e.g. "1,0,2:0").
//   For a bidirectional edge, both directions are added:
//     "${sourceId}:${genIdx}" and "${targetId}:${genIdx}".

import { identity, allPerms, compose, toKey } from './permutations.js';

/**
 * Returns the initial graph state: one active node for the identity, no edges.
 * Also sets up the Map entries for all ghost nodes (active: false) when
 * ghost mode is on — that population is done separately via buildGhostGraph.
 * @param {number} n
 * @returns {{ nodes: Map<string, object>, edges: Map<string, object> }}
 */
export function initialState(n) {
  const nodes = new Map();
  const edges = new Map();

  const idPerm = identity(n);
  const idKey = toKey(idPerm);

  nodes.set(idKey, {
    id: idKey,
    perm: idPerm,
    wordPath: [],
    active: true,
  });

  return { nodes, edges };
}

/**
 * Performs one BFS step: for every active node and every generator,
 * if the (nodeId, genIdx) pair is not yet in `applied`, compute g·v,
 * create the target node if new, and create the directed edge v→g·v.
 *
 * Self-inverse check: if g·(g·v) === v, the edge is marked bidirectional
 * and only one edge object is created for the pair; the reverse direction
 * is also added to `applied` so it won't be processed again.
 *
 * Returns the delta for this frame (ids of newly created nodes/edges).
 *
 * @param {{ nodes: Map<string,object>, edges: Map<string,object> }} state
 *   Mutated in place: new nodes and edges are added to the maps.
 * @param {number[][]} generators
 * @param {Set<string>} applied
 *   Mutated in place: processed (nodeId, genIdx) pairs are added.
 * @returns {{ addedNodeIds: string[], addedEdgeIds: string[] }}
 */
export function stepForward(state, generators, applied) {
  const { nodes, edges } = state;
  const addedNodeIds = [];
  const addedEdgeIds = [];

  // Snapshot the currently active nodes before adding new ones
  const activeNodes = [];
  for (const node of nodes.values()) {
    if (node.active) {
      activeNodes.push(node);
    }
  }

  for (const v of activeNodes) {
    for (let genIdx = 0; genIdx < generators.length; genIdx++) {
      const appliedKey = `${v.id}:${genIdx}`;

      if (applied.has(appliedKey)) {
        continue;
      }

      const g = generators[genIdx];
      const targetPerm = compose(g, v.perm);
      const targetId = toKey(targetPerm);

      // Create target node if it doesn't exist yet
      if (!nodes.has(targetId)) {
        const newNode = {
          id: targetId,
          perm: targetPerm,
          wordPath: [...v.wordPath, genIdx],
          active: true,
        };
        nodes.set(targetId, newNode);
        addedNodeIds.push(targetId);
      }

      // Self-inverse check: g·(g·v) === v ?
      const doubleApply = compose(g, targetPerm);
      const isSelfInverse = toKey(doubleApply) === v.id;

      const edgeId = `${v.id}->${targetId}:${genIdx}`;

      if (!edges.has(edgeId)) {
        if (isSelfInverse) {
          const edge = {
            id: edgeId,
            sourceId: v.id,
            targetId: targetId,
            generatorIndex: genIdx,
            active: true,
            bidirectional: true,
          };
          edges.set(edgeId, edge);
          addedEdgeIds.push(edgeId);
          // Mark both directions as applied
          applied.add(appliedKey);
          applied.add(`${targetId}:${genIdx}`);
        } else {
          const edge = {
            id: edgeId,
            sourceId: v.id,
            targetId: targetId,
            generatorIndex: genIdx,
            active: true,
            bidirectional: false,
          };
          edges.set(edgeId, edge);
          addedEdgeIds.push(edgeId);
          applied.add(appliedKey);
        }
      } else {
        // Edge already exists, still mark the applied key
        applied.add(appliedKey);
        if (isSelfInverse) {
          applied.add(`${targetId}:${genIdx}`);
        }
      }
    }
  }

  return { addedNodeIds, addedEdgeIds };
}

/**
 * Runs stepForward to completion, collecting every frame delta.
 * Frame 0 is always the seed frame (identity node only, no edges).
 * Generation terminates when a stepForward call produces zero new nodes.
 * The terminating empty-delta frame is NOT appended; callers set isStable=true
 * after this function returns.
 *
 * @param {number} n
 * @param {number[][]} generators
 * @returns {{
 *   frames: { addedNodeIds: string[], addedEdgeIds: string[] }[],
 *   nodes:  Map<string, object>,
 *   edges:  Map<string, object>,
 * }}
 *   `nodes` and `edges` are the complete maps after full generation.
 *   Callers should write these directly to the allNodes / allEdges stores.
 */
export function generate(n, generators) {
  const { nodes, edges } = initialState(n);
  const applied = new Set();

  const seedFrame = {
    addedNodeIds: [toKey(identity(n))],
    addedEdgeIds: [],
  };

  const frames = [seedFrame];

  while (true) {
    const delta = stepForward({ nodes, edges }, generators, applied);
    const stable = delta.addedNodeIds.length === 0;
    // Always record a step that adds edges, even if it adds no new nodes.
    // (The final step closes outgoing edges from the last-discovered nodes
    // to already-existing nodes — those edges must appear in a frame.)
    if (!stable || delta.addedEdgeIds.length > 0) frames.push(delta);
    if (stable) break;
  }

  return { frames, nodes, edges };
}

/**
 * Builds the full ghost graph for S_n: all n! nodes and, for every
 * ordered pair of distinct nodes, one undirected ghost edge per
 * non-identity element that maps source to target.
 * In practice this produces a complete directed graph (each pair gets
 * exactly one ghost edge since any two elements differ by a unique left-factor).
 *
 * Ghost edges have generatorIndex: -1 and active: false.
 *
 * @param {number} n
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function buildGhostGraph(n) {
  const perms = allPerms(n);
  const idKey = toKey(identity(n));

  // Build inverse lookup: key -> perm
  const permByKey = new Map();
  for (const p of perms) {
    permByKey.set(toKey(p), p);
  }

  // Build inverse of each permutation
  function inversePerm(p) {
    const inv = new Array(p.length);
    for (let i = 0; i < p.length; i++) {
      inv[p[i]] = i;
    }
    return inv;
  }

  // Create all ghost nodes (active: false)
  const nodes = perms.map(p => ({
    id: toKey(p),
    perm: p,
    wordPath: [],
    active: false,
  }));

  const edges = [];

  // For every ordered pair of distinct nodes (u, v),
  // compute g = v.perm ∘ inverse(u.perm), check it's not identity,
  // then create a ghost edge.
  for (const u of nodes) {
    const invU = inversePerm(u.perm);
    for (const v of nodes) {
      if (u.id === v.id) continue;

      // g = v.perm composed with inv(u.perm): g[i] = v.perm[invU[i]]
      const g = compose(v.perm, invU);
      const gKey = toKey(g);

      // Skip if g is identity (no self-loops)
      if (gKey === idKey) continue;

      edges.push({
        id: `${u.id}->${v.id}:ghost`,
        sourceId: u.id,
        targetId: v.id,
        generatorIndex: -1,
        active: false,
        bidirectional: false,
      });
    }
  }

  return { nodes, edges };
}

/**
 * Computes (x, y) positions for n! nodes evenly spaced on a circle.
 * Used exclusively in ghost mode (cola is not used when ghost is on).
 * Ghost mode is only available for n ≤ 4 (S_5 has 120 nodes / 14 280 edges
 * and is disabled at the UI level).
 *
 * @param {number} n       size of the symmetric group (used to enumerate perms)
 * @param {number} cx      SVG center x
 * @param {number} cy      SVG center y
 * @param {number} r       circle radius
 * @returns {{ id: string, x: number, y: number }[]}
 *   id === toKey(allPerms(n)[i]) for each i, so positions map directly to node ids.
 *   The ordering matches allPerms(n) exactly; callers must not assume any other order.
 */
export function circleLayout(n, cx, cy, r) {
  const perms = allPerms(n);
  const count = perms.length;

  return perms.map((p, i) => {
    const angle = (2 * Math.PI * i) / count;
    return {
      id: toKey(p),
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
}
