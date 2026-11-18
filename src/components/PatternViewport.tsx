import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Moon,
  PanelLeft,
  ScanLine,
  Sun,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type {
  GridCalibration,
  HighlightColor,
  HighlightStyle,
  PatternRecord,
} from '../types/pattern';
import { getRowBandPct, getRowDisplayInfo, getRowFromYPct } from '../utils/rowLabel';
import type { WorkspaceMode } from './TopBar';

interface PatternViewportProps {
  pattern: PatternRecord | null;
  calibration: GridCalibration;
  mode: WorkspaceMode;
  highlightStyle: HighlightStyle;
  highlightColor: HighlightColor;
  darkMode: boolean;
  soundEnabled: boolean;
  sidebarOpen: boolean;
  zenMode: boolean;
  onToggleSidebar: () => void;
  onToggleZenMode: () => void;
  onToggleDarkMode: () => void;
  onToggleSound: () => void;
  onChangeHighlightStyle: (style: HighlightStyle) => void;
  onChangeHighlightColor: (color: HighlightColor) => void;
  onChangePage: (page: number) => void;
  onJumpToRow: (row: number) => void;
  onUpdateCalibration: (patch: Partial<GridCalibration>) => void;
  onAutoDetectGrid: () => Promise<void>;
  onChangeMode: (mode: WorkspaceMode) => void;
  onOpenUpload: () => void;
}

const COLOR_STYLES: Record<
  HighlightColor,
  { border: string; fill: string; tagBg: string; swatch: string; label: string }
> = {
  teal: {
    border: 'border-teal-600 dark:border-teal-400',
    fill: 'bg-teal-500/12 dark:bg-teal-400/15',
    tagBg: 'bg-teal-700 text-white dark:bg-teal-500 dark:text-slate-950',
    swatch: 'bg-teal-700',
    label: 'Verde petróleo',
  },
  amber: {
    border: 'border-amber-600 dark:border-amber-400',
    fill: 'bg-amber-500/14 dark:bg-amber-400/15',
    tagBg: 'bg-amber-600 text-white dark:bg-amber-400 dark:text-slate-950',
    swatch: 'bg-amber-600',
    label: 'Ámbar',
  },
  crimson: {
    border: 'border-rose-600 dark:border-rose-400',
    fill: 'bg-rose-500/12 dark:bg-rose-400/15',
    tagBg: 'bg-rose-700 text-white dark:bg-rose-500 dark:text-slate-950',
    swatch: 'bg-rose-700',
    label: 'Carmesí',
  },
  slate: {
    border: 'border-slate-900 dark:border-slate-100',
    fill: 'bg-slate-900/8 dark:bg-white/12',
    tagBg: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
    swatch: 'bg-slate-800',
    label: 'Grafito',
  },
};

type DragHandle = 'top' | 'bottom' | 'left' | 'right' | null;

