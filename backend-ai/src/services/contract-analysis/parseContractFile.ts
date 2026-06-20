// Pure-Node PDF rasterizer + Arabic OCR — no system binaries required.
//
// Pipeline:
//   PDF buffer -> pdfjs-dist (renders page) -> @napi-rs/canvas (prebuilt
//   native canvas, no compile step) -> JPEG base64 -> tesseract.js (WASM
//   Arabic OCR) -> RasterizedPage { base64, ocrText, pageNumber }
//
// Why OCR instead of sending images straight to the LLM? Vision models
// reliably hallucinate plausible-but-wrong Arabic company names from
// scanned stamp images. Tesseract reads the actual pixel characters and
// returns exact strings; that text is then handed to the LLM, which
// structures it at a fraction of the token cost. The vision-only path is
// still available via AI_SCAN_INPUT_MODE=vision.

// pdfjs-dist expects a package called "canvas" at runtime. Redirect that
// require to @napi-rs/canvas (prebuilt binaries) so the Docker image needs
// no native build step.
import Module from "module";
const _originalLoad = (Module as any)._load.bind(Module);
(Module as any)._load = function (
  request: string,
  parent: unknown,
  isMain: boolean,
) {
  if (request === "canvas") {
    const { createCanvas, ImageData } = require("@napi-rs/canvas");
    return { createCanvas, ImageData };
  }
  return _originalLoad(request, parent, isMain);
};

import fs from "fs";
import os from "os";
import path from "path";
import axios from "axios";
// MUST be imported after the canvas polyfill above
import { createCanvas } from "@napi-rs/canvas";
import Tesseract from "tesseract.js";
import { aiConfig } from "../../config/aiConfig";

type PdfJsLib = {
  getDocument: (src: { data: Uint8Array; isEvalSupported?: boolean }) => {
    promise: Promise<any>;
  };
};

// Lazy + cached so the ESM import only happens once per process
let pdfjsLibPromise: Promise<PdfJsLib> | null = null;

async function getPdfjsLib(): Promise<PdfJsLib> {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise =
      import("pdfjs-dist/legacy/build/pdf.mjs") as Promise<PdfJsLib>;
  }
  return pdfjsLibPromise;
}

// Tesseract.js downloads ara.traineddata / eng.traineddata on first use and
// caches them in process.cwd() by default. Point its cache at /tmp so the
// data never lands inside the project working directory.
const TESS_CACHE_DIR = path.join(os.tmpdir(), "tessdata");
if (!fs.existsSync(TESS_CACHE_DIR)) {
  fs.mkdirSync(TESS_CACHE_DIR, { recursive: true });
}

export interface RasterizedPage {
  // base64 JPEG for scanned pages, empty string for text-layer pages
  base64: string;
  // Text-layer content OR raw Arabic text extracted by Tesseract
  ocrText: string;
  pageNumber: number;
}

export interface ParseResult {
  pages: RasterizedPage[];
  // true when at least one page had no extractable text layer (i.e. a scan)
  isScanned: boolean;
  // Original PDF kept around for Gemini native document understanding
  sourcePdfBase64: string;
}

// Pool of Tesseract workers — concurrency limited so we don't OOM the WASM heap
async function createOcrScheduler(
  concurrency: number,
): Promise<Tesseract.Scheduler> {
  const scheduler = Tesseract.createScheduler();
  const workerCount = Math.max(1, concurrency);

  for (let index = 0; index < workerCount; index += 1) {
    // OEM.LSTM_ONLY = more accurate neural-net engine.
    // PSM.AUTO = fully automatic page segmentation (best for mixed Arabic docs).
    const worker = await Tesseract.createWorker(
      "ara+eng",
      Tesseract.OEM.LSTM_ONLY,
      {
        logger: () => {},
        cachePath: TESS_CACHE_DIR,
      },
    );
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    });
    scheduler.addWorker(worker);
  }

  return scheduler;
}

// Recognize one rasterized page. Empty string on failure so the pipeline
// keeps running with a degraded result rather than aborting the whole run.
async function ocrPage(
  scheduler: Tesseract.Scheduler,
  jpegBuffer: Buffer,
  pageNum: number,
): Promise<string> {
  const startedAt = Date.now();
  try {
    const {
      data: { text },
    } = await scheduler.addJob("recognize", jpegBuffer);

    // Normalize whitespace — Tesseract sometimes emits long runs of spaces/tabs
    const normalized = text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
    console.log(
      `[parse:ocr] page=${pageNum} durationMs=${Date.now() - startedAt} chars=${normalized.length}`,
    );
    return normalized;
  } catch (err) {
    console.warn(
      `[parse:ocr] page=${pageNum} durationMs=${Date.now() - startedAt} ` +
        `failure=ocr_error message=${(err as Error).message}`,
    );
    return "";
  }
}

