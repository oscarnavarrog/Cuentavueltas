export type PatternSourceType = 'pdf' | 'png' | 'jpg';

export type RowDirection = 'bottom-to-top' | 'top-to-bottom';

export type HighlightStyle = 'focus' | 'completed' | 'outline';

export type HighlightColor = 'teal' | 'amber' | 'crimson' | 'slate';

export interface GridCalibration {
  topPct: number;
  bottomPct: number;
  leftPct: number;
  rightPct: number;
  totalRows: number;
  direction: RowDirection;
  passesPerRow: 1 | 2;
  startRowNumber: number;
}

export interface PatternRecord {
  id: string;
  name: string;
  fileName: string;
  sourceType: PatternSourceType;
  pageCount: number;
  activePage: number;
  pagesDataUrls: string[];
  pageAspectRatios: number[];
  calibrationByPage: Record<number, GridCalibration>;
  currentRow: number; // 1-indexed physical row on active page
  repeatCount: number;
  autoRepeat: boolean;
  notes: string;
  isSample?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface KeyBindings {
  nextRow: string; // KeyboardEvent.code (e.g. 'Space')
  prevRow: string; // KeyboardEvent.code (e.g. 'Backspace')
}

export interface AppSettings {
  keyBindings: KeyBindings;
  highlightStyle: HighlightStyle;
  highlightColor: HighlightColor;
  darkMode: boolean;
  soundEnabled: boolean;
}

export const DEFAULT_CALIBRATION: GridCalibration = {
  topPct: 16,
  bottomPct: 76,
  leftPct: 6,
  rightPct: 94,
  totalRows: 20,
  direction: 'bottom-to-top',
  passesPerRow: 1,
  startRowNumber: 1,
};

export const CUELLO_GADES_CALIBRATION: GridCalibration = {
  topPct: 16.05,
  bottomPct: 47.65,
  leftPct: 4.8,
  rightPct: 95.2,
  totalRows: 20,
  direction: 'bottom-to-top',
  passesPerRow: 2,
  startRowNumber: 1,
};

export const DEFAULT_SETTINGS: AppSettings = {
  keyBindings: {
    nextRow: 'Space',
    prevRow: 'Backspace',
  },
  highlightStyle: 'focus',
  highlightColor: 'teal',
  darkMode: false,
  soundEnabled: true,
};
