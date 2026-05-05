# Tutorial
## Bugs:
1. hero-tile stroke width and node colors don't match those of D3Graph component.
2. D3Graph flip edges (red) should be double-sided
3. Triangle component:
    a. rf animation (13/31) needs to be multi-stage (see inline comment)
    b. labeled vertices should stay upright when triangle is rotated
4. Balls component:
    a. balls are not evenly spaced
    b. pair swap involves a vertical component - it shouldn't
5. S4Graph component should use cola, not ghost mode. There also appear to be some edges missing.
   I can export some JSON to make this view if needed.
   Needs more work to illustrate the point; highlight the subgroup within it.

## Features:
1. Copy text-boxes should scroll. Use IntersectionObserver API?
2. Smooth transition into app at end of tutorial; on skip tutorial click; on skip to app click 
