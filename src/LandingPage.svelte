<script>
  import { onMount } from 'svelte';
  import { appView } from './stores.js';
  import { generate } from './lib/cayley.js';

  const SIZE   = 90;
  const NODE_R = 5;
  const D3_KEY = 'D3_rf';

  const BAKED = {
    // D₃ with r (rotation) and f (flip): outer triangle = {e, r, r²}, inner = {f, rf, r²f}
    // f-edges connect each outer vertex to the inner vertex directly beneath it.
    'D3_rf': {
      "0,1,2": { x: 50, y:  8 },  // e   — outer top
      "2,0,1": { x: 85, y: 75 },  // r   — outer bottom-right
      "1,2,0": { x: 15, y: 75 },  // r²  — outer bottom-left
      "0,2,1": { x: 50, y: 30 },  // f   — inner top      (f-edge to e)
      "1,0,2": { x: 68, y: 62 },  // rf  — inner bottom-right (f-edge to r)
      "2,1,0": { x: 32, y: 62 },  // r²f — inner bottom-left  (f-edge to r²)
    },
  };

  const CONFIGS = [
    { key: 'Z2',        n: 2, gens: [[1,0]],                       colors: ['#e15759'] },
    { key: 'Z3',        n: 3, gens: [[1,2,0]],                     colors: ['#4e79a7'] },
    { key: 'D3_rf',     n: 3, gens: [[2,0,1],[0,2,1]],             colors: ['#4e79a7','#e15759'] }, // r=rot, f=flip
    { key: 'S3_12_r',   n: 3, gens: [[1,0,2],[1,2,0]],             colors: ['#e15759','#59a14f'] },
    { key: 'S3_23_r',   n: 3, gens: [[0,2,1],[1,2,0]],             colors: ['#4e79a7','#f28e2b'] },
    { key: 'S3_all',    n: 3, gens: [[1,0,2],[0,2,1],[2,1,0]],     colors: ['#e15759','#4e79a7','#59a14f'] },
    { key: 'Z4_a',      n: 4, gens: [[1,2,3,0]],                   colors: ['#f28e2b'] },
    { key: 'Z4_b',      n: 4, gens: [[3,0,1,2]],                   colors: ['#76b7b2'] },
    { key: 'V4_swap',   n: 4, gens: [[1,0,3,2],[2,3,0,1]],         colors: ['#e15759','#4e79a7'] },
    { key: 'V4_adj',    n: 4, gens: [[1,0,2,3],[0,1,3,2]],         colors: ['#59a14f','#edc948'] },
    { key: 'Z3_S4',     n: 4, gens: [[1,2,0,3]],                   colors: ['#b07aa1'] },
    { key: 'S3_S4a',    n: 4, gens: [[1,0,2,3],[0,2,1,3]],         colors: ['#edc948','#b07aa1'] },
    { key: 'S3_S4b',    n: 4, gens: [[1,0,2,3],[2,1,0,3]],         colors: ['#76b7b2','#f28e2b'] },
    { key: 'S3_S4c',    n: 4, gens: [[0,2,1,3],[0,1,3,2]],         colors: ['#ff9da7','#9c755f'] },
    { key: 'D4_rot_r1', n: 4, gens: [[1,2,3,0],[3,2,1,0]],         colors: ['#59a14f','#e15759'] },
    { key: 'D4_rot_r2', n: 4, gens: [[1,2,3,0],[0,3,2,1]],         colors: ['#4e79a7','#f28e2b'] },
    { key: 'A4_a',      n: 4, gens: [[1,2,0,3],[0,2,3,1]],         colors: ['#76b7b2','#f28e2b'] },
    { key: 'A4_b',      n: 4, gens: [[1,2,0,3],[1,0,3,2]],         colors: ['#e15759','#59a14f'] },
    { key: 'Z2_S5',     n: 5, gens: [[1,0,2,3,4]],                 colors: ['#e15759'] },
    { key: 'Z3_S5',     n: 5, gens: [[1,2,0,3,4]],                 colors: ['#4e79a7'] },
    { key: 'Z5',        n: 5, gens: [[1,2,3,4,0]],                 colors: ['#59a14f'] },
    { key: 'Z6_S5',     n: 5, gens: [[1,0,3,4,2]],                 colors: ['#f28e2b'] },
    { key: 'V4_S5',     n: 5, gens: [[1,0,2,3,4],[0,1,3,2,4]],     colors: ['#edc948','#b07aa1'] },
    { key: 'S3_S5',     n: 5, gens: [[1,0,2,3,4],[0,2,1,3,4]],     colors: ['#76b7b2','#edc948'] },
    { key: 'D4_S5',     n: 5, gens: [[1,2,3,0,4],[3,2,1,0,4]],     colors: ['#59a14f','#e15759'] },
    { key: 'D5',        n: 5, gens: [[1,2,3,4,0],[4,3,2,1,0]],     colors: ['#4e79a7','#e15759'] },
    { key: 'A4_S5',     n: 5, gens: [[1,2,0,3,4],[0,2,3,1,4]],     colors: ['#76b7b2','#b07aa1'] },
  ];

  // ── Layout helpers ───────────────────────────────────────────────────

  function normalizePosMap(rawMap, pad = 12) {
    const entries = [...rawMap.entries()];
    if (entries.length === 0) return new Map();
    if (entries.length === 1) return new Map([[entries[0][0], { x: SIZE/2, y: SIZE/2 }]]);
    const xs = entries.map(([,v]) => v.x), ys = entries.map(([,v]) => v.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rX = maxX - minX || 1, rY = maxY - minY || 1;
    const usable = SIZE - 2 * pad;
    const scale  = Math.min(usable / rX, usable / rY);
    const ox = (SIZE - scale * rX) / 2, oy = (SIZE - scale * rY) / 2;
    return new Map(entries.map(([id, v]) => [id, {
      x: ox + (v.x - minX) * scale,
      y: oy + (v.y - minY) * scale,
    }]));
  }

  function forceLayout(nodeIds, edgeList, seed) {
    const n = nodeIds.length;
    if (n === 0) return new Map();
    if (n === 1) return new Map([[nodeIds[0], { x: SIZE/2, y: SIZE/2 }]]);
    let rng = seed >>> 0;
    const rand = () => { rng = (Math.imul(1664525, rng) + 1013904223) >>> 0; return rng / 0x100000000; };
    const pad = 12;
    const nodes = nodeIds.map(id => ({
      id, x: pad + rand() * (SIZE - 2*pad), y: pad + rand() * (SIZE - 2*pad), fx: 0, fy: 0,
    }));
    const byId = new Map(nodes.map(v => [v.id, v]));
    const k = Math.sqrt((SIZE - 2*pad) ** 2 / n);
    const ITERS = Math.max(120, n * 18);
    for (let iter = 0; iter < ITERS; iter++) {
      const t = SIZE * 0.13 * (1 - iter / ITERS);
      for (const v of nodes) { v.fx = 0; v.fy = 0; }
      for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = (b.x - a.x) || 0.01, dy = (b.y - a.y) || 0.01;
        const d  = Math.sqrt(dx*dx + dy*dy), f = k*k / d;
        a.fx -= f*dx/d; a.fy -= f*dy/d; b.fx += f*dx/d; b.fy += f*dy/d;
      }
      for (const e of edgeList) {
        const a = byId.get(e.sourceId), b = byId.get(e.targetId);
        if (!a || !b || a === b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d  = Math.sqrt(dx*dx + dy*dy) || 0.01, f = d*d / k;
        a.fx += f*dx/d; a.fy += f*dy/d; b.fx -= f*dx/d; b.fy -= f*dy/d;
      }
      let cx = 0, cy = 0;
      for (const v of nodes) {
        const d = Math.sqrt(v.fx*v.fx + v.fy*v.fy) || 0.001;
        const move = Math.min(d, t);
        v.x += v.fx/d * move; v.y += v.fy/d * move;
        cx += v.x; cy += v.y;
      }
      cx /= n; cy /= n;
      for (const v of nodes) {
        v.x += (SIZE/2 - cx) * 0.04; v.y += (SIZE/2 - cy) * 0.04;
        v.x = Math.max(pad, Math.min(SIZE - pad, v.x));
        v.y = Math.max(pad, Math.min(SIZE - pad, v.y));
      }
    }
    return normalizePosMap(new Map(nodes.map(v => [v.id, { x: v.x, y: v.y }])));
  }

  function makeGraph(cfg, idx) {
    const { key, n, gens, colors } = cfg;
    const { nodes, edges } = generate(n, gens);
    const nodeList = [...nodes.values()].filter(nd => nd.active);
    const nodeIds  = nodeList.map(nd => nd.id);
    const nodeSet  = new Set(nodeIds);
    const edgeList = [...edges.values()].filter(
      e => nodeSet.has(e.sourceId) && nodeSet.has(e.targetId)
    );
    const baked = BAKED[key];
    const posMap = (baked && Object.keys(baked).length > 0)
      ? normalizePosMap(new Map(Object.entries(baked).map(([id, v]) => [id, { x: v.x, y: v.y }])))
      : forceLayout(nodeIds, edgeList, idx * 12345 + 7);
    return { nodeList, edgeList, posMap, colors };
  }

  const graphsData = CONFIGS.map(makeGraph);
  const d3Graph    = graphsData[CONFIGS.findIndex(c => c.key === D3_KEY)];

  // ── Hero D₃ positions (500×500 space, identical to D3Graph.svelte) ──────────
  // Using the same viewBox and node positions as the tutorial D3Graph component
  // so that zooming the hero tile is visually seamless — the SVG content matches.
  const HERO_POSITIONS = new Map([
    ['0,1,2', { x: 250, y:  68 }],  // e
    ['2,0,1', { x: 440, y: 432 }],  // r
    ['1,2,0', { x:  60, y: 432 }],  // r²
    ['0,2,1', { x: 250, y: 188 }],  // f
    ['1,0,2', { x: 348, y: 361 }],  // rf
    ['2,1,0', { x: 152, y: 361 }],  // r²f
  ]);
  const heroD3 = {
    nodeList: d3Graph.nodeList,
    edgeList: d3Graph.edgeList,
    posMap:   HERO_POSITIONS,
    colors:   d3Graph.colors,
  };

  // ── Tile grid ────────────────────────────────────────────────────────
  let bgGraphs   = [];
  let flyVectors = [];  // { tx, ty } per tile — pre-computed radial directions
  let centerIdx  = -1;
  let cols       = 0;
  let heroPx     = { x: 0, y: 0 };  // top-left pixel of center tile
  let heroScale  = 1;
  let heroTx     = 0;
  let heroTy     = 0;
  let vpW        = 0, vpH = 0;
  let beginBtnEl;  // bound to the Begin button element

  onMount(() => {
    vpW  = window.innerWidth;
    vpH  = window.innerHeight;
    cols = Math.ceil(vpW / SIZE) + 1;
    const rows   = Math.ceil(vpH / SIZE) + 1;
    const needed = cols * rows;

    // Align the center tile with the Begin button
    let bx = vpW / 2, by = vpH / 2;
    if (beginBtnEl) {
      const r = beginBtnEl.getBoundingClientRect();
      bx = r.left + r.width  / 2;
      by = r.top  + r.height / 2;
    }
    const centerCol = Math.max(0, Math.min(cols - 1, Math.floor(bx / SIZE)));
    const centerRow = Math.max(0, Math.min(rows - 1, Math.floor(by / SIZE)));
    centerIdx  = centerRow * cols + centerCol;
    heroPx = { x: centerCol * SIZE, y: centerRow * SIZE };

    // Scale = how much the hero (SIZE px) must grow to match D3Graph (30vw px).
    // Translation = offset so hero's center lands on D3Graph's center (vpW/2, vpH/2).
    const heroCx = heroPx.x + SIZE / 2;
    const heroCy = heroPx.y + SIZE / 2;
    heroScale = (vpW * 0.30) / SIZE;
    heroTx    = vpW / 2 - heroCx;
    heroTy    = vpH / 2 - heroCy;

    // Build shuffled pool, then force D₃ at center slot
    const pool = [];
    while (pool.length < needed) {
      const chunk = [...graphsData];
      for (let i = chunk.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chunk[i], chunk[j]] = [chunk[j], chunk[i]];
      }
      pool.push(...chunk);
    }
    const arr = pool.slice(0, needed);
    arr[centerIdx] = d3Graph;
    bgGraphs = arr;

    // Pre-compute radial fly vectors so CSS transitions can fire on class toggle.
    // (Setting transform+transition simultaneously in one style update prevents
    //  the browser from seeing a "before" state, killing the animation.)
    const vpCx = heroPx.x + SIZE / 2, vpCy = heroPx.y + SIZE / 2;
    const dist = Math.max(vpW, vpH) * 1.8;
    flyVectors = arr.map((_, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const dx  = col * SIZE + SIZE / 2 - vpCx;
      const dy  = row * SIZE + SIZE / 2 - vpCy;
      const d   = Math.sqrt(dx * dx + dy * dy) || 1;
      return { tx: Math.round(dx / d * dist), ty: Math.round(dy / d * dist) };
    });
  });

  // ── Animation ────────────────────────────────────────────────────────
  // 0 = idle  1 = UI fading  2 = tiles flying + hero revealing  3 = hero zooming
  let animPhase = 0;

  function handleBegin() {
    animPhase = 1;                          // UI fades (0.3 s)
    setTimeout(() => {
      animPhase = 2;                        // tiles fly, hero reveals
      appView.set('transitioning');         // Tutorial mounts behind LandingPage
      setTimeout(() => {
        animPhase = 3;                      // hero zooms (translate+scale, no fade)
        // Switch to tutorial once zoom animation completes (1.4 s CSS transition).
        // LandingPage unmounts; Tutorial's D3Graph is already at the target position.
        setTimeout(() => appView.set('tutorial'), 1400);
      }, 1200);
    }, 350);
  }

  function handleSkip() {
    animPhase = 1;
    setTimeout(() => appView.set('app'), 350);
  }
