<script>
  import { onMount } from 'svelte';
  import {
    searchIcons,
    getIconData,
    getIconUrl,
    getPopularCollections,
    getCollectionIcons,
    parseIconId
  } from '../lib/iconifyApi.js';

  let { onselect } = $props();

  let searchQuery = $state('');
  let selectedCollection = $state('');
  let collections = $state([]);
  let results = $state([]);
  let loading = $state(false);
  let error = $state(null);
  let totalResults = $state(0);
  let searchTimeout = $state(null);

  onMount(async () => {
    collections = await getPopularCollections();
  });

  // Debounced search
  function handleSearchInput() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch();
    }, 300);
  }

  async function performSearch() {
    if (!searchQuery.trim()) {
      results = [];
      totalResults = 0;
      return;
    }

    loading = true;
    error = null;

    try {
      const data = await searchIcons(searchQuery, {
        limit: 64,
        prefix: selectedCollection
      });

      results = data.icons;
      totalResults = data.total;
    } catch (err) {
      error = 'Search failed. Please try again.';
      results = [];
    } finally {
      loading = false;
    }
  }

  async function handleIconClick(iconId) {
    const { prefix, name } = parseIconId(iconId);

    // Fetch full icon data
    const iconData = await getIconData(prefix, name);
    if (!iconData) {
      alert('Failed to load icon');
      return;
    }

    // Dispatch event to add to label
    onselect?.({
      detail: {
        type: 'iconify',
        prefix,
        name,
        iconId,
        svgBody: iconData.body,
        width: iconData.width,
        height: iconData.height
      }
    });
  }

  async function handleCollectionChange() {
    if (searchQuery.trim()) {
      // If there's a search query, search within the collection
      performSearch();
    } else if (selectedCollection) {
      // No search query but collection selected - browse the collection
      await browseCollection();
    } else {
      // No collection selected and no search - clear results
      results = [];
      totalResults = 0;
    }
  }

  async function browseCollection() {
    if (!selectedCollection) return;

    loading = true;
    error = null;

    try {
      const data = await getCollectionIcons(selectedCollection, 64);
      results = data.icons;
      totalResults = data.total;
    } catch (err) {
      error = 'Failed to load collection. Please try again.';
      results = [];
    } finally {
      loading = false;
    }
  }
</script>

<div class="icon-search">
  <div class="search-controls">
    <input
      type="text"
      placeholder="Search 275,000+ icons..."
      bind:value={searchQuery}
      oninput={handleSearchInput}
      class="search-input"
    />

    <select
      bind:value={selectedCollection}
      onchange={handleCollectionChange}
      class="collection-select"
    >
      <option value="">All Collections</option>
      {#each collections as col}
        <option value={col.prefix}>
          {col.name} ({col.total.toLocaleString()})
        </option>
      {/each}
    </select>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if loading}
    <div class="loading-state">Searching...</div>
  {:else if results.length > 0}
    <div class="results-info">
      {totalResults.toLocaleString()} results
      {#if totalResults > results.length}
        (showing {results.length})
      {/if}
    </div>

    <div class="icon-grid">
      {#each results as iconId}
        {@const { prefix, name } = parseIconId(iconId)}
        <button
          class="icon-item"
          onclick={() => handleIconClick(iconId)}
          title="{prefix}:{name}"
        >
          <img
            src={getIconUrl(prefix, name, { color: '000000' })}
            alt={name}
            loading="lazy"
          />
          <span class="icon-name">{name}</span>
        </button>
      {/each}
    </div>
  {:else if searchQuery && !loading}
    <div class="empty-state">
      No icons found for "{searchQuery}"
    </div>
  {:else}
    <div class="empty-state">
      Search for icons or select a collection to browse.<br>
      Try: star, arrow, home, user, heart
    </div>
  {/if}

  <div class="attribution">
    Icons from <a href="https://iconify.design" target="_blank" rel="noopener">Iconify</a>
  </div>
</div>

<style>
  .icon-search {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    height: 100%;
  }

  .search-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .search-input {
    width: 100%;
  }

  .collection-select {
    width: 100%;
    font-size: 0.75rem;
  }

  .results-info {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    overflow-y: auto;
    flex: 1;
    align-content: start;
  }

  .icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.25rem;
    background: var(--color-bg);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.15s;
  }

  .icon-item:hover {
    background: var(--color-primary);
    color: white;
  }

  .icon-item:hover img {
    filter: brightness(0) invert(1);
  }

  .icon-item img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    background: white;
    border-radius: 4px;
    padding: 2px;
  }

  .icon-name {
    font-size: 0.5rem;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    color: var(--color-text-muted);
  }

  .icon-item:hover .icon-name {
    color: white;
  }

  .loading-state,
  .empty-state {
    text-align: center;
    color: var(--color-text-muted);
    padding: 2rem 1rem;
    font-size: 0.875rem;
  }

  .error-message {
    background: #fef2f2;
    color: var(--color-danger);
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
  }

  .attribution {
    font-size: 0.625rem;
    color: var(--color-text-muted);
    text-align: center;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border);
  }

  .attribution a {
    color: var(--color-primary);
    text-decoration: none;
  }

  .attribution a:hover {
    text-decoration: underline;
  }
</style>
