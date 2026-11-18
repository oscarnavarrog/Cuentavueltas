import { FileUp, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { PatternRecord, RowDirection } from '../types/pattern';
import { detectChartGrid } from '../utils/gridDetector';
import {
  loadImageFileToDataUrl,
  renderPdfFromArrayBuffer,
} from '../utils/pdfRenderer';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onPatternCreated: (pattern: PatternRecord) => void;
}

export function UploadModal({
  open,
  onClose,
  onPatternCreated,
}: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [direction, setDirection] = useState<RowDirection>('bottom-to-top');
  const [passesPerRow, setPassesPerRow] = useState<1 | 2>(1);

  if (!open) return null;

  const processFile = async (file: File) => {
    setError(null);
    const lower = file.name.toLowerCase();
    const isPdf = lower.endsWith('.pdf') || file.type === 'application/pdf';
    const isImage =
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      file.type === 'image/png' ||
      file.type === 'image/jpeg';

    if (!isPdf && !isImage) {
      setError('Formato no compatible. Sube un archivo PDF, PNG o JPG.');
      return;
    }

    setLoading(true);
    try {
      const rendered = isPdf
        ? await renderPdfFromArrayBuffer(await file.arrayBuffer())
        : await loadImageFileToDataUrl(file);

      const firstPageCal = await detectChartGrid(rendered.pagesDataUrls[0], {
        direction,
        passesPerRow,
      });

      const calibrationByPage: PatternRecord['calibrationByPage'] = {
        1: firstPageCal,
      };
      for (let p = 2; p <= rendered.pagesDataUrls.length; p++) {
        calibrationByPage[p] = await detectChartGrid(
          rendered.pagesDataUrls[p - 1],
          { direction, passesPerRow }
        );
      }

      const cleanTitle =
        customName.trim() ||
        file.name.replace(/\.(pdf|png|jpe?g)$/i, '').replace(/[_-]+/g, ' ');

      const now = Date.now();
      const record: PatternRecord = {
        id: `pattern-${now}-${Math.random().toString(36).slice(2, 7)}`,
        name: cleanTitle,
        fileName: file.name,
        sourceType: rendered.sourceType,
        pageCount: rendered.pagesDataUrls.length,
        activePage: 1,
        pagesDataUrls: rendered.pagesDataUrls,
        pageAspectRatios: rendered.pageAspectRatios,
        calibrationByPage,
        currentRow: 1,
        repeatCount: 1,
        autoRepeat: false,
        notes: '',
        createdAt: now,
        updatedAt: now,
      };

      onPatternCreated(record);
      setCustomName('');
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo procesar el archivo seleccionado.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2
            id="upload-modal-title"
            className="font-display text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            Importar nuevo patrón
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="pattern-name-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Nombre del proyecto (opcional)
            </label>
            <input
              id="pattern-name-input"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ej. Jersey Brioche · Canesú"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Dirección inicial
              </span>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as RowDirection)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600"
              >
                <option value="bottom-to-top">Abajo → Arriba (gráficos)</option>
                <option value="top-to-bottom">Arriba → Abajo (texto)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Pasadas por vuelta
              </span>
              <select
                value={passesPerRow}
                onChange={(e) =>
                  setPassesPerRow(Number(e.target.value) as 1 | 2)
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600"
              >
                <option value={1}>1 pasada por vuelta</option>
                <option value={2}>2 pasadas A·B (Brioche)</option>
              </select>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files[0];
              if (dropped) void processFile(dropped);
            }}
            onClick={() => !loading && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragging
                ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40'
                : 'border-slate-300 dark:border-slate-700 hover:border-teal-600/70 bg-slate-50/60 dark:bg-slate-950/60'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void processFile(file);
                e.target.value = '';
              }}
            />

            {loading ? (
              <div className="flex flex-col items-center gap-2 text-teal-700 dark:text-teal-400">
                <Loader2 className="w-7 h-7 animate-spin" aria-hidden="true" />
                <span className="text-sm font-medium">
                  Procesando patrón y detectando líneas...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileUp
                  className="w-7 h-7 text-teal-700 dark:text-teal-400"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Arrastra tu patrón aquí o haz clic para seleccionarlo
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Formatos admitidos: PDF · PNG · JPG
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
