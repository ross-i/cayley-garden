// Permutations are 0-indexed arrays: p[i] = j means element i maps to j.
// Display (cycle notation, word labels) uses 1-indexing.

/**
 * Returns the identity permutation of S_n.
 * @param {number} n
 * @returns {number[]}  e.g. n=3 → [0, 1, 2]
 */
export function identity(n) {
  return Array.from({ length: n }, (_, i) => i);
}

/**
 * Generates all n! permutations of S_n.
 * @param {number} n
 * @returns {number[][]}
 */
export function allPerms(n) {
  const result = [];
  const arr = Array.from({ length: n }, (_, i) => i);

  function heaps(k) {
    if (k === 1) {
      result.push([...arr]);
      return;
    }
    for (let i = 0; i < k; i++) {
      heaps(k - 1);
      if (k % 2 === 0) {
        [arr[i], arr[k - 1]] = [arr[k - 1], arr[i]];
      } else {
        [arr[0], arr[k - 1]] = [arr[k - 1], arr[0]];
      }
    }
  }

  heaps(n);
  return result;
}

/**
 * Left-composes g onto v: returns g·v where (g·v)(i) = g(v(i)).
 * This is the target node when generator g is applied to node v.
 * @param {number[]} g
 * @param {number[]} v
 * @returns {number[]}
 */
export function compose(g, v) {
  return v.map(vi => g[vi]);
}

/**
 * Canonical string key for a permutation, used in Maps and Sets.
 * @param {number[]} p
 * @returns {string}  e.g. [1, 0, 2] → "1,0,2"
 */
export function toKey(p) {
  return p.join(',');
}

/**
 * Renders a permutation in cycle notation (1-indexed, fixed points omitted).
 * The identity returns "e".
 * @param {number[]} p
 * @returns {string}  e.g. [1, 0, 2] → "(1 2)"
 */
export function toCycleNotation(p) {
  const n = p.length;
  const visited = new Array(n).fill(false);
  const cycles = [];

  for (let i = 0; i < n; i++) {
    if (visited[i] || p[i] === i) {
      visited[i] = true;
      continue;
    }
    // Trace the cycle starting at i
    const cycle = [];
    let j = i;
    while (!visited[j]) {
      visited[j] = true;
      cycle.push(j + 1); // convert to 1-indexed
      j = p[j];
    }
    cycles.push(cycle);
  }

  if (cycles.length === 0) return 'e';
  return cycles.map(c => `(${c.join(' ')})`).join('');
}

/**
 * Groups all non-identity elements of S_n by cycle structure.
 * Used to build the nested generator-selection menu.
 * @param {number} n
 * @returns {{ label: string, perms: number[][] }[]}
 *   Sorted by the length of the longest non-trivial cycle, then
 *   lexicographically by cycle-type tuple.
 *   Label format: cycle lengths joined with "+", suffixed with "-cycles".
 *   Examples for S_4:
 *     { label: "2-cycles",   perms: [/* transpositions *\/ ] }
 *     { label: "2+2-cycles", perms: [/* double transpositions *\/ ] }
 *     { label: "3-cycles",   perms: [...] }
 *     { label: "4-cycles",   perms: [...] }
 */
export function groupByCycleStructure(n) {
  const perms = allPerms(n);
  const identityPerm = identity(n);
  const groups = new Map(); // key: "2+3" → { label, perms }

  for (const p of perms) {
    // Skip identity
    if (permsEqual(p, identityPerm)) continue;

    // Compute cycle type (non-trivial cycle lengths only)
    const visited = new Array(n).fill(false);
    const cycleLengths = [];

    for (let i = 0; i < n; i++) {
      if (visited[i] || p[i] === i) {
        visited[i] = true;
        continue;
      }
      let len = 0;
      let j = i;
      while (!visited[j]) {
        visited[j] = true;
        j = p[j];
        len++;
      }
      cycleLengths.push(len);
    }

    cycleLengths.sort((a, b) => a - b);
    const key = cycleLengths.join('+');
    const label = key + '-cycles';

    if (!groups.has(key)) {
      groups.set(key, { label, perms: [], _lengths: cycleLengths });
    }
    groups.get(key).perms.push(p);
  }

  // Sort groups: by longest cycle length descending first,
  // then by cycle-type tuple lexicographically
  const sorted = [...groups.values()].sort((a, b) => {
    const la = a._lengths;
    const lb = b._lengths;
    const maxA = la[la.length - 1];
    const maxB = lb[lb.length - 1];
    if (maxA !== maxB) return maxA - maxB;
    // Compare tuples lexicographically
    const minLen = Math.min(la.length, lb.length);
    for (let i = 0; i < minLen; i++) {
      if (la[i] !== lb[i]) return la[i] - lb[i];
    }
    return la.length - lb.length;
  });

  // Sort permutations within each group by their cycle notation string.
  // toCycleNotation starts each cycle with its smallest element and outputs
  // cycles in ascending order of their minimum, so lexicographic string
  // comparison gives (1 2) < (1 3) < (2 3), (1 2)(3 4) < (1 3)(2 4), etc.
  return sorted.map(({ label, perms }) => ({
    label,
    perms: [...perms].sort((a, b) => {
      const sa = toCycleNotation(a), sb = toCycleNotation(b);
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    }),
  }));
}

/**
 * Builds a compact word label from a BFS path of generator indices.
 * Consecutive repeated indices collapse into powers.
 * Returns "e" for an empty path (the identity node).
 * @param {number[]} path   sequence of generator indices, e.g. [0, 0, 1]
 * @param {string[]} names  generator names indexed by generator index, e.g. ['a','b']
 * @returns {string}  e.g. "a²b"
 */
export function toWordLabel(path, names) {
  if (path.length === 0) return 'e';

  const superscripts = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸' };

  // Collapse consecutive repeated indices into runs
  const runs = [];
  let i = 0;
  while (i < path.length) {
    const gen = path[i];
    let count = 0;
    while (i < path.length && path[i] === gen) {
      count++;
      i++;
    }
    runs.push({ gen, count });
  }

  return runs.map(({ gen, count }) => {
    const name = names[gen];
    const sup = count > 1 ? (superscripts[count] ?? String(count)) : '';
    return name + sup;
  }).join('');
}

/**
 * Returns true if two permutations are equal.
 * @param {number[]} p
 * @param {number[]} q
 * @returns {boolean}
 */
export function permsEqual(p, q) {
  if (p.length !== q.length) return false;
  return p.every((pi, i) => pi === q[i]);
}

/**
 * Returns the inverse of a permutation.
 * @param {number[]} p
 * @returns {number[]}
 */
export function inverse(p) {
  const r = new Array(p.length);
  for (let i = 0; i < p.length; i++) {
    r[p[i]] = i;
  }
  return r;
}
