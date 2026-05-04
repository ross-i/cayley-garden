// Identifies the isomorphism class of a generated subgroup of S_n (n ≤ 5).
//
// Strategy:
//   1. Check order (trivial and prime orders have unique names).
//   2. Check whether the group is abelian.
//   3. Build the multiset of element orders.
//   4. Apply order-specific structural tests to distinguish isomorphism classes
//      that share order and abelianness (e.g. Z_4 vs Z_2×Z_2, D_4 vs Q_8).
//
// All subgroups that can appear as subgroups of S_5 are covered.

import { compose, toKey, identity } from './permutations.js';

/**
 * Returns the structural name of the group, e.g. "Z_6", "D_3", "A_4", "Z_2 × Z_2".
 * Called once generation is complete (slider at final frame).
 *
 * @param {object[]} nodes       active nodes, each with a .perm field
 * @param {number[][]} generators
 * @returns {string}
 */
export function identifyGroup(nodes, generators) {
  const perms = nodes.map(nd => nd.perm);
  const order = perms.length;

  if (order === 1) return 'trivial';
  if (order === 2) return 'Z₂';
  if (order === 3) return 'Z₃';
  if (order === 5) return 'Z₅';

  if (order === 4) {
    // Both Z₄ and Z₂×Z₂ are abelian; distinguish by whether any element has order 4
    const ms = orderMultiset(perms);
    return ms.includes(4) ? 'Z₄' : 'Z₂ × Z₂';
  }

  if (order === 6) {
    return isAbelian(perms) ? 'Z₆' : 'S₃';
  }

  if (order === 8) {
    if (isAbelian(perms)) {
      const ms = orderMultiset(perms);
      const maxOrd = Math.max(...ms);
      if (maxOrd === 8) return 'Z₈';
      if (maxOrd === 4) return 'Z₄ × Z₂';
      return 'Z₂³';
    } else {
      // Non-abelian order-8 groups: D₄ has 2 elements of order 4, Q₈ has 6
      const ms = orderMultiset(perms);
      const countOrder4 = ms.filter(o => o === 4).length;
      return countOrder4 === 2 ? 'D₄' : 'Q₈';
    }
  }

  if (order === 10) return 'D₅';

  if (order === 12) {
    if (isAbelian(perms)) return 'Z₁₂';
    const ms = orderMultiset(perms);
    return ms.includes(6) ? 'D₆' : 'A₄';
  }

  if (order === 20) return 'GA(1,5)';
  if (order === 24) return 'S₄';
  if (order === 60) return 'A₅';
  if (order === 120) return 'S₅';

  return `order ${order}`;
}

/**
 * Returns the order of a permutation: the smallest k > 0 such that p^k = id.
 * @param {number[]} p
 * @returns {number}
 */
export function permOrder(p) {
  const n = p.length;
  const id = identity(n);
  const idKey = toKey(id);
  let current = p;
  let k = 1;
  while (toKey(current) !== idKey) {
    current = compose(p, current);
    k++;
  }
  return k;
}

/**
 * Returns true if every pair of elements commutes under composition.
 * @param {number[][]} perms
 * @returns {boolean}
 */
export function isAbelian(perms) {
  for (let i = 0; i < perms.length; i++) {
    for (let j = i + 1; j < perms.length; j++) {
      if (toKey(compose(perms[i], perms[j])) !== toKey(compose(perms[j], perms[i]))) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Returns the multiset of element orders as a sorted array.
 * Useful for distinguishing isomorphism classes of the same order.
 * E.g. Z_4 → [1,2,4,4], Z_2×Z_2 → [1,2,2,2]
 * @param {number[][]} perms
 * @returns {number[]}
 */
export function orderMultiset(perms) {
  return perms.map(p => permOrder(p)).sort((a, b) => a - b);
}
