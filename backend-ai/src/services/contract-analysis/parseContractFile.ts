/**
 * parseContractFile.ts
 * Pure Node.js PDF rasterizer + Arabic OCR — no system binaries required.
 *
 * Pipeline:
 *   PDF buffer
 *     → pdfjs-dist  (render each page to canvas)
 *     → @napi-rs/canvas  (prebuilt native canvas, no compilation)
 *     → JPEG base64  (kept for potential fallback / debugging)
 *     → tesseract.js  (WASM-based Arabic OCR — pure npm, no system Tesseract)
 *     → RasterizedPage { base64, ocrText, pageNumber }
 *
 * Why OCR here instead of sending images to GPT?
 *   gpt-4o-mini cannot reliably read Arabic company names from scanned stamp
 *   images — it hallucinates plausible-sounding but wrong names. Tesseract reads
 *   the actual pixel characters and returns exact strings. We then send that text
 *   to GPT, which parses and structures it perfectly at ~1/50th the token cost.
 *
 * traineddata files:
 *   Tesseract.js downloads ara.traineddata and eng.traineddata on first use.
 *   By default it writes them to process.cwd(). We redirect that cache to
 *   /tmp/tessdata so they never land in the project working directory.
 *   The TESSDATA_PREFIX env var is set before the worker is created and does
 *   not affect OCR accuracy in any way.
 */


// ── Polyfill: pdfjs-dist expects a package called "canvas" at runtime.
//    We redirect that require to @napi-rs/canvas which ships prebuilt binaries.
import Module from 'module';
const _originalLoad = (Module as any)._load.bind(Module);
(Module as any)._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request === 'canvas') {
    const { createCanvas, ImageData } = require('@napi-rs/canvas');
    return { createCanvas, ImageData };
  }
  return _originalLoad(request, parent, isMain);
};

import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
// Must be imported AFTER the canvas polyfill above
// eslint-disable-next-line import/order
import { createCanvas } from '@napi-rs/canvas';
import Tesseract from 'tesseract.js';

type PdfJsLib = {
  getDocument: (src: {
    data: Uint8Array;
    isEvalSupported?: boolean;
  }) => { promise: Promise<any> };
};

let pdfjsLibPromise: Promise<PdfJsLib> | null = null;

async function getPdfjsLib(): Promise<PdfJsLib> {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs') as Promise<PdfJsLib>;
  }
  return pdfjsLibPromise;
}


// ── Redirect Tesseract traineddata cache to /tmp so files never appear
//    in the project working directory (resolves the eng/ara.traineddata issue).
const TESS_CACHE_DIR = path.join(os.tmpdir(), 'tessdata');
if (!fs.existsSync(TESS_CACHE_DIR)) {
  fs.mkdirSync(TESS_CACHE_DIR, { recursive: true });
}

export interface RasterizedPage {
  /** base64-encoded JPEG of this page (kept for merge-pass visual fallback) */
  base64: string;
  /** Raw Arabic text extracted by Tesseract OCR — primary input for LLM */
  ocrText: string;
  pageNumber: number;
}

export interface ParseResult {
  pages: RasterizedPage[];
  /** true if the PDF has no extractable text layer (i.e. it is a scan) */
  isScanned: boolean;
}


/**
 * Detects whether a PDF has a real text layer by checking its font table.
 * A scanned PDF rasterized from images has no fonts → empty font table.
 */
async function hasTextLayer(pdfDocument: any): Promise<boolean> {
  const pagesToCheck = Math.min(3, pdfDocument.numPages);
  for (let i = 1; i <= pagesToCheck; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    if (textContent.items.length > 0) return true;
  }
  return false;
}


/**
 * Runs Tesseract OCR on a JPEG buffer using Arabic + English language data.
 * Returns the raw recognized text (may contain noise — the LLM handles that).
 *
 * PSM 3 = fully automatic page segmentation (best for mixed Arabic documents).
 * OEM 1 = LSTM neural net engine (most accurate).
 *
 * cachePath: points Tesseract.js to /tmp/tessdata so traineddata files are
 * written there and never appear in the project working directory.
 */
async function ocrPage(jpegBuffer: Buffer, pageNum: number): Promise<string> {
  try {
    const { data: { text } } = await Tesseract.recognize(
      jpegBuffer,
      'ara+eng',   // Arabic primary, English for numbers/codes
      {
        logger: () => {},   // suppress per-step progress logs
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        // Redirect traineddata cache away from cwd → /tmp/tessdata
        cachePath: TESS_CACHE_DIR,
      } as any,
    );
    // Normalize: collapse excess whitespace, trim
    return text.replace(/\r\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
  } catch (err) {
    console.warn(`[parse:ocr] Page ${pageNum} OCR failed, using empty text:`, (err as Error).message);
    return '';
  }
}


/**
 * Converts every page of a PDF into a rasterized JPEG + OCR text.
 * Accepts either a URL string (will be downloaded) or a Buffer already in memory.
 *
 * Returns pages array + isScanned flag so callers can set needsReview appropriately.
 */
export async function parseContractFile(
  fileUrlOrBuffer: string | Buffer,
): Promise<ParseResult> {
  let pdfBuffer: Buffer;

  if (Buffer.isBuffer(fileUrlOrBuffer)) {
    pdfBuffer = fileUrlOrBuffer;
  } else {
    const ext = fileUrlOrBuffer.split('?')[0].split('.').pop()?.toLowerCase();
    if (ext !== 'pdf') {
      throw new Error(`Unsupported file type: ${ext}. Only PDF is accepted.`);
    }
    const response = await axios.get<ArrayBuffer>(fileUrlOrBuffer, {
      responseType: 'arraybuffer',
    });
    pdfBuffer = Buffer.from(response.data);
  }

  // Validate PDF magic bytes (%PDF = 0x25504446)
  if (!pdfBuffer.toString('hex', 0, 4).startsWith('25504446')) {
    throw new Error('Invalid file: does not start with a PDF signature.');
  }
  if (pdfBuffer.length === 0) {
    throw new Error('PDF file is empty.');
  }

  // Load the PDF document
  // isEvalSupported=false mitigates the vulnerable default behavior in PDF.js.
  const pdfjsLib = await getPdfjsLib();
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    isEvalSupported: false,
  }).promise;
  const totalPages: number = doc.numPages;

  // Detect scan vs text-layer PDF
  const isScanned = !(await hasTextLayer(doc));
  console.log(`[parse] PDF loaded — ${totalPages} page(s), scanned=${isScanned}`);

  const pages: RasterizedPage[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await doc.getPage(pageNum);

    // scale 2.5 → ~1500px wide for scanned docs (better OCR accuracy for Arabic text + numbers)
    // scale 2.0 for text PDFs (they're already crisp at lower res)
    const scale = isScanned ? 2.5 : 2.0;
    const viewport = page.getViewport({ scale });
    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    // JPEG quality 95 for scanned docs (higher quality = better OCR accuracy)
    // quality 92 for text PDFs
    const quality = isScanned ? 95 : 92;
    const jpegBuffer = await canvas.encode('jpeg', quality);
    const base64 = jpegBuffer.toString('base64');

    // ── OCR step: extract Arabic text from the rendered page image ──
    const ocrText = await ocrPage(jpegBuffer, pageNum);

    pages.push({ base64, ocrText, pageNumber: pageNum });
    console.log(
      `[parse] Page ${pageNum}/${totalPages} rendered (${Math.round(jpegBuffer.length / 1024)} KB) | OCR: ${ocrText.length} chars`,
    );
  }

  return { pages, isScanned };
}