Upon loading the site, we see the title "Cayley's Garden" in the center of the page.
The title is surrounded by many Cayley graphs, laid out in a square grid,
forming a background for the page.
In the bottom left is a button labeled "Begin". On the bottom right is a "Skip Tutorial" button.
Skipping the tutorial brings you straight to the main tool, which is also the natural endpoint of
the tutorial.

Clicking "Begin" starts the tutorial via the following animation.
With the exception of a single graph near the center, just under the title,
all the graphs fly away off the screen. Then, the title fades.
Finally, we zoom in on the remaining graph.
Progress through the tutorial is made by scrolling.
Each separate line of copy is a distinct text bubble, reached by scrolling.

We see the Cayley graph of D_3, the dihedral group.

//

A picture of Arthur Cayley slides in from the right,
pushing the graph to the left so that the space between them is centered on the page.
`
A Cayley Graph, named after Arthur Cayley, encodes the abstract structure of a group.
`
//

The picture slides off screen to the right.

//

`
The nodes represent the elements of the group: {e, r, r^2, f, rf, r^2f}.
The edges represent the action of one element of the group on another:
for example, beginning at r, if we apply
`
//

`
However, here, we are letting only a subset of the elements "act" on the others:
we have chosen as *generators* the elements {e, r, f}.
`

//

`
Of course, this is all rather abstract. These are mere symbols: what could they represent?
`
//
An equilateral triangle appears, sliding in from the left.
The graph stays centered on the page.
`
D_3 is the dihedral group of symmetries of an equilateral triangle.
`

//

Highlight the node 'e'.
`
e is the identity element: it represents the 'do-nothing symmetry'.
If we do nothing to the triangle, it looks the same!
`

//
Unhighlight 'e' and highlight the node 'f'.
A red vertical line appears over the triangle indicating the axis to reflect over.
`f represents the 'flip' - if we reflect it about the vertical axis, it still looks the same!`

//
Unhighlight 'f' and highlight the node 'r'.
Animate the triangle rotating 120 degrees clockwise.
`r represents rotation - if we rotate the triangle by 120 degrees, it still looks the same!`

//

`
By composing these actions, we can create all possible symmetries of the triangle;
i.e., we can *generate* the dihedral group.
`
//

Highlight the path beginning at 'e', to 'r', then to 'rf'.
The vertical axis appears on the triangle, then the triangle is rotated 120 degrees clockwise.
`
For example, if we rotate by 120 degrees, then flip over the vertical axis,
this is the same as flipping over the axis that passes through the lower right vertex.
Even though that action isn't one of our generators, we still can produce it.
`

//
Unhighlight the nodes and edges.
From the right side, the Cayley table for D_3 slides in.
`
The Cayley table (can you guess its namesake?) is like a multiplication table for a group.
The element labelling row acts (from the left) on the element that labels the column.
`

//
Highlight r (row label), f (column label) and rf on the Cayley table.
`
Thus, r and f give rf.
`

//
Highlight f (row label), r (column label), and r^2 f.
`
Note that the dihedral group is non-Abelian, i.e., non-commutative---order matters.
f and r, when combined in that order, give r^2 f, which is distinct from rf.
Look at the triangle: can you see that flipping and then rotating 120 degrees is the same
as rotating 240 degrees and then flipping?
`
//
`
Of course, there are many more groups than just the dihedral groups;
there are lots of symmetries that can be described by groups.
`
% TODO: next section. Introduce permutations, permutation groups,
% Cayley's Theorem

% TODO: final section: explaining how the tool works

