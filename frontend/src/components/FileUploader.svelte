<script>
  import { clipartStore } from '../stores/clipartStore.js';

  let { oncomplete } = $props();

  let file = $state(null);
  let name = $state('');
  let tags = $state('');
  let isDragging = $state(false);
  let uploading = $state(false);
  let error = $state(null);

  const acceptedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }

  function handleFileSelect(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }

  function validateAndSetFile(f) {
    error = null;

    if (!acceptedTypes.includes(f.type)) {
      error = 'Invalid file type. Please use SVG, PNG, JPEG, GIF, or WebP.';
      return;
    }

    if (f.size > maxSize) {
      error = 'File too large. Maximum size is 5MB.';
      return;
    }

    file = f;

    // Auto-fill name from filename if empty
    if (!name) {
      name = f.name.replace(/\.[^/.]+$/, '');
    }
  }

  function clearFile() {
    file = null;
    name = '';
    tags = '';
    error = null;
  }

  async function handleUpload() {
    if (!file || !name) return;

    uploading = true;
    error = null;

    try {
      await clipartStore.upload(file, name, tags);
      oncomplete?.();
      clearFile();
    } catch (err) {
      error = err.message;
    } finally {
      uploading = false;
    }
  }
</script>

<div class="file-uploader">
  <div
    class="drop-zone"
    class:dragging={isDragging}
    class:has-file={file}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="button"
    tabindex="0"
  >
    {#if file}
      <div class="file-preview">
        {#if file.type.startsWith('image/')}
          <img src={URL.createObjectURL(file)} alt="Preview" />
        {/if}
        <span class="file-name">{file.name}</span>
        <button class="remove-btn" onclick={clearFile}>×</button>
      </div>
    {:else}
      <div class="drop-content">
        <span class="drop-icon">📁</span>
        <span class="drop-text">Drag & drop or click to upload</span>
        <span class="drop-hint">SVG, PNG, JPEG, GIF, WebP (max 5MB)</span>
        <input
          type="file"
          accept=".svg,.png,.jpg,.jpeg,.gif,.webp,image/svg+xml,image/png,image/jpeg,image/gif,image/webp"
          onchange={handleFileSelect}
        />
      </div>
    {/if}
  </div>

  {#if file}
    <div class="form-fields">
      <div class="field">
        <label for="upload-name">Name *</label>
        <input
          type="text"
          id="upload-name"
          bind:value={name}
          placeholder="Enter a name..."
          required
        />
      </div>

      <div class="field">
        <label for="upload-tags">Tags (comma-separated)</label>
        <input
          type="text"
          id="upload-tags"
          bind:value={tags}
          placeholder="e.g., icon, symbol, star"
        />
      </div>

      <button
        class="btn-primary full-width"
        onclick={handleUpload}
        disabled={!name || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Clip Art'}
      </button>
    </div>
  {/if}

  {#if error}
    <div class="error-message">{error}</div>
  {/if}
</div>

<style>
  .file-uploader {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: var(--color-bg);
    border-radius: var(--radius-md);
  }

  .drop-zone {
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    text-align: center;
    transition: all 0.15s ease;
    position: relative;
    cursor: pointer;
  }

  .drop-zone:hover,
  .drop-zone.dragging {
    border-color: var(--color-primary);
    background: rgba(37, 99, 235, 0.05);
  }

  .drop-zone.has-file {
    border-style: solid;
    background: white;
    cursor: default;
  }

  .drop-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .drop-icon {
    font-size: 2rem;
  }

  .drop-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
  }

  .drop-hint {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .drop-zone input[type="file"] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .file-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    position: relative;
  }

  .file-preview img {
    max-width: 100px;
    max-height: 100px;
    object-fit: contain;
  }

  .file-name {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    padding: 0;
    background: var(--color-danger);
    color: white;
    border-radius: 50%;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .form-fields {
    margin-top: 1rem;
  }

  .field {
    margin-bottom: 0.75rem;
  }

  .field input {
    width: 100%;
  }

  .full-width {
    width: 100%;
  }

  .error-message {
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: #fef2f2;
    color: var(--color-danger);
    font-size: 0.75rem;
    border-radius: var(--radius-sm);
  }
</style>
