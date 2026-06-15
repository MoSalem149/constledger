import OpenAI from "openai";
import { ContractExtraction, PaymentProgress, PaymentTerm } from "../../types";
import { aiConfig } from "../../config/aiConfig";
import { RasterizedPage } from "./parseContractFile";
import { loadOrderSchema } from "./loadOrderSchema";

// Split-task extraction: five focused passes + merge (OrderSchema.md defines output shape).
const ORDER_SCHEMA = loadOrderSchema();

const openai = new OpenAI({ apiKey: aiConfig.apiKey });

const JSON_ONLY = "Output ONLY valid JSON. No markdown fences. No explanation.";

function taskSystem(focus: string): string {
  return `${ORDER_SCHEMA}\n\n---\n\nTASK FOR THIS CALL:\n${focus}\n\n${JSON_ONLY}`;
}

const PROMPT_1A_SYSTEM = taskSystem(`
Extract ONLY from the header/opening pages:
parties, contract_value, currency, start_date, end_date, duration_days.

Arabic cues: الطرف الأول, الطرف الثاني, المالك, قيمة العقد, قيمة التعاقد, تاريخ التعاقد.
Cross-check contract_value digits with Arabic written amount.
duration_days: شهر=30, شهرين=60, ثلاثة أشهر=90.`);

const PROMPT_1A_USER = (pageCount: number) =>
  `OCR text from pages 1–${pageCount}. Return JSON with: parties, contract_value, currency, start_date, end_date, duration_days.`;

const PROMPT_1B_SYSTEM = taskSystem(`
Extract ONLY unit_prices from the BOQ table (مقايسة الأعمال / قائمة الكميات والأسعار).

Table columns: البند | الوحدة | الكمية | سعر الوحدة | الإجمالي.
Math: unit_price × qty = total (lump_sum: qty=1).
Process EVERY data row. Skip headers and الإجمالي العام only.
Never output line total as unit_price.`);

const PROMPT_1B_USER = (pageCount: number) =>
  `OCR text from the last ${pageCount} pages (BOQ section). Return JSON: { "unit_prices": [...] }.`;

const PROMPT_1C_SYSTEM = taskSystem(`
Extract ONLY: payment_terms, payment_schedule, reporting_period, milestones.
Arabic cues: كيفية السداد, البند السادس, دفعة مقدمة, مستخلص, خصم أمانة.
Do NOT extract penalties in this call.`);

const PROMPT_1C_USER = (pageCount: number, contractValue: number | null) =>
  `OCR text from pages 3–${pageCount} (payment clauses).
${contractValue ? `Contract value for amount math: ${contractValue}.` : ""}
Return JSON: payment_terms, payment_schedule, reporting_period, milestones.`;

const PROMPT_1D_SYSTEM = taskSystem(`
Extract ONLY delay penalties as { "delay_penalties": [{ "condition", "penalty" }] }.
Arabic cues: غرامات التأخير, البند التاسع.
Include weekly rate and maximum cap as separate entries when both exist.
If none found, return "delay_penalties": [].`);

const PROMPT_1D_USER = (pageCount: number) =>
  `OCR text from pages 3–${pageCount}. Return JSON with "delay_penalties" array only.`;

const PROMPT_1E_SYSTEM = taskSystem(`
Extract ONLY HSE violations as { "hse_penalties": [{ "condition", "penalty" }] }.
Find table: مخالفات متعلقة بالسلامة والصحة المهنية.
Columns: violation | 1st offence | 2nd offence | 3rd offence.
Each non-empty tier → one object. Skip blank or "---" tiers.
Process ALL rows.`);

const PROMPT_1E_USER = () =>
  `OCR text from HSE/safety section. Return JSON with "hse_penalties" array only.`;

const PROMPT_2_SYSTEM = taskSystem(`
Merge five partial JSON extractions into ONE final object matching the OrderSchema output structure.
Use page 1 image + OCR snippet to verify party names (keep Arabic legal names).

Merge rules:
1. Keep all array entries; remove exact duplicates only.
2. Scalars: prefer non-null; on conflict prefer PARTIAL A.
3. penalties = delay_penalties (D) + hse_penalties (E).
4. Fix unit_price > contract_value (likely a line total).
5. Dates → YYYY-MM-DD. Recompute payment_schedule amounts of 0 using contract_value × %.`);

