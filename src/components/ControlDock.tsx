import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Keyboard,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import type { GridCalibration, KeyBindings, PatternRecord } from '../types/pattern';
import { formatShortKeyCap } from '../utils/keyboard';
import { getRowDisplayInfo } from '../utils/rowLabel';

interface ControlDockProps {
  pattern: PatternRecord | null;
  calibration: GridCalibration;
  keyBindings: KeyBindings;
  onNextRow: () => void;
  onPrevRow: () => void;
  onResetRow: () => void;
  onChangeRepeat: (delta: number) => void;
  onToggleAutoRepeat: () => void;
  onUpdateCalibration: (patch: Partial<GridCalibration>) => void;
  onOpenShortcuts: () => void;
}

export function ControlDock({
  pattern,
  calibration,
  keyBindings,
  onNextRow,
  onPrevRow,
  onResetRow,
  onChangeRepeat,
  onToggleAutoRepeat,
  onUpdateCalibration,
  onOpenShortcuts,
}: ControlDockProps) {
  if (!pattern) {
    return (
      <aside className="w-full lg:w-76 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Selecciona o sube un patrón para comenzar.
      </aside>
    );
  }

  const info = getRowDisplayInfo(pattern.currentRow, calibration);
  const nextCap = formatShortKeyCap(keyBindings.nextRow);
  const prevCap = formatShortKeyCap(keyBindings.prevRow);

  return (
    <aside className="w-full lg:w-76 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col lg:h-full overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
      {/* Active Row Readout & Stepper */}
      <div className="p-5 space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Posición actual
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                {info.displayLabel}
              </span>
              {info.passLabel && (
                <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
                  {info.passLabel}
                </span>
              )}
            </div>
          </div>

          <div className="text-right font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            <div>
              Fila {info.physicalRow} / {info.totalRows}
            </div>
            <div>{info.progressPct}%</div>
          </div>
        </div>

        {/* Clean Progress Track */}
        <div
          className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={info.physicalRow}
          aria-valuemin={1}
          aria-valuemax={info.totalRows}
        >
          <div
            className="h-full bg-teal-700 dark:bg-teal-500 transition-[width] duration-150 ease-out"
            style={{ width: `${info.progressPct}%` }}
          />
        </div>

        {/* Primary Next / Prev Controls */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onNextRow();
            }}
            className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-lg font-semibold text-sm flex items-center justify-between transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <span className="inline-flex items-center gap-2">
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
              <span>Siguiente vuelta</span>
            </span>
            <kbd className="px-2 py-0.5 text-xs font-mono bg-teal-900/40 dark:bg-teal-950/50 rounded border border-teal-500/40">
              {nextCap}
            </kbd>
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onPrevRow();
              }}
              className="col-span-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg font-medium text-sm flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5">
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
                <span>Anterior</span>
              </span>
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                {prevCap}
              </kbd>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onResetRow();
              }}
              title="Volver a la primera vuelta"
              className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-xs inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Inicio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Repeat Counter */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Repeticiones del motivo
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onChangeRepeat(-1);
              }}
              disabled={pattern.repeatCount <= 1}
              aria-label="Disminuir repetición"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="w-8 text-center font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {pattern.repeatCount}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onChangeRepeat(1);
              }}
              aria-label="Aumentar repetición"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
          <span>Reiniciar al terminar gráfico</span>
          <input
            type="checkbox"
            checked={pattern.autoRepeat}
            onChange={(e) => {
              e.currentTarget.blur();
              onToggleAutoRepeat();
            }}
            className="w-4 h-4 accent-teal-700 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Grid & Row Configuration */}
      <div className="p-5 space-y-4">
        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Ajustes de las filas
        </h3>

        {/* Total Rows */}
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="total-rows-input"
            className="text-xs text-slate-600 dark:text-slate-400"
          >
            Filas en el gráfico
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onUpdateCalibration({
                  totalRows: Math.max(1, calibration.totalRows - 1),
                });
              }}
              aria-label="Restar fila"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <input
              id="total-rows-input"
              type="number"
              min={1}
              max={200}
              value={calibration.totalRows}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!Number.isNaN(val)) {
                  onUpdateCalibration({
                    totalRows: Math.max(1, Math.min(200, val)),
                  });
                }
              }}
              className="w-12 h-7 text-center font-mono text-xs tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600"
            />
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onUpdateCalibration({
                  totalRows: Math.min(200, calibration.totalRows + 1),
                });
              }}
              aria-label="Sumar fila"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Direction */}
        <div className="space-y-1.5">
          <span className="block text-xs text-slate-600 dark:text-slate-400">
            Dirección de lectura
          </span>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onUpdateCalibration({ direction: 'bottom-to-top' });
              }}
              className={`py-1.5 px-2 text-xs font-medium rounded-md inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
                calibration.direction === 'bottom-to-top'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowUp className="w-3 h-3" aria-hidden="true" />
              <span>Abajo → Arriba</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onUpdateCalibration({ direction: 'top-to-bottom' });
              }}
              className={`py-1.5 px-2 text-xs font-medium rounded-md inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
                calibration.direction === 'top-to-bottom'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowDown className="w-3 h-3" aria-hidden="true" />
              <span>Arriba → Abajo</span>
            </button>
          </div>
        </div>

        {/* Passes per numbered row (1 vs 2 for Brioche/Mosaic) */}
        <div className="space-y-1.5">
          <span className="block text-xs text-slate-600 dark:text-slate-400">
            Pasadas por vuelta numerada
          </span>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onUpdateCalibration({ passesPerRow: 1 });
              }}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                calibration.passesPerRow === 1
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              1 pasada
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onUpdateCalibration({ passesPerRow: 2 });
              }}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                calibration.passesPerRow === 2
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              2 pasadas (A·B)
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Summary Link */}
      <div className="p-5">
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onOpenShortcuts();
          }}
          className="w-full py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg inline-flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>Configurar teclas</span>
          </span>
          <span className="font-mono text-slate-500 dark:text-slate-400">
            {nextCap} / {prevCap}
          </span>
        </button>
      </div>
    </aside>
  );
}
