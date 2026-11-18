import { Plus } from 'lucide-react';

export type WorkspaceMode = 'read' | 'calibrate';

interface TopBarProps {
  mode: WorkspaceMode;
  onChangeMode: (mode: WorkspaceMode) => void;
  onOpenShortcuts: () => void;
  onOpenUpload: () => void;
  hasActivePattern: boolean;
}

export function TopBar({
  mode,
  onChangeMode,
  onOpenShortcuts,
  onOpenUpload,
  hasActivePattern,
}: TopBarProps) {
  return (
    <header className="h-14 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 flex items-center justify-between gap-8">
      {/* Zone 1: Brand wordmark */}
      <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
        Marcavueltas
      </span>

      {/* Zone 2: Clean single-line navigation links */}
      <nav
        aria-label="Modos de trabajo"
        className="flex items-center gap-6 text-sm font-medium"
      >
        <button
          type="button"
          onClick={() => onChangeMode('read')}
          className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 ${
            mode === 'read'
              ? 'border-teal-700 text-slate-900 dark:border-teal-400 dark:text-slate-100'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          Lectura
        </button>

        <button
          type="button"
          disabled={!hasActivePattern}
          onClick={() => onChangeMode('calibrate')}
          className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 ${
            mode === 'calibrate'
              ? 'border-teal-700 text-slate-900 dark:border-teal-400 dark:text-slate-100'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          Calibrar filas
        </button>

        <button
          type="button"
          onClick={onOpenShortcuts}
          className="py-1 whitespace-nowrap shrink-0 border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
        >
          Atajos
        </button>
      </nav>

      {/* Zone 3: Primary action */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Subir patrón</span>
        </button>
      </div>
    </header>
  );
}
