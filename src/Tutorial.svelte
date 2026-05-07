<script>
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut, cubicIn } from 'svelte/easing';
  import { appView, d3Visible } from './stores.js';
  import { stages } from './story.js';

  import D3Graph            from './tutorial/D3Graph.svelte';
  import Triangle           from './tutorial/Triangle.svelte';
  import TutorialCayleyTable from './tutorial/TutorialCayleyTable.svelte';
  import Balls              from './tutorial/Balls.svelte';
  import S4Graph            from './tutorial/S4Graph.svelte';
  import { animations }     from './tutorial/animations.js';
  import { clearAll }       from './tutorial/animState.js';

  // ── Visibility gate — Tutorial mounts during 'transitioning' (hidden behind
  // LandingPage). Animations must not fire until the view is actually 'tutorial'.
  let tutorialActive = false;
  $: if ($appView === 'tutorial') tutorialActive = true;

  // ── Scroll tracking ────────────────────────────────────────────────────────
  let scrollEl;
  let scrollTop = 0;
  let stageHeight = 0; // set in onMount to window.innerHeight

  $: currentIdx = stageHeight
    ? Math.min(stages.length - 1, Math.max(0, Math.floor(scrollTop / stageHeight)))
    : 0;
  $: stage = stages[currentIdx];

  function handleScroll() {
    scrollTop = scrollEl?.scrollTop ?? 0;
    // One extra viewport height of scroll after the last stage launches the app.
    if (stageHeight && scrollTop >= (stages.length - 0.4) * stageHeight) {
      appView.set('app');
    }
  }

  // ── Navigation helpers ─────────────────────────────────────────────────────
  function goToStage(idx) {
    scrollEl?.scrollTo({ top: idx * stageHeight, behavior: 'smooth' });
  }

  function handleKeydown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (currentIdx >= stages.length - 1) {
        appView.set('app');
      }
      else {
        goToStage(Math.min(stages.length - 1, currentIdx + 1));
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      goToStage(Math.max(0, currentIdx - 1));
    }
  }

  // ── Copy bubble positioning ────────────────────────────────────────────────
  function copyStyle(cp) {
    if (!cp) return '';
    const { x = 'center', y = 'bottom' } = cp;
    const hParts = x === 'left'  ? ['left: 2.5rem;']
                 : x === 'right' ? ['right: 2.5rem;']
                 : ['left: 50%;'];
    const vParts = y === 'top'    ? ['top: 3rem;']
                 : y === 'middle' ? ['top: 50%;']
                 : ['bottom: 6rem;'];
    const tx = x === 'center' ? 'translateX(-50%)' : '';
    const ty = y === 'middle' ? 'translateY(-50%)' : '';
    const tf = [tx, ty].filter(Boolean).join(' ');
    return [...hParts, ...vParts, tf ? `transform: ${tf};` : ''].join(' ');
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  onMount(() => {
    stageHeight = window.innerHeight;
    window.addEventListener('keydown', handleKeydown);
  });
  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  // Dispatch animation (or clear) whenever the stage changes.
  $: {
    const key = stage?.animation;
    if (key && animations[key]) {
      animations[key]();
    } else {
      clearAll();
    }
  }

  // All possible component keys — order controls render stacking.
  const COMPONENTS = ['graph', 'portrait', 'triangle', 'table', 'balls', 's4graph'];
</script>

<!--
  The tutorial is a self-contained scroll area (position:fixed, overflow-y:scroll).
  A sticky visual stage stays pinned to the top while an invisible spacer below
  provides the scrollable height. scrollTop / stageHeight = current stage index.
-->
<div class="tutorial" class:tutorial-active={tutorialActive} bind:this={scrollEl} on:scroll={handleScroll}>

  <!-- ── Sticky visual area ── -->
  <div class="visual-stage">

    <!-- Component slots: always in DOM, CSS-transitioned between columns.
         Portrait is the exception — it mounts/unmounts with a fly transition
         so the slide direction is guaranteed. -->
    {#each COMPONENTS as comp (comp)}
      {@const colPos = stage?.show?.[comp] ?? null}
      {#if comp === 'portrait'}
        {#if colPos}
          <div class="portrait-wrap"
               in:fly={{ x: 500, duration: 550, easing: cubicOut }}
               out:fly={{ x: 500, duration: 400, easing: cubicIn }}>
            <figure class="portrait-figure">
              <img src="/arthur_cayley.jpg" alt="Arthur Cayley" class="portrait-img" />
              <figcaption>
                <span class="portrait-name">Arthur Cayley</span>
                <span class="portrait-years">1821 – 1895</span>
              </figcaption>
            </figure>
          </div>
        {/if}
      {:else}
        <div class="comp-wrap"
             class:col-left={colPos === 'left'}
             class:col-center={colPos === 'center'}
             class:col-right={colPos === 'right'}
             class:col-hidden={!colPos && comp !== 'table' && comp !== 's4graph'}
             class:col-hidden-right={!colPos && (comp === 'table' || comp === 's4graph')}>
          {#if comp === 'graph'}
            <D3Graph visible={$d3Visible} />
          {:else if comp === 'triangle'}
            <Triangle />
          {:else if comp === 'table'}
            <TutorialCayleyTable />
          {:else if comp === 'balls'}
            <Balls />
          {:else if comp === 's4graph'}
            <S4Graph />
          {/if}
        </div>
      {/if}
    {/each}

    <!-- Copy bubble — re-keyed on stage change so it fades between stages -->
    {#if tutorialActive && stage?.copy}
      {#key currentIdx}
        <div class="copy-bubble"
             style={copyStyle(stage.copyPosition)}
             in:fade={{ duration: 280, delay: 120 }}
             out:fade={{ duration: 180 }}>
          <p>{stage.copy}</p>
        </div>
      {/key}
    {/if}

    <!-- Navigation: prev / next arrows + stage counter -->
    <nav class="stage-nav">
      <button class="nav-btn" disabled={currentIdx === 0}
              on:click={() => goToStage(currentIdx - 1)}
              aria-label="Previous stage">‹</button>
      <span class="stage-counter">{currentIdx + 1} / {stages.length}</span>
      <button class="nav-btn"
              on:click={() => goToStage(Math.min(stages.length - 1, currentIdx + 1))}
              aria-label="Next stage">›</button>
    </nav>

    <!-- Progress bar -->
    <div class="progress-track" aria-hidden="true">
      <div class="progress-fill"
           style="width: {(currentIdx / (stages.length - 1)) * 100}%"></div>
    </div>

    <!-- Skip to app -->
    <button class="skip-btn" on:click={() => appView.set('app')}>
      Skip to app →
    </button>

    <!-- Stage id label (dev aid — remove or hide for production) -->
    <!-- <div class="dev-label" aria-hidden="true"> -->
    <!--   {stage?.id ?? ''} -->
    <!--   {#if stage?.animation}· <em>{stage.animation}</em>{/if} -->
    <!-- </div> -->

  </div><!-- /visual-stage -->

  <!--
    Spacer: provides the total scrollable height.
    stages.length extra viewports = one spare after the last stage
    that triggers the app transition when scrolled into.
  -->
  <div class="spacer-tail" style="height: {stages.length * 100}vh;"></div>

</div>

<style>
  /* ── Scroll container ───────────────────────────────────────────────────── */
  .tutorial {
    position: fixed;
    inset: 0;
    overflow-y: scroll;
    overflow-x: hidden;
    scrollbar-width: none;       /* Firefox */
    background: #111;
    color: rgba(255, 255, 255, 0.88);
    --col-w: 30vw;       /* width of each component column */
    --col-pad: 3vw;      /* outer edge padding */
    --gap: 3.5vw;        /* gap between left edge of adjacent columns */
  }
  .tutorial::-webkit-scrollbar { display: none; } /* Chrome/Safari/Edge */

  /* :global(html[data-theme="light"]) .tutorial { */
  /*   background: #f0f0f0; */
  /*   color: #1a1a1a; */
  /* } */

  /* ── Sticky visual stage ────────────────────────────────────────────────── */
  .visual-stage {
    position: sticky;
    top: 0;
    height: 100vh;
    width: 100%;
    overflow: hidden;
  }

  /* ── Component slots ────────────────────────────────────────────────────── */
  /*
    All slots share position:absolute and vertically centered.
    Columns are laid out as left/center/right thirds with outer padding.
    Hidden components slide off to the left; transitions animate between states.

    Column x-offsets (with --col-pad=3vw, --col-w=30vw, --gap=3.5vw):
      left:   left = 3vw
      center: left = 35vw   (3 + 30 + 2 ≈ 35)
      right:  left = 67vw   (35 + 30 + 2 ≈ 67)
  */
  .comp-wrap {
    position: absolute;
    top: 50%;
    width: var(--col-w);
    transform: translateY(-50%);
    /* Position and opacity both transition so column moves feel intentional. */
    transition: left 0.55s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.4s ease,
                visibility 0s linear 0.4s;
    /* Default: hidden off-screen left */
    left: -40vw;
    opacity: 0;
    visibility: hidden;
  }

  .col-left   { left: var(--col-pad);        opacity: 1; visibility: visible; transition-delay: 0s, 0s, 0s; }
  .col-center { left: calc(50% - var(--col-w) / 2); opacity: 1; visibility: visible; transition-delay: 0s, 0s, 0s; }
  .col-right  { left: calc(100% - var(--col-pad) - var(--col-w)); opacity: 1; visibility: visible; transition-delay: 0s, 0s, 0s; }
  .col-hidden       { left: -40vw;  opacity: 0; visibility: hidden; }
  .col-hidden-right { left: 140vw;  opacity: 0; visibility: hidden; }

  /* Portrait uses flexbox centering instead of transform so in:fly doesn't
     clobber the translateY(-50%) that comp-wrap normally relies on. */
  .portrait-wrap {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(100% - var(--col-pad) - var(--col-w));
    width: var(--col-w);
    display: flex;
    align-items: center;
  }

  /* ── Portrait ───────────────────────────────────────────────────────────── */
  .portrait-figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .portrait-img {
    display: block;
    width: 100%;
    max-height: 55vh;
    object-fit: cover;
    object-position: center top;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .portrait-figure figcaption {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  .portrait-name {
    font-size: 1rem;
    font-weight: 600;
    font-style: italic;
    opacity: 0.85;
  }

  .portrait-years {
    font-size: 0.75rem;
    opacity: 0.4;
    letter-spacing: 0.05em;
  }

  /* ── Copy bubble ─────────────────────────────────────────────────────────── */
  .copy-bubble {
    position: absolute;
    max-width: 440px;
    padding: 1.2rem 1.5rem;
    background: rgba(15, 15, 15, 0.82);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    pointer-events: none;
  }

  /* :global(html[data-theme="light"]) .copy-bubble { */
  /*   background: rgba(255, 255, 255, 0.88); */
  /*   border-color: rgba(0, 0, 0, 0.12); */
  /* } */

  .copy-bubble p {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.65;
    white-space: pre-line;
  }

  /* ── Navigation ─────────────────────────────────────────────────────────── */
  .stage-nav {
    position: absolute;
    bottom: 3.5rem;
    right: 3.5rem;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    padding: 0.35rem 0.75rem;
    user-select: none;
    opacity: 0;
  }
  .tutorial-active .stage-nav {
    animation: uiFadeIn 0.6s ease 0.3s both;
  }

  .nav-btn {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.3rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.25rem;
    opacity: 0.7;
    transition: opacity 0.15s;
  }
  .nav-btn:hover:not(:disabled) { opacity: 1; }
  .nav-btn:disabled { opacity: 0.2; cursor: default; }

  .stage-counter {
    font-size: 0.8rem;
    opacity: 0.5;
    min-width: 5ch;
    text-align: center;
  }

  /* ── Progress bar ───────────────────────────────────────────────────────── */
  .progress-track {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.08);
    opacity: 0;
  }
  .tutorial-active .progress-track {
    animation: uiFadeIn 0.7s ease 0.4s both;
  }

  .progress-fill {
    height: 100%;
    background: #e15759;
    transition: width 0.3s ease;
  }

  /* ── Skip button ─────────────────────────────────────────────────────────── */
  .skip-btn {
    position: absolute;
    top: 1.25rem;
    right: 1.5rem;
    background: transparent !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: rgba(255, 255, 255, 0.45) !important;
    font-size: 0.85rem;
    padding: 0.4em 1em;
    border-radius: 6px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    opacity: 0;
  }
  .tutorial-active .skip-btn {
    animation: uiFadeIn 0.6s ease 0.3s both;
  }

  @keyframes uiFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .skip-btn:hover {
    color: rgba(255, 255, 255, 0.85) !important;
    border-color: rgba(255, 255, 255, 0.5) !important;
  }

  /* :global(html[data-theme="light"]) .skip-btn { */
  /*   border-color: rgba(0,0,0,0.2) !important; */
  /*   color: rgba(0,0,0,0.4) !important; */
  /* } */
  /* :global(html[data-theme="light"]) .skip-btn:hover { */
  /*   color: rgba(0,0,0,0.75) !important; */
  /*   border-color: rgba(0,0,0,0.5) !important; */
  /* } */

  /* ── Dev label ──────────────────────────────────────────────────────────── */
  /* .dev-label { */
  /*   position: absolute; */
  /*   top: 1.25rem; */
  /*   left: 1.5rem; */
  /*   font-size: 0.7rem; */
  /*   opacity: 0.25; */
  /*   font-family: monospace; */
  /*   pointer-events: none; */
  /* } */
</style>
