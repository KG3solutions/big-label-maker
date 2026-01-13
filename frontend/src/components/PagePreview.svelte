<script>
  import { onMount, afterUpdate } from 'svelte';
  import { labelStore, pageDimensions } from '../stores/labelStore.js';
  import { calculateAutoFitFontSize, inchesToPixels } from '../lib/autofit.js';
  import DraggableElement from './DraggableElement.svelte';

  export let printMode = false;

  // Screen DPI for preview (actual print uses CSS inches)
  const PREVIEW_DPI = 96;
  const PREVIEW_SCALE = 0.75; // Scale down for preview to fit on screen

  let containerEl;
  let calculatedFontSize = 72;

  $: pageWidth = inchesToPixels($pageDimensions.width, PREVIEW_DPI);
  $: pageHeight = inchesToPixels($pageDimensions.height, PREVIEW_DPI);
  $: printableWidth = inchesToPixels($pageDimensions.printableWidth, PREVIEW_DPI);
  $: printableHeight = inchesToPixels($pageDimensions.printableHeight, PREVIEW_DPI);
  $: marginTop = inchesToPixels($pageDimensions.margins.top, PREVIEW_DPI);
  $: marginLeft = inchesToPixels($pageDimensions.margins.left, PREVIEW_DPI);

  // Recalculate font size when relevant properties change
  $: if ($labelStore.autoFitEnabled && $labelStore.text && printableWidth > 0 && printableHeight > 0) {
    calculatedFontSize = calculateAutoFitFontSize(
      $labelStore.text,
      printableWidth,
      printableHeight,
      {
        fontFamily: $labelStore.fontFamily,
        fontWeight: $labelStore.fontWeight,
        fontStyle: $labelStore.fontStyle,
        lineHeight: 1.15,
        padding: 10
      }
    );
  }

  $: fontSize = $labelStore.autoFitEnabled ? calculatedFontSize : $labelStore.manualFontSize;

  $: textStyle = `
    font-family: ${$labelStore.fontFamily};
    font-size: ${fontSize}px;
    font-weight: ${$labelStore.fontWeight};
    font-style: ${$labelStore.fontStyle};
    color: ${$labelStore.textColor};
    text-align: ${$labelStore.textAlign};
  `;

  $: contentStyle = `
    justify-content: ${$labelStore.verticalAlign === 'top' ? 'flex-start' : $labelStore.verticalAlign === 'bottom' ? 'flex-end' : 'center'};
    align-items: ${$labelStore.textAlign === 'left' ? 'flex-start' : $labelStore.textAlign === 'right' ? 'flex-end' : 'center'};
  `;

  function handleLayerUpdate(id, updates) {
    labelStore.updateLayer(id, updates);
  }

  function handleTextClick(e) {
    if (printMode) return;
    e.stopPropagation();

    // Deselect any layers
    labelStore.deselectAll();

    // Focus the text input in the control panel and scroll it into view
    setTimeout(() => {
      const textInput = document.getElementById('labelText');
      if (textInput) {
        textInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        textInput.focus();
        textInput.select();
      }
    }, 50);
  }

  function handleBackgroundClick() {
    labelStore.deselectAll();
  }
</script>

<div
  class="page-preview"
  class:print-mode={printMode}
  style="--scale: {printMode ? 1 : PREVIEW_SCALE}; --page-width: {pageWidth}px; --page-height: {pageHeight}px; --scaled-width: {pageWidth * (printMode ? 1 : PREVIEW_SCALE)}px; --scaled-height: {pageHeight * (printMode ? 1 : PREVIEW_SCALE)}px;"
