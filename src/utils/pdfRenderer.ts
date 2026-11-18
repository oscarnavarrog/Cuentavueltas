import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PatternSourceType } from '../types/pattern';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface RenderedPatternPages {
  pagesDataUrls: string[];
  pageAspectRatios: number[];
  pageCount: number;
  sourceType: PatternSourceType;
}

export async function renderPdfFromArrayBuffer(
  buffer: ArrayBuffer,
  maxPages = 12
): Promise<RenderedPatternPages> {
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDoc = await loadingTask.promise;
  const totalPages = Math.min(pdfDoc.numPages, maxPages);
  const pagesDataUrls: string[] = [];
  const pageAspectRatios: number[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    // Target ~1600px width for crisp zoomable stitch symbols without excessive memory
    const targetScale = Math.min(3, Math.max(1.8, 1650 / baseViewport.width));
    const viewport = page.getViewport({ scale: targetScale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo crear el contexto de lienzo para renderizar el PDF.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvas,
      canvasContext: ctx,
      viewport,
    }).promise;

    pagesDataUrls.push(canvas.toDataURL('image/png'));
    pageAspectRatios.push(canvas.width / canvas.height);
  }

  return {
    pagesDataUrls,
    pageAspectRatios,
    pageCount: pdfDoc.numPages,
    sourceType: 'pdf',
  };
}

export async function loadImageFileToDataUrl(
  file: File
): Promise<RenderedPatternPages> {
  const ext = file.name.toLowerCase();
  const sourceType: PatternSourceType =
    ext.endsWith('.png') || file.type === 'image/png' ? 'png' : 'jpg';

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('No se pudo leer la imagen.'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });

  const aspect = await new Promise<number>((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 0.75);
    };
    img.onerror = () => resolve(0.75);
    img.src = dataUrl;
  });

  return {
    pagesDataUrls: [dataUrl],
    pageAspectRatios: [aspect],
    pageCount: 1,
    sourceType,
  };
}
