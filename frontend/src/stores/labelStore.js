import { writable, derived } from 'svelte/store';

// Page dimensions in inches
const PAGE_SIZES = {
  letter: { width: 8.5, height: 11, name: 'US Letter' },
  a4: { width: 8.27, height: 11.69, name: 'A4' }
};

// Default margins in inches
const DEFAULT_MARGINS = {
  top: 0.5,
  right: 0.5,
  bottom: 0.5,
  left: 0.5
};

// Initial state
function createLabelStore() {
  const { subscribe, set, update } = writable({
    // Page setup
    pageSize: 'letter',
    orientation: 'portrait', // portrait or landscape
    margins: { ...DEFAULT_MARGINS },

    // Text content
    text: 'BIG LABEL',
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textColor: '#000000',
    textAlign: 'center',
    verticalAlign: 'middle',

    // Layers (emoji and clipart)
    layers: [],

    // Auto-fit state
    autoFitEnabled: true,
    manualFontSize: 72,

    // UI state
    selectedLayerId: null,
    showGrid: false
  });

  return {
    subscribe,
    set,
    update,

    // Page setup actions
    setPageSize: (size) => update(s => ({ ...s, pageSize: size })),
    setOrientation: (orientation) => update(s => ({ ...s, orientation })),
    setMargins: (margins) => update(s => ({ ...s, margins: { ...s.margins, ...margins } })),

    // Text actions
    setText: (text) => update(s => ({ ...s, text })),
    setFontFamily: (fontFamily) => update(s => ({ ...s, fontFamily })),
    setFontWeight: (fontWeight) => update(s => ({ ...s, fontWeight })),
    setFontStyle: (fontStyle) => update(s => ({ ...s, fontStyle })),
    setTextColor: (textColor) => update(s => ({ ...s, textColor })),
    setTextAlign: (textAlign) => update(s => ({ ...s, textAlign })),
    setVerticalAlign: (verticalAlign) => update(s => ({ ...s, verticalAlign })),

    // Auto-fit actions
    setAutoFit: (enabled) => update(s => ({ ...s, autoFitEnabled: enabled })),
    setManualFontSize: (size) => update(s => ({ ...s, manualFontSize: size })),

    // Layer actions
    addLayer: (layer) => update(s => ({
      ...s,
      layers: [...s.layers, {
        id: crypto.randomUUID(),
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        ...layer
      }]
    })),

    updateLayer: (id, updates) => update(s => ({
      ...s,
      layers: s.layers.map(l => l.id === id ? { ...l, ...updates } : l)
    })),

    removeLayer: (id) => update(s => ({
      ...s,
      layers: s.layers.filter(l => l.id !== id),
      selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId
    })),

    selectLayer: (id) => update(s => ({ ...s, selectedLayerId: id })),
    deselectAll: () => update(s => ({ ...s, selectedLayerId: null })),

    // Reorder layers
    moveLayerUp: (id) => update(s => {
      const idx = s.layers.findIndex(l => l.id === id);
      if (idx < s.layers.length - 1) {
        const layers = [...s.layers];
        [layers[idx], layers[idx + 1]] = [layers[idx + 1], layers[idx]];
        return { ...s, layers };
      }
      return s;
    }),

    moveLayerDown: (id) => update(s => {
      const idx = s.layers.findIndex(l => l.id === id);
      if (idx > 0) {
        const layers = [...s.layers];
        [layers[idx], layers[idx - 1]] = [layers[idx - 1], layers[idx]];
        return { ...s, layers };
      }
      return s;
    }),

    // UI actions
    toggleGrid: () => update(s => ({ ...s, showGrid: !s.showGrid })),

    // Load/Save
    loadDesign: (data) => set(data),
    getExportData: () => {
      let data;
      subscribe(s => { data = s; })();
      return data;
    },

    // Reset to defaults
    reset: () => set({
      pageSize: 'letter',
      orientation: 'portrait',
      margins: { ...DEFAULT_MARGINS },
      text: 'BIG LABEL',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textColor: '#000000',
      textAlign: 'center',
      verticalAlign: 'middle',
      layers: [],
      autoFitEnabled: true,
      manualFontSize: 72,
      selectedLayerId: null,
      showGrid: false
    })
  };
}

export const labelStore = createLabelStore();

// Derived store for computed page dimensions
export const pageDimensions = derived(labelStore, ($label) => {
  const base = PAGE_SIZES[$label.pageSize];
  const isLandscape = $label.orientation === 'landscape';

  return {
    width: isLandscape ? base.height : base.width,
    height: isLandscape ? base.width : base.height,
    printableWidth: (isLandscape ? base.height : base.width) - $label.margins.left - $label.margins.right,
    printableHeight: (isLandscape ? base.width : base.height) - $label.margins.top - $label.margins.bottom,
    margins: $label.margins
  };
});

export { PAGE_SIZES, DEFAULT_MARGINS };
