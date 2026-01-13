/**
 * Auto-fit text algorithm for Big Label Maker
 *
 * Finds the maximum font size that allows text to fit within given bounds
 * using binary search for efficiency.
 */

/**
 * Calculate the optimal font size for text to fit within bounds
 * @param {string} text - The text to fit
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @param {object} options - Font options
 * @returns {number} Optimal font size in pixels
 */
export function calculateAutoFitFontSize(text, maxWidth, maxHeight, options = {}) {
  const {
    fontFamily = 'Arial',
    fontWeight = 'normal',
    fontStyle = 'normal',
    minFontSize = 12,
    maxFontSize = 800,
    lineHeight = 1.2,
    padding = 0
  } = options;

  // Create off-screen canvas for text measurement
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Effective bounds after padding
  const effectiveWidth = maxWidth - (padding * 2);
  const effectiveHeight = maxHeight - (padding * 2);

  if (effectiveWidth <= 0 || effectiveHeight <= 0 || !text.trim()) {
    return minFontSize;
  }

  /**
   * Check if text fits at given font size
   * Returns true only if ALL text fits within bounds without clipping
   */
  function textFitsAtSize(fontSize) {
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

    // Split text into user-specified lines
    const inputLines = text.split('\n');
    let totalHeight = 0;

    for (const line of inputLines) {
      if (!line.trim()) {
        // Empty line still takes up space
        totalHeight += fontSize * lineHeight;
        continue;
      }

      // For each line, check if it fits width-wise
      // We do NOT wrap - the text must fit on one line per user line break
      const metrics = ctx.measureText(line);

      // If the line is wider than the container, this font size doesn't fit
      if (metrics.width > effectiveWidth) {
        return false;
      }

      totalHeight += fontSize * lineHeight;
    }

    // Check if total height fits
    return totalHeight <= effectiveHeight;
  }

  // Binary search for optimal font size
  let low = minFontSize;
  let high = maxFontSize;
  let result = minFontSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (textFitsAtSize(mid)) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

/**
 * Measure text dimensions at a given font size
 * @param {string} text - The text to measure
 * @param {number} fontSize - Font size in pixels
 * @param {object} options - Font options
 * @returns {object} { width, height, lines }
 */
export function measureText(text, fontSize, options = {}) {
  const {
    fontFamily = 'Arial',
    fontWeight = 'normal',
    fontStyle = 'normal',
    lineHeight = 1.2,
    maxWidth = Infinity
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

  const inputLines = text.split('\n');
  const outputLines = [];
  let totalWidth = 0;

  for (const line of inputLines) {
    if (maxWidth === Infinity) {
      // No wrapping needed
      const metrics = ctx.measureText(line);
      outputLines.push({ text: line, width: metrics.width });
      totalWidth = Math.max(totalWidth, metrics.width);
    } else {
      // Word wrap
      const words = line.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          const lineMetrics = ctx.measureText(currentLine);
          outputLines.push({ text: currentLine, width: lineMetrics.width });
          totalWidth = Math.max(totalWidth, lineMetrics.width);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        const lineMetrics = ctx.measureText(currentLine);
        outputLines.push({ text: currentLine, width: lineMetrics.width });
        totalWidth = Math.max(totalWidth, lineMetrics.width);
      }
    }
  }

  return {
    width: totalWidth,
    height: outputLines.length * fontSize * lineHeight,
    lines: outputLines
  };
}

/**
 * Convert inches to pixels at a given DPI
 */
export function inchesToPixels(inches, dpi = 96) {
  return inches * dpi;
}

/**
 * Convert pixels to inches at a given DPI
 */
export function pixelsToInches(pixels, dpi = 96) {
  return pixels / dpi;
}