</script>

<div class="landing">

  <!-- ── Background tiled mini Cayley graphs ── -->
  <!-- width must be cols*SIZE so flex-wrap puts exactly cols items per row,
       matching the index arithmetic in onMount and getTileStyle -->
  <div class="bg-grid" style="width:{cols * SIZE}px;" aria-hidden="true">
    {#each bgGraphs as g, i}
      {#if i === centerIdx}
        <!-- blank placeholder keeps the flex grid intact; hero tile renders above -->
        <span class="mini-placeholder"></span>
      {:else}
        {@const fv = flyVectors[i]}
        <svg
          width={SIZE} height={SIZE} viewBox="0 0 {SIZE} {SIZE}"
          class="mini-svg"
          class:flying={animPhase >= 2}
          style={fv ? `--tx:${fv.tx}px;--ty:${fv.ty}px;` : ''}
        >
          {#each g.edgeList as edge}
            {@const src = g.posMap.get(edge.sourceId)}
            {@const tgt = g.posMap.get(edge.targetId)}
            {#if src && tgt}
              <line
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={g.colors[edge.generatorIndex] ?? '#999'}
                stroke-width="1.2" stroke-opacity="0.65"
              />
            {/if}
          {/each}
          {#each g.nodeList as node}
            {@const pos = g.posMap.get(node.id)}
            {#if pos}
              <circle cx={pos.x} cy={pos.y} r={NODE_R} class="mini-node" />
            {/if}
          {/each}
        </svg>
      {/if}
    {/each}
  </div>

  <!-- ── Hero D₃ tile — always over the center slot ── -->
  <!--
    Uses viewBox="0 0 500 500" with the same node positions as D3Graph.svelte.
    When the hero zooms to match D3Graph's physical size, the SVG content is
    visually identical — ensuring seamless object constancy at the handoff.
  -->
  {#if centerIdx >= 0}
    <div
      class="hero-tile"
      class:hero-visible={animPhase >= 2}
      class:hero-zooming={animPhase >= 3}
      style="left:{heroPx.x}px;top:{heroPx.y}px;--hero-scale:{heroScale};--hero-tx:{heroTx}px;--hero-ty:{heroTy}px;"
      aria-hidden="true"
    >
      <svg width={SIZE} height={SIZE} viewBox="0 0 500 500">
        {#each heroD3.edgeList as edge}
          {@const src = heroD3.posMap.get(edge.sourceId)}
          {@const tgt = heroD3.posMap.get(edge.targetId)}
          {#if src && tgt}
            <line
              x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke={heroD3.colors[edge.generatorIndex] ?? '#666'}
              class="hero-edge"
            />
          {/if}
        {/each}
        {#each heroD3.nodeList as node}
          {@const pos = heroD3.posMap.get(node.id)}
          {#if pos}
            <circle cx={pos.x} cy={pos.y} r="22" class="hero-node" />
          {/if}
        {/each}
      </svg>
    </div>
  {/if}

  <!-- ── UI overlay: title + Begin button centered ── -->
  <div class="ui-overlay" class:ui-gone={animPhase >= 1}>
    <div class="title-stack">
      <h1>Cayley's Garden</h1>
      <button class="begin-btn" bind:this={beginBtnEl} on:click={handleBegin}>
        Begin
      </button>
    </div>
  </div>

  <!-- ── Skip button — bottom-right, fades with UI ── -->
  <button
    class="skip-btn"
    class:ui-gone={animPhase >= 1}
    on:click={handleSkip}
  >
    Skip Tutorial
  </button>

</div>

<style>
  /* ── Container ──────────────────────────────────────────────────── */
  .landing {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: #111;
    --mini-node-fill:   #ccc;
    --mini-node-stroke: #666;
    --title-color: rgba(255,255,255,0.92);
  }

  @media (prefers-color-scheme: light) {
    .landing {
      background: #f0f0f0;
      --mini-node-fill:   #555;
      --mini-node-stroke: #aaa;
      --title-color: #1a1a1a;
    }
  }
  :global(html[data-theme="dark"])  .landing {
    background: #111;
    --mini-node-fill: #ccc; --mini-node-stroke: #666;
    --title-color: rgba(255,255,255,0.92);
  }
  :global(html[data-theme="light"]) .landing {
    background: #f0f0f0;
    --mini-node-fill: #555; --mini-node-stroke: #aaa;
    --title-color: #1a1a1a;
  }

  /* ── Background grid ─────────────────────────────────────────────── */
  .bg-grid {
    position: absolute;
    top: 0;
    left: 0;
    /* width set via inline style to cols*SIZE — keeps flex row count matching JS */
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    opacity: 0.3;
    pointer-events: none;
  }

  .mini-svg, .mini-placeholder {
    flex-shrink: 0;
    display: block;
    width: 90px;   /* SIZE */
    height: 90px;
  }

  /* Transition always defined so adding .flying triggers it correctly.
     (Defining transition+transform simultaneously in a single style update
      prevents the browser from seeing a before-state — no animation fires.) */
  .mini-svg {
    transition: transform 1.1s cubic-bezier(0.4, 0, 1, 1), opacity 0.9s ease;
  }
  .mini-svg.flying {
    transform: translate(var(--tx, 0px), var(--ty, 0px));
    opacity: 0;
  }

  .mini-node {
    fill:         var(--mini-node-fill,   #ccc);
    stroke:       var(--mini-node-stroke, #666);
    stroke-width: 1;
  }

  /* ── Hero D₃ tile ────────────────────────────────────────────────── */
  .hero-tile {
    position: absolute;
    width:  90px;   /* SIZE */
    height: 90px;
    opacity: 0.3;
    pointer-events: none;
    transform-origin: center center;
    /* base transitions — overridden in hero-zooming */
    transition: opacity 0.35s ease;
  }

  .hero-tile.hero-visible {
    opacity: 1;
  }

  .hero-tile.hero-zooming {
    /* Translate to D3Graph center, scale to D3Graph size. No opacity change —
       the hero only "disappears" when Tutorial's D3Graph covers it exactly. */
    transform: translate(var(--hero-tx, 0px), var(--hero-ty, 0px)) scale(var(--hero-scale, 1));
    transition: transform 1.4s cubic-bezier(0.15, 0, 0.4, 1);
  }

  /* Hero edges and nodes use the same style as Tutorial's D3Graph (normal state)
     so the visual is identical at both scales. */
  .hero-edge {
    stroke-opacity: 1;
    stroke-width: 1.2;
    vector-effect: non-scaling-stroke;
    transition: stroke-opacity 0.35s ease;
  }

  .hero-node {
    fill:         var(--mini-node-fill,   #ccc);
    stroke:       var(--mini-node-stroke, #666);
    stroke-width: 1.5;
  }

  /* ── UI overlay ──────────────────────────────────────────────────── */
  .ui-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  .ui-overlay.ui-gone {
    opacity: 0;
    pointer-events: none;
  }

  .title-stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.75rem;
    pointer-events: auto;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.8rem, 7vw, 5.5rem);
    font-weight: 700;
    color: var(--title-color, rgba(255,255,255,0.92));
    letter-spacing: -0.02em;
    text-shadow: 0 2px 24px rgba(0,0,0,0.5);
  }

  .begin-btn {
    background: #e15759 !important;
    color: #fff !important;
    border: none !important;
    padding: 0.7em 2.4em;
    font-size: 1.15rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
  }
  .begin-btn:hover {
    background: #c94547 !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(225,87,89,0.45);
    border-color: transparent !important;
  }

  /* ── Skip button ─────────────────────────────────────────────────── */
  .skip-btn {
    position: absolute;
    bottom: 2.5rem;
    right:  2.5rem;
    background: transparent !important;
    color: #888 !important;
    border: 1px solid #555 !important;
    padding: 0.7em 1.6em;
    font-size: 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, opacity 0.3s ease;
  }
  .skip-btn:hover {
    color: #bbb !important;
    border-color: #888 !important;
  }
  .skip-btn.ui-gone {
    opacity: 0;
    pointer-events: none;
  }

  :global(html[data-theme="light"]) .skip-btn {
    color: #666 !important;
    border-color: #aaa !important;
  }
  :global(html[data-theme="light"]) .skip-btn:hover {
    color: #222 !important;
    border-color: #555 !important;
  }
</style>
