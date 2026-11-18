import { FileImage, FileText, Trash2, Upload } from 'lucide-react';
import type { PatternRecord } from '../types/pattern';
import { DEFAULT_CALIBRATION } from '../types/pattern';
import { getRowDisplayInfo } from '../utils/rowLabel';

interface PatternSidebarProps {
  patterns: PatternRecord[];
  activePatternId: string | null;
  onSelectPattern: (id: string) => void;
  onDeletePattern: (id: string) => void;
  onOpenUpload: () => void;
  notes: string;
  onChangeNotes: (notes: string) => void;
  onRestoreSample: () => void;
  hasSample: boolean;
}

export function PatternSidebar({
  patterns,
  activePatternId,
  onSelectPattern,
  onDeletePattern,
  onOpenUpload,
  notes,
  onChangeNotes,
  onRestoreSample,
  hasSample,
}: PatternSidebarProps) {
  return (
    <aside className="w-68 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Mis patrones
        </h2>
        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Añadir</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
        {patterns.length === 0 ? (
          <div className="p-5 text-sm text-slate-500 dark:text-slate-400 space-y-3">
            <p>Aún no hay patrones guardados.</p>
            <button
              type="button"
              onClick={onOpenUpload}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
            >
              Importar PDF, PNG o JPG
            </button>
          </div>
        ) : (
          patterns.map((pattern) => {
            const isActive = pattern.id === activePatternId;
            const cal =
              pattern.calibrationByPage[pattern.activePage] ?? DEFAULT_CALIBRATION;
            const rowInfo = getRowDisplayInfo(pattern.currentRow, cal);

            return (
              <div
                key={pattern.id}
                className={`group relative flex items-start gap-3 px-4 py-3.5 transition-colors ${
                  isActive
                    ? 'bg-slate-100/90 dark:bg-slate-800/80'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectPattern(pattern.id)}
                  className="flex-1 min-w-0 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600 rounded"
                >
                  <div className="flex items-center gap-2">
                    {pattern.sourceType === 'pdf' ? (
                      <FileText
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-teal-700 dark:text-teal-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                        aria-hidden="true"
                      />
                    ) : (
                      <FileImage
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-teal-700 dark:text-teal-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`text-sm font-medium truncate ${
                        isActive
                          ? 'text-slate-900 dark:text-slate-50'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {pattern.name}
                    </span>
                  </div>

                  <div className="mt-1 pl-6 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                    <span>{pattern.sourceType.toUpperCase()}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {rowInfo.displayLabel}
                      {rowInfo.passLabel ? ` (${rowInfo.shortTag})` : ''}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {pattern.currentRow}/{cal.totalRows}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onDeletePattern(pattern.id)}
                  title="Eliminar patrón"
                  aria-label={`Eliminar ${pattern.name}`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-opacity cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            );
          })
        )}

        {!hasSample && (
          <div className="p-4">
            <button
              type="button"
              onClick={onRestoreSample}
              className="w-full py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Restaurar ejemplo Cuello Gades
            </button>
          </div>
        )}
      </div>

      {/* Project Notes */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
        <label
          htmlFor="pattern-notes"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
        >
          Notas del proyecto
        </label>
        <textarea
          id="pattern-notes"
          rows={3}
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="Agujas, grosor de lana, recordatorios de talla..."
          disabled={!activePatternId}
          className="w-full text-xs leading-relaxed text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 resize-none focus:outline-none focus:border-teal-600 dark:focus:border-teal-500 disabled:opacity-50"
        />
      </div>
    </aside>
  );
}