function pagesToTextBlocks(
  pages: RasterizedPage[],
): OpenAI.Chat.ChatCompletionContentPartText[] {
  return pages.map((p) => ({
    type: "text" as const,
    text: `--- PAGE ${p.pageNumber} ---\n${p.ocrText || "[no OCR text]"}`,
  }));
}

function pageToImageBlock(
  page: RasterizedPage,
): OpenAI.Chat.ChatCompletionContentPartImage {
  return {
    type: "image_url" as const,
    image_url: {
      url: `data:image/jpeg;base64,${page.base64}`,
      detail: "high" as const,
    },
  };
}

async function callModelWithText(
  systemPrompt: string,
  userText: string,
  pages: RasterizedPage[],
  label: string,
  maxTokens = 2048,
): Promise<string> {
  const content: OpenAI.Chat.ChatCompletionContentPart[] = [
    ...pagesToTextBlocks(pages),
    { type: "text", text: userText },
  ];

  const totalChars = pages.reduce((s, p) => s + (p.ocrText?.length ?? 0), 0);
  console.log(
    `[extract:${label}] ${pages.length}p (~${Math.round(totalChars / 4)} tokens) → ${aiConfig.model}`,
  );

  const response = await openai.chat.completions.create({
    model: aiConfig.model,
    temperature: 0,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  console.log(
    `[extract:${label}] tokens — prompt: ${response.usage?.prompt_tokens}, completion: ${response.usage?.completion_tokens}`,
  );
  return raw;
}

async function callModelMerge(
  systemPrompt: string,
  userText: string,
  page1: RasterizedPage,
  label: string,
): Promise<string> {
  const content: OpenAI.Chat.ChatCompletionContentPart[] = [
    pageToImageBlock(page1),
    { type: "text", text: userText },
  ];

  console.log(`[extract:${label}] merge + page 1 image → ${aiConfig.model}`);

  const response = await openai.chat.completions.create({
    model: aiConfig.model,
    temperature: 0,
    max_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  console.log(
    `[extract:${label}] tokens — prompt: ${response.usage?.prompt_tokens}, completion: ${response.usage?.completion_tokens}`,
  );
  return raw;
}

function safeParseJson(raw: string, label: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        /* fall through */
      }
    }
    console.warn(`[extract:${label}] JSON parse failed. Raw: ${raw.substring(0, 200)}`);
    return {};
  }
}

function headerPages(pages: RasterizedPage[]): RasterizedPage[] {
  return pages.slice(0, Math.min(5, pages.length));
}

function boqPages(pages: RasterizedPage[]): RasterizedPage[] {
  return pages.slice(Math.max(0, pages.length - 5));
}

function clausePages(pages: RasterizedPage[]): RasterizedPage[] {
  const start = Math.min(2, pages.length);
  const end = Math.max(start + 1, pages.length - 1);
  return pages.slice(start, end);
}

function hsePages(pages: RasterizedPage[]): RasterizedPage[] {
  return pages.slice(Math.max(0, pages.length - 4));
}

function normalizePaymentProgress(raw: unknown): PaymentProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const progress = raw as Partial<PaymentProgress>;
  const basis =
    typeof progress.basis === "string" ? progress.basis.trim() : null;
  const frequency =
    typeof progress.frequency === "number" ? progress.frequency : null;
  const dueTo = typeof progress.dueTo === "number" ? progress.dueTo : null;

  if (!basis && frequency === null && dueTo === null) return null;
  return { basis, frequency, dueTo };
}

function normalizePaymentTerms(raw: unknown): PaymentTerm[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => item && typeof item === "object" && "name" in item)
      .map((item) => {
        const term = item as Partial<PaymentTerm> & { paymentProgress?: unknown };
        return {
          name: String(term.name ?? "").trim(),
          percentage:
            typeof term.percentage === "number" ? term.percentage : null,
          description:
            typeof term.description === "string" ? term.description.trim() : null,
        };
      })
      .filter((term) => term.name.length > 0);
  }

  if (typeof raw === "string" && raw.trim()) {
    return [{ name: "Summary", percentage: null, description: raw.trim() }];
  }

  return [];
}

