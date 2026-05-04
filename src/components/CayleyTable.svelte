<script>
  // Multiplication table for the generated subgroup.
  // Rows and columns are ordered by BFS discovery (insertion order into allNodes).
  // Cells show the product of the row element composed with the column element,
  // labeled in the same mode as the graph nodes (word or cycle notation).
  // Cells whose product is not yet in the visible node set are left blank.
  // Toggled visible/invisible via $cayleyVisible.

  import { visibleNodes, cayleyVisible } from '../stores.js';
  import { compose, toKey } from '../lib/permutations.js';

  // Active nodes in BFS discovery order. One row and one column per node.
  $: orderedNodes = $visibleNodes.filter(nd => nd.active);

  // O(1) lookup map from node id → node object (with label).
  // Rebuilt whenever visibleNodes changes (which already includes useNames reactivity).
  $: nodeMap = new Map($visibleNodes.map(nd => [nd.id, nd]));

  // Returns the label for the product of node a × node b (i.e. a.perm ∘ b.perm).
  // Returns '' if the product node is not yet visible.
  // @param {object} a  - node object
  // @param {object} b  - node object
  // @returns {string}
  function cellLabel(a, b) {
    const productNode = nodeMap.get(toKey(compose(a.perm, b.perm)));
    return productNode ? productNode.label : '';
  }
</script>

{#if $cayleyVisible && orderedNodes.length > 0}
  <div class="cayley-table-wrapper">
    <h3>Cayley Table</h3>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th></th>
            {#each orderedNodes as col}
              <th>{col.label}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each orderedNodes as row}
            <tr>
              <th>{row.label}</th>
              {#each orderedNodes as col}
                <td>{cellLabel(row, col)}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}

<style>
  .cayley-table-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow: hidden;
  }
  .table-scroll {
    overflow: auto;
    max-height: 100%;
  }
  table {
    border-collapse: collapse;
    font-size: 0.8rem;
  }
  th, td {
    border: 1px solid #555;
    padding: 0.2rem 0.4rem;
    text-align: center;
    white-space: nowrap;
  }
  thead th {
    position: sticky;
    top: 0;
    background-color: #242424;
    box-shadow: 0 1px 0 #555;
  }
  thead th:first-child {
    left: 0;
    z-index: 1;
    box-shadow: 1px 1px 0 #555;
  }
  tbody th {
    position: sticky;
    left: 0;
    background-color: #242424;
    box-shadow: 1px 0 0 #555;
  }
  @media (prefers-color-scheme: light) {
    thead th, tbody th { background-color: #ffffff; }
  }
  :global(html[data-theme="light"]) thead th,
  :global(html[data-theme="light"]) tbody th { background-color: #ffffff; }
  :global(html[data-theme="dark"])  thead th,
  :global(html[data-theme="dark"])  tbody th { background-color: #242424; }
</style>
