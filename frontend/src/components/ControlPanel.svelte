<script>
  import { labelStore, PAGE_SIZES } from '../stores/labelStore.js';
  import EmojiPicker from './EmojiPicker.svelte';

  let showEmojiPicker = false;

  const fontFamilies = [
    'Arial',
    'Arial Black',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Impact',
    'Comic Sans MS',
    'Trebuchet MS'
  ];

  function handleTextChange(e) {
    labelStore.setText(e.target.value);
  }

  function handleAddEmoji(e) {
    const { emoji } = e.detail;
    labelStore.addLayer({
      type: 'emoji',
      content: emoji,
      x: 50,
      y: 50,
      scale: 1
    });
    showEmojiPicker = false;
  }
</script>

<div class="control-panel">
  <section class="section">
    <h2>Page Setup</h2>

    <div class="field">
      <label for="pageSize">Page Size</label>
      <select
        id="pageSize"
        value={$labelStore.pageSize}
        on:change={(e) => labelStore.setPageSize(e.target.value)}
      >
        {#each Object.entries(PAGE_SIZES) as [key, size]}
          <option value={key}>{size.name} ({size.width}" × {size.height}")</option>
        {/each}
      </select>
    </div>

    <div class="field">
      <label>Orientation</label>
      <div class="button-group">
        <button
          class:active={$labelStore.orientation === 'portrait'}
          on:click={() => labelStore.setOrientation('portrait')}
        >
          Portrait
        </button>
        <button
          class:active={$labelStore.orientation === 'landscape'}
          on:click={() => labelStore.setOrientation('landscape')}
        >
          Landscape
        </button>
      </div>
    </div>

    <div class="field">
      <label>Margins (inches)</label>
      <div class="margin-grid">
        <div></div>
        <input
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={$labelStore.margins.top}
          on:change={(e) => labelStore.setMargins({ top: parseFloat(e.target.value) })}
          placeholder="Top"
        />
        <div></div>
        <input
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={$labelStore.margins.left}
          on:change={(e) => labelStore.setMargins({ left: parseFloat(e.target.value) })}
          placeholder="Left"
        />
        <div class="margin-center">
          <span>Printable</span>
        </div>
        <input
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={$labelStore.margins.right}
          on:change={(e) => labelStore.setMargins({ right: parseFloat(e.target.value) })}
          placeholder="Right"
        />
        <div></div>
        <input
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={$labelStore.margins.bottom}
          on:change={(e) => labelStore.setMargins({ bottom: parseFloat(e.target.value) })}
          placeholder="Bottom"
        />
        <div></div>
      </div>
    </div>
  </section>

  <section class="section">
    <h2>Text</h2>

    <div class="field">
      <label for="labelText">Label Text</label>
      <textarea
        id="labelText"
        rows="3"
        value={$labelStore.text}
        on:input={handleTextChange}
        placeholder="Enter your label text..."
      />
    </div>

    <div class="field">
      <label for="fontFamily">Font</label>
      <select
        id="fontFamily"
        value={$labelStore.fontFamily}
        on:change={(e) => labelStore.setFontFamily(e.target.value)}
      >
        {#each fontFamilies as font}
          <option value={font} style="font-family: {font}">{font}</option>
        {/each}
      </select>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Style</label>
        <div class="button-group small">
          <button
            class:active={$labelStore.fontWeight === 'bold'}
            on:click={() => labelStore.setFontWeight($labelStore.fontWeight === 'bold' ? 'normal' : 'bold')}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            class:active={$labelStore.fontStyle === 'italic'}
            on:click={() => labelStore.setFontStyle($labelStore.fontStyle === 'italic' ? 'normal' : 'italic')}
            title="Italic"
          >
            <em>I</em>
          </button>
        </div>
      </div>

      <div class="field">
        <label for="textColor">Color</label>
        <input
          type="color"
          id="textColor"
          value={$labelStore.textColor}
          on:change={(e) => labelStore.setTextColor(e.target.value)}
        />
      </div>
    </div>

    <div class="field">
      <label>Text Align</label>
      <div class="button-group">
        <button
          class:active={$labelStore.textAlign === 'left'}
          on:click={() => labelStore.setTextAlign('left')}
        >Left</button>
        <button
          class:active={$labelStore.textAlign === 'center'}
          on:click={() => labelStore.setTextAlign('center')}
        >Center</button>
        <button
          class:active={$labelStore.textAlign === 'right'}
          on:click={() => labelStore.setTextAlign('right')}
        >Right</button>
      </div>
    </div>

    <div class="field">
      <button class="btn-secondary full-width" on:click={() => labelStore.centerText()}>
        Center Text on Page
      </button>
      <p class="hint">Drag the text on the preview to reposition it</p>
    </div>

    <div class="field">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={$labelStore.autoFitEnabled}
          on:change={(e) => labelStore.setAutoFit(e.target.checked)}
        />
        Auto-fit text to page
      </label>
    </div>

    {#if !$labelStore.autoFitEnabled}
      <div class="field">
        <label for="fontSize">Manual Font Size (px)</label>
        <input
          type="number"
          id="fontSize"
          min="12"
          max="800"
          value={$labelStore.manualFontSize}
          on:change={(e) => labelStore.setManualFontSize(parseInt(e.target.value))}
        />
      </div>
    {/if}
  </section>

  <section class="section">
    <h2>Decorations</h2>

    <div class="field">
      <button class="btn-secondary full-width" on:click={() => showEmojiPicker = !showEmojiPicker}>
        Add Emoji
      </button>
    </div>

    {#if showEmojiPicker}
      <EmojiPicker on:select={handleAddEmoji} on:close={() => showEmojiPicker = false} />
    {/if}

    {#if $labelStore.layers.length > 0}
      <div class="layers-list">
        <h3>Layers</h3>
        {#each $labelStore.layers as layer (layer.id)}
          <div
            class="layer-item"
            class:selected={$labelStore.selectedLayerId === layer.id}
            on:click={() => labelStore.selectLayer(layer.id)}
            on:keydown={(e) => e.key === 'Enter' && labelStore.selectLayer(layer.id)}
            role="button"
            tabindex="0"
          >
            <span class="layer-preview">
              {#if layer.type === 'emoji'}
                {layer.content}
              {:else if layer.type === 'clipart'}
                <img src="/api/clipart/{layer.clipartId}/file" alt={layer.name} />
              {:else if layer.type === 'iconify'}
                <img
                  src="https://api.iconify.design/{layer.prefix}/{layer.name}.svg"
                  alt={layer.name}
                />
              {/if}
            </span>
            <span class="layer-name">
              {#if layer.type === 'emoji'}
                Emoji
              {:else if layer.type === 'iconify'}
                {layer.name}
              {:else}
                {layer.name}
              {/if}
            </span>
            <button
              class="btn-icon"
              on:click|stopPropagation={() => labelStore.removeLayer(layer.id)}
              title="Remove"
            >
              x
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .control-panel {
    padding: 1rem;
  }

  .section {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  h2 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  h3 {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
  }

  .field {
    margin-bottom: 0.75rem;
  }

  .field:last-child {
    margin-bottom: 0;
  }

  .field-row {
    display: flex;
    gap: 0.75rem;
  }

  .field-row .field {
    flex: 1;
  }

  select, input[type="number"], textarea {
    width: 100%;
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }

  input[type="color"] {
    width: 100%;
    height: 36px;
    padding: 2px;
    cursor: pointer;
  }

  .button-group {
    display: flex;
    gap: 2px;
    background: var(--color-border);
    padding: 2px;
    border-radius: var(--radius-sm);
  }

  .button-group button {
    flex: 1;
    background: transparent;
    border-radius: 2px;
    padding: 0.4rem 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .button-group button:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  .button-group button.active {
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: var(--shadow-sm);
  }

  .button-group.small button {
    flex: 0;
    padding: 0.4rem 0.75rem;
  }

  .margin-grid {
    display: grid;
    grid-template-columns: 1fr 60px 1fr;
    gap: 4px;
  }

  .margin-grid input {
    width: 100%;
    text-align: center;
    padding: 0.35rem;
    font-size: 0.75rem;
  }

  .margin-center {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.625rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-sm);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text);
    cursor: pointer;
    text-transform: none;
    letter-spacing: normal;
  }

  .checkbox-label input {
    width: auto;
  }

  .full-width {
    width: 100%;
  }

  .hint {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    margin-top: 0.35rem;
    text-align: center;
  }

  .layers-list {
    margin-top: 1rem;
  }

  .layer-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--color-bg);
    border-radius: var(--radius-sm);
    margin-bottom: 0.25rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .layer-item:hover {
    background: var(--color-border);
  }

  .layer-item.selected {
    background: var(--color-primary);
    color: white;
  }

  .layer-item.selected .layer-name {
    color: white;
  }

  .layer-preview {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
  }

  .layer-preview img,
  .layer-preview svg {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .layer-name {
    flex: 1;
    font-size: 0.75rem;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Mobile/Embed mode - more compact layout */
  :global(.app.mobile-mode) .control-panel {
    padding: 0.75rem;
  }

  :global(.app.mobile-mode) .section {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
  }

  :global(.app.mobile-mode) h2 {
    font-size: 0.75rem;
    margin-bottom: 0.75rem;
  }

  :global(.app.mobile-mode) .field {
    margin-bottom: 0.5rem;
  }

  :global(.app.mobile-mode) textarea {
    min-height: 50px;
  }

  :global(.app.mobile-mode) .margin-grid {
    grid-template-columns: 1fr 50px 1fr;
  }
</style>
