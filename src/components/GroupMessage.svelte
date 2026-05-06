<script>
  // Displays the structural name of the generated group once generation is complete.
  // Hidden until the slider reaches the final frame.

  import { generationComplete, visibleNodes, generators } from '../stores.js';
  import { identifyGroup } from '../lib/groupId.js';

  // Computed lazily; only evaluated when generationComplete is true.
  $: groupName = $generationComplete
    ? identifyGroup($visibleNodes.filter(nd => nd.active), $generators)
    : '';
</script>

<div class="group-message" class:hidden={!$generationComplete}>
  You generated <strong>{groupName}</strong>
</div>

<style>
  .group-message {
    font-size: 1.15rem;
    padding: 0.5rem 0;
  }
  .group-message.hidden {
    visibility: hidden;
  }
</style>
