// ─────────────────────────────────────────────────────────────────────────────
// Tutorial stages — edit this file to update the tutorial.
//
// Each stage is one scroll step. Fields:
//
//   id            unique identifier string
//   copy          narrative text shown in a floating bubble (null = no bubble)
//   copyPosition  where the bubble sits:
//                   x: 'left' | 'center' | 'right'  (horizontal third)
//                   y: 'top'  | 'middle' | 'bottom'  (vertical third)
//   show          components to display and which column they occupy:
//                   graph     — the D₃ Cayley graph
//                   portrait  — Arthur Cayley portrait
//                   triangle  — animated equilateral triangle
//                   table     — D₃ Cayley table
//                   balls     — four numbered balls (S₄ section)
//                   s4graph   — S₄ Cayley graph
//                 Value is the column: 'left' | 'center' | 'right'
//                 Any component not listed is hidden.
//   animation     string key for the animation that runs on stage enter
//                 (all null for now — wired up later)
// ─────────────────────────────────────────────────────────────────────────────

export const stages = [

  // ── 0 ─ Opening ────────────────────────────────────────────────────────────
  {
    id: 'opening',
    copy: 'Scroll to explore.',
    copyPosition: { x: 'left', y: 'middle' },
    show: { graph: 'center' },
    animation: null,
  },

  // ── 1 ─ Arthur Cayley portrait slides in from the right ────────────────────
  {
    id: 'portrait-in',
    copy: 'A Cayley Graph, named after Arthur Cayley, encodes the abstract structure of a group.',
    copyPosition: { x: 'left', y: 'middle' },
    show: { graph: 'center', portrait: 'right' },
    animation: 'portraitSlideIn',   // portrait enters from right; graph shifts left
  },

  // ── 2 ─ Portrait slides off to the right ───────────────────────────────────
  {
    id: 'portrait-out',
    copy: null,
    copyPosition: { x: 'left', y: 'middle' },
    show: { graph: 'center' },
    animation: 'portraitSlideOut',  // portrait exits right; graph recenters
  },

  // ── 3 ─ Nodes and edges ─────────────────────────────────────────────────────
  {
    id: 'nodes-intro',
    copy: 'The nodes represent the elements of the group.',
    copyPosition: { x: 'left', y: 'middle' },
    show: { graph: 'center' },
    animation: 'highlightAllNodes',   // all 6 nodes glow to show "these are the elements"
  },

  {
    id: 'generators-intro-1',
    copy: 'The edges represent the action of one element on another.',
    copyPosition: { x: 'left', y: 'middle' },
    show: { graph: 'center' },
    animation: 'highlightGeneratorEdges',  // r-edges (blue) and f-edges (red) lit up
  },
  // ── 4 ─ Generators ──────────────────────────────────────────────────────────
  {
    id: 'generators-intro-2',
    copy: 'Here, we are letting only a subset of elements "act" on the others: we have chosen as generators the elements f (red edges) and r (blue edges).',
    copyPosition: { x: 'left', y: 'middle' },
    show: { graph: 'center' },
    animation: 'highlightGeneratorEdges',  // r-edges (blue) and f-edges (red) lit up
  },

  // ── 5 ─ Abstraction ─────────────────────────────────────────────────────────
  {
    id: 'abstract',
    copy: 'Of course, this is all rather abstract. These are mere symbols — what could they represent?',
    copyPosition: { x: 'left', y: 'middle' },
    show: { graph: 'center' },
    animation: null,
  },

  // ── 6 ─ Triangle slides in from the left ────────────────────────────────────
  {
    id: 'triangle-in',
    copy: 'D₃ is the dihedral group of symmetries of an equilateral triangle.',
    copyPosition: { x: 'right', y: 'middle' },
    show: { triangle: 'left', graph: 'center' },
    animation: 'triangleSlideIn',   // triangle enters from left; graph stays centered
  },

  // ── 7 ─ Identity element ────────────────────────────────────────────────────
  {
    id: 'identity',
    copy: 'e is the identity element — the "do-nothing" symmetry. If we do nothing to the triangle, it looks the same!',
    copyPosition: { x: 'right', y: 'middle' },
    show: { triangle: 'left', graph: 'center' },
    animation: 'highlightE',        // highlight node e on graph
  },

  // ── 8 ─ Flip ────────────────────────────────────────────────────────────────
  {
    id: 'flip',
    copy: 'f represents the "flip" — if we reflect the triangle about the vertical axis, it still looks the same!',
    copyPosition: { x: 'right', y: 'middle' },
    show: { triangle: 'left', graph: 'center' },
    animation: 'highlightF',        // highlight node f; show red axis on triangle; animate reflection
  },

  // ── 9 ─ Rotation ────────────────────────────────────────────────────────────
  {
    id: 'rotation',
    copy: 'r represents rotation — if we rotate the triangle by 120°, it still looks the same!',
    copyPosition: { x: 'right', y: 'middle' },
    show: { triangle: 'left', graph: 'center' },
    animation: 'highlightR',        // highlight node r; animate triangle rotating 120° CW
  },

  // ── 10 ─ Composing actions ──────────────────────────────────────────────────
  {
    id: 'composing',
    copy: 'By composing these actions, we can create all possible symmetries of the triangle — we can generate the dihedral group.',
    copyPosition: { x: 'right', y: 'middle' },
    show: { triangle: 'left', graph: 'center' },
    animation: null,
  },

  // ── 11 ─ Path e → f → rf ────────────────────────────────────────────────────
  {
    id: 'rf-path',
    copy: 'For example, flipping over the vertical axis and then rotating by 120° is the same as flipping over the axis through the lower-right vertex — even though that action isn\'t one of our generators.',
    copyPosition: { x: 'right', y: 'middle' },
    show: { triangle: 'left', graph: 'center' },
    animation: 'highlightRFPath',   // trace path e → f → rf on graph; animate on triangle
  },

  // ── 12 ─ Cayley table slides in from the right ─────────────────────────────
  {
    id: 'table-in',
    copy: 'The Cayley table (can you guess its namesake?) is like a multiplication table for a group. The row element acts on the column element.',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { triangle: 'left', graph: 'center', table: 'right' },
    animation: 'tableSlideIn',      // table enters from right
  },

  // ── 13 ─ rf in the table ────────────────────────────────────────────────────
  {
    id: 'rf-table',
    copy: 'Thus, r and f give rf.',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { triangle: 'left', graph: 'center', table: 'right' },
    animation: 'highlightTableRF',  // highlight row r, column f, cell rf
  },

  // ── 14 ─ Non-abelian ────────────────────────────────────────────────────────
  {
    id: 'nonabelian',
    copy: 'The dihedral group is non-Abelian — order matters. f and r give r²f, not rf. Can you see that rotating 120° and then flipping is the same as flipping and then rotating 240°?',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { triangle: 'left', graph: 'center', table: 'right' },
    animation: 'highlightTableR2F', // highlight row f, column r, cell r²f
  },

  // ── 15 ─ Many more groups ───────────────────────────────────────────────────
  {
    id: 'more-groups',
    copy: 'Of course, there are many more groups than just the dihedral groups — there are lots of symmetries that can be described by groups.',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { triangle: 'left', graph: 'center', table: 'right' },
    animation: null,
  },

  // ── 16 ─ Everything flies off to the right ─────────────────────────────────
  {
    id: 'clear-stage',
    copy: null,
    copyPosition: { x: 'center', y: 'bottom' },
    show: {},
    animation: 'flyOffRight',       // graph, triangle, table all exit right
  },

  // ── 17 ─ Four balls appear ──────────────────────────────────────────────────
  {
    id: 'balls-intro',
    copy: 'How many ways are there to order four objects?\nWe might think about the actions we could take: swap two elements, make a pair of swaps, or cycle 3 or 4 elements at a time.',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { balls: 'center' },
    animation: 'ballsAppear',
  },

  // ── 18 ─ Swap (1 2) ─────────────────────────────────────────────────────────
  {
    id: 'swap',
    copy: 'A swap like (1 2) swaps the elements in position 1 and 2.',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { balls: 'center' },
    animation: 'ballSwap12',        // animate balls 1 and 2 swapping, then back
  },

  // ── 19 ─ 3-cycle (1 2 3) ────────────────────────────────────────────────────
  {
    id: 'cycle',
    copy: 'A 3-cycle like (1 2 3) cycles three elements. This notation is called "cycle notation".',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { balls: 'center' },
    animation: 'ballCycle123',      // animate balls 1, 2, 3 cycling, then return
  },

  // ── 20 ─ S₄ Cayley graph ────────────────────────────────────────────────────
  {
    id: 's4-graph',
    copy: 'These actions also form a group: the symmetric group S₄. It has 4! = 24 elements. The Cayley graph here is generated by the swaps (1 2), (1 3), and (2 4).',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { s4graph: 'center' },
    animation: 's4GraphReveal',
  },

  // ── 21 ─ Permutation groups ─────────────────────────────────────────────────
  {
    id: 'permutation-groups',
    copy: 'Any subgroup of a symmetric group is called a permutation group. It contains some, but not necessarily all, of the permutations.',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { s4graph: 'center' },
    animation: null,
  },

  // ── 22 ─ Cayley's theorem ───────────────────────────────────────────────────
  {
    id: 'cayleys-theorem',
    copy: 'Cayley\'s theorem states that every group is isomorphic to some permutation group.',
    copyPosition: { x: 'center', y: 'middle' },
    show: { s4graph: 'center' },
    animation: null,
  },

  // ── 23 ─ Labeled triangle reappears ─────────────────────────────────────────
  {
    id: 'labeled-triangle',
    copy: 'For example, we can realize D₃ as a permutation group simply by labeling the vertices of the triangle.',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { triangle: 'left', s4graph: 'right' },
    animation: 'labeledTriangleIn', // triangle reappears with vertex labels 1, 2, 3
  },

  // ── 24 ─ Labeled flip ───────────────────────────────────────────────────────
  {
    id: 'labeled-flip',
    copy: 'A flip across the vertical axis is (2 3): it swaps vertices 2 and 3, leaving vertex 1 alone.',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { triangle: 'left' },
    animation: 'labeledFlipAxis',   // draw vertical axis on labeled triangle
  },

  // ── 25 ─ Labeled rotation ───────────────────────────────────────────────────
  {
    id: 'labeled-rotation',
    copy: 'A rotation is the cycle (1 2 3): it sends 1 → 2, 2 → 3, and 3 → 1.',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { triangle: 'left' },
    animation: 'labeledRotation',   // animate labeled triangle rotating 120° CW
  },

  // ── 26 ─ Generators close ───────────────────────────────────────────────────
  {
    id: 'generators-close',
    copy: 'Thus, by choosing the right generators from among the elements of a symmetric group, we can generate any group.',
    copyPosition: { x: 'center', y: 'bottom' },
    show: { triangle: 'left' },
    animation: null,
  },

  // ── 27 ─ Cayley's Garden intro ──────────────────────────────────────────────
  {
    id: 'garden-intro',
    copy: 'In Cayley\'s Garden, you can do exactly that: choose a symmetric group, choose generators, and grow your own Cayley graphs — just don\'t forget to water them.',
    copyPosition: { x: 'center', y: 'middle' },
    show: {},
    animation: 'triangleOut',       // triangle exits; screen clears
  },

  // ── 28 ─ Call to action ─────────────────────────────────────────────────────
  {
    id: 'call-to-action',
    copy: 'Can you discover every subgroup?',
    copyPosition: { x: 'center', y: 'middle' },
    show: {},
    animation: null,
  },

  // ── 29 ─ Launch app ─────────────────────────────────────────────────────────
  {
    id: 'finish',
    copy: null,
    copyPosition: { x: 'center', y: 'middle' },
    show: {},
    animation: null,                 // scroll trigger in handleScroll fires the app transition
  },

];
