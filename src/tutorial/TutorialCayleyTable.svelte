<script>
  import { tableHighlight } from './animState.js';
  import { compose } from '../lib/permutations.js';

  const ELEMENTS = [
    { key: '0,1,2', label: 'e'   },
    { key: '2,0,1', label: 'r'   },
    { key: '1,2,0', label: 'r²'  },
    { key: '0,2,1', label: 'f'   },
    { key: '1,0,2', label: 'rf'  },
    { key: '2,1,0', label: 'r²f' },
  ];

  const PERMS = {
    '0,1,2': [0,1,2],
    '2,0,1': [2,0,1],
    '1,2,0': [1,2,0],
    '0,2,1': [0,2,1],
    '1,0,2': [1,0,2],
    '2,1,0': [2,1,0],
  };

  // TABLE[rowKey][colKey] = resultKey
  // Convention: cell(row, col) = compose(col, row) (col acts on row's element)
  const TABLE = {};
  for (const row of ELEMENTS) {
    TABLE[row.key] = {};
    for (const col of ELEMENTS) {
      const result = compose(PERMS[col.key], PERMS[row.key]);
      TABLE[row.key][col.key] = result.join(',');
    }
  }

  function keyToLabel(key) {
    return ELEMENTS.find(e => e.key === key)?.label ?? key;
  }
</script>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th></th>
        {#each ELEMENTS as col}
          <th class:col-hl={$tableHighlight.col === col.key}>{col.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each ELEMENTS as row}
        <tr>
          <td class="row-label" class:row-hl={$tableHighlight.row === row.key}>{row.label}</td>
          {#each ELEMENTS as col}
            <td class:cell-hl={$tableHighlight.row === row.key && $tableHighlight.col === col.key}>
              {keyToLabel(TABLE[row.key][col.key])}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  div {
    animation: fadeIn 0.45s ease 0.1s both;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: none; }
  }

  table {
    border-collapse: collapse;
    font-size: 0.9rem;
    width: 100%;
  }

  th, td {
    border: 1px solid rgba(255,255,255,0.12);
    padding: 0.5rem 0.6rem;
    text-align: center;
    min-width: 2.8rem;
    color: rgba(255,255,255,0.75);
    transition: background 0.25s, color 0.25s;
  }

  th {
    background: rgba(255,255,255,0.06);
    font-weight: 600;
    color: rgba(255,255,255,0.9);
  }

  td.row-label {
    font-weight: 600;
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.9);
  }

  .row-hl { background: rgba(78,121,167,0.35) !important; color: #a8c8ef !important; }
  .col-hl { background: rgba(225,87,89,0.35)  !important; color: #f5a0a1 !important; }
  .cell-hl {
    background: rgba(255,255,255,0.9) !important;
    color: #111 !important;
    font-weight: 700;
  }
</style>