export function PatternViewport({
  pattern,
  calibration,
  mode,
  highlightStyle,
  highlightColor,
  darkMode,
  soundEnabled,
  sidebarOpen,
  zenMode,
  onToggleSidebar,
  onToggleZenMode,
  onToggleDarkMode,
  onToggleSound,
  onChangeHighlightStyle,
  onChangeHighlightColor,
  onChangePage,
  onJumpToRow,
  onUpdateCalibration,
  onAutoDetectGrid,
  onChangeMode,
  onOpenUpload,
}: PatternViewportProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [detecting, setDetecting] = useState(false);
  const [draggingHandle, setDraggingHandle] = useState<DragHandle>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const activeBandRef = useRef<HTMLDivElement | null>(null);

  const activeImageUrl = pattern
    ? pattern.pagesDataUrls[pattern.activePage - 1] ?? pattern.pagesDataUrls[0]
    : null;

  const rowBand = getRowBandPct(pattern?.currentRow ?? 1, calibration);
  const rowInfo = getRowDisplayInfo(pattern?.currentRow ?? 1, calibration);
  const colorTheme = COLOR_STYLES[highlightColor];

  // Smoothly keep the active row visible inside the scrollable canvas
  useEffect(() => {
    if (!pattern || mode !== 'read' || !activeBandRef.current) return;
    activeBandRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [pattern?.id, pattern?.activePage, pattern?.currentRow, mode]);

  // Calibration drag listeners
  useEffect(() => {
    if (!draggingHandle) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!sheetRef.current) return;
      const rect = sheetRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      if (draggingHandle === 'top') {
        const clamped = Math.min(calibration.bottomPct - 3, yPct);
        onUpdateCalibration({ topPct: Number(clamped.toFixed(2)) });
      } else if (draggingHandle === 'bottom') {
        const clamped = Math.max(calibration.topPct + 3, yPct);
        onUpdateCalibration({ bottomPct: Number(clamped.toFixed(2)) });
      } else if (draggingHandle === 'left') {
        const clamped = Math.min(calibration.rightPct - 5, xPct);
        onUpdateCalibration({ leftPct: Number(clamped.toFixed(2)) });
      } else if (draggingHandle === 'right') {
        const clamped = Math.max(calibration.leftPct + 5, xPct);
        onUpdateCalibration({ rightPct: Number(clamped.toFixed(2)) });
      }
    };

    const handlePointerUp = () => {
      setDraggingHandle(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingHandle, calibration, onUpdateCalibration]);

  const handleSheetClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'read' || !pattern || !sheetRef.current) return;
    const rect = sheetRef.current.getBoundingClientRect();
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    if (xPct < calibration.leftPct - 4 || xPct > calibration.rightPct + 4) return;
    const targetRow = getRowFromYPct(yPct, calibration);
    if (targetRow !== null) {
      onJumpToRow(targetRow);
    }
  };

  const handleAutoDetect = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    setDetecting(true);
    try {
      await onAutoDetectGrid();
    } finally {
      setDetecting(false);
    }
  };

  // Compute dimming curtains based on highlight style
  const renderHighlightCurtains = () => {
    if (!pattern || mode !== 'read') return null;

    const bandTop = rowBand.topPct;
    const bandBottom = rowBand.topPct + rowBand.heightPct;

    if (highlightStyle === 'focus') {
      return (
        <>
          <div
            className="absolute inset-x-0 top-0 bg-slate-950/38 dark:bg-slate-950/55 pointer-events-none transition-[height] duration-150 ease-out"
            style={{ height: `${bandTop}%` }}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-slate-950/38 dark:bg-slate-950/55 pointer-events-none transition-[top] duration-150 ease-out"
            style={{ top: `${bandBottom}%` }}
          />
        </>
      );
    }

    if (highlightStyle === 'completed') {
      if (calibration.direction === 'bottom-to-top') {
        // Completed rows are BELOW the active row (between bandBottom and calibration.bottomPct)
        const completedHeight = Math.max(0, calibration.bottomPct - bandBottom);
        return completedHeight > 0.1 ? (
          <div
            className="absolute bg-slate-950/35 dark:bg-slate-950/50 pointer-events-none transition-all duration-150 ease-out"
            style={{
              top: `${bandBottom}%`,
              height: `${completedHeight}%`,
              left: `${calibration.leftPct}%`,
              width: `${calibration.rightPct - calibration.leftPct}%`,
            }}
          />
        ) : null;
      } else {
        // Completed rows are ABOVE the active row (between calibration.topPct and bandTop)
        const completedHeight = Math.max(0, bandTop - calibration.topPct);
        return completedHeight > 0.1 ? (
          <div
            className="absolute bg-slate-950/35 dark:bg-slate-950/50 pointer-events-none transition-all duration-150 ease-out"
            style={{
              top: `${calibration.topPct}%`,
              height: `${completedHeight}%`,
              left: `${calibration.leftPct}%`,
              width: `${calibration.rightPct - calibration.leftPct}%`,
            }}
          />
        ) : null;
      }
    }

    return null;
  };

  return (
    <section className="flex-1 min-w-0 flex flex-col h-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Workspace Toolbar */}
      <div className="h-12 shrink-0 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          {!zenMode && (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleSidebar();
              }}
              title={sidebarOpen ? 'Ocultar lista de patrones' : 'Mostrar lista de patrones'}
              aria-label="Alternar panel de patrones"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              <PanelLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {pattern && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-52">
                {pattern.name}
              </span>
              {pattern.pageCount > 1 && (
                <>
                  <span aria-hidden="true">·</span>
                  <div className="flex items-center gap-1 tabular-nums">
                    <button
                      type="button"
                      disabled={pattern.activePage <= 1}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onChangePage(pattern.activePage - 1);
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-35 cursor-pointer"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <span>
                      Pág. {pattern.activePage}/{pattern.pageCount}
                    </span>
                    <button
                      type="button"
                      disabled={pattern.activePage >= pattern.pageCount}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onChangePage(pattern.activePage + 1);
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-35 cursor-pointer"
                      aria-label="Página siguiente"
                    >
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Center Highlight Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {mode === 'calibrate' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pattern || detecting}
                onClick={handleAutoDetect}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <ScanLine className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{detecting ? 'Detectando...' : 'Detectar cuadrícula'}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onChangeMode('read');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Listo
              </button>
            </div>
          ) : (
            <>
              <div
                role="group"
                aria-label="Modo de resaltado"
                className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
              >
                {(
                  [
                    { id: 'focus', label: 'Enfoque' },
                    { id: 'completed', label: 'Completadas' },
                    { id: 'outline', label: 'Marco' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onChangeHighlightStyle(item.id);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      highlightStyle === item.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div
                role="group"
                aria-label="Color de la guía"
                className="hidden sm:flex items-center gap-1.5 pl-1"
              >
                {(Object.keys(COLOR_STYLES) as HighlightColor[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onChangeHighlightColor(key);
                    }}
                    aria-label={COLOR_STYLES[key].label}
                    title={COLOR_STYLES[key].label}
                    className={`w-4 h-4 rounded-full ${COLOR_STYLES[key].swatch} transition-transform cursor-pointer ${
                      highlightColor === key
                        ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-100 dark:ring-offset-slate-900 scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Zoom & Environment Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))));
            }}
            aria-label="Alejar"
            title="Alejar"
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              setZoom(1);
            }}
            title="Restablecer zoom"
            className="px-2 py-1 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))));
            }}
            aria-label="Acercar"
            title="Acercar"
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" aria-hidden="true" />
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" aria-hidden="true" />

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleSound();
            }}
            aria-label={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
            title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleDarkMode();
            }}
            aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
            title={darkMode ? 'Modo claro' : 'Modo noche'}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
          >
            {darkMode ? (
              <Sun className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleZenMode();
            }}
            aria-label={zenMode ? 'Salir de vista enfocada' : 'Vista enfocada'}
            title={zenMode ? 'Mostrar paneles' : 'Ocultar paneles laterales'}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
          >
            {zenMode ? (
              <Minimize2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Calibration Helper Strip */}
      {mode === 'calibrate' && pattern && (
        <div className="px-4 py-2 bg-teal-50/90 dark:bg-teal-950/60 border-b border-teal-200 dark:border-teal-900 text-xs text-teal-900 dark:text-teal-200 flex items-center justify-between gap-4">
          <span>
            Arrastra las líneas horizontales superior e inferior sobre el borde exacto del gráfico y ajusta el número de filas en el panel derecho.
          </span>
          <span className="font-mono tabular-nums shrink-0 text-teal-700 dark:text-teal-300">
            {calibration.totalRows} filas
          </span>
        </div>
      )}

      {/* Scrollable Pattern Mat */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto p-6 flex justify-center items-start"
      >
        {!pattern || !activeImageUrl ? (
          <div className="my-auto max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-4">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Carga tu primer patrón de tejido
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Acepta gráficos o patrones completos en formato PDF, PNG o JPG. Luego podrás resaltar la vuelta actual y avanzar con una sola tecla.
            </p>
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
            >
              Subir patrón
            </button>
          </div>
        ) : (
          <div
            ref={sheetRef}
            onClick={handleSheetClick}
            className={`relative bg-white shadow-sm border border-slate-200 dark:border-slate-800 select-none ${
              mode === 'read' ? 'cursor-pointer' : 'cursor-default'
            }`}
            style={{
              width: `${Math.round(780 * zoom)}px`,
              maxWidth: zoom <= 1 ? '100%' : 'none',
            }}
          >
            <img
              src={activeImageUrl}
              alt={`Patrón ${pattern.name}, página ${pattern.activePage}`}
              draggable={false}
              className="block w-full h-auto"
            />

            {/* Reading Mode Highlight Curtains & Active Band */}
            {mode === 'read' && (
              <>
                {renderHighlightCurtains()}

                <div
                  ref={activeBandRef}
                  aria-label={`Fila activa ${rowInfo.displayLabel}`}
                  className={`absolute pointer-events-none border-2 ${colorTheme.border} ${colorTheme.fill} transition-all duration-150 ease-out`}
                  style={{
                    top: `${rowBand.topPct}%`,
                    height: `${rowBand.heightPct}%`,
                    left: `${calibration.leftPct}%`,
                    width: `${calibration.rightPct - calibration.leftPct}%`,
                  }}
                >
                  {/* Side Marker Tag */}
                  <div
                    className={`absolute -left-2 -translate-x-full top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-mono font-semibold tabular-nums rounded shadow-sm whitespace-nowrap ${colorTheme.tagBg}`}
                  >
                    {rowInfo.shortTag}
                  </div>
                </div>
              </>
            )}

            {/* Calibration Overlay */}
            {mode === 'calibrate' && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Outside shade */}
                <div
                  className="absolute inset-x-0 top-0 bg-slate-900/35"
                  style={{ height: `${calibration.topPct}%` }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 bg-slate-900/35"
                  style={{ top: `${calibration.bottomPct}%` }}
                />

                {/* Grid preview box */}
                <div
                  className="absolute border-2 border-teal-600 bg-teal-500/8"
                  style={{
                    top: `${calibration.topPct}%`,
                    height: `${calibration.bottomPct - calibration.topPct}%`,
                    left: `${calibration.leftPct}%`,
                    width: `${calibration.rightPct - calibration.leftPct}%`,
                  }}
                >
                  {/* Internal horizontal row guide lines */}
                  {Array.from({ length: Math.max(0, calibration.totalRows - 1) }).map(
                    (_, i) => {
                      const pct = ((i + 1) / calibration.totalRows) * 100;
                      return (
                        <div
                          key={i}
                          className="absolute inset-x-0 border-t border-dashed border-teal-700/65"
                          style={{ top: `${pct}%` }}
                        />
                      );
                    }
                  )}
                </div>

                {/* Top Handle */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDraggingHandle('top');
                  }}
                  style={{
                    top: `${calibration.topPct}%`,
                    left: `${calibration.leftPct}%`,
                    width: `${calibration.rightPct - calibration.leftPct}%`,
                  }}
                  className="absolute -translate-y-1/2 h-5 flex items-center justify-center cursor-ns-resize pointer-events-auto group"
                >
                  <div className="w-full h-0.5 bg-teal-600" />
                  <span className="absolute px-2.5 py-0.5 text-[11px] font-medium text-white bg-teal-700 rounded shadow-sm whitespace-nowrap">
                    Línea superior
                  </span>
                </div>

                {/* Bottom Handle */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDraggingHandle('bottom');
                  }}
                  style={{
                    top: `${calibration.bottomPct}%`,
                    left: `${calibration.leftPct}%`,
                    width: `${calibration.rightPct - calibration.leftPct}%`,
                  }}
                  className="absolute -translate-y-1/2 h-5 flex items-center justify-center cursor-ns-resize pointer-events-auto group"
                >
                  <div className="w-full h-0.5 bg-teal-600" />
                  <span className="absolute px-2.5 py-0.5 text-[11px] font-medium text-white bg-teal-700 rounded shadow-sm whitespace-nowrap">
                    Línea inferior
                  </span>
                </div>

                {/* Left Handle */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDraggingHandle('left');
                  }}
                  style={{
                    top: `${calibration.topPct}%`,
                    height: `${calibration.bottomPct - calibration.topPct}%`,
                    left: `${calibration.leftPct}%`,
                  }}
                  className="absolute -translate-x-1/2 w-4 flex items-center justify-center cursor-ew-resize pointer-events-auto"
                >
                  <div className="h-full w-0.5 bg-teal-600" />
                  <div className="w-2.5 h-8 bg-teal-700 rounded-full border border-white shadow-sm" />
                </div>

                {/* Right Handle */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDraggingHandle('right');
                  }}
                  style={{
                    top: `${calibration.topPct}%`,
                    height: `${calibration.bottomPct - calibration.topPct}%`,
                    left: `${calibration.rightPct}%`,
                  }}
                  className="absolute -translate-x-1/2 w-4 flex items-center justify-center cursor-ew-resize pointer-events-auto"
                >
                  <div className="h-full w-0.5 bg-teal-600" />
                  <div className="w-2.5 h-8 bg-teal-700 rounded-full border border-white shadow-sm" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
