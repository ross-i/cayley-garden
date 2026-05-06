<script>
  import { ballsState } from './animState.js';
  $: animKey = $ballsState.animation;
</script>

<!--
  {#key animKey} destroys and recreates the balls group whenever the animation
  type changes, restarting the CSS @keyframes from frame 0 each time.
-->
{#key animKey}
<svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg" class="balls-svg">
  <!-- Ball 1 — #4e79a7, cx=70 -->
  <g class:anim-swap-1={animKey === 'swap12'}
     class:anim-cycle-1={animKey === 'cycle123'}>
    <circle cx="70" cy="100" r="42" fill="#4e79a7" />
    <text x="70" y="100" fill="white" font-size="22" font-weight="700"
          text-anchor="middle" dominant-baseline="central">1</text>
  </g>
  <!-- Ball 2 — #e15759, cx=190 -->
  <g class:anim-swap-2={animKey === 'swap12'}
     class:anim-cycle-2={animKey === 'cycle123'}>
    <circle cx="190" cy="100" r="42" fill="#e15759" />
    <text x="190" y="100" fill="white" font-size="22" font-weight="700"
          text-anchor="middle" dominant-baseline="central">2</text>
  </g>
  <!-- Ball 3 — #59a14f, cx=310 -->
  <g class:anim-cycle-3={animKey === 'cycle123'}>
    <circle cx="310" cy="100" r="42" fill="#59a14f" />
    <text x="310" y="100" fill="white" font-size="22" font-weight="700"
          text-anchor="middle" dominant-baseline="central">3</text>
  </g>
  <!-- Ball 4 — #f28e2b, cx=430 (never animates) -->
  <g>
    <circle cx="430" cy="100" r="42" fill="#f28e2b" />
    <text x="430" y="100" fill="white" font-size="22" font-weight="700"
          text-anchor="middle" dominant-baseline="central">4</text>
  </g>
</svg>
{/key}

<style>
  .balls-svg {
    animation: mountIn 0.5s ease 0.1s both;
    width: 100%;
    height: auto;
    display: block;
  }

  @keyframes mountIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Swap (1 2): ball 1 and ball 2 trade places, then return ── */
  /* Pure horizontal — spacing between centres is 120px. */
  .anim-swap-1 { animation: swap-b1 2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
  @keyframes swap-b1 {
    0%   { transform: translate(0, 0); }
    35%  { transform: translate(120px, 0); }
    65%  { transform: translate(120px, 0); }
    100% { transform: translate(0, 0); }
  }
  .anim-swap-2 { animation: swap-b2 2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
  @keyframes swap-b2 {
    0%   { transform: translate(0, 0); }
    35%  { transform: translate(-120px, 0); }
    65%  { transform: translate(-120px, 0); }
    100% { transform: translate(0, 0); }
  }

  /* ── Cycle (1 2 3): three steps of the 3-cycle, returning to start ── */
  /* Centres: 70, 190, 310 — uniform 120px spacing. */
  /* Ball 1: 70 → 190 → 310 → 70 */
  .anim-cycle-1 { animation: cycle-b1 3s ease-in-out forwards; }
  @keyframes cycle-b1 {
    0%,  10% { transform: translate(0,     0); }
    33%, 43% { transform: translate(120px, 0); }
    66%, 76% { transform: translate(240px, 0); }
    100%     { transform: translate(0,     0); }
  }
  /* Ball 2: 190 → 310 → 70 → 190 */
  .anim-cycle-2 { animation: cycle-b2 3s ease-in-out forwards; }
  @keyframes cycle-b2 {
    0%,  10% { transform: translate(0,      0); }
    33%, 43% { transform: translate(120px,  0); }
    66%, 76% { transform: translate(-120px, 0); }
    100%     { transform: translate(0,      0); }
  }
  /* Ball 3: 310 → 70 → 190 → 310 */
  .anim-cycle-3 { animation: cycle-b3 3s ease-in-out forwards; }
  @keyframes cycle-b3 {
    0%,  10% { transform: translate(0,      0); }
    33%, 43% { transform: translate(-240px, 0); }
    66%, 76% { transform: translate(-120px, 0); }
    100%     { transform: translate(0,      0); }
  }
</style>
