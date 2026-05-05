The app is built with cola.js (https://ialab.it.monash.edu/webcola/) + D3 + Svelte,
with Vite as the server.

On load, the graph has a single node:
the identity element.

There is a dropdown selection to pick the size of the
symmetric group. The options are 2, 3, 4, 5.

Upon making a selection of symmetric group size,
a new menu appears to let the user select their generators.
This menu nests generators according to the number of elements
they involve.
For example, for S_3,
we can choose any of the elements from the 3 pair-swaps,
as well as any of the elements from the 2 three-cycles.
Users pick individual permutations, not conjugacy classes.
All elements of $S_n$ are available (except the identity).

The chosen generators should appear at the top,
and the user can select colors for them.
These will be the edge colors.
There is a switch that, when flipped,
allows the user to "name" the generators with single letters,
which default to a, b, c, ...
Then, the nodes will be labelled as words made of the generators,
e.g., "a^2 b"; if the switch is not flipped,
the nodes are labeled as permutations in cycle notation.

Edges use left action: applying generator g to node v draws the
directed edge v → g·v.

At the bottom are buttons "Generate", "Step Forward", and "Reset".

Step Forward applies every generator to every current graph node
that has not yet had that generator applied, causing the following
new items to be drawn:
1. the directed edge of the color corresponding to that generator,
   pointing from v to g·v.
2. the newly reached node (if not already present), labeled by the
   generator-word or permutation (written in cycle notation) it represents.
Edges to pre-existing nodes are also drawn in that frame —
not just edges to new nodes.
If two generators produce edges between the same pair of nodes in
opposite directions and different colors, those edges sit side by side.
If a generator is its own inverse (e.g. a transposition) and produces
edges in both directions with the same color, a single double-headed
arrow is drawn instead.
All of the items drawn in a single step appear simultaneously.
Thus, each "step" represents a new frame of the animation.

The generate function effectively calls step forward
repeatedly until the graph is stable (i.e., a call to step forward)
produces no new nodes).

A slider below the buttons lets the user move through the frames/steps
of graph generation. Each step forward is one frame.

A Cayley table off to the side updates as nodes are added.
This can be toggled visible/invisible.

Graph layout: in normal mode, cola.js is used so that nodes and edges
feel alive and organic as they appear — the graph visibly grows and
re-arranges itself, reinforcing the central "garden" metaphor.

A toggle option makes all nodes and edges of the full symmetric group
S_n visible as "ghost" elements — very transparent, light grey.
Toggling ghost mode on resets generation (equivalent to pressing Reset).
In ghost mode, cola.js is not used; instead, all n! nodes are placed
on a fixed circle. The ghost graph is a complete directed graph on
those n! vertices (one edge per non-identity element of S_n between
every ordered pair of nodes). Ghost edges have no arrowheads.
As generation proceeds, nodes and edges corresponding to the user's
selected generators become colored and get arrows added —
it should appear as though they are being "activated" out of the ghost.

When generation is complete, a message at the bottom tells the user
what group they generated, giving its structural name
(e.g. Z_6, D_3, S_4, A_4).
