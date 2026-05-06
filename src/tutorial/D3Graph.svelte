<script>
  import { graphHighlight } from './animState.js';

  export let visible = false;

  const NODES = [
    { id: '0,1,2', label: 'e',   x: 250, y:  68 },
    { id: '2,0,1', label: 'r',   x: 440, y: 432 },
    { id: '1,2,0', label: 'r²',  x:  60, y: 432 },
    { id: '0,2,1', label: 'f',   x: 250, y: 188 },
    { id: '1,0,2', label: 'rf',  x: 152, y: 361 },
    { id: '2,1,0', label: 'r²f', x: 348, y: 361 },
  ];

  const EDGES = [
    { id: '0,1,2->2,0,1:0',  src: '0,1,2', tgt: '2,0,1', gen: 0 },  // e  → r
    { id: '0,1,2->0,2,1:1',  src: '0,1,2', tgt: '0,2,1', gen: 1 },  // e  → f
    { id: '2,0,1->1,2,0:0',  src: '2,0,1', tgt: '1,2,0', gen: 0 },  // r  → r²
    { id: '2,0,1->2,1,0:1',  src: '2,0,1', tgt: '2,1,0', gen: 1 },  // r  → r²f
    { id: '0,2,1->1,0,2:0',  src: '0,2,1', tgt: '1,0,2', gen: 0 },  // f  → rf
    { id: '1,2,0->0,1,2:0',  src: '1,2,0', tgt: '0,1,2', gen: 0 },  // r² → e
    { id: '1,2,0->1,0,2:1',  src: '1,2,0', tgt: '1,0,2', gen: 1 },  // r² → rf
    { id: '1,0,2->2,1,0:0',  src: '1,0,2', tgt: '2,1,0', gen: 0 },  // rf → r²f
    { id: '2,1,0->0,2,1:0',  src: '2,1,0', tgt: '0,2,1', gen: 0 },  // r²f→ f
  ];

  const GEN_COLORS = ['#4e79a7', '#e15759'];

  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));

  function edgeEndpoints(src, tgt) {
    const R = 27;
    const dx = tgt.x - src.x, dy = tgt.y - src.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    return {
      x1: src.x + dx * 22 / d,
      y1: src.y + dy * 22 / d,
      x2: tgt.x - dx * R / d,
      y2: tgt.y - dy * R / d,
    };
  }

  $: hlNodes = $graphHighlight.nodes;
  $: hlEdges = $graphHighlight.edges;
  $: anyHighlight = hlNodes.size > 0 || hlEdges.size > 0;
</script>

<svg class:visible viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- filterUnits="userSpaceOnUse" prevents the filter region from collapsing
         to zero on axis-aligned edges (which have a zero-width or zero-height
         bounding box when objectBoundingBox percentages are used). -->
    <filter id="glow" filterUnits="userSpaceOnUse" x="-20" y="-20" width="540" height="540">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    {#each [0, 1] as gen}
      <marker
        id="arrow-{gen}"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill={GEN_COLORS[gen]} />
      </marker>
    {/each}
  </defs>

  <g class="root-group">
    {#each EDGES as edge}
      {@const src = nodeMap[edge.src]}
      {@const tgt = nodeMap[edge.tgt]}
      {@const ep = edgeEndpoints(src, tgt)}
      <line
        class="edge"
        class:highlighted={anyHighlight && hlEdges.has(edge.id)}
        class:dimmed={anyHighlight && !hlEdges.has(edge.id)}
        x1={ep.x1}
        y1={ep.y1}
        x2={ep.x2}
        y2={ep.y2}
        stroke={GEN_COLORS[edge.gen]}
        marker-start={edge.gen === 1 ? `url(#arrow-${edge.gen})` : null}
        marker-end="url(#arrow-{edge.gen})"
        filter={anyHighlight && hlEdges.has(edge.id) ? 'url(#glow)' : null}
      />
    {/each}

    {#each NODES as node}
      <g class="node"
         class:highlighted={anyHighlight && hlNodes.has(node.id)}
         class:dimmed={anyHighlight && !hlNodes.has(node.id)}>
        <circle
          cx={node.x}
          cy={node.y}
          r="22"
          filter={anyHighlight && hlNodes.has(node.id) ? 'url(#glow)' : null}
        />
        <text
          x={node.x}
          y={node.y}
          font-size="14"
          text-anchor="middle"
          dominant-baseline="central"
        >{node.label}</text>
      </g>
    {/each}
  </g>
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.75s ease;
  }
  svg.visible {
    opacity: 1;
  }

  /* Edge states */
  .edge {
    stroke-width: 1.5;
    opacity: 0.65;
    transition: opacity 0.2s, stroke-width 0.2s;
  }
  .edge.highlighted {
    stroke-width: 2.5;
    opacity: 1;
  }
  .edge.dimmed {
    opacity: 0.08;
  }

  /* Node circle states */
  .node circle {
    fill: #fff;
    stroke: rgba(255, 255, 255, 0.4);
    stroke-width: 1.5;
    transition: fill 0.2s, stroke 0.2s, opacity 0.2s;
  }
  .node.highlighted circle {
    fill: #eee;
    stroke: #fff;
    stroke-width: 2;
  }
  .node.dimmed {
    opacity: 0.12;
  }

  /* Node label states */
  .node text {
    fill: #111;
    pointer-events: none;
    user-select: none;
    transition: fill 0.2s;
  }
  .node.highlighted text {
    fill: #111;
  }
</style>
