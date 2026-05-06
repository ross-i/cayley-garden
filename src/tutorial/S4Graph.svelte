<script>
  import { generate } from '../lib/cayley.js';
  import { normalizePosMap } from '../lib/layout.js';

  const gens = [
    [1, 0, 2, 3],  // (1 2)
    [3, 1, 0, 2],  // (1 3 4)
  ];
  const GEN_COLORS = ['#4e79a7', '#e15759'];

  const { nodes, edges } = generate(4, gens);
  const nodeList = [...nodes.values()].filter(nd => nd.active);
  const nodeSet  = new Set(nodeList.map(nd => nd.id));
  const edgeList = [...edges.values()].filter(
    e => nodeSet.has(e.sourceId) && nodeSet.has(e.targetId)
  );

  const BAKED_S4 = {
  "0,1,2,3": {
    "x": 281,
    "y": -71,
    "label": "e"
  },
  "1,0,2,3": {
    "x": 465,
    "y": -44,
    "label": "(1 2)"
  },
  "2,1,3,0": {
    "x": 219,
    "y": 33,
    "label": "(1 3 4)"
  },
  "1,2,3,0": {
    "x": 494,
    "y": 74,
    "label": "(1 2 3 4)"
  },
  "2,0,3,1": {
    "x": 288,
    "y": 200,
    "label": "(1 3 4 2)"
  },
  "3,1,0,2": {
    "x": 102,
    "y": 0,
    "label": "(1 4 3)"
  },
  "0,2,3,1": {
    "x": 380,
    "y": 214,
    "label": "(2 3 4)"
  },
  "1,3,0,2": {
    "x": 616,
    "y": 77,
    "label": "(1 2 4 3)"
  },
  "3,2,0,1": {
    "x": 431,
    "y": 312,
    "label": "(1 4 2 3)"
  },
  "3,0,1,2": {
    "x": -15,
    "y": 147,
    "label": "(1 4 3 2)"
  },
  "2,3,0,1": {
    "x": 210,
    "y": 280,
    "label": "(1 3)(2 4)"
  },
  "0,3,1,2": {
    "x": 684,
    "y": 252,
    "label": "(2 4 3)"
  },
  "3,2,1,0": {
    "x": 605,
    "y": 339,
    "label": "(1 4)(2 3)"
  },
  "0,3,2,1": {
    "x": 262,
    "y": 378,
    "label": "(2 4)"
  },
  "0,2,1,3": {
    "x": -44,
    "y": 341,
    "label": "(2 3)"
  },
  "2,3,1,0": {
    "x": 37,
    "y": 254,
    "label": "(1 3 2 4)"
  },
  "3,0,2,1": {
    "x": 352,
    "y": 392,
    "label": "(1 4 2)"
  },
  "2,0,1,3": {
    "x": 655,
    "y": 446,
    "label": "(1 3 2)"
  },
  "1,3,2,0": {
    "x": 147,
    "y": 518,
    "label": "(1 2 4)"
  },
  "1,2,0,3": {
    "x": 25,
    "y": 516,
    "label": "(1 2 3)"
  },
  "3,1,2,0": {
    "x": 421,
    "y": 559,
    "label": "(1 4)"
  },
  "2,1,0,3": {
    "x": 538,
    "y": 593,
    "label": "(1 3)"
  },
  "1,0,3,2": {
    "x": 175,
    "y": 636,
    "label": "(1 2)(3 4)"
  },
  "0,1,3,2": {
    "x": 359,
    "y": 664,
    "label": "(3 4)"
  }
};

  const posMap = normalizePosMap(
    new Map(Object.entries(BAKED_S4).map(([id, { x, y }]) => [id, { x, y }])),
    500, 40
  );
</script>

<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  {#each edgeList as edge}
    {@const src = posMap.get(edge.sourceId)}
    {@const tgt = posMap.get(edge.targetId)}
    {#if src && tgt && edge.sourceId !== edge.targetId}
      <line
        x1={src.x} y1={src.y}
        x2={tgt.x} y2={tgt.y}
        stroke={GEN_COLORS[edge.generatorIndex] ?? '#aaa'}
        stroke-width="1.2"
        stroke-opacity="0.55"
      />
    {/if}
  {/each}

  {#each nodeList as node}
    {@const pos = posMap.get(node.id)}
    {#if pos}
      <circle
        cx={pos.x} cy={pos.y} r="7"
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.5)"
        stroke-width="1"
      />
    {/if}
  {/each}
</svg>

<style>
  svg {
    animation: mountIn 0.6s ease 0.2s both;
    width: 100%;
    height: auto;
    display: block;
  }

  @keyframes mountIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
</style>
