<script>
  // Dropdown for picking the size of the symmetric group (S_2 through S_5).
  // Changing the selection resets generators and generation state; ghost mode
  // is preserved unless switching to S₅.

  import { n, generators, generatorColors, generatorNames, frames,
           currentFrame, applied, ghostMode, isStable } from '../stores.js';

  const options = [2, 3, 4, 5];
  const sub = n => String.fromCodePoint(0x2080 + n);

  // Called when the user picks a new value.
  // Resets all downstream state so the new group starts fresh.
  // Ghost mode is preserved across group switches except when switching to S₅,
  // where it is forced off because 14 280 ghost edges would lock the browser.
  function handleChange(event) {
    const newN = Number(event.target.value);
    n.set(newN);
    generators.set([]);
    generatorColors.set([]);
    generatorNames.set([]);
    frames.set([]);
    currentFrame.set(0);
    applied.set(new Set());
    if (newN === 5) ghostMode.set(false); // S₅ ghost edges would lock the browser
    isStable.set(false);
  }
</script>

<div class="group-selector">
  <label for="group-size">Symmetric group:</label>
  <select id="group-size" on:change={handleChange}>
    <option value="" disabled selected>–</option>
    {#each options as size}
      <option value={size}>S{sub(size)}</option>
    {/each}
  </select>
</div>

<style>
  .group-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
