<script>
  import { ballsState } from './animState.js';

  const BALLS = [
    { cx: 80,  cy: 100, color: '#4e79a7', label: '1' },
    { cx: 180, cy: 100, color: '#e15759', label: '2' },
    { cx: 300, cy: 100, color: '#59a14f', label: '3' },
    { cx: 420, cy: 100, color: '#f28e2b', label: '4' },
  ];

  $: offsets = (() => {
    if ($ballsState.animation === 'swap12') {
      return [
        { x: 100, y: -30 },
        { x: -100, y: 30 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ];
    } else if ($ballsState.animation === 'cycle123') {
      return [
        { x: 100, y: 0 },
        { x: 120, y: 0 },
        { x: -220, y: 0 },
        { x: 0, y: 0 },
      ];
    }
    return [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
  })();
</script>

<svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
  {#each BALLS as ball, i}
    <g style="transform: translate({ball.cx + offsets[i].x}px, {ball.cy + offsets[i].y}px); transition: transform 0.7s ease-in-out;">
      <circle r="42" fill={ball.color} />
      <text
        x="0"
        y="0"
        fill="white"
        font-size="22"
        font-weight="700"
        text-anchor="middle"
        dominant-baseline="central"
      >{ball.label}</text>
    </g>
  {/each}
</svg>

<style>
  svg {
    animation: mountIn 0.5s ease 0.1s both;
    width: 100%;
    height: auto;
  }

  @keyframes mountIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }
</style>
