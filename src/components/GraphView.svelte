<script>
  // SVG canvas for the Cayley graph.
  //
  // Two rendering modes:
  //   Normal (ghostMode off): cola.js handles layout; nodes and edges are
  //     added incrementally so the graph appears to grow organically.
  //   Ghost (ghostMode on): all n! nodes are placed on a fixed circle;
  //     ghost nodes/edges are rendered as light grey with no arrows;
  //     active nodes/edges are layered on top with full color and arrows.
  //
  // Parallel edges (same node pair, different generators, opposite directions)
  // are rendered side-by-side using a small perpendicular offset.
  // Self-inverse edges (bidirectional: true) are rendered as double-headed arrows.

  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import { d3adaptor } from 'webcola';
  import { visibleNodes, visibleEdges, ghostMode, generatorColors, n, fitSignal, viewBoxFitSignal } from '../stores.js';
  import { buildGhostGraph, circleLayout } from '../lib/cayley.js';

  let svgEl;
  let colaInstance;
  let width = 800;
  let height = 600;

  const GHOST_OPACITY = 0.08;
  const NODE_RADIUS   = 20;
  const ARROW_GAP     = NODE_RADIUS + 4;  // clearance from node edge to arrowhead tip

  // ── Normal-mode cola state ────────────────────────────────────────────────
  // cola modifies node objects' x/y in place; we track them across reactive updates
  // so existing nodes keep their positions when new ones are added.

  let colaNodes    = [];            // { x, y, width, height, _id, _label }
  let colaLinks    = [];            // { source, target, _id, _color, _bidi, ... }
  let colaNodeIdx  = new Map();     // nodeId → index in colaNodes

  // Stops the current cola instance (if any), cancels any pending settle timer,
  // and creates a brand-new d3adaptor. Must be called any time the node set is
  // wiped — reusing the same instance across different node arrays corrupts the
  // VPSC block structure inside webcola and causes "swapBlock is undefined" crashes.
  function resetColaInstance() {
    if (dragSettleTimer)   { clearTimeout(dragSettleTimer);   dragSettleTimer   = null; }
    if (postGenerateTimer) { clearTimeout(postGenerateTimer); postGenerateTimer = null; }
    if (viewBoxFitTimer)   { clearTimeout(viewBoxFitTimer);   viewBoxFitTimer   = null; }
    isDragging = false;
    if (colaInstance) { try { colaInstance.stop(); } catch (_) {} }
    colaInstance = d3adaptor(d3)
      .size([width, height])
      .linkDistance(130)
      .avoidOverlaps(true)
      .on('tick', onColaTick);
  }

  // Tracks which n the ghost base was last drawn for. When this differs from
  // $n (or is null in normal mode), renderGhostBase is called by activateGhostElements.
  let ghostBaseN = null;

  // Tracks the last n we rendered for. Used to detect group switches inside
  // the render functions so we can clear stale state atomically — before the
  // derived stores ($visibleNodes etc.) have caught up to the new n.
  let lastN = null;
  let lastVisibleCount = 0;
  let lastVisColaNodes = [];
  let tooltipEl;
  let colaDrag;
  let dragSettleTimer = null;
  let postGenerateTimer = null;
  let viewBoxFitTimer = null;
  let isDragging = false;

  // ── Tooltip ───────────────────────────────────────────────────────────────

  function showTooltip(event, label) {
    if (!tooltipEl || !label || isDragging) return;
    tooltipEl.textContent = label;
    tooltipEl.style.display = 'block';
    moveTooltip(event);
  }
  function moveTooltip(event) {
    if (!tooltipEl) return;
    const rect = tooltipEl.parentElement.getBoundingClientRect();
    tooltipEl.style.left = `${event.clientX - rect.left + 12}px`;
    tooltipEl.style.top  = `${event.clientY - rect.top  - 32}px`;
  }
  function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  // Returns the font-size (SVG user units) that fits `label` inside the node.
  // Scales down for longer labels, floored at 6 so text is always present.
  function labelFontSize(label) {
    if (!label) return 11;
    const maxWidth = NODE_RADIUS * 1.8;   // usable diameter in user units
    const avgCharWidth = 0.6;             // fraction of font-size per character
    return Math.max(6, Math.min(11, maxWidth / (label.length * avgCharWidth)));
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  onMount(() => {
    const rect = svgEl.getBoundingClientRect();
    if (rect.width  > 0) width  = rect.width;
    if (rect.height > 0) height = rect.height;
    initSvg();
  });

  onDestroy(() => {
    if (dragSettleTimer) { clearTimeout(dragSettleTimer); dragSettleTimer = null; }
    if (colaInstance) { try { colaInstance.stop(); } catch (_) {} }
  });

  // ── Initialization ────────────────────────────────────────────────────────

  // Sets up the static SVG structure: defs (arrowhead markers) and layered <g> groups
  // rendered back-to-front: ghost-edges, ghost-nodes, active-edges, active-nodes, labels.
  function initSvg() {
    const svg = d3.select(svgEl);
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    svg.append('defs');
    svg.append('g').attr('id', 'ghost-edges');
    svg.append('g').attr('id', 'ghost-nodes');
    svg.append('g').attr('id', 'active-edges');
    svg.append('g').attr('id', 'active-nodes');
    svg.append('g').attr('id', 'labels');

    resetColaInstance();

    colaDrag = d3.drag()
      .on('start', (event, d) => {
        event.sourceEvent?.stopPropagation();
        isDragging = true;
        hideTooltip();
        if (dragSettleTimer)   { clearTimeout(dragSettleTimer);   dragSettleTimer   = null; }
        if (postGenerateTimer) { clearTimeout(postGenerateTimer); postGenerateTimer = null; }
        d.fixed = 2;
      })
      .on('drag', (event, d) => {
        // Set px/py (the locked position cola uses for fixed nodes).
        // Also set x/y and call onColaTick so the dragged node follows the
        // cursor immediately without waiting for the next async timer tick.
        d.x = d.px = event.x;
        d.y = d.py = event.y;
        onColaTick();
        // resume() restarts the d3.timer loop if it converged (alpha→0).
        // The loop fires tick() which runs physics and moves other nodes.
        // This mirrors how webcola's own drag helper works.
        colaInstance.resume();
      })
      .on('end', (event, d) => {
        d.fixed &= ~2;
        isDragging = false;
        colaInstance.resume();
        dragSettleTimer = setTimeout(() => {
          if (colaInstance) colaInstance.stop();
          fitViewBox(lastVisColaNodes);
          dragSettleTimer = null;
        }, 800);
      });
  }

  // ── Arrowhead markers ─────────────────────────────────────────────────────

  // Rebuilds <defs> arrowhead markers whenever $generatorColors changes.
  // Two markers per color: "arrow-<id>" at path end, "arrow-start-<id>" at path start
  // (orient="auto-start-reverse" makes it face the correct direction for bidi edges).
  function updateMarkers(colors) {
    if (!svgEl) return;
    const defs = d3.select(svgEl).select('defs');
    defs.selectAll('marker').remove();

    (colors ?? []).forEach(color => {
      if (!color) return;
      const id = color.replace('#', '');

      defs.append('marker')
        .attr('id', `arrow-${id}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', color);

      defs.append('marker')
        .attr('id', `arrow-start-${id}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 2).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto-start-reverse')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', color);
    });
  }

  // ── Normal-mode (cola) rendering ──────────────────────────────────────────

  // D3 tick callback: updates all SVG element positions from the current cola state.
  // cola resolves link source/target to node objects after start(), so d.source.x works.
  function onColaTick() {
    const svg = d3.select(svgEl);

    svg.select('#active-nodes').selectAll('circle.node')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    svg.select('#labels').selectAll('text.node-label')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('font-size', d => labelFontSize(d._label))
      .text(d => d._label ?? '');

    svg.select('#active-edges').selectAll('path.edge')
      .attr('d', d => {
        // After cola.start() resolves indices to objects, d.source/d.target are
        // node objects with .x/.y updated each tick.
        const src = typeof d.source === 'object' ? d.source : null;
        const tgt = typeof d.target === 'object' ? d.target : null;
        if (!src || !tgt) return '';
        return edgePath(src.x, src.y, tgt.x, tgt.y, d._offset ?? 0, d._bidi);
      })
      .attr('stroke', d => d._color ?? '#333')
      .attr('marker-end',   d => d._color ? `url(#arrow-${d._color.replace('#', '')})` : null)
      .attr('marker-start', d =>
        (d._bidi && d._color) ? `url(#arrow-start-${d._color.replace('#', '')})` : null
      );
  }

  // Called reactively whenever $visibleNodes or $visibleEdges changes in normal mode.
  // Incrementally adds new nodes/edges to the cola instance and restarts the simulation.
  function updateColaGraph(nodes, edges) {
    if (!svgEl || !colaInstance) return;
    const svg = d3.select(svgEl);

    // When n changes, wipe everything and return — the stores haven't settled yet
    // so nodes/edges still belong to the previous group. The next reactive fire
    // (once allNodes/frames finish clearing) will render with correct data.
    if ($n !== lastN) {
      resetColaInstance();
      colaNodes = []; colaLinks = []; colaNodeIdx = new Map(); ghostBaseN = null;
      svg.select('#ghost-edges').selectAll('*').remove();
      svg.select('#ghost-nodes').selectAll('*').remove();
      svg.select('#active-edges').selectAll('*').remove();
      svg.select('#active-nodes').selectAll('*').remove();
      svg.select('#labels').selectAll('*').remove();
      resetViewBox();
      lastN = $n;
      lastVisibleCount = 0;
      // Do NOT return: $visibleNodes is already settled (same Svelte flush) so
      // we should process it now. There are no stale old-group nodes here because
      // frames.set([]) makes visibleNodes empty regardless of allNodes.
    }

    // When switching back from ghost mode, clear all layers and reset cola state.
    // activateGhostElements uses different CSS classes (active-node, active-edge,
    // active-label) that updateColaGraph's data joins won't touch, so they must
    // be removed explicitly to avoid double-rendering.
    if (ghostBaseN !== null) {
      svg.select('#ghost-nodes').selectAll('*').remove();
      svg.select('#ghost-edges').selectAll('*').remove();
      svg.select('#active-nodes').selectAll('*').remove();
      svg.select('#active-edges').selectAll('*').remove();
      svg.select('#labels').selectAll('*').remove();
      colaNodes   = [];
      colaLinks   = [];
      colaNodeIdx = new Map();
      ghostBaseN  = null;
      resetColaInstance();
      resetViewBox();
    }

    const activeNodes  = (nodes ?? []).filter(nd => nd.active);
    const activeNodeIds = new Set(activeNodes.map(nd => nd.id));

    // Add new nodes; update labels on existing ones (useNames may have toggled)
    let newNodesAdded = false;
    for (const nd of activeNodes) {
      if (!colaNodeIdx.has(nd.id)) {
        colaNodeIdx.set(nd.id, colaNodes.length);
        colaNodes.push({
          x: width  / 2 + (Math.random() - 0.5) * 60,
          y: height / 2 + (Math.random() - 0.5) * 60,
          width:  NODE_RADIUS * 2 + 40,
          height: NODE_RADIUS * 2 + 40,
          _id:    nd.id,
          _label: nd.label,
        });
        newNodesAdded = true;
      } else {
        colaNodes[colaNodeIdx.get(nd.id)]._label = nd.label;
      }
    }

    // Rebuild links from visible edges
    const rawLinks = (edges ?? [])
      .filter(e => activeNodeIds.has(e.sourceId) && activeNodeIds.has(e.targetId))
      .map(e => {
        const color = $generatorColors[e.generatorIndex] ?? '#999';
        return {
          source:   colaNodeIdx.get(e.sourceId),
          target:   colaNodeIdx.get(e.targetId),
          _id:      e.id,
          _color:   color,
          _genIdx:  e.generatorIndex,
          _bidi:    e.bidirectional,
          sourceId: e.sourceId,
          targetId: e.targetId,
          _offset:  0,
        };
      })
      .filter(l => l.source !== undefined && l.target !== undefined);

    colaLinks = rawLinks;
    colaLinks.forEach(l => { l._offset = parallelOffset(l, colaLinks); });

    // D3 enter/exit for node circles
    const visColaNodes = colaNodes.filter(cn => activeNodeIds.has(cn._id));
    lastVisColaNodes = visColaNodes;
    const nodeSel = svg.select('#active-nodes').selectAll('circle.node')
      .data(visColaNodes, d => d._id);
    nodeSel.enter().append('circle').attr('class', 'node')
      .attr('r', NODE_RADIUS)
      .attr('fill', '#fff')
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5)
      .call(colaDrag)
      .on('mouseover', (event, d) => showTooltip(event, d._label))
      .on('mousemove', moveTooltip)
      .on('mouseout',  hideTooltip);
    nodeSel.exit().remove();

    // D3 enter/exit for labels
    const labelSel = svg.select('#labels').selectAll('text.node-label')
      .data(visColaNodes, d => d._id);
    labelSel.enter().append('text').attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('pointer-events', 'none');
    labelSel.exit().remove();

    // D3 enter/exit for edges
    const edgeSel = svg.select('#active-edges').selectAll('path.edge')
      .data(colaLinks, d => d._id);
    edgeSel.enter().append('path').attr('class', 'edge')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5);
    edgeSel.exit().remove();

    colaInstance
      .nodes(colaNodes)
      .links(colaLinks)
      .start(newNodesAdded ? 30 : 0, 0, newNodesAdded ? 30 : 0);

    lastVisibleCount = visColaNodes.length;
    if (newNodesAdded) fitViewBox(visColaNodes);
  }

  // ── ViewBox fitting ──────────────────────────────────────────────────────

  // Smoothly adjusts the SVG viewBox so all settled cola nodes stay in frame.
  // Called after every layout run that added nodes. Ghost mode uses fixed circle
  // positions that already fit inside the default viewBox, so it skips this.
  function fitViewBox(visNodes) {
    if (!svgEl) return;
    if (!visNodes.length) { resetViewBox(); return; }
    const pad = NODE_RADIUS + 40;
    const xs = visNodes.map(cn => cn.x);
    const ys = visNodes.map(cn => cn.y);
    const cx  = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy  = (Math.min(...ys) + Math.max(...ys)) / 2;
    const vbW = Math.max(Math.max(...xs) - Math.min(...xs) + pad * 2, width  / 2);
    const vbH = Math.max(Math.max(...ys) - Math.min(...ys) + pad * 2, height / 2);
    d3.select(svgEl).transition().duration(400)
      .attr('viewBox', `${cx - vbW / 2} ${cy - vbH / 2} ${vbW} ${vbH}`);
  }

  function resetViewBox() {
    if (svgEl) d3.select(svgEl).attr('viewBox', `0 0 ${width} ${height}`);
  }

  // ── Ghost-mode rendering ──────────────────────────────────────────────────

  // Draws the full ghost graph for S_groupN: all n! nodes on a circle,
  // all directed pairs as thin grey lines with no arrowheads.
  // Clears all layers first so activation starts from a clean slate.
  // Records ghostBaseN so activateGhostElements knows not to re-render it
  // until n or mode changes.
  function renderGhostBase(groupN) {
    if (!svgEl || !groupN) return;
    resetColaInstance();

    const { nodes: gNodes, edges: gEdges } = buildGhostGraph(groupN);
    const { cx, cy, r } = ghostCircle();
    const positions = circleLayout(groupN, cx, cy, r);
    const posMap = new Map(positions.map(p => [p.id, p]));
    const svg = d3.select(svgEl);

    svg.select('#ghost-edges').selectAll('*').remove();
    svg.select('#ghost-nodes').selectAll('*').remove();
    svg.select('#active-edges').selectAll('*').remove();
    svg.select('#active-nodes').selectAll('*').remove();
    svg.select('#labels').selectAll('*').remove();
    resetViewBox();

    if (groupN !== 5) {
      svg.select('#ghost-edges').selectAll('line.ghost-edge')
        .data(gEdges, d => d.id)
        .enter().append('line').attr('class', 'ghost-edge')
        .attr('x1', d => posMap.get(d.sourceId)?.x ?? 0)
        .attr('y1', d => posMap.get(d.sourceId)?.y ?? 0)
        .attr('x2', d => posMap.get(d.targetId)?.x ?? 0)
        .attr('y2', d => posMap.get(d.targetId)?.y ?? 0)
        .attr('stroke', '#999')
        .attr('stroke-width', 0.5)
        .attr('opacity', GHOST_OPACITY);
    }

    svg.select('#ghost-nodes').selectAll('circle.ghost-node')
      .data(gNodes, d => d.id)
      .enter().append('circle').attr('class', 'ghost-node')
      .attr('cx', d => posMap.get(d.id)?.x ?? 0)
      .attr('cy', d => posMap.get(d.id)?.y ?? 0)
      .attr('r', NODE_RADIUS)
      .attr('fill', '#eee')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1)
      .attr('opacity', GHOST_OPACITY);

    ghostBaseN = groupN;
  }

  // Called reactively in ghost mode whenever $visibleNodes or $visibleEdges changes.
  // Re-renders the ghost base if it is stale, then overlays active nodes and edges
  // at their fixed circle positions with full color and arrowheads.
  function activateGhostElements(nodes, edges) {
    if (!svgEl || !$n) return;

    if ($n !== lastN) {
      colaNodes = []; colaLinks = []; colaNodeIdx = new Map(); ghostBaseN = null;
      lastN = $n;
    }

    if (ghostBaseN !== $n) renderGhostBase($n);

    const { cx, cy, r } = ghostCircle();
    const positions = circleLayout($n, cx, cy, r);
    const posMap = new Map(positions.map(p => [p.id, p]));
    const svg = d3.select(svgEl);

    const activeNodes = (nodes ?? []).filter(nd => nd.active);
    const activeEdges = (edges ?? [])
      .filter(e => e.active && e.generatorIndex >= 0)
      .map(e => ({
        ...e,
        _color:  $generatorColors[e.generatorIndex] ?? '#333',
        _offset: 0,
      }));
    activeEdges.forEach(e => { e._offset = parallelOffset(e, activeEdges); });

    // Active nodes
    const nodeSel = svg.select('#active-nodes').selectAll('circle.active-node')
      .data(activeNodes, d => d.id);
    nodeSel.enter().append('circle').attr('class', 'active-node')
      .attr('r', NODE_RADIUS)
      .attr('fill', '#fff')
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5)
      .merge(nodeSel)
      .attr('cx', d => posMap.get(d.id)?.x ?? 0)
      .attr('cy', d => posMap.get(d.id)?.y ?? 0)
      .on('mouseover', (event, d) => showTooltip(event, d.label))
      .on('mousemove', moveTooltip)
      .on('mouseout',  hideTooltip);
    nodeSel.exit().remove();

    // Labels
    const labelSel = svg.select('#labels').selectAll('text.active-label')
      .data(activeNodes, d => d.id);
    labelSel.enter().append('text').attr('class', 'active-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('pointer-events', 'none')
      .merge(labelSel)
      .attr('x', d => posMap.get(d.id)?.x ?? 0)
      .attr('y', d => posMap.get(d.id)?.y ?? 0)
      .attr('font-size', d => labelFontSize(d.label))
      .text(d => d.label ?? '');
    labelSel.exit().remove();

    // Active edges
    const edgeSel = svg.select('#active-edges').selectAll('path.active-edge')
      .data(activeEdges, d => d.id);
    edgeSel.enter().append('path').attr('class', 'active-edge')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .merge(edgeSel)
      .attr('d', d => {
        const src = posMap.get(d.sourceId);
        const tgt = posMap.get(d.targetId);
        return (src && tgt) ? edgePath(src.x, src.y, tgt.x, tgt.y, d._offset, d.bidirectional) : '';
      })
      .attr('stroke', d => d._color)
      .attr('marker-end',   d => `url(#arrow-${d._color.replace('#', '')})`)
      .attr('marker-start', d =>
        d.bidirectional ? `url(#arrow-start-${d._color.replace('#', '')})` : null
      );
    edgeSel.exit().remove();
  }

  // ── Edge geometry helpers ─────────────────────────────────────────────────

  // Returns the SVG path `d` for a directed edge from (x1,y1) to (x2,y2).
  // `offset` shifts the line perpendicularly so parallel edges don't overlap.
  // For bidirectional edges the path starts clear of the source node too.
  function edgePath(x1, y1, x2, y2, offset, bidirectional = false) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) return '';

    const ux = dx / len, uy = dy / len;   // unit along edge
    const px = -uy,  py = ux;             // unit perpendicular (left of direction)

    const ox = px * offset, oy = py * offset;
    const srcPush = bidirectional ? ARROW_GAP : 0;

    const sx = x1 + ux * srcPush + ox;
    const sy = y1 + uy * srcPush + oy;
    const ex = x2 - ux * ARROW_GAP  + ox;
    const ey = y2 - uy * ARROW_GAP  + oy;

    return `M${sx.toFixed(1)},${sy.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`;
  }

  // Returns the signed perpendicular pixel offset for an edge among its parallel siblings.
  // Edges sharing an unordered node pair are spread symmetrically around the midline.
  function parallelOffset(edge, allEdges) {
    const normKey = e => [e.sourceId, e.targetId].sort().join('||');
    const key = normKey(edge);
    const siblings = allEdges.filter(e => normKey(e) === key);
    if (siblings.length <= 1) return 0;
    const idx = siblings.findIndex(e => e.id === edge.id);
    const step = 7; // px between parallel edges
    return (idx - (siblings.length - 1) / 2) * step;
  }

  // Returns the ghost-mode circle center and radius.
  function ghostCircle() {
    return {
      cx: width  / 2,
      cy: height / 2,
      r:  Math.min(width, height) / 2 - NODE_RADIUS - 24,
    };
  }

  // ── Reactive update dispatch ──────────────────────────────────────────────

  // Markers must exist before edges reference them, so this runs first.
  $: if (svgEl) updateMarkers($generatorColors);

  // Re-color edge strokes and marker references when generator colors change,
  // without restarting the cola layout. Works in both normal and ghost mode.
  $: if (svgEl) recolorEdges($generatorColors);
  function recolorEdges(colors) {
    if (!svgEl || !colors) return;
    if (!$ghostMode) {
      colaLinks.forEach(l => { l._color = colors[l._genIdx] ?? '#999'; });
      d3.select(svgEl).select('#active-edges').selectAll('path.edge')
        .attr('stroke', d => d._color)
        .attr('marker-end',   d => d._color ? `url(#arrow-${d._color.replace('#', '')})` : null)
        .attr('marker-start', d => (d._bidi && d._color) ? `url(#arrow-start-${d._color.replace('#', '')})` : null);
    } else {
      d3.select(svgEl).select('#active-edges').selectAll('path.active-edge')
        .attr('stroke', d => { d._color = colors[d.generatorIndex] ?? '#333'; return d._color; })
        .attr('marker-end',   d => `url(#arrow-${d._color.replace('#', '')})`)
        .attr('marker-start', d => d.bidirectional ? `url(#arrow-start-${d._color.replace('#', '')})` : null);
    }
  }

  // Main render dispatch — ghost and normal modes are handled separately.
  $: if (svgEl) {
    if ($ghostMode) {
      activateGhostElements($visibleNodes, $visibleEdges);
    } else {
      updateColaGraph($visibleNodes, $visibleEdges);
    }
  }

  // After the Generate animation ends, let cola run to convergence then refit.
  // Cola only ran ~30 iterations per frame during the animation, so the final
  // layout is typically more spread out than it would be after full convergence.
  $: void $viewBoxFitSignal, scheduleViewBoxFit();
  function scheduleViewBoxFit() {
    if (!svgEl || $viewBoxFitSignal === 0) return;
    if (viewBoxFitTimer) { clearTimeout(viewBoxFitTimer); viewBoxFitTimer = null; }
    viewBoxFitTimer = setTimeout(() => {
      fitViewBox(lastVisColaNodes);
      viewBoxFitTimer = null;
    }, 300);
  }

  $: void $fitSignal, schedulePostGenerateFit();
  function schedulePostGenerateFit() {
    if (!svgEl || !colaInstance || $ghostMode || $fitSignal === 0) return;
    if (postGenerateTimer) { clearTimeout(postGenerateTimer); postGenerateTimer = null; }
    colaInstance.start(0, 0, 0, 0, true, false);
    postGenerateTimer = setTimeout(() => {
      if (colaInstance) colaInstance.stop();
      fitViewBox(lastVisColaNodes);
      postGenerateTimer = null;
    }, 800);
  }
</script>

<div class="graph-container">
  <svg bind:this={svgEl} {width} {height}></svg>
  <div class="tooltip" bind:this={tooltipEl}></div>
</div>

<style>
  .graph-container {
    flex: 1;
    min-width: 0;
    position: relative;
  }
  :global(circle.node) { cursor: grab; }
  :global(circle.node:active) { cursor: grabbing; }

  /* Ghost nodes: fully opaque in both modes, colored just off the background. */
  :global(html[data-theme="dark"] .ghost-node) {
    fill: #383838;
    stroke: #505050;
    opacity: 1;
  }
  :global(html[data-theme="light"] .ghost-node) {
    fill: #d6d6d6;
    stroke: #ccc;
    opacity: 1;
  }

  :global(html[data-theme="light"] .ghost-edge) {
    stroke: #777;
    opacity: 0.2;
  }
  .tooltip {
    display: none;
    position: absolute;
    background: #111;
    color: #eee;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  }
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
