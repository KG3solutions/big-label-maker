/**
 * Iconify API wrapper for Big Label Maker
 *
 * Free API with 275,000+ icons from 200+ open source sets
 * No API key required
 */

const API_BASE = 'https://api.iconify.design';

// Cache collections to avoid repeated requests
let collectionsCache = null;

/**
 * Search for icons by query
 * @param {string} query - Search term
 * @param {object} options - Search options
 * @returns {Promise<{icons: string[], total: number, collections: object}>}
 */
export async function searchIcons(query, options = {}) {
  const { limit = 64, start = 0, prefix = '', category = '' } = options;

  if (!query.trim()) {
    return { icons: [], total: 0, collections: {} };
  }

  const params = new URLSearchParams({
    query: query.trim(),
    limit: limit.toString()
  });

  if (start > 0) params.append('start', start.toString());
  if (prefix) params.append('prefix', prefix);
  if (category) params.append('category', category);

  try {
    const response = await fetch(`${API_BASE}/search?${params}`);
    if (!response.ok) throw new Error('Search failed');

    const data = await response.json();
    return {
      icons: data.icons || [],
      total: data.total || 0,
      collections: data.collections || {}
    };
  } catch (error) {
    console.error('Iconify search error:', error);
    return { icons: [], total: 0, collections: {} };
  }
}

/**
 * Get SVG data for a specific icon
 * @param {string} prefix - Icon set prefix (e.g., 'mdi')
 * @param {string} name - Icon name (e.g., 'star')
 * @returns {Promise<{body: string, width: number, height: number} | null>}
 */
export async function getIconData(prefix, name) {
  try {
    const response = await fetch(`${API_BASE}/${prefix}.json?icons=${name}`);
    if (!response.ok) throw new Error('Failed to fetch icon');

    const data = await response.json();
    const icon = data.icons?.[name];

    if (!icon) return null;

    return {
      body: icon.body,
      width: icon.width || data.width || 24,
      height: icon.height || data.height || 24
    };
  } catch (error) {
    console.error('Iconify getIconData error:', error);
    return null;
  }
}

/**
 * Get direct SVG URL for an icon (for img src)
 * @param {string} prefix - Icon set prefix
 * @param {string} name - Icon name
 * @param {object} options - SVG options
 * @returns {string}
 */
export function getIconUrl(prefix, name, options = {}) {
  const { color = 'currentColor', width, height } = options;
  let url = `${API_BASE}/${prefix}/${name}.svg`;

  const params = new URLSearchParams();
  if (color && color !== 'currentColor') params.append('color', color);
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Build complete SVG string from icon data
 * @param {object} iconData - Icon data from getIconData
 * @param {object} options - SVG options
 * @returns {string}
 */
export function buildSvg(iconData, options = {}) {
  const { color = 'currentColor', size } = options;
  const width = size || iconData.width;
  const height = size || iconData.height;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${iconData.width} ${iconData.height}" fill="${color}">${iconData.body}</svg>`;
}

/**
 * Get all available icon collections
 * @returns {Promise<object>}
 */
export async function getCollections() {
  if (collectionsCache) return collectionsCache;

  try {
    const response = await fetch(`${API_BASE}/collections`);
    if (!response.ok) throw new Error('Failed to fetch collections');

    collectionsCache = await response.json();
    return collectionsCache;
  } catch (error) {
    console.error('Iconify getCollections error:', error);
    return {};
  }
}

/**
 * Get popular/recommended collections for the dropdown
 * @returns {Array<{prefix: string, name: string, total: number}>}
 */
export async function getPopularCollections() {
  const collections = await getCollections();

  // Curated list of popular, high-quality icon sets
  const popularPrefixes = [
    'mdi',           // Material Design Icons (7000+)
    'material-symbols', // Google Material Symbols
    'fa6-solid',     // Font Awesome 6 Solid
    'fa6-regular',   // Font Awesome 6 Regular
    'tabler',        // Tabler Icons
    'lucide',        // Lucide Icons
    'heroicons',     // Heroicons
    'ph',            // Phosphor Icons
    'ri',            // Remix Icon
    'bi',            // Bootstrap Icons
    'fluent',        // Fluent UI Icons
    'carbon',        // IBM Carbon Icons
    'ion',           // Ionicons
    'octicon',       // GitHub Octicons
    'simple-icons',  // Simple Icons (brands)
    'logos',         // Logos
    'emojione',      // Emoji One
    'noto',          // Google Noto Emoji
    'twemoji',       // Twitter Emoji
    'openmoji'       // OpenMoji
  ];

  const result = [];
  for (const prefix of popularPrefixes) {
    if (collections[prefix]) {
      result.push({
        prefix,
        name: collections[prefix].name,
        total: collections[prefix].total,
        category: collections[prefix].category || 'General'
      });
    }
  }

  return result;
}

/**
 * Parse an icon identifier into prefix and name
 * @param {string} iconId - Full icon ID (e.g., 'mdi:star')
 * @returns {{prefix: string, name: string}}
 */
export function parseIconId(iconId) {
  const [prefix, name] = iconId.split(':');
  return { prefix, name };
}