// Fast path — extract the text layer if pdfjs sees one. No rasterization, no OCR.
async function extractTextLayerPage(
  pdfDocument: any,
  pageNum: number,
): Promise<RasterizedPage> {
  const startedAt = Date.now();
  const page = await pdfDocument.getPage(pageNum);
  const textContent = await page.getTextContent();
  const lines: string[] = [];
  let currentLine = "";

  // pdfjs emits text items in display order with hasEOL hints we use to
  // reconstruct logical lines.
  for (const item of textContent.items as Array<{
    str?: string;
    hasEOL?: boolean;
  }>) {
    const text = item.str?.trim();
    if (text) currentLine += `${currentLine ? " " : ""}${text}`;
    if (item.hasEOL && currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }
  }
  if (currentLine) lines.push(currentLine);

  const extractedText = lines.join("\n").trim();
  console.log(
    `[parse:text] page=${pageNum} durationMs=${Date.now() - startedAt} chars=${extractedText.length}`,
  );
  return { base64: "", ocrText: extractedText, pageNumber: pageNum };
}

// Render one page to a JPEG. Higher DPI when destined for OCR than for vision.
async function rasterizePage(
  pdfDocument: any,
  pageNum: number,
  forOcr: boolean,
): Promise<RasterizedPage> {
  const page = await pdfDocument.getPage(pageNum);

  // 2.5x scale for OCR (sharper characters), 1.8x for vision (smaller payload)
  const viewport = page.getViewport({ scale: forOcr ? 2.5 : 1.8 });
  const width = Math.floor(viewport.width);
  const height = Math.floor(viewport.height);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Force white background — many PDFs have a transparent canvas
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  // JPEG quality 95 for OCR (preserve detail), 85 for vision (smaller payload)
  const jpegBuffer = await canvas.encode("jpeg", forOcr ? 95 : 85);
  console.log(
    `[parse:render] page=${pageNum} renderedKb=${Math.round(jpegBuffer.length / 1024)} mode=${forOcr ? "ocr" : "vision"}`,
  );
  return {
    base64: jpegBuffer.toString("base64"),
    ocrText: "",
    pageNumber: pageNum,
  };
}

async function rasterizeAndOcrPage(
  pdfDocument: any,
  pageNum: number,
  scheduler: Tesseract.Scheduler,
): Promise<RasterizedPage> {
  const rendered = await rasterizePage(pdfDocument, pageNum, true);
  const jpegBuffer = Buffer.from(rendered.base64, "base64");
  const ocrText = await ocrPage(scheduler, jpegBuffer, pageNum);
  return { ...rendered, ocrText };
}

// Simple worker-pool implementation. Concurrency keeps the GC + WASM heap
// happy on large PDFs by not running every page in parallel.
async function mapWithConcurrency<T>(
  items: number[],
  concurrency: number,
  worker: (item: number) => Promise<T>,
): Promise<T[]> {
  const results = new Array<T>(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () =>
      runWorker(),
    ),
  );
  return results;
}

