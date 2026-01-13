import { writable } from 'svelte/store';

const API_BASE = '/api/clipart';

function createClipartStore() {
  const { subscribe, set, update } = writable({
    items: [],
    loading: false,
    error: null,
    search: '',
    pagination: {
      total: 0,
      limit: 50,
      offset: 0
    }
  });

  return {
    subscribe,

    // Fetch clipart list
    async fetch(search = '', tags = '') {
      update(s => ({ ...s, loading: true, error: null }));

      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (tags) params.append('tags', tags);

        const res = await fetch(`${API_BASE}?${params}`);
        if (!res.ok) throw new Error('Failed to fetch clipart');

        const data = await res.json();
        update(s => ({
          ...s,
          items: data.data,
          pagination: data.pagination,
          loading: false,
          search
        }));
      } catch (error) {
        update(s => ({ ...s, error: error.message, loading: false }));
      }
    },

    // Upload new clipart
    async upload(file, name, tags = '') {
      update(s => ({ ...s, loading: true, error: null }));

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);
        formData.append('tags', tags);

        const res = await fetch(API_BASE, {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to upload');
        }

        const newClipart = await res.json();
        update(s => ({
          ...s,
          items: [newClipart, ...s.items],
          loading: false
        }));

        return newClipart;
      } catch (error) {
        update(s => ({ ...s, error: error.message, loading: false }));
        throw error;
      }
    },

    // Delete clipart
    async delete(id) {
      try {
        const res = await fetch(`${API_BASE}/${id}`, {
          method: 'DELETE'
        });

        if (!res.ok) throw new Error('Failed to delete clipart');

        update(s => ({
          ...s,
          items: s.items.filter(item => item.id !== id)
        }));
      } catch (error) {
        update(s => ({ ...s, error: error.message }));
        throw error;
      }
    },

    // Get file URL for a clipart item
    getFileUrl(id) {
      return `${API_BASE}/${id}/file`;
    },

    // Clear error
    clearError() {
      update(s => ({ ...s, error: null }));
    }
  };
}

export const clipartStore = createClipartStore();
