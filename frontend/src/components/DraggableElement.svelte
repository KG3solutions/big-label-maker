<script>
  let {
    id,
    x = 50,
    y = 50,
    scale = 1,
    rotation = 0,
    selected = false,
    containerWidth = 100,
    containerHeight = 100,
    printMode = false,
    baseSize = 80,
    onupdate,
    onselect,
    ondelete,
    ondblclick,
    children
  } = $props();

  let element = $state(null);
  let isDragging = $state(false);
  let isResizing = $state(false);
  let resizeHandle = $state(null);
  let startX = $state(0);
  let startY = $state(0);
  let startPosX = $state(0);
  let startPosY = $state(0);
  let startScale = $state(1);
  let startElementX = $state(0);
  let startElementY = $state(0);

  let pixelX = $derived((x / 100) * containerWidth);
  let pixelY = $derived((y / 100) * containerHeight);
  let currentSize = $derived(baseSize * scale);

  function getPageScale() {
    const transform = element?.closest('.page')?.style.transform;
    const match = transform?.match(/scale\(([\d.]+)\)/);
    return match ? parseFloat(match[1]) : 1;
  }

  function handleClick(e) {
    if (printMode) return;
    e.stopPropagation();
    onselect?.();
  }

  function handleMouseDown(e) {
    if (printMode) return;

    // Don't start drag if clicking on a resize handle
    if (e.target.classList.contains('handle')) return;

    e.stopPropagation();
    onselect?.();

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startPosX = pixelX;
    startPosY = pixelY;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e) {
    if (!isDragging) return;

    const pageScale = getPageScale();
    const dx = (e.clientX - startX) / pageScale;
    const dy = (e.clientY - startY) / pageScale;

    const newPixelX = Math.max(0, Math.min(containerWidth, startPosX + dx));
    const newPixelY = Math.max(0, Math.min(containerHeight, startPosY + dy));

    const newX = (newPixelX / containerWidth) * 100;
    const newY = (newPixelY / containerHeight) * 100;

    onupdate?.({ detail: { x: newX, y: newY } });
  }

  function handleMouseUp() {
    isDragging = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  function handleResizeStart(e, handle) {
    if (printMode) return;

    e.stopPropagation();
    e.preventDefault();

    isResizing = true;
    resizeHandle = handle;
    startX = e.clientX;
    startY = e.clientY;
    startScale = scale;
    startElementX = pixelX;
    startElementY = pixelY;

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  }

  function handleResizeMove(e) {
    if (!isResizing) return;

    const pageScale = getPageScale();
    const dx = (e.clientX - startX) / pageScale;
    const dy = (e.clientY - startY) / pageScale;

    // Calculate scale change based on handle position
    // Scale from opposite corner
    let delta;
    let posAdjustX = 0;
    let posAdjustY = 0;
    const startSize = baseSize * startScale;

    if (resizeHandle === 'se') {
      // Dragging SE corner - anchor at NW (top-left)
      delta = Math.max(dx, dy);
    } else if (resizeHandle === 'nw') {
      // Dragging NW corner - anchor at SE (bottom-right)
      delta = -Math.max(dx, dy);
      // Move position to keep bottom-right fixed
      posAdjustX = -delta / 2;
      posAdjustY = -delta / 2;
    } else if (resizeHandle === 'ne') {
      // Dragging NE corner - anchor at SW (bottom-left)
      delta = Math.max(dx, -dy);
      posAdjustY = -delta / 2;
    } else if (resizeHandle === 'sw') {
      // Dragging SW corner - anchor at NE (top-right)
      delta = Math.max(-dx, dy);
      posAdjustX = -delta / 2;
    }

    // Scale factor: drag distance affects scale
    const scaleDelta = delta / baseSize;
    const newScale = Math.max(0.2, Math.min(5, startScale + scaleDelta));

    // Calculate position adjustment to anchor opposite corner
    const sizeDiff = (newScale - startScale) * baseSize;
    let newX = x;
    let newY = y;

    if (resizeHandle === 'nw') {
      newX = ((startElementX - sizeDiff / 2) / containerWidth) * 100;
      newY = ((startElementY - sizeDiff / 2) / containerHeight) * 100;
    } else if (resizeHandle === 'ne') {
      newX = ((startElementX + sizeDiff / 2) / containerWidth) * 100;
      newY = ((startElementY - sizeDiff / 2) / containerHeight) * 100;
    } else if (resizeHandle === 'sw') {
      newX = ((startElementX - sizeDiff / 2) / containerWidth) * 100;
      newY = ((startElementY + sizeDiff / 2) / containerHeight) * 100;
    } else if (resizeHandle === 'se') {
      newX = ((startElementX + sizeDiff / 2) / containerWidth) * 100;
      newY = ((startElementY + sizeDiff / 2) / containerHeight) * 100;
    }

    onupdate?.({ detail: { scale: newScale, x: newX, y: newY } });
  }

  function handleResizeEnd() {
    isResizing = false;
    resizeHandle = null;
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  }

  function handleKeyDown(e) {
    if (!selected || printMode) return;

    const moveStep = e.shiftKey ? 5 : 1;
    const scaleStep = e.shiftKey ? 0.2 : 0.1;
    let newX = x;
    let newY = y;
    let newScale = scale;

    switch (e.key) {
      case 'ArrowLeft':
        newX = Math.max(0, x - moveStep);
        break;
      case 'ArrowRight':
        newX = Math.min(100, x + moveStep);
        break;
      case 'ArrowUp':
        newY = Math.max(0, y - moveStep);
        break;
      case 'ArrowDown':
        newY = Math.min(100, y + moveStep);
        break;
      case '+':
      case '=':
        newScale = Math.min(5, scale + scaleStep);
        break;
      case '-':
      case '_':
        newScale = Math.max(0.2, scale - scaleStep);
        break;
      case 'Delete':
      case 'Backspace':
        ondelete?.();
        return;
      default:
        return;
    }

    e.preventDefault();
    onupdate?.({ detail: { x: newX, y: newY, scale: newScale } });
  }
</script>

<div
  bind:this={element}
  class="draggable"
  class:selected
  class:dragging={isDragging}
  class:resizing={isResizing}
  class:print-mode={printMode}
  style="
    left: {pixelX}px;
    top: {pixelY}px;
    transform: translate(-50%, -50%) rotate({rotation}deg);
  "
  onclick={handleClick}
  onmousedown={handleMouseDown}
  onkeydown={handleKeyDown}
  ondblclick={ondblclick}
  role="button"
  tabindex={printMode ? -1 : 0}
  aria-label="Draggable element"
>
  {@render children()}

  <!-- Always show handles on hover, highlighted when selected -->
  {#if !printMode}
    <div class="resize-handles" class:always-visible={selected}>
      <div class="handle nw" onmousedown={(e) => handleResizeStart(e, 'nw')}></div>
      <div class="handle ne" onmousedown={(e) => handleResizeStart(e, 'ne')}></div>
      <div class="handle sw" onmousedown={(e) => handleResizeStart(e, 'sw')}></div>
      <div class="handle se" onmousedown={(e) => handleResizeStart(e, 'se')}></div>
    </div>
  {/if}

  {#if selected && !printMode}
    <div class="scale-indicator">{(scale * 100).toFixed(0)}%</div>
  {/if}
</div>

<style>
  .draggable {
    position: absolute;
    cursor: move;
    user-select: none;
    z-index: 10;
    padding: 4px;
    border-radius: 4px;
  }

  .draggable:not(.print-mode):hover {
    outline: 2px solid rgba(37, 99, 235, 0.5);
  }

  .draggable.selected:not(.print-mode) {
    outline: 2px solid var(--color-primary);
    z-index: 20;
  }

  .draggable.dragging,
  .draggable.resizing {
    cursor: grabbing;
  }

  .draggable.print-mode {
    cursor: default;
    outline: none !important;
  }

  .resize-handles {
    position: absolute;
    inset: -6px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .draggable:hover .resize-handles,
  .resize-handles.always-visible {
    opacity: 1;
  }

  .handle {
    position: absolute;
    width: 12px;
    height: 12px;
    background: white;
    border: 2px solid var(--color-primary);
    border-radius: 2px;
    pointer-events: auto;
    cursor: nwse-resize;
    z-index: 20;
    transition: transform 0.1s, background 0.1s;
  }

  .handle:hover {
    background: var(--color-primary);
    transform: scale(1.2);
  }

  .handle.nw { top: -6px; left: -6px; cursor: nwse-resize; }
  .handle.ne { top: -6px; right: -6px; cursor: nesw-resize; }
  .handle.sw { bottom: -6px; left: -6px; cursor: nesw-resize; }
  .handle.se { bottom: -6px; right: -6px; cursor: nwse-resize; }

  .scale-indicator {
    position: absolute;
    bottom: -24px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    background: var(--color-primary);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
    pointer-events: none;
  }

  @media print {
    .draggable {
      cursor: default;
      outline: none !important;
    }

    .resize-handles,
    .scale-indicator {
      display: none;
    }
  }
</style>
