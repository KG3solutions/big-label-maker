<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  // Common emoji categories
  const categories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😎', '🤩', '🥳', '😏', '🤔'],
    'Gestures': ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '👈', '👉', '👆', '👇', '☝️', '✋'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
    'Symbols': ['⭐', '🌟', '✨', '💫', '⚡', '🔥', '💥', '❄️', '🌈', '☀️', '🌙', '⭕', '❌', '✅', '☑️', '✔️', '❗', '❓', '💯', '🎯'],
    'Objects': ['🎈', '🎉', '🎊', '🎁', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '📌', '📍', '🔔', '🔕', '💡', '🔑', '🗝️', '🔒', '🔓', '📎'],
    'Nature': ['🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '🥀', '🪻', '🪷', '🌱', '🌲', '🌳', '🌴', '🌵', '🍀', '🍁', '🍂', '🍃', '🪴', '🌿'],
    'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦋', '🐝'],
    'Food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍕', '🍔', '🍟', '🌭']
  };

  let activeCategory = 'Smileys';
  let searchQuery = '';

  $: filteredEmojis = searchQuery
    ? Object.values(categories).flat().filter(e => e.includes(searchQuery))
    : categories[activeCategory];

  function selectEmoji(emoji) {
    dispatch('select', { emoji });
  }

  function close() {
    dispatch('close');
  }
</script>

<div class="emoji-picker">
  <div class="picker-header">
    <input
      type="text"
      placeholder="Search emojis..."
      bind:value={searchQuery}
      class="search-input"
    />
    <button class="close-btn" on:click={close}>×</button>
  </div>

  {#if !searchQuery}
    <div class="categories">
      {#each Object.keys(categories) as category}
        <button
          class="category-btn"
          class:active={activeCategory === category}
          on:click={() => activeCategory = category}
        >
          {category}
        </button>
      {/each}
    </div>
  {/if}

  <div class="emoji-grid">
    {#each filteredEmojis as emoji}
      <button
        class="emoji-btn"
        on:click={() => selectEmoji(emoji)}
        title={emoji}
      >
        {emoji}
      </button>
    {/each}
  </div>
</div>

<style>
  .emoji-picker {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    margin-top: 0.5rem;
    box-shadow: var(--shadow-md);
  }

  .picker-header {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .search-input {
    flex: 1;
  }

  .close-btn {
    width: 32px;
    height: 32px;
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

  .categories {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);
  }

  .category-btn {
    font-size: 0.625rem;
    padding: 0.25rem 0.5rem;
    background: transparent;
    color: var(--color-text-muted);
  }

  .category-btn:hover {
    background: var(--color-border);
  }

  .category-btn.active {
    background: var(--color-primary);
    color: white;
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 2px;
    max-height: 200px;
    overflow-y: auto;
  }

  .emoji-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    background: transparent;
    border-radius: var(--radius-sm);
  }

  .emoji-btn:hover {
    background: var(--color-border);
    transform: scale(1.1);
  }
</style>
