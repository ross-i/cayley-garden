# Tutorial
## Bugs:
1. hero-tile edges have higher opacity than those of D3Graph component.
2. extremely subtle jank/shrink just before hero-tile transforms into D3Graph.
4. Triangle component:
    a. rf animation (stage 13/31) needs to be multi-stage (see inline comment)
    b. vertices 2 and 3 should swap positions when triangle is reflected

## Features:
1. Copy text-boxes should scroll. Use IntersectionObserver API?
2. Transition into app is just fade - it could be better.
3. Light mode for tutorial

# App
## Bugs
1. Step forward needs more thought; behavior feels unexpected at times
2. Toggling ghost mode too quickly causes wrong zoom
3. View box doesn't update during generation; likely because resetViewBox is called after delay
to give cola time to settle, but the next frame appears before the delay is up.

## Features
1. Pop-up message when discovering new group family (toggle-able)
2. Progress tracker indicates found groups
3. Cayley table needs more thought
