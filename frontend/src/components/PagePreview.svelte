<script>
  import { labelStore, pageDimensions } from '../stores/labelStore.js';
  import { calculateAutoFitFontSize, inchesToPixels } from '../lib/autofit.js';
  import DraggableElement from './DraggableElement.svelte';

  let { printMode = false, mobileMode = false } = $props();

  // Screen DPI for preview (actual print uses CSS inches)
  const PREVIEW_DPI = 96;

  let containerEl = $state(null);
  let calculatedFontSize = $state(72);

  // Dynamic scale based on mode
  let previewScale = $derived(mobileMode ? 0.4 : 0.75);

  let pageWidth = $derived(inchesToPixels($pageDimensions.width, PREVIEW_DPI));
  let pageHeight = $derived(inchesToPixels($pageDimensions.height, PREVIEW_DPI));
  let printableWidth = $derived(inchesToPixels($pageDimensions.printableWidth, PREVIEW_DPI));
  let printableHeight = $derived(inchesToPixels($pageDimensions.printableHeight, PREVIEW_DPI));
  let marginTop = $derived(inchesToPixels($pageDimensions.margins.top, PREVIEW_DPI));
  let marginLeft = $derived(inchesToPixels($pageDimensions.margins.left, PREVIEW_DPI));

  // Recalculate font size when relevant properties change
  $effect(() => {
    if ($labelStore.autoFitEnabled && $labelStore.text && printableWidth > 0 && printableHeight > 0) {
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
  });

  let fontSize = $derived($labelStore.autoFitEnabled ? calculatedFontSize : $labelStore.manualFontSize);

  let textStyle = $derived(`
    font-family: ${$labelStore.fontFamily};
    font-size: ${fontSize}px;
    font-weight: ${$labelStore.fontWeight};
    font-style: ${$labelStore.fontStyle};
    color: ${$labelStore.textColor};
    text-align: ${$labelStore.textAlign};
  `);

  // Text position in pixels
  let textPixelX = $derived(($labelStore.textX / 100) * pageWidth);
  let textPixelY = $derived(($labelStore.textY / 100) * pageHeight);

  // Check if text is selected (using special id 'text')
  let textSelected = $derived($labelStore.selectedLayerId === 'text');

  function handleLayerUpdate(id, updates) {
    labelStore.updateLayer(id, updates);
  }

  function handleTextUpdate(e) {
    const { x, y } = e.detail;
    labelStore.setTextPosition(x, y);
  }

  function handleTextSelect() {
    labelStore.selectLayer('text');
  }

  function handleTextDoubleClick() {
    // Focus the text input in the control panel
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
  style="--scale: {printMode ? 1 : previewScale}; --page-width: {pageWidth}px; --page-height: {pageHeight}px; --scaled-width: {pageWidth * (printMode ? 1 : previewScale)}px; --scaled-height: {pageHeight * (printMode ? 1 : previewScale)}px;"
>
  <div class="page-wrapper">
    <div
      class="page"
      bind:this={containerEl}
      onclick={handleBackgroundClick}
      onkeydown={(e) => e.key === 'Escape' && handleBackgroundClick()}
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
      ></div>
    {/if}

    <!-- Main text (draggable) -->
    <DraggableElement
      id="text"
      x={$labelStore.textX}
      y={$labelStore.textY}
      scale={1}
      rotation={0}
      selected={textSelected}
      containerWidth={pageWidth}
      containerHeight={pageHeight}
      onupdate={handleTextUpdate}
      onselect={handleTextSelect}
      ondblclick={handleTextDoubleClick}
      {printMode}
    >
      <div
        class="text-content"
        style={textStyle}
        ondblclick={handleTextDoubleClick}
      >
        {#each $labelStore.text.split('\n') as line}
          <div class="text-line">{line || '\u00A0'}</div>
        {/each}
      </div>
    </DraggableElement>

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
        onupdate={(e) => handleLayerUpdate(layer.id, e.detail)}
        onselect={() => labelStore.selectLayer(layer.id)}
        ondelete={() => labelStore.removeLayer(layer.id)}
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
    gap: 0.5rem;
    width: 100%;
  }

  .page-wrapper {
    width: var(--scaled-width);
    height: var(--scaled-height);
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .page {
    width: var(--page-width);
    height: var(--page-height);
    background: white;
    box-shadow: var(--shadow-lg);
    position: relative;
    transform-origin: top center;
    transform: scale(var(--scale));
    overflow: hidden;
    flex-shrink: 0;
  }

  .print-mode .page-wrapper {
    width: auto;
    height: auto;
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

  .text-content {
    word-wrap: break-word;
    overflow-wrap: break-word;
    line-height: 1.15;
    white-space: nowrap;
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
