import type { AppSettings, PatternRecord } from '../types/pattern';
import {
  CUELLO_GADES_CALIBRATION,
  DEFAULT_SETTINGS,
} from '../types/pattern';
import { renderPdfFromArrayBuffer } from './pdfRenderer';

const DB_NAME = 'marcavueltas_db';
const DB_VERSION = 1;
const STORE_PATTERNS = 'patterns';
const STORE_META = 'meta';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PATTERNS)) {
        db.createObjectStore(STORE_PATTERNS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllPatterns(): Promise<PatternRecord[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PATTERNS, 'readonly');
      const store = tx.objectStore(STORE_PATTERNS);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result as PatternRecord[]) || [];
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function savePattern(pattern: PatternRecord): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PATTERNS, 'readwrite');
    tx.objectStore(STORE_PATTERNS).put(pattern);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deletePatternById(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PATTERNS, 'readwrite');
    tx.objectStore(STORE_PATTERNS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getActivePatternId(): Promise<string | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_META, 'readonly');
      const req = tx.objectStore(STORE_META).get('activePatternId');
      req.onsuccess = () => resolve(req.result?.value ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setActivePatternId(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_META, 'readwrite');
      tx.objectStore(STORE_META).put({ key: 'activePatternId', value: id });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = localStorage.getItem('marcavueltas_settings');
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      keyBindings: {
        ...DEFAULT_SETTINGS.keyBindings,
        ...(parsed.keyBindings ?? {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem('marcavueltas_settings', JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export async function loadCuelloGadesSample(): Promise<PatternRecord> {
  const res = await fetch('/assets/aistudio/CUELLO_GADES_copia_3b69ec9e.pdf');
  if (!res.ok) {
    throw new Error('No se pudo cargar el patrón de ejemplo.');
  }
  const buffer = await res.arrayBuffer();
  const rendered = await renderPdfFromArrayBuffer(buffer);
  const now = Date.now();
  return {
    id: 'sample-cuello-gades',
    name: 'Cuello Gades — Gráfico del motivo',
    fileName: 'CUELLO_GADES_copia_3b69ec9e.pdf',
    sourceType: 'pdf',
    pageCount: rendered.pageCount,
    activePage: 1,
    pagesDataUrls: rendered.pagesDataUrls,
    pageAspectRatios: rendered.pageAspectRatios,
    calibrationByPage: {
      1: { ...CUELLO_GADES_CALIBRATION },
    },
    currentRow: 1,
    repeatCount: 1,
    autoRepeat: false,
    notes: 'Brioche a 2 colores · 30 puntos por motivo · Cada vuelta numerada (1–10) tiene 2 pasadas (color A y color B).',
    isSample: true,
    createdAt: now,
    updatedAt: now,
  };
}
