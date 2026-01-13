<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { clipartStore } from '../stores/clipartStore.js';
  import { labelStore } from '../stores/labelStore.js';
  import FileUploader from './FileUploader.svelte';
  import IconSearch from './IconSearch.svelte';

  const dispatch = createEventDispatcher();

  let activeTab = 'icons'; // 'icons' or 'my-clipart'
  let searchQuery = '';
  let showUploader = false;

  onMount(() => {
    clipartStore.fetch();
  });

  function handleSearch() {
    clipartStore.fetch(searchQuery);
  }

  function addToLabel(clipart) {
    labelStore.addLayer({
      type: 'clipart',
      clipartId: clipart.id,
      name: clipart.name,
      x: 50,
      y: 50,
      scale: 1
    });
  }

  function handleIconSelect(e) {
    const { prefix, name, svgBody, width, height } = e.detail;
    labelStore.addLayer({
      type: 'iconify',
      prefix,
      name,
      svgBody,
      width,
      height,
      x: 50,
      y: 50,
      scale: 1
    });
  }

  async function handleDelete(clipart) {
    if (!confirm(`Delete "${clipart.name}"?`)) return;

    try {
      await clipartStore.delete(clipart.id);
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  }

  function handleUploadComplete() {
    showUploader = false;
    clipartStore.fetch(searchQuery);
  }

  function close() {
    dispatch('close');
  }
</script>

<div class="clipart-library">
  <div class="library-header">
    <h2>Clip Art</h2>
    <button class="close-btn" on:click={close}>×</button>
  </div>

  <!-- Tab Navigation -->
  <div class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'icons'}
      on:click={() => activeTab = 'icons'}
    >
      Icon Search
    </button>
    <button
      class="tab"
      class:active={activeTab === 'my-clipart'}
      on:click={() => activeTab = 'my-clipart'}
    >
      My Uploads
    </button>
  </div>

  <!-- Tab Content -->
  <div class="tab-content">
    {#if activeTab === 'icons'}
      <IconSearch on:select={handleIconSelect} />
    {:else}
      <!-- My Clipart Tab -->
      <div class="my-clipart">
        <div class="search-bar">
          <input
            type="text"
            placeholder="Search my clip art..."
            bind:value={searchQuery}
            on:keydown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button class="btn-secondary" on:click={handleSearch}>Search</button>
        </div>

        <div class="upload-section">
          <button
            class="btn-primary full-width"
            on:click={() => showUploader = !showUploader}
          >
            {showUploader ? 'Cancel Upload' : 'Upload New Clip Art'}
          </button>

          {#if showUploader}
            <FileUploader on:complete={handleUploadComplete} />
          {/if}
        </div>

        {#if $clipartStore.error}
          <div class="error-message">
            {$clipartStore.error}
            <button on:click={() => clipartStore.clearError()}>Dismiss</button>
          </div>
        {/if}

        <div class="clipart-grid">
          {#if $clipartStore.loading}
            <div class="loading">Loading...</div>
          {:else if $clipartStore.items.length === 0}
            <div class="empty-state">
              No clip art found.
              {#if searchQuery}
                Try a different search term.
              {:else}
                Upload some to get started!
              {/if}
            </div>
          {:else}
            {#each $clipartStore.items as clipart (clipart.id)}
              <div class="clipart-item">
                <div class="clipart-preview">
                  <img
                    src={clipartStore.getFileUrl(clipart.id)}
                    alt={clipart.name}
                    loading="lazy"
                  />
                </div>
                <div class="clipart-info">
                  <span class="clipart-name" title={clipart.name}>{clipart.name}</span>
                  <div class="clipart-actions">
                    <button
                      class="btn-primary small"
                      on:click={() => addToLabel(clipart)}
                      title="Add to label"
                    >
                      +
                    </button>
                    <button
                      class="btn-danger small"
                      on:click={() => handleDelete(clipart)}
                      title="Delete"
                    >
                      x
                    </button>
                  </div>
                </div>
                {#if clipart.tags}
                  <div class="clipart-tags">
                    {#each clipart.tags.split(',').slice(0, 3) as tag}
                      <span class="tag">{tag.trim()}</span>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>

        {#if $clipartStore.pagination.total > $clipartStore.items.length}
          <div class="pagination-info">
            Showing {$clipartStore.items.length} of {$clipartStore.pagination.total}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .clipart-library {
    padding: 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .library-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  h2 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    background: transparent;
    color: var(--color-text-muted);
  }

  .close-btn:hover {
    background: var(--color-border);
    color: var(--color-text);
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 2px;
    background: var(--color-border);
    padding: 2px;
    border-radius: var(--radius-sm);
    margin-bottom: 1rem;
  }

  .tab {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 2px;
    transition: all 0.15s;
  }

  .tab:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  .tab.active {
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: var(--shadow-sm);
  }

  .tab-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .my-clipart {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .search-bar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .search-bar input {
    flex: 1;
  }

  .upload-section {
    margin-bottom: 0.75rem;
  }

  .full-width {
    width: 100%;
  }

  .error-message {
    background: #fef2f2;
    color: var(--color-danger);
    padding: 0.75rem;
    border-radius: var(--radius-sm);
    margin-bottom: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }

  .error-message button {
    background: transparent;
    color: var(--color-danger);
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .clipart-grid {
    flex: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    align-content: start;
  }

  .clipart-item {
    background: var(--color-bg);
    border-radius: var(--radius-md);
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .clipart-preview {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .clipart-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .clipart-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .clipart-name {
    font-size: 0.75rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .clipart-actions {
    display: flex;
    gap: 0.25rem;
  }

  .clipart-actions button.small {
    width: 24px;
    height: 24px;
    padding: 0;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .clipart-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .tag {
    font-size: 0.625rem;
    background: var(--color-border);
    color: var(--color-text-muted);
    padding: 0.125rem 0.375rem;
    border-radius: 9999px;
  }

  .loading, .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    color: var(--color-text-muted);
    padding: 2rem;
    font-size: 0.875rem;
  }

  .pagination-info {
    text-align: center;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
    margin-top: 0.75rem;
  }
</style>
