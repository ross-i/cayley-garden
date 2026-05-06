// Fruchterman-Reingold force-directed layout + position normalisation.
//
// The physics simulation always runs at SIM_SIZE=90 / SIM_PAD=12 — the same
// scale the landing page tiles use.  Only the final normalization step maps
// the settled positions into the caller's display coordinate space.  This
// keeps force magnitudes, temperature, and iteration count identical to the
// landing page regardless of how large the display SVG is.

const SIM_SIZE = 90;
const SIM_PAD  = 12;

export function normalizePosMap(rawMap, displaySize = 90, displayPad = 12) {
  const entries = [...rawMap.entries()];
  if (entries.length === 0) return new Map();
  if (entries.length === 1) return new Map([[entries[0][0], { x: displaySize / 2, y: displaySize / 2 }]]);
  const xs = entries.map(([, v]) => v.x), ys = entries.map(([, v]) => v.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rX = maxX - minX || 1, rY = maxY - minY || 1;
  const usable = displaySize - 2 * displayPad;
  const scale  = Math.min(usable / rX, usable / rY);
  const ox = (displaySize - scale * rX) / 2;
  const oy = (displaySize - scale * rY) / 2;
  return new Map(entries.map(([id, v]) => [id, {
    x: ox + (v.x - minX) * scale,
    y: oy + (v.y - minY) * scale,
  }]));
}

export function forceLayout(nodeIds, edgeList, seed, displaySize = 90, displayPad = 12) {
  const n = nodeIds.length;
  if (n === 0) return new Map();
  if (n === 1) return new Map([[nodeIds[0], { x: displaySize / 2, y: displaySize / 2 }]]);

  let rng = seed >>> 0;
  const rand = () => { rng = (Math.imul(1664525, rng) + 1013904223) >>> 0; return rng / 0x100000000; };

  const nodes = nodeIds.map(id => ({
    id,
    x: SIM_PAD + rand() * (SIM_SIZE - 2 * SIM_PAD),
    y: SIM_PAD + rand() * (SIM_SIZE - 2 * SIM_PAD),
    fx: 0, fy: 0,
  }));
  const byId = new Map(nodes.map(v => [v.id, v]));
  const k = Math.sqrt((SIM_SIZE - 2 * SIM_PAD) ** 2 / n);
  const ITERS = Math.max(120, n * 18);

  for (let iter = 0; iter < ITERS; iter++) {
    const t = SIM_SIZE * 0.13 * (1 - iter / ITERS);
    for (const v of nodes) { v.fx = 0; v.fy = 0; }

    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = (b.x - a.x) || 0.01, dy = (b.y - a.y) || 0.01;
      const d = Math.sqrt(dx * dx + dy * dy), f = k * k / d;
      a.fx -= f * dx / d; a.fy -= f * dy / d;
      b.fx += f * dx / d; b.fy += f * dy / d;
    }

    for (const e of edgeList) {
      const a = byId.get(e.sourceId), b = byId.get(e.targetId);
      if (!a || !b || a === b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01, f = d * d / k;
      a.fx += f * dx / d; a.fy += f * dy / d;
      b.fx -= f * dx / d; b.fy -= f * dy / d;
    }

    let cx = 0, cy = 0;
    for (const v of nodes) {
      const d = Math.sqrt(v.fx * v.fx + v.fy * v.fy) || 0.001;
      const move = Math.min(d, t);
      v.x += v.fx / d * move; v.y += v.fy / d * move;
      cx += v.x; cy += v.y;
    }
    cx /= n; cy /= n;
    for (const v of nodes) {
      v.x += (SIM_SIZE / 2 - cx) * 0.04; v.y += (SIM_SIZE / 2 - cy) * 0.04;
      v.x = Math.max(SIM_PAD, Math.min(SIM_SIZE - SIM_PAD, v.x));
      v.y = Math.max(SIM_PAD, Math.min(SIM_SIZE - SIM_PAD, v.y));
    }
  }

  const rawMap = new Map(nodes.map(v => [v.id, { x: v.x, y: v.y }]));
  return normalizePosMap(rawMap, displaySize, displayPad);
}
