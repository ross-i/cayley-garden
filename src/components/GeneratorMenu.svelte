<script>
  // Generator selection panel. Appears after the user picks a group size.
  // Generators are grouped by cycle structure (2-cycles, 3-cycles, etc.)
  // Selected generators float to the top with color swatches and optional name inputs.

  import { n, generators, generatorColors, generatorNames, useNames,
           frames, currentFrame, applied, isStable } from '../stores.js';
  import { groupByCycleStructure, toCycleNotation, toKey } from '../lib/permutations.js';

  // Groups of non-identity permutations for the current n, used to render
  // the nested checkbox list. Recomputed whenever $n changes.
  // Shape: { label: string, perms: number[][] }[]
  $: groups = $n ? groupByCycleStructure($n) : [];

  // Set of selected permutation keys, derived from $generators for O(1) lookup.
  $: selectedKeys = new Set($generators.map(toKey));

  // Default colors cycled from this palette when a new generator is selected.
  const palette = ['#e15759', '#4e79a7', '#f28e2b', '#76b7b2', '#59a14f',
                   '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac'];

  const MAX_GENERATORS = 16;

  // Called when a checkbox is toggled.
  // Adds the permutation to $generators with a default color and name,
  // or removes it and cleans up its color/name entries.
  // @param {number[]} perm
  // @param {boolean} checked
  function toggleGenerator(perm, checked) {
    if (checked) {
      if ($generators.length >= MAX_GENERATORS) return;
      const usedColors = new Set($generatorColors);
      const color = palette.find(c => !usedColors.has(c)) ?? palette[$generators.length % palette.length];
      const usedNames = new Set($generatorNames);
      const name = 'abcdfghijklmnopqrstuvwxyz'.split('').find(c => !usedNames.has(c)) ?? 'a';
      const gens = [...$generators, perm];
      const colors = [...$generatorColors, color];
      const names = [...$generatorNames, name];
      generators.set(gens);
      generatorColors.set(colors);
      generatorNames.set(names);
    } else {
      const idx = $generators.findIndex(g => toKey(g) === toKey(perm));
      if (idx === -1) return;
      const gens = [...$generators];
      const colors = [...$generatorColors];
      const names = [...$generatorNames];
      gens.splice(idx, 1);
      colors.splice(idx, 1);
      names.splice(idx, 1);
      generators.set(gens);
      generatorColors.set(colors);
      generatorNames.set(names);
    }
    frames.set([]);
    currentFrame.set(0);
    applied.set(new Set());
    isStable.set(false);
  }

  // Called when the user changes a generator's color swatch.
  // @param {number} index  - position in $generators
  // @param {string} color  - new hex color
  function updateColor(index, color) {
    const colors = [...$generatorColors];
    colors[index] = color;
    generatorColors.set(colors);
  }

  // Reorders an array for column-major display in a 2-column CSS grid.
  // CSS grid is row-major, so we permute the items so that reading left-to-right
  // top-to-bottom produces the same result as reading top-to-bottom column-by-column.
  function colMajor2(arr) {
    const rows = Math.ceil(arr.length / 2);
    return Array.from({ length: arr.length }, (_, i) => {
      const row = Math.floor(i / 2), col = i % 2;
      return arr[col * rows + row];
    }).filter(Boolean);
  }

  function deselectAll() {
    generators.set([]);
    generatorColors.set([]);
    generatorNames.set([]);
    frames.set([]);
    currentFrame.set(0);
    applied.set(new Set());
    isStable.set(false);
  }

  // Called when the user edits a generator's name.
  // Rejects the change (and reverts the input) if another generator already
  // uses the same non-empty letter, keeping names unique.
  // @param {number} index     - position in $generators
  // @param {string} name      - new single-letter name
  // @param {HTMLElement} el   - the input element (for revert)
  function updateName(index, name, el) {
    if (name === 'e' || (name && $generatorNames.some((n, i) => i !== index && n === name))) {
      el.value = $generatorNames[index];
      return;
    }
    const names = [...$generatorNames];
    names[index] = name;
    generatorNames.set(names);
  }
</script>

{#if $n}
  <div class="generator-menu">

    <!-- Selected generators with color swatches (and name inputs if useNames) -->
    <div class="selected-generators">
      <h3>Selected generators</h3>
      {#if $generators.length > 0}
      {#each $generators as perm, i}
        <div class="generator-row">
          <input
            type="color"
            value={$generatorColors[i]}
            on:input={(e) => updateColor(i, e.target.value)}
          />
          {#if $useNames}
            <input
              type="text"
              class="name-input"
              maxlength="1"
              value={$generatorNames[i]}
              on:input={(e) => updateName(i, e.target.value, e.target)}
            />
          {/if}
          <span class="label">{toCycleNotation(perm)}</span>
          <button class="remove-btn" on:click={() => toggleGenerator(perm, false)} title="Remove">✕</button>
        </div>
      {/each}
      {/if}
    </div>

    {#if $generators.length >= 6}
      <button class="deselect-all-btn" on:click={deselectAll}>
        Deselect all generators
      </button>
    {/if}

    <!-- Name-mode toggle -->
    <label class="name-toggle">
      <input type="checkbox" bind:checked={$useNames} />
      Assign generator names
    </label>

    <!-- Nested generator list grouped by cycle structure -->
    {#each groups as group}
      <details>
        <summary>{group.label}</summary>
        <div class="perm-list" class:two-col={group.perms.length >= 4}>
          {#each (group.perms.length >= 4 ? colMajor2(group.perms) : group.perms) as perm}
            <label>
              <input
                type="checkbox"
                checked={selectedKeys.has(toKey(perm))}
                disabled={!selectedKeys.has(toKey(perm)) && $generators.length >= MAX_GENERATORS}
                on:change={(e) => toggleGenerator(perm, e.target.checked)}
              />
              {toCycleNotation(perm)}
            </label>
          {/each}
        </div>
      </details>
    {/each}

  </div>
{/if}

<style>
  .generator-menu {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    text-align: left;
    width: 100%;
  }
  .selected-generators {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .generator-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .name-input {
    width: 2em;
    text-align: center;
    padding: 0.1em 0.2em;
  }
  .remove-btn {
    margin-left: auto;
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 0.75rem;
    padding: 0 0.2em;
    line-height: 1;
  }
  .remove-btn:hover {
    color: #e15759;
  }
  .perm-list {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding-left: 1rem;
  }
  .perm-list.two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 0.5rem;
    padding-left: 1rem;
  }
  .deselect-all-btn {
    align-self: flex-start;
    font-size: 0.8rem;
    padding: 0.2em 0.6em;
    color: #888;
    background: none;
    border: 1px solid #bbb;
    border-radius: 4px;
    cursor: pointer;
  }
  .deselect-all-btn:hover {
    color: #e15759;
    border-color: #e15759;
  }
  .name-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.875rem;
  }
</style>
