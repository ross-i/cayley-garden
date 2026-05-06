<script>
  import { triangleState } from './animState.js';

  $: rotDeg = $triangleState.rotation;
  $: flipTick = $triangleState.flipTick;
</script>

<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <!-- flip axis (behind triangle, not in the rotating group) -->
  <line class="flip-axis" class:axis-visible={$triangleState.showAxis}
        x1="250" y1="15" x2="250" y2="490"/>

  <!-- rotating group -->
  <g class="triangle-group" style="transform: rotate({rotDeg}deg); transform-origin: 50% 56.67%;">
    <!--
      {#key flipTick} destroys and recreates this inner group whenever flipTick
      changes, which restarts the CSS animation from frame 0 every time a flip
      is triggered — without disturbing the outer rotation transform.
    -->
    {#key flipTick}
      <g class="flip-group" class:do-flip={flipTick > 0}>
        <polygon class="tri-poly" points="250,64 440,393 60,393"/>
      </g>
    {/key}

    <!-- Labels live outside the flip-group so scaleX never squishes or mirrors
         them. They stay inside the rotating group so they translate with their
         vertices. Each label counter-rotates by -rotDeg (same easing as the
         outer group) so the text always reads upright. -->
    <g class="vertex-labels" class:labels-visible={$triangleState.labeled}>
      <text x="250" y="36"  class="vlabel" style="--cr:{-rotDeg}deg">1</text>
      <text x="468" y="393" class="vlabel" style="--cr:{-rotDeg}deg">2</text>
      <text x="32"  y="393" class="vlabel" style="--cr:{-rotDeg}deg">3</text>
    </g>
  </g>
</svg>

<style>
  svg {
    animation: mountIn 0.5s ease 0.15s both;
  }

  @keyframes mountIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }

  .triangle-group {
    transition: transform 0.6s ease-in-out;
  }

  .tri-poly {
    fill: rgba(255, 255, 255, 0.08);
    stroke: rgba(255, 255, 255, 0.75);
    stroke-width: 2.5;
  }

  /* flip-group: scaleX flip around the vertical axis of the triangle (x=250).
     transform-box:fill-box + transform-origin:50% 0% pivots at the top center
     of the bounding box, which is close to x=250 — good enough for the effect.
     The animation squishes to 0, holds at −1 (visually flipped), then returns,
     demonstrating that the triangle looks identical after a vertical-axis reflection. */
  .flip-group {
    transform-box: fill-box;
    transform-origin: 50% 50%;
  }
  .flip-group.do-flip {
    animation: flipReflect 1.5s cubic-bezier(0.4, 0, 0.2, 1) both;
  }
  @keyframes flipReflect {
    0%   { transform: scaleX(1);    }
    25%  { transform: scaleX(0);    }
    26%  { transform: scaleX(-1);   }   /* instant visual flip at the midpoint */
    65%  { transform: scaleX(-1);   }   /* hold flipped state so viewer registers it */
    66%  { transform: scaleX(0);    }
    100% { transform: scaleX(1);    }
  }

  .flip-axis {
    stroke: #e15759;
    stroke-width: 2;
    stroke-dasharray: 8 5;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .flip-axis.axis-visible {
    opacity: 0.85;
  }

  .vertex-labels {
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .vertex-labels.labels-visible {
    opacity: 1;
  }

  .vlabel {
    font-size: 18px;
    font-weight: 600;
    fill: rgba(255, 255, 255, 0.85);
    text-anchor: middle;
    dominant-baseline: central;
    transform: rotate(var(--cr, 0deg));
    transform-box: fill-box;
    transform-origin: 50% 50%;
    transition: transform 0.6s ease-in-out;
  }
</style>
