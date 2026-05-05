<script>
  import { generate } from '../lib/cayley.js';

  const gens = [
    [1, 0, 2, 3],  // swap (1 2): swaps positions 0 and 1
    [2, 1, 0, 3],  // swap (1 3): swaps positions 0 and 2
    [0, 3, 2, 1],  // swap (2 4): swaps positions 1 and 3
  ];

  const { nodes, edges } = generate(4, gens);
  const nodeList = [...nodes.values()];
  const edgeList = [...edges.values()];

  const N = nodeList.length;
  const nodePositions = new Map();
  nodeList.forEach((nd, i) => {
    const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
    nodePositions.set(nd.id, {
      x: 250 + 190 * Math.cos(angle),
      y: 250 + 190 * Math.sin(angle),
    });
  });

  const GEN_COLORS = ['#4e79a7', '#e15759', '#59a14f'];
</script>

<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Edges -->
  {#each edgeList as edge}
    {#if edge.sourceId !== edge.targetId}
      {@const src = nodePositions.get(edge.sourceId)}
      {@const tgt = nodePositions.get(edge.targetId)}
      {#if src && tgt}
        <line
          x1={src.x}
          y1={src.y}
          x2={tgt.x}
          y2={tgt.y}
          stroke={GEN_COLORS[edge.generatorIndex] ?? '#aaa'}
          stroke-width="1"
          opacity="0.5"
        />
      {/if}
    {/if}
  {/each}

  <!-- Nodes -->
  {#each nodeList as node}
    {@const pos = nodePositions.get(node.id)}
    {#if pos}
      <circle
        cx={pos.x}
        cy={pos.y}
        r="9"
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.4)"
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
  }

  @keyframes mountIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
</style>
