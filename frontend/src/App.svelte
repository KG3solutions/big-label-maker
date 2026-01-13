<script>
  import { onMount } from 'svelte';
  import ControlPanel from './components/ControlPanel.svelte';
  import PagePreview from './components/PagePreview.svelte';
  import ClipArtLibrary from './components/ClipArtLibrary.svelte';
  import { labelStore } from './stores/labelStore.js';

  let { embedMode = false } = $props();

  let showLibrary = $state(false);
  let darkMode = $state(false);
  let windowWidth = $state(0);
  let windowHeight = $state(0);

  let isMobile = $derived(windowWidth < 800 || embedMode);

  // Mobile swipe state - previewRatio is the fraction of available space for preview
  // 0.67 = 2/3 preview (default), 0.33 = 1/3 preview (swiped up)
  let previewRatio = $state(0.67);
  let isDragging = $state(false);
  let dragStartY = $state(0);
  let dragStartRatio = $state(0.67);

  // Calculate heights based on ratio (excluding header)
  let headerHeight = $state(80); // Will be measured
  let handleHeight = 40; // Approximate handle height
  let mainHeight = $derived(windowHeight - headerHeight);
  let previewHeight = $derived(isMobile ? Math.round(mainHeight * previewRatio) : 0);
  let sidebarHeight = $derived(isMobile ? mainHeight - previewHeight - handleHeight : 0);

  function handleDragStart(e) {
    if (!isMobile) return;
    isDragging = true;
    dragStartY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    dragStartRatio = previewRatio;
    document.body.style.userSelect = 'none';
  }

  function handleDragMove(e) {
    if (!isDragging || !isMobile) return;

    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartY;
    const deltaRatio = deltaY / mainHeight;

    // Swipe down = increase preview (positive delta = increase ratio)
    // Swipe up = decrease preview (negative delta = decrease ratio)
    let newRatio = dragStartRatio + deltaRatio;

    // Clamp between 0.33 (1/3) and 0.67 (2/3)
    newRatio = Math.max(0.33, Math.min(0.67, newRatio));
    previewRatio = newRatio;
  }

  function handleDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.userSelect = '';

    // Snap to nearest third (0.33 or 0.67)
    previewRatio = previewRatio < 0.5 ? 0.33 : 0.67;
  }

  onMount(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      darkMode = saved === 'true';
    } else {
      darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();

    // Set initial window width
    windowWidth = window.innerWidth;
  });

  function applyTheme() {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode.toString());
    applyTheme();
  }

  function handlePrint() {
    window.print();
  }

  function handleNew() {
    if (confirm('Create a new label? Unsaved changes will be lost.')) {
      labelStore.reset();
    }
  }

  async function handleSaveDesign() {
    const data = labelStore.getExportData();
    const name = prompt('Enter a name for this design:', 'My Label');
    if (!name) return;

    try {
      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          design_data: data
        })
      });

      if (!res.ok) throw new Error('Failed to save');
      alert('Design saved successfully!');
    } catch (error) {
      alert('Failed to save design: ' + error.message);
    }
  }

  async function handleLoadDesign() {
    try {
      const res = await fetch('/api/designs');
      if (!res.ok) throw new Error('Failed to load designs');

      const { data: designs } = await res.json();

      if (designs.length === 0) {
        alert('No saved designs found.');
        return;
      }

      const designList = designs.map((d, i) => `${i + 1}. ${d.name}`).join('\n');
      const choice = prompt(`Select a design (enter number):\n\n${designList}`);

      if (!choice) return;

      const idx = parseInt(choice) - 1;
      if (isNaN(idx) || idx < 0 || idx >= designs.length) {
        alert('Invalid selection');
        return;
      }

      const fullRes = await fetch(`/api/designs/${designs[idx].id}`);
      if (!fullRes.ok) throw new Error('Failed to load design');

      const design = await fullRes.json();
      labelStore.loadDesign(design.design_data);
    } catch (error) {
      alert('Failed to load design: ' + error.message);
    }
  }
</script>

<svelte:window
  bind:innerWidth={windowWidth}
  bind:innerHeight={windowHeight}
  onmousemove={handleDragMove}
  onmouseup={handleDragEnd}
  ontouchmove={handleDragMove}
  ontouchend={handleDragEnd}
/>