function normalizeExtraction(raw: Partial<ContractExtraction>): ContractExtraction {
  return {
    parties: Array.isArray(raw.parties) ? raw.parties : [],
    contract_value: raw.contract_value ?? null,
    currency: raw.currency ?? null,
    unit_prices: Array.isArray(raw.unit_prices) ? raw.unit_prices : [],
    paymentProgress: normalizePaymentProgress(raw.paymentProgress),
    payment_terms: normalizePaymentTerms(raw.payment_terms),
    payment_schedule: Array.isArray(raw.payment_schedule) ? raw.payment_schedule : [],
    start_date: raw.start_date ?? null,
    end_date: raw.end_date ?? null,
    duration_days: raw.duration_days ?? null,
    reporting_period: raw.reporting_period ?? null,
    milestones: Array.isArray(raw.milestones) ? raw.milestones : [],
    penalties: Array.isArray(raw.penalties) ? raw.penalties : [],
  };
}

async function runExtraction(pages: RasterizedPage[]): Promise<ContractExtraction> {
  const hPages = headerPages(pages);
  const bPages = boqPages(pages);
  const cPages = clausePages(pages);
  const ePages = hsePages(pages);

  console.log(
    `[extract] OrderSchema split-task — header:${hPages.length}p, BOQ:${bPages.length}p, ` +
      `clauses:${cPages.length}p, HSE:${ePages.length}p`,
  );

  const [rawA, rawB, rawC, rawD, rawE] = await Promise.all([
    callModelWithText(PROMPT_1A_SYSTEM, PROMPT_1A_USER(hPages.length), hPages, "1A-header"),
    callModelWithText(PROMPT_1B_SYSTEM, PROMPT_1B_USER(bPages.length), bPages, "1B-boq", 4096),
    callModelWithText(PROMPT_1C_SYSTEM, PROMPT_1C_USER(cPages.length, null), cPages, "1C-payment"),
    callModelWithText(PROMPT_1D_SYSTEM, PROMPT_1D_USER(cPages.length), cPages, "1D-delay"),
    callModelWithText(PROMPT_1E_SYSTEM, PROMPT_1E_USER(), ePages, "1E-hse", 4096),
  ]);

  const partA = safeParseJson(rawA, "1A");
  const partB = safeParseJson(rawB, "1B");
  const partC = safeParseJson(rawC, "1C");
  const partD = safeParseJson(rawD, "1D");
  const partE = safeParseJson(rawE, "1E");

  const contractValue =
    typeof partA.contract_value === "number" ? partA.contract_value : null;
  let finalC = partC;
  if (contractValue !== null) {
    const rawC2 = await callModelWithText(
      PROMPT_1C_SYSTEM,
      PROMPT_1C_USER(cPages.length, contractValue),
      cPages,
      "1C-payment-v2",
    );
    finalC = safeParseJson(rawC2, "1C-v2");
  }

  const mergeUserText = `Merge five partial extractions into one JSON per OrderSchema.

PAGE 1 OCR (party cross-check):
${pages[0]?.ocrText?.substring(0, 800) ?? "(unavailable)"}

PARTIAL A — parties, dates, value:
${JSON.stringify(partA, null, 2)}

PARTIAL B — unit_prices:
${JSON.stringify(partB, null, 2)}

PARTIAL C — payment, milestones:
${JSON.stringify(finalC, null, 2)}

PARTIAL D — delay_penalties:
${JSON.stringify(partD, null, 2)}

PARTIAL E — hse_penalties:
${JSON.stringify(partE, null, 2)}

Return the single merged JSON object with all OrderSchema fields.`;

  const rawMerge = await callModelMerge(PROMPT_2_SYSTEM, mergeUserText, pages[0], "2-merge");
  const merged = safeParseJson(rawMerge, "2-merge");

  return normalizeExtraction(merged as Partial<ContractExtraction>);
}

export interface ExtractionResult {
  data: ContractExtraction;
  needsReview: boolean;
}

/**
 * CPMS-203 entry point — prompts driven by contract-analysis/assets/OrderSchema.md.
 */
export async function extractContractData(
  pages: RasterizedPage[],
  isScanned = false,
): Promise<ExtractionResult> {
  const timeoutMs = aiConfig.timeoutMs;
  const extractionPromise = runExtraction(pages);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`LLM extraction timed out after ${timeoutMs / 1000}s`)),
      timeoutMs,
    ),
  );

  const data = await Promise.race([extractionPromise, timeoutPromise]);

  const missingCritical =
    data.parties.length === 0 ||
    data.contract_value === null ||
    data.start_date === null ||
    data.end_date === null;

  return { data, needsReview: missingCritical || isScanned };
}
