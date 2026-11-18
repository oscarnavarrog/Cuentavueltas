import { RotateCcw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { KeyBindings } from '../types/pattern';
import { DEFAULT_SETTINGS } from '../types/pattern';
import { formatKeyCode } from '../utils/keyboard';

interface ShortcutsModalProps {
  open: boolean;
  keyBindings: KeyBindings;
  onSave: (bindings: KeyBindings) => void;
  onClose: () => void;
}

export function ShortcutsModal({
  open,
  keyBindings,
  onSave,
  onClose,
}: ShortcutsModalProps) {
  const [capturing, setCapturing] = useState<'nextRow' | 'prevRow' | null>(
    null
  );

  useEffect(() => {
    if (!open || !capturing) return;

    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.code === 'Escape') {
        setCapturing(null);
        return;
      }

      // Ignore bare modifier keys
      if (
        ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(
          e.code
        )
      ) {
        return;
      }

      const next: KeyBindings = { ...keyBindings };
      if (capturing === 'nextRow') {
        if (next.prevRow === e.code) {
          next.prevRow = keyBindings.nextRow;
        }
        next.nextRow = e.code;
      } else {
        if (next.nextRow === e.code) {
          next.nextRow = keyBindings.prevRow;
        }
        next.prevRow = e.code;
      }
      onSave(next);
      setCapturing(null);
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [open, capturing, keyBindings, onSave]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2
            id="shortcuts-modal-title"
            className="font-display text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            Atajos de teclado
          </h2>
          <button
            type="button"
            onClick={() => {
              setCapturing(null);
              onClose();
            }}
            aria-label="Cerrar"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Personaliza las teclas para avanzar o retroceder de vuelta sin soltar las agujas. También funcionan siempre las flechas ↑ y ↓.
          </p>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Avanzar a la siguiente vuelta
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  También: Flecha ↑
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCapturing(capturing === 'nextRow' ? null : 'nextRow')
                }
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                  capturing === 'nextRow'
                    ? 'border-teal-600 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-300'
                }`}
              >
                {capturing === 'nextRow'
                  ? 'Pulsa una tecla...'
                  : formatKeyCode(keyBindings.nextRow)}
              </button>
            </div>

            <div className="px-4 py-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Volver a la vuelta anterior
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  También: Shift + {formatKeyCode(keyBindings.nextRow)} · Flecha ↓
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCapturing(capturing === 'prevRow' ? null : 'prevRow')
                }
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                  capturing === 'prevRow'
                    ? 'border-teal-600 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-300'
                }`}
              >
                {capturing === 'prevRow'
                  ? 'Pulsa una tecla...'
                  : formatKeyCode(keyBindings.prevRow)}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => onSave(DEFAULT_SETTINGS.keyBindings)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Restaurar Espacio / Retroceso</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCapturing(null);
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