// Converts every page of a PDF into a rasterized JPEG + OCR text.
// Accepts either a URL string (downloaded via axios) or a Buffer already in
// memory. Returns pages + isScanned so callers can decide whether the result
// needs human review.
export async function parseContractFile(
  fileUrlOrBuffer: string | Buffer,
): Promise<ParseResult> {
  const parseStartedAt = Date.now();
  let pdfBuffer: Buffer;

  if (Buffer.isBuffer(fileUrlOrBuffer)) {
    pdfBuffer = fileUrlOrBuffer;
  } else {
    // URL path — fetch over HTTP. Only PDFs are accepted.
    const ext = fileUrlOrBuffer.split("?")[0].split(".").pop()?.toLowerCase();
    if (ext !== "pdf") {
      throw new Error(`Unsupported file type: ${ext}. Only PDF is accepted.`);
    }
    const response = await axios.get<ArrayBuffer>(fileUrlOrBuffer, {
      responseType: "arraybuffer",
    });
    pdfBuffer = Buffer.from(response.data);
  }

  // Validate PDF magic bytes ('%PDF' = 0x25504446) before handing to pdf.js,
  // so a non-PDF returns a clean error rather than a cryptic parser stack.
  if (!pdfBuffer.toString("hex", 0, 4).startsWith("25504446")) {
    throw new Error("Invalid file: does not start with a PDF signature.");
  }
  if (pdfBuffer.length === 0) {
    throw new Error("PDF file is empty.");
  }

  // SECURITY: isEvalSupported=false disables pdf.js's eval-based optimization,
  // closing a known unsafe-eval surface.
  const pdfjsLib = await getPdfjsLib();
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    isEvalSupported: false,
  }).promise;
  const totalPages: number = doc.numPages;

  // Pass 1 — try the text layer on every page (cheap)
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );
  const pages = await mapWithConcurrency(pageNumbers, 4, (pageNum) =>
    extractTextLayerPage(doc, pageNum),
  );

  // Any page with zero extracted text is treated as a scan
  const scannedPageNumbers = pages
    .filter((page) => page.ocrText.length === 0)
    .map((page) => page.pageNumber);
  const isScanned = scannedPageNumbers.length > 0;

  console.log(
    `[parse] PDF loaded — ${totalPages} page(s), OCR pages=${scannedPageNumbers.length}`,
  );

  // Pass 2 — scanned pages. Either rasterize for vision-model input, or
  // rasterize + run local OCR, per AI_SCAN_INPUT_MODE.
  if (scannedPageNumbers.length > 0) {
    if (aiConfig.scanInputMode === "vision") {
      // Vision path — just rasterize, the LLM reads the image directly
      const visionPages = await mapWithConcurrency(
        scannedPageNumbers,
        4,
        (pageNum) => rasterizePage(doc, pageNum, false),
      );
      for (const visionPage of visionPages) {
        pages[visionPage.pageNumber - 1] = visionPage;
      }
    } else {
      // OCR path — rasterize then run Tesseract. Concurrency=2 to keep the
      // WASM heap small; scheduler is terminated even on error.
      const scheduler = await createOcrScheduler(2);
      try {
        const ocrPages = await mapWithConcurrency(
          scannedPageNumbers,
          2,
          (pageNum) => rasterizeAndOcrPage(doc, pageNum, scheduler),
        );
        for (const ocrResult of ocrPages) {
          pages[ocrResult.pageNumber - 1] = ocrResult;
        }
      } finally {
        await scheduler.terminate();
      }
    }
  }

  console.log(
    `[parse] completed pages=${totalPages} scanned=${isScanned} durationMs=${Date.now() - parseStartedAt}`,
  );

  return {
    pages,
    isScanned,
    sourcePdfBase64: pdfBuffer.toString("base64"),
  };
}

// ── Redirect Tesseract traineddata cache to /tmp so files never appear
//    in the project working directory (resolves the eng/ara.traineddata issue).
const TESS_CACHE_DIR = path.join(os.tmpdir(), "tessdata");
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
    const {
      data: { text },
    } = await Tesseract.recognize(
      jpegBuffer,
      "ara+eng", // Arabic primary, English for numbers/codes
      {
        logger: () => {}, // suppress per-step progress logs
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        // Redirect traineddata cache away from cwd → /tmp/tessdata
        cachePath: TESS_CACHE_DIR,
      } as any,
    );
    // Normalize: collapse excess whitespace, trim
    return text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  } catch (err) {
    console.warn(
      `[parse:ocr] Page ${pageNum} OCR failed, using empty text:`,
      (err as Error).message,
    );
    return "";
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
    const ext = fileUrlOrBuffer.split("?")[0].split(".").pop()?.toLowerCase();
    if (ext !== "pdf") {
      throw new Error(`Unsupported file type: ${ext}. Only PDF is accepted.`);
    }
    const response = await axios.get<ArrayBuffer>(fileUrlOrBuffer, {
      responseType: "arraybuffer",
    });
    pdfBuffer = Buffer.from(response.data);
  }

  // Validate PDF magic bytes (%PDF = 0x25504446)
  if (!pdfBuffer.toString("hex", 0, 4).startsWith("25504446")) {
    throw new Error("Invalid file: does not start with a PDF signature.");
  }
  if (pdfBuffer.length === 0) {
    throw new Error("PDF file is empty.");
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
  console.log(
    `[parse] PDF loaded — ${totalPages} page(s), scanned=${isScanned}`,
  );

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
    const ctx = canvas.getContext("2d");

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    // JPEG quality 95 for scanned docs (higher quality = better OCR accuracy)
    // quality 92 for text PDFs
    const quality = isScanned ? 95 : 92;
    const jpegBuffer = await canvas.encode("jpeg", quality);
    const base64 = jpegBuffer.toString("base64");

    // ── OCR step: extract Arabic text from the rendered page image ──
    const ocrText = await ocrPage(jpegBuffer, pageNum);

    pages.push({ base64, ocrText, pageNumber: pageNum });
    console.log(
      `[parse] Page ${pageNum}/${totalPages} rendered (${Math.round(jpegBuffer.length / 1024)} KB) | OCR: ${ocrText.length} chars`,
    );
  }

  return { pages, isScanned };
}
