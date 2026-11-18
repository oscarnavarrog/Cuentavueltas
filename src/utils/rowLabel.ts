import type { GridCalibration } from '../types/pattern';

export interface RowDisplayInfo {
  physicalRow: number;
  totalRows: number;
  displayLabel: string;
  shortTag: string;
  passLabel: string | null;
  progressPct: number;
}

export function getRowDisplayInfo(
  physicalRow: number,
  calibration: GridCalibration
): RowDisplayInfo {
  const clamped = Math.max(1, Math.min(calibration.totalRows, physicalRow));
  const start = calibration.startRowNumber || 1;

  if (calibration.passesPerRow === 2) {
    const logicalIndex = Math.floor((clamped - 1) / 2) + start;
    const pass = clamped % 2 === 1 ? 'A' : 'B';
    return {
      physicalRow: clamped,
      totalRows: calibration.totalRows,
      displayLabel: `Vuelta ${logicalIndex}`,
      shortTag: `${logicalIndex}${pass}`,
      passLabel: `Pasada ${pass}`,
      progressPct: Math.round((clamped / calibration.totalRows) * 100),
    };
  }

  const logicalRow = clamped - 1 + start;
  return {
    physicalRow: clamped,
    totalRows: calibration.totalRows,
    displayLabel: `Vuelta ${logicalRow}`,
    shortTag: `${logicalRow}`,
    passLabel: null,
    progressPct: Math.round((clamped / calibration.totalRows) * 100),
  };
}

/**
 * Computes the top% and height% (in 0..100 coordinates of the full pattern page)
 * for a given 1-indexed physical row.
 */
export function getRowBandPct(
  physicalRow: number,
  calibration: GridCalibration
): { topPct: number; heightPct: number } {
  const total = Math.max(1, calibration.totalRows);
  const span = Math.max(1, calibration.bottomPct - calibration.topPct);
  const rowHeight = span / total;
  const clamped = Math.max(1, Math.min(total, physicalRow));

  if (calibration.direction === 'bottom-to-top') {
    // Row 1 is at the bottom of the grid
    const topPct = calibration.bottomPct - clamped * rowHeight;
    return { topPct, heightPct: rowHeight };
  } else {
    // Row 1 is at the top of the grid
    const topPct = calibration.topPct + (clamped - 1) * rowHeight;
    return { topPct, heightPct: rowHeight };
  }
}

/**
 * Converts a click Y-percentage (0..100) on the pattern image into the nearest
 * 1-indexed physical row inside the calibrated grid.
 */
export function getRowFromYPct(
  yPct: number,
  calibration: GridCalibration
): number | null {
  const { topPct, bottomPct, totalRows, direction } = calibration;
  if (yPct < topPct || yPct > bottomPct) return null;
  const span = Math.max(0.5, bottomPct - topPct);
  const normalized = (yPct - topPct) / span; // 0 at top, 1 at bottom

  if (direction === 'bottom-to-top') {
    const idxFromBottom = Math.floor((1 - normalized) * totalRows) + 1;
    return Math.max(1, Math.min(totalRows, idxFromBottom));
  } else {
    const idxFromTop = Math.floor(normalized * totalRows) + 1;
    return Math.max(1, Math.min(totalRows, idxFromTop));
  }
}
