<script>
  import GroupSelector from './components/GroupSelector.svelte';
  import GeneratorMenu from './components/GeneratorMenu.svelte';
  import GraphView     from './components/GraphView.svelte';
  import Controls      from './components/Controls.svelte';
  import CayleyTable   from './components/CayleyTable.svelte';
  import GroupMessage  from './components/GroupMessage.svelte';

  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { n, cayleyVisible, visibleNodes, darkMode } from './stores.js';

  $: nodeCount = $visibleNodes.filter(nd => nd.active).length;
  $: document.documentElement.dataset.theme = $darkMode ? 'dark' : 'light';

  let headerLeftEl, toggleEl;

  onMount(() => {
    let done = false;
    // Subscribe directly to the store so we run synchronously inside n.set(),
    // capturing old positions before Svelte's DOM flush (which runs in the next
    // microtask). Our Promise.resolve().then() queues after that flush.
    const unsub = n.subscribe(newN => {
      if (!newN || done) return;
      done = true;

      const leftBefore = headerLeftEl?.getBoundingClientRect();
      const togBefore  = toggleEl?.getBoundingClientRect();

      Promise.resolve().then(() => {
        function animEl(el, before) {
          if (!el || !before) return;
          const after = el.getBoundingClientRect();
          const dx = before.left - after.left;
          if (Math.abs(dx) < 0.5) return;
          el.style.transition = 'none';
          el.style.transform = `translateX(${dx}px)`;
          el.getBoundingClientRect(); // force reflow
          el.style.transition = 'transform 0.42s cubic-bezier(0.4, 0, 0.2, 1)';
          el.style.transform = '';
          const cleanup = () => { el.style.transition = ''; el.removeEventListener('transitionend', cleanup); };
          el.addEventListener('transitionend', cleanup);
        }
        animEl(headerLeftEl, leftBefore);
        animEl(toggleEl, togBefore);
      });
    });
    return unsub;
  });
</script>

<main class:ready={!!$n}>

  <!-- ── Top bar ──────────────────────────────────────────────── -->
  <header>
    <div class="header-left" bind:this={headerLeftEl}>
      <h1>Cayley's Garden</h1>
      <GroupSelector />
    </div>
    <button class="theme-toggle" bind:this={toggleEl}
            on:click={() => ($darkMode = !$darkMode)}
            title={$darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
      {#if $darkMode}
        <!-- Sun: click to go light -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1"  x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1"  y1="12" x2="3"  y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
          <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
        </svg>
      {:else}
        <!-- Moon: click to go dark -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      {/if}
    </button>
  </header>

  <!-- ── Main workspace (only shown once a group size is chosen) ── -->
  {#if $n}
  <div class="workspace" in:fade={{ duration: 320, delay: 200 }}>

    <!-- Left panel: controls pinned at top, generators scroll below, message at bottom -->
    <aside class="left-panel">
      <Controls />
      <div class="generator-scroll">
        <GeneratorMenu />
      </div>
      <GroupMessage />
    </aside>

    <!-- Center: the graph SVG -->
    <div class="graph-area">
      <GraphView />
    </div>

    <!-- Right panel: Cayley table (toggle button lives here too) -->
    <aside class="right-panel">
      <button on:click={() => ($cayleyVisible = !$cayleyVisible)}>
        {$cayleyVisible ? 'Hide' : 'Show'} Cayley Table
      </button>
      <CayleyTable />
    </aside>

  </div>
  {/if}

  {#if $n}
    <footer in:fade={{ duration: 280, delay: 180 }}>{nodeCount} / {[2,6,24,120][$n-2]} elements</footer>
  {/if}

</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 90vh;
    overflow: hidden;
    padding: 1rem;
    box-sizing: border-box;
    gap: 1rem;
  }

  footer {
    flex-shrink: 0;
    text-align: center;
    font-size: 0.95rem;
    color: #888;
  }

  header {
    display: flex;
    align-items: center;
    gap: 2rem;
    flex-shrink: 0;
  }

  /* Before group selection: center the left group and toggle together. */
  main:not(.ready) header {
    justify-content: center;
  }

  /* After group selection: push the toggle to the far right. */
  main.ready .theme-toggle {
    margin-left: auto;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 2rem;
    flex-shrink: 0;
  }

  .header-left h1 {
    margin: 0;
    font-size: 1.8rem;
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border-radius: 50%;
    border: 1px solid transparent;
    background: none;
    cursor: pointer;
    color: inherit;
    flex-shrink: 0;
  }
  .theme-toggle:hover {
    border-color: currentColor;
  }

  .workspace {
    display: flex;
    flex: 1;
    gap: 1rem;
    min-height: 0;
  }

  .left-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 280px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .generator-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .graph-area {
    flex: 1;
    min-width: 0;
    display: flex;
  }

  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 260px;
    flex-shrink: 0;
    overflow: hidden;
  }
</style>