>
  <div
    class="page"
    bind:this={containerEl}
    on:click={handleBackgroundClick}
    on:keydown={(e) => e.key === 'Escape' && handleBackgroundClick()}
    role="presentation"
  >
    <!-- Margin guides (non-print) -->
    {#if !printMode && $labelStore.showGrid}
      <div
        class="margin-guide"
        style="
          top: {marginTop}px;
          left: {marginLeft}px;
          width: {printableWidth}px;
          height: {printableHeight}px;
        "
      />
    {/if}

    <!-- Printable area -->
    <div
      class="printable-area"
      style="
        top: {marginTop}px;
        left: {marginLeft}px;
        width: {printableWidth}px;
        height: {printableHeight}px;
        {contentStyle}
      "
    >
      <!-- Main text -->
      <div
        class="text-content"
        class:clickable={!printMode}
        style={textStyle}
        on:click={handleTextClick}
        on:keydown={(e) => e.key === 'Enter' && handleTextClick(e)}
        role={printMode ? 'presentation' : 'button'}
        tabindex={printMode ? -1 : 0}
      >
        {#each $labelStore.text.split('\n') as line}
          <div class="text-line">{line || '\u00A0'}</div>
        {/each}
      </div>
    </div>

    <!-- Decoration layers -->
    {#each $labelStore.layers as layer (layer.id)}
      <DraggableElement
        id={layer.id}
        x={layer.x}
        y={layer.y}
        scale={layer.scale}
        rotation={layer.rotation}
        selected={$labelStore.selectedLayerId === layer.id}
        containerWidth={pageWidth}
        containerHeight={pageHeight}
        on:update={(e) => handleLayerUpdate(layer.id, e.detail)}
        on:select={() => labelStore.selectLayer(layer.id)}
        on:delete={() => labelStore.removeLayer(layer.id)}
        {printMode}
      >
        {#if layer.type === 'emoji'}
          <span class="emoji-layer" style="font-size: {60 * layer.scale}px;">
            {layer.content}
          </span>
        {:else if layer.type === 'clipart'}
          <img
            src="/api/clipart/{layer.clipartId}/file"
            alt={layer.name}
            class="clipart-layer"
            style="width: {80 * layer.scale}px; height: auto;"
            draggable="false"
          />
        {:else if layer.type === 'iconify'}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 {layer.width} {layer.height}"
            class="iconify-layer"
            style="width: {80 * layer.scale}px; height: {80 * layer.scale}px;"
            fill="currentColor"
          >
            {@html layer.svgBody}
          </svg>
        {/if}
      </DraggableElement>
    {/each}
  </div>

  {#if !printMode}
    <div class="preview-info">
      {$pageDimensions.width}" × {$pageDimensions.height}"
      {#if $labelStore.autoFitEnabled}
        | Font: {calculatedFontSize}px (auto)
      {:else}
        | Font: {fontSize}px
      {/if}
    </div>
  {/if}
</div>

<style>
  .page-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .page-preview:not(.print-mode) {
    /* Container sized to fit the scaled page */
    width: var(--scaled-width);
    margin: 0 auto;
  }

  .page {
    width: var(--page-width);
    height: var(--page-height);
    background: white;
    box-shadow: var(--shadow-lg);
    position: relative;
    transform-origin: top left;
    transform: scale(var(--scale));
    overflow: hidden;
  }

  .print-mode .page {
    box-shadow: none;
    width: var(--page-width);
    height: var(--page-height);
  }

  .margin-guide {
    position: absolute;
    border: 1px dashed #ccc;
    pointer-events: none;
  }

  .printable-area {
    position: absolute;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .text-content {
    width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
    line-height: 1.15;
  }

  .text-content.clickable {
    cursor: pointer;
    border-radius: 4px;
    transition: outline 0.15s;
  }

  .text-content.clickable:hover {
    outline: 2px dashed rgba(37, 99, 235, 0.4);
    outline-offset: 8px;
  }

  .text-content.clickable:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 8px;
  }

  .text-line {
    width: 100%;
  }

  .emoji-layer {
    display: block;
    line-height: 1;
    user-select: none;
  }

  .clipart-layer {
    display: block;
    user-select: none;
    pointer-events: none;
  }

  .iconify-layer {
    display: block;
    user-select: none;
    pointer-events: none;
  }

  .preview-info {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  /* Print styles */
  @media print {
    .page-preview {
      margin: 0;
      padding: 0;
    }

    .page {
      width: 8.5in;
      height: 11in;
      margin: 0;
      padding: 0;
      box-shadow: none;
      transform: none;
    }

    .preview-info {
      display: none;
    }
  }
</style>
