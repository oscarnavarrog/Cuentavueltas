import type { GridCalibration } from '../types/pattern';
import { DEFAULT_CALIBRATION } from '../types/pattern';

/**
 * Analyzes a rendered knitting/crochet chart image to estimate the chart grid's
 * vertical bounds (topPct, bottomPct), horizontal bounds (leftPct, rightPct),
 * and approximate row count using horizontal ink projection & periodicity.
 */
export async function detectChartGrid(
  dataUrl: string,
  previous?: Partial<GridCalibration>
): Promise<GridCalibration> {
  const base: GridCalibration = {
    ...DEFAULT_CALIBRATION,
    ...previous,
  };

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image load failed'));
      el.src = dataUrl;
    });

    const maxW = 700;
    const scale = Math.min(1, maxW / img.naturalWidth);
    const w = Math.max(100, Math.round(img.naturalWidth * scale));
    const h = Math.max(100, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return base;

    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    // Compute per-row ink density (dark pixels inside middle 75% width, avoiding outer page frames)
    const xStart = Math.floor(w * 0.08);
    const xEnd = Math.ceil(w * 0.92);
    const spanX = xEnd - xStart;

    const rowDensity = new Float32Array(h);
    const rowDarkLine = new Float32Array(h);

    for (let y = 0; y < h; y++) {
      let inkCount = 0;
      let transitions = 0;
      let prevDark = false;
      for (let x = xStart; x < xEnd; x++) {
        const idx = (y * w + x) * 4;
        const lum = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
        const isDark = lum < 195;
        if (isDark) inkCount++;
        if (isDark !== prevDark) transitions++;
        prevDark = isDark;
      }
      rowDensity[y] = inkCount / spanX;
      // High ink + low transitions = solid horizontal grid border; medium ink + high transitions = stitch symbols
      rowDarkLine[y] = transitions;
    }

    // Find dense contiguous bands (rows of symbols separated by small white gaps)
    const activeRows: boolean[] = new Array(h).fill(false);
    for (let y = Math.floor(h * 0.04); y < Math.floor(h * 0.96); y++) {
      // Ignore pure solid outer border lines (ink > 0.78) or very sparse noise (ink < 0.015)
      if (rowDensity[y] > 0.018 && rowDensity[y] < 0.78 && rowDarkLine[y] >= 8) {
        activeRows[y] = true;
      }
    }

    // Group active y-bands with small gaps (<= 1.4% of height) into chart blocks
    const maxGap = Math.max(4, Math.round(h * 0.015));
    interface Block {
      startY: number;
      endY: number;
      bandCount: number;
    }
    const blocks: Block[] = [];
    let currentStart = -1;
    let lastActive = -1;
    let inBand = false;
    let bandCount = 0;

    for (let y = 0; y < h; y++) {
      if (activeRows[y]) {
        if (!inBand) {
          bandCount++;
          inBand = true;
        }
        if (currentStart === -1) {
          currentStart = y;
          bandCount = 1;
        }
        lastActive = y;
      } else {
        inBand = false;
        if (currentStart !== -1 && y - lastActive > maxGap) {
          blocks.push({ startY: currentStart, endY: lastActive, bandCount });
          currentStart = -1;
          lastActive = -1;
          bandCount = 0;
        }
      }
    }
    if (currentStart !== -1) {
      blocks.push({ startY: currentStart, endY: lastActive, bandCount });
    }

    // Pick the block with the most periodic symbol bands (and height >= 10% of image)
    const candidates = blocks.filter(
      (b) => b.endY - b.startY >= h * 0.08 && b.bandCount >= 4
    );
    if (candidates.length === 0) return base;

    candidates.sort((a, b) => b.bandCount - a.bandCount);
    const best = candidates[0];

    // Add tiny padding around top and bottom symbol bands so the highlight frames the row cleanly
    const padY = Math.max(2, Math.round((best.endY - best.startY) / Math.max(1, best.bandCount) * 0.22));
    const topPx = Math.max(0, best.startY - padY);
    const bottomPx = Math.min(h, best.endY + padY);

    // Estimate left/right bounds inside that vertical slice
    let minX = w;
    let maxX = 0;
    for (let x = Math.floor(w * 0.02); x < Math.ceil(w * 0.98); x++) {
      let darkY = 0;
      for (let y = topPx; y < bottomPx; y++) {
        const idx = (y * w + x) * 4;
        const lum = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        if (lum < 190) darkY++;
      }
      if (darkY >= Math.max(3, (bottomPx - topPx) * 0.05)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }

    const topPct = Number(((topPx / h) * 100).toFixed(2));
    const bottomPct = Number(((bottomPx / h) * 100).toFixed(2));
    const leftPct =
      minX < maxX ? Number(Math.max(1, (minX / w) * 100 - 1.2).toFixed(2)) : base.leftPct;
    const rightPct =
      minX < maxX ? Number(Math.min(99, (maxX / w) * 100 + 1.2).toFixed(2)) : base.rightPct;

    const estimatedRows = Math.min(120, Math.max(4, best.bandCount));

    return {
      ...base,
      topPct,
      bottomPct,
      leftPct,
      rightPct,
      totalRows: estimatedRows,
    };
  } catch {
    return base;
  }
}