<div class="app no-print" class:embed-mode={embedMode} class:mobile-mode={isMobile}>
  <header class="header" bind:clientHeight={headerHeight}>
    <div class="logo">
      <h1>Big Label Maker</h1>
    </div>
    <nav class="toolbar">
      <button class="btn-secondary" onclick={handleNew}>
        New
      </button>
      <button class="btn-secondary" onclick={handleLoadDesign}>
        Load
      </button>
      <button class="btn-secondary" onclick={handleSaveDesign}>
        Save
      </button>
      <div class="toolbar-divider"></div>
      <button
        class="btn-secondary"
        class:active={showLibrary}
        onclick={() => showLibrary = !showLibrary}
      >
        Clip Art Library
      </button>
      <div class="toolbar-divider"></div>
      <button
        class="btn-icon theme-toggle"
        onclick={toggleDarkMode}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {#if darkMode}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        {:else}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        {/if}
      </button>
      <div class="toolbar-divider"></div>
      <button class="btn-primary" onclick={handlePrint}>
        Print
      </button>
    </nav>
  </header>

  <main class="main">
    {#if isMobile}
      <!-- Mobile layout with swipeable divider -->
      <section
        class="preview-area"
        style="height: {previewHeight}px; flex: none;"
      >
        <PagePreview mobileMode={true} />
      </section>

      <!-- Drag handle -->
      <div
        class="swipe-handle"
        class:dragging={isDragging}
        onmousedown={handleDragStart}
        ontouchstart={handleDragStart}
        role="separator"
        aria-valuenow={Math.round(previewRatio * 100)}
        aria-valuemin="33"
        aria-valuemax="67"
      >
        <div class="handle-bar"></div>
        <span class="handle-hint">
          {previewRatio > 0.5 ? '↑ Swipe up for more options' : '↓ Swipe down for larger preview'}
        </span>
      </div>

      <aside class="sidebar" style="height: {sidebarHeight}px; overflow-y: auto;">
        <ControlPanel />
      </aside>
    {:else}
      <!-- Desktop layout -->
      <aside class="sidebar">
        <ControlPanel />
      </aside>

      <section class="preview-area">
        <PagePreview mobileMode={false} />
      </section>
    {/if}

    {#if showLibrary}
      <aside class="library-panel">
        <ClipArtLibrary onclose={() => showLibrary = false} />
      </aside>
    {/if}
  </main>
</div>

<!-- Print-only view -->
<div class="print-only">
  <PagePreview printMode={true} />
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-bg);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    gap: 1rem;
    flex-wrap: wrap;
  }

  .logo h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: var(--color-border);
    margin: 0 0.25rem;
  }

  .toolbar button.active {
    background: var(--color-primary);
    color: white;
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
  }

  .theme-toggle:hover {
    background: var(--color-border);
  }

  .main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .sidebar {
    width: 320px;
    min-width: 320px;
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
  }

  .preview-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    overflow: auto;
    background: var(--color-preview-bg);
  }

  .library-panel {
    width: 320px;
    min-width: 320px;
    background: var(--color-surface);
    border-left: 1px solid var(--color-border);
    overflow-y: auto;
  }

  .print-only {
    display: none;
  }

  @media print {
    .no-print {
      display: none !important;
    }

    .print-only {
      display: block !important;
    }
  }

  /* Mobile mode - vertical stacked layout (applies to both mobile and embed) */
  .app.mobile-mode .header {
    flex-direction: column;
    align-items: stretch;
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .app.mobile-mode .logo {
    text-align: center;
  }

  .app.mobile-mode .logo h1 {
    font-size: 1rem;
  }

  .app.mobile-mode .toolbar {
    justify-content: center;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .app.mobile-mode .toolbar-divider {
    display: none;
  }

  .app.mobile-mode .toolbar button {
    padding: 0.4rem 0.6rem;
    font-size: 0.75rem;
  }

  .app.mobile-mode .main {
    flex-direction: column;
    overflow: hidden;
  }

  .app.mobile-mode .sidebar {
    width: 100%;
    min-width: unset;
    border-right: none;
    border-top: none;
  }

  .app.mobile-mode .preview-area {
    flex: none;
    padding: 0.5rem;
    min-height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .app.mobile-mode .library-panel {
    width: 100%;
    min-width: unset;
    border-left: none;
    border-top: 1px solid var(--color-border);
    max-height: 300px;
  }

  /* Swipe handle styles */
  .swipe-handle {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
    cursor: ns-resize;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    transition: background 0.15s ease;
  }

  .swipe-handle:hover,
  .swipe-handle.dragging {
    background: var(--color-border);
  }

  .swipe-handle.dragging {
    cursor: grabbing;
  }

  .handle-bar {
    width: 40px;
    height: 4px;
    background: var(--color-text-muted);
    border-radius: 2px;
    opacity: 0.5;
  }

  .swipe-handle:hover .handle-bar,
  .swipe-handle.dragging .handle-bar {
    opacity: 0.8;
  }

  .handle-hint {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
    opacity: 0.7;
  }

  /* Extra narrow screens */
  @media (max-width: 500px) {
    .app.mobile-mode .logo h1 {
      font-size: 0.875rem;
    }

    .app.mobile-mode .toolbar button {
      padding: 0.3rem 0.5rem;
      font-size: 0.65rem;
    }

    .app.mobile-mode .theme-toggle {
      width: 28px;
      height: 28px;
    }

    .app.mobile-mode .theme-toggle svg {
      width: 16px;
      height: 16px;
    }
  }
</style>
