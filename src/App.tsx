/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ControlDock } from './components/ControlDock';
import { PatternSidebar } from './components/PatternSidebar';
import { PatternViewport } from './components/PatternViewport';
import { ShortcutsModal } from './components/ShortcutsModal';
import { TopBar, type WorkspaceMode } from './components/TopBar';
import { UploadModal } from './components/UploadModal';
import type {
  AppSettings,
  GridCalibration,
  KeyBindings,
  PatternRecord,
} from './types/pattern';
import { DEFAULT_CALIBRATION, DEFAULT_SETTINGS } from './types/pattern';
import { detectChartGrid } from './utils/gridDetector';
import { isIgnoredShortcutTarget } from './utils/keyboard';
import { playRowTick } from './utils/sound';
import {
  deletePatternById,
  getActivePatternId,
  getAllPatterns,
  getSettings,
  loadCuelloGadesSample,
  savePattern,
  saveSettings,
  setActivePatternId,
} from './utils/storage';

export default function App() {
  const [patterns, setPatterns] = useState<PatternRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [initializing, setInitializing] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mode, setMode] = useState<WorkspaceMode>('read');
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [zenMode, setZenMode] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Load initial settings and patterns (seeding the example PDF on first run)
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const [loadedSettings, storedPatterns, storedActiveId] =
          await Promise.all([
            getSettings(),
            getAllPatterns(),
            getActivePatternId(),
          ]);

        if (cancelled) return;
        setSettings(loadedSettings);

        if (storedPatterns.length > 0) {
          setPatterns(storedPatterns);
          const validActive =
            storedActiveId && storedPatterns.some((p) => p.id === storedActiveId)
              ? storedActiveId
              : storedPatterns[0].id;
          setActiveId(validActive);
        } else {
          const sample = await loadCuelloGadesSample();
          if (cancelled) return;
          await savePattern(sample);
          await setActivePatternId(sample.id);
          setPatterns([sample]);
          setActiveId(sample.id);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : 'No se pudo inicializar el espacio de patrones.'
          );
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync Tailwind dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  const activePattern = useMemo(
    () => patterns.find((p) => p.id === activeId) ?? null,
    [patterns, activeId]
  );

  const activeCalibration: GridCalibration = useMemo(() => {
    if (!activePattern) return DEFAULT_CALIBRATION;
    return (
      activePattern.calibrationByPage[activePattern.activePage] ??
      DEFAULT_CALIBRATION
    );
  }, [activePattern]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const persistPatternUpdate = useCallback(
    (id: string, updater: (prev: PatternRecord) => PatternRecord) => {
      setPatterns((prevList) =>
        prevList.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...updater(item), updatedAt: Date.now() };
          void savePattern(updated);
          return updated;
        })
      );
    },
    []
  );

  const handleNextRow = useCallback(() => {
    if (!activePattern) return;
    const total = Math.max(1, activeCalibration.totalRows);
    const isAtEnd = activePattern.currentRow >= total;

    if (isAtEnd) {
      if (activePattern.autoRepeat) {
        if (settings.soundEnabled) playRowTick('complete');
        persistPatternUpdate(activePattern.id, (p) => ({
          ...p,
          currentRow: 1,
          repeatCount: p.repeatCount + 1,
        }));
      }
      return;
    }

    if (settings.soundEnabled) {
      playRowTick(activePattern.currentRow + 1 === total ? 'complete' : 'next');
    }

    persistPatternUpdate(activePattern.id, (p) => ({
      ...p,
      currentRow: Math.min(total, p.currentRow + 1),
    }));
  }, [
    activePattern,
    activeCalibration.totalRows,
    settings.soundEnabled,
    persistPatternUpdate,
  ]);

  const handlePrevRow = useCallback(() => {
    if (!activePattern) return;
    const total = Math.max(1, activeCalibration.totalRows);

    if (activePattern.currentRow <= 1) {
      if (activePattern.autoRepeat && activePattern.repeatCount > 1) {
        if (settings.soundEnabled) playRowTick('prev');
        persistPatternUpdate(activePattern.id, (p) => ({
          ...p,
          currentRow: total,
          repeatCount: Math.max(1, p.repeatCount - 1),
        }));
      }
      return;
    }

    if (settings.soundEnabled) playRowTick('prev');

    persistPatternUpdate(activePattern.id, (p) => ({
      ...p,
      currentRow: Math.max(1, p.currentRow - 1),
    }));
  }, [
    activePattern,
    activeCalibration.totalRows,
    settings.soundEnabled,
    persistPatternUpdate,
  ]);

  const handleResetRow = useCallback(() => {
    if (!activePattern) return;
    persistPatternUpdate(activePattern.id, (p) => ({
      ...p,
      currentRow: 1,
    }));
  }, [activePattern, persistPatternUpdate]);

  const handleJumpToRow = useCallback(
    (row: number) => {
      if (!activePattern) return;
      const clamped = Math.max(1, Math.min(activeCalibration.totalRows, row));
      if (settings.soundEnabled && clamped !== activePattern.currentRow) {
        playRowTick(clamped > activePattern.currentRow ? 'next' : 'prev');
      }
      persistPatternUpdate(activePattern.id, (p) => ({
        ...p,
        currentRow: clamped,
      }));
    },
    [
      activePattern,
      activeCalibration.totalRows,
      settings.soundEnabled,
      persistPatternUpdate,
    ]
  );

  const handleUpdateCalibration = useCallback(
    (patch: Partial<GridCalibration>) => {
      if (!activePattern) return;
      persistPatternUpdate(activePattern.id, (p) => {
        const currentCal =
          p.calibrationByPage[p.activePage] ?? DEFAULT_CALIBRATION;
        const nextCal: GridCalibration = { ...currentCal, ...patch };
        return {
          ...p,
          currentRow: Math.max(1, Math.min(nextCal.totalRows, p.currentRow)),
          calibrationByPage: {
            ...p.calibrationByPage,
            [p.activePage]: nextCal,
          },
        };
      });
    },
    [activePattern, persistPatternUpdate]
  );

  const handleAutoDetectGrid = useCallback(async () => {
    if (!activePattern) return;
    const pageUrl =
      activePattern.pagesDataUrls[activePattern.activePage - 1] ??
      activePattern.pagesDataUrls[0];
    if (!pageUrl) return;
    const detected = await detectChartGrid(pageUrl, {
      direction: activeCalibration.direction,
      passesPerRow: activeCalibration.passesPerRow,
    });
    handleUpdateCalibration(detected);
  }, [activePattern, activeCalibration, handleUpdateCalibration]);

  // Global keyboard listener for row progression
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (uploadOpen || shortcutsOpen) return;
      if (isIgnoredShortcutTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const { nextRow, prevRow } = settings.keyBindings;

      if (e.code === nextRow && e.shiftKey) {
        e.preventDefault();
        handlePrevRow();
        return;
      }

      if (e.code === nextRow) {
        e.preventDefault();
        handleNextRow();
        return;
      }

      if (e.code === prevRow) {
        e.preventDefault();
        handlePrevRow();
        return;
      }

      // Intuitive arrow navigation aligned with chart reading direction
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        if (activeCalibration.direction === 'bottom-to-top') {
          handleNextRow();
        } else {
          handlePrevRow();
        }
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (activeCalibration.direction === 'bottom-to-top') {
          handlePrevRow();
        } else {
          handleNextRow();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    uploadOpen,
    shortcutsOpen,
    settings.keyBindings,
    activeCalibration.direction,
    handleNextRow,
    handlePrevRow,
  ]);

  const handleSelectPattern = (id: string) => {
    setActiveId(id);
    setMode('read');
    void setActivePatternId(id);
  };

  const handlePatternCreated = (pattern: PatternRecord) => {
    setPatterns((prev) => [pattern, ...prev]);
    setActiveId(pattern.id);
    setMode('read');
    void savePattern(pattern);
    void setActivePatternId(pattern.id);
  };

  const handleDeletePattern = (id: string) => {
    void deletePatternById(id);
    setPatterns((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      if (activeId === id) {
        const nextActive = remaining[0]?.id ?? null;
        setActiveId(nextActive);
        if (nextActive) void setActivePatternId(nextActive);
      }
      return remaining;
    });
  };

  const handleRestoreSample = async () => {
    try {
      const sample = await loadCuelloGadesSample();
      await savePattern(sample);
      setPatterns((prev) => {
        const filtered = prev.filter((p) => p.id !== sample.id);
        return [sample, ...filtered];
      });
      setActiveId(sample.id);
      void setActivePatternId(sample.id);
    } catch {
      // ignore
    }
  };

  const handleSaveKeyBindings = (keyBindings: KeyBindings) => {
    updateSettings({ keyBindings });
  };

  const hasSample = patterns.some((p) => p.id === 'sample-cuello-gades');

  if (initializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-sm text-slate-600 dark:text-slate-400">
        Cargando espacio de tejido...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <TopBar
        mode={mode}
        onChangeMode={setMode}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenUpload={() => setUploadOpen(true)}
        hasActivePattern={Boolean(activePattern)}
      />

      {loadError && (
        <div className="px-5 py-2 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => setLoadError(null)}
            className="underline cursor-pointer"
          >
            Ocultar
          </button>
        </div>
      )}

      <main className="relative flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {sidebarOpen && !zenMode && (
          <>
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 top-14 z-30 bg-slate-950/40 md:hidden"
              aria-hidden="true"
            />
            <div className="fixed inset-y-0 top-14 left-0 z-40 md:static md:z-auto h-[calc(100%-3.5rem)] md:h-full shrink-0 shadow-lg md:shadow-none">
              <PatternSidebar
                patterns={patterns}
                activePatternId={activeId}
                onSelectPattern={(id) => {
                  handleSelectPattern(id);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                onDeletePattern={handleDeletePattern}
                onOpenUpload={() => setUploadOpen(true)}
                notes={activePattern?.notes ?? ''}
                onChangeNotes={(notes) => {
                  if (!activePattern) return;
                  persistPatternUpdate(activePattern.id, (p) => ({
                    ...p,
                    notes,
                  }));
                }}
                onRestoreSample={() => void handleRestoreSample()}
                hasSample={hasSample}
              />
            </div>
          </>
        )}

        <PatternViewport
          pattern={activePattern}
          calibration={activeCalibration}
          mode={mode}
          highlightStyle={settings.highlightStyle}
          highlightColor={settings.highlightColor}
          darkMode={settings.darkMode}
          soundEnabled={settings.soundEnabled}
          sidebarOpen={sidebarOpen}
          zenMode={zenMode}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onToggleZenMode={() => setZenMode((z) => !z)}
          onToggleDarkMode={() =>
            updateSettings({ darkMode: !settings.darkMode })
          }
          onToggleSound={() =>
            updateSettings({ soundEnabled: !settings.soundEnabled })
          }
          onChangeHighlightStyle={(highlightStyle) =>
            updateSettings({ highlightStyle })
          }
          onChangeHighlightColor={(highlightColor) =>
            updateSettings({ highlightColor })
          }
          onChangePage={(page) => {
            if (!activePattern) return;
            persistPatternUpdate(activePattern.id, (p) => ({
              ...p,
              activePage: page,
              currentRow: 1,
            }));
          }}
          onJumpToRow={handleJumpToRow}
          onUpdateCalibration={handleUpdateCalibration}
          onAutoDetectGrid={handleAutoDetectGrid}
          onChangeMode={setMode}
          onOpenUpload={() => setUploadOpen(true)}
        />

        {!zenMode && (
          <ControlDock
            pattern={activePattern}
            calibration={activeCalibration}
            keyBindings={settings.keyBindings}
            onNextRow={handleNextRow}
            onPrevRow={handlePrevRow}
            onResetRow={handleResetRow}
            onChangeRepeat={(delta) => {
              if (!activePattern) return;
              persistPatternUpdate(activePattern.id, (p) => ({
                ...p,
                repeatCount: Math.max(1, p.repeatCount + delta),
              }));
            }}
            onToggleAutoRepeat={() => {
              if (!activePattern) return;
              persistPatternUpdate(activePattern.id, (p) => ({
                ...p,
                autoRepeat: !p.autoRepeat,
              }));
            }}
            onUpdateCalibration={handleUpdateCalibration}
            onOpenShortcuts={() => setShortcutsOpen(true)}
          />
        )}
      </main>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onPatternCreated={handlePatternCreated}
      />

      <ShortcutsModal
        open={shortcutsOpen}
        keyBindings={settings.keyBindings}
        onSave={handleSaveKeyBindings}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}
