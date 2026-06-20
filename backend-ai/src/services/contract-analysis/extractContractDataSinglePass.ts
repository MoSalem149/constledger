import OpenAI from 'openai';

import {
  ContractExtraction,
  PaymentProgress,
  PaymentTerm,
  Penalty,
} from '../../types';
import { RasterizedPage } from './parseContractFile';
import { loadOrderSchema } from './loadOrderSchema';
import { requestJsonFromModel } from './aiModelClient';

const ORDER_SCHEMA = loadOrderSchema();
const JSON_ONLY = 'Output ONLY valid JSON. No markdown fences. No explanation.';

// System prompt for the main extraction call. Injects the OrderSchema (the
// canonical field definitions) + a fixed set of extraction rules tuned for
// bilingual Arabic / English construction contracts.
const EXTRACTION_SYSTEM_PROMPT = `${ORDER_SCHEMA}

---

TASK FOR THIS CALL:
Extract every field in the output schema from the complete construction contract.

Important extraction rules:
1. Keep Arabic legal party names exactly as written.
2. Cross-check the numeric contract value against the Arabic written amount.
3. Process every BOQ row. unit_price must be the price per unit, not the line total.
4. Extract payment terms, payment schedule, reporting period, and milestones.
5. Extract delay penalties and every HSE violation row. Return each violation
   once with first_offense, second_offense, and third_offense values.
6. Convert dates to YYYY-MM-DD where the source is unambiguous.
7. Convert explicit duration wording to days: one month = 30 days, two months = 60 days.
8. If end_date is not printed but start_date and duration_days are known,
   calculate end_date by adding duration_days to start_date.
9. A recurring 14–15 day progress statement cycle means reporting_period="biweekly".
10. Use null or an empty array when the contract does not provide a field.

${JSON_ONLY}`;

function contractText(pages: RasterizedPage[]): string {
  return pages
    .map(
      (page) =>
        `--- PAGE ${page.pageNumber} ---\n${page.ocrText || '[no readable text]'}`,
    )
    .join('\n\n');
}

// OCR/PDF text occasionally arrives mojibake'd (UTF-8 bytes misread as
// Latin-1). Detect the tell-tale replacement characters and re-decode; only
// keep the re-decoded version if it actually has FEWER garbled characters.
function repairMojibake(value: string): string {
  if (!/[ØÙÃÂ]/.test(value)) return value;
  const decoded = Buffer.from(value, 'latin1').toString('utf8');
  if (decoded.includes('\uFFFD')) return value;
  const originalMarkers = (value.match(/[ØÙÃÂ]/g) ?? []).length;
  const decodedMarkers = (decoded.match(/[ØÙÃÂ]/g) ?? []).length;
  return decodedMarkers < originalMarkers ? decoded : value;
}

// Attaches page IMAGES on top of the OCR text for visual verification:
//   - Pages with no extracted text (pure scans) always go in.
//   - Pages whose OCR text contains BOQ/HSE table keywords go in too — dense
//     tables are the rows most likely to be misread by plain OCR.
function visualEvidenceContent(
  pages: RasterizedPage[],
  prompt: string,
): OpenAI.Chat.ChatCompletionContentPart[] {
  const content: OpenAI.Chat.ChatCompletionContentPart[] = [
    { type: 'text', text: prompt },
  ];
  const scannedVisionPages = pages.filter(
    (page) => page.base64 && !page.ocrText,
  );
  // BOQ / pricing tables and HSE violation tables — Arabic keywords
  const tablePages = pages.filter(
    (page) =>
      page.base64 &&
      (/قائمه|قائمة|الكميات|الاسعار|الأسعار/.test(page.ocrText) ||
        (/مخالفات/.test(page.ocrText) && /السلامة/.test(page.ocrText))),
  );
  // Scans take precedence — if every page was scanned we don't need to also
  // re-send the table pages since they're already image-only.
  const visualPages =
    scannedVisionPages.length > 0 ? scannedVisionPages : tablePages;

  // Cap at 20 images so we don't blow past per-request size limits
  for (const page of visualPages.slice(0, 20)) {
    content.push({
      type: 'text',
      text:
        `PAGE ${page.pageNumber} IMAGE: Read this page visually. ` +
        'For tables, preserve row alignment and use the printed numbers rather than guessing from nearby rows.',
    });
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${page.base64}`,
        detail: 'high',
      },
    });
  }

  if (visualPages.length > 0) {
    console.log(
      `[extract] attachedVisualPages=${visualPages
        .slice(0, 20)
        .map((page) => page.pageNumber)
        .join(',')}`,
    );
  }
  return content;
}

function normalizePaymentProgress(raw: unknown): PaymentProgress | null {
  if (!raw || typeof raw !== 'object') return null;
  const progress = raw as Partial<PaymentProgress>;
  const basis =
    typeof progress.basis === 'string' ? progress.basis.trim() : null;
  const frequency =
    typeof progress.frequency === 'number' ? progress.frequency : null;
  const dueTo = typeof progress.dueTo === 'number' ? progress.dueTo : null;

  // All-null = no payment progress info; return null rather than an empty shell
  if (!basis && frequency === null && dueTo === null) return null;
  return { basis, frequency, dueTo };
}

function normalizePaymentTerms(raw: unknown): PaymentTerm[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => item && typeof item === 'object' && 'name' in item)
      .map((item) => {
        const term = item as Partial<PaymentTerm>;
        return {
          name: String(term.name ?? '').trim(),
          percentage:
            typeof term.percentage === 'number' ? term.percentage : null,
          description:
            typeof term.description === 'string'
              ? term.description.trim()
              : null,
        };
      })
      .filter((term) => term.name.length > 0);
  }

  // Some models return payment_terms as a single descriptive string —
  // wrap that into a single Summary term so downstream consumers stay sane.
  if (typeof raw === 'string' && raw.trim()) {
    return [{ name: 'Summary', percentage: null, description: raw.trim() }];
  }

  return [];
}

function cleanOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = repairMojibake(value).trim();
  return cleaned && cleaned !== '-' && cleaned !== '---' ? cleaned : null;
}

// Older prompts returned one row per "(1st/2nd/3rd offense)" suffix instead
// of pre-grouped tiers. This pattern-matches the suffix off the condition
// string so we can normalize back to the schema's grouped shape.
function offenseFromCondition(
  condition: string,
): { baseCondition: string; tier: 1 | 2 | 3 | null } {
  const patterns: Array<{ regex: RegExp; tier: 1 | 2 | 3 }> = [
    {
      regex: /\s*\((?:first|1st)\s+(?:time|offen[cs]e)\)\s*$/i,
      tier: 1,
    },
    {
      regex: /\s*\((?:second|2nd)\s+(?:time|offen[cs]e)\)\s*$/i,
      tier: 2,
    },
    {
      regex: /\s*\((?:third|3rd)\s+(?:time|offen[cs]e)\)\s*$/i,
      tier: 3,
    },
  ];
  for (const pattern of patterns) {
    if (pattern.regex.test(condition)) {
      return {
        baseCondition: condition.replace(pattern.regex, '').trim(),
        tier: pattern.tier,
      };
    }
  }
  return { baseCondition: condition.trim(), tier: null };
}

// Groups raw penalty rows by base condition so e.g. "Late delivery (1st time)"
// / "(2nd time)" / "(3rd time)" become first/second/third_offense on a single
// Penalty entry, matching the HSE table shape in the schema.
export function normalizePenalties(raw: unknown): Penalty[] {
  if (!Array.isArray(raw)) return [];
  const grouped = new Map<string, Penalty>();

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const source = entry as Record<string, unknown>;
    const condition = cleanOptionalString(source.condition);
    if (!condition) continue;
    const { baseCondition, tier } = offenseFromCondition(condition);
    const key = baseCondition.toLocaleLowerCase();
    const existing = grouped.get(key) ?? {
      condition: baseCondition,
      penalty: null,
      first_offense: null,
      second_offense: null,
      third_offense: null,
    };

    const genericPenalty = cleanOptionalString(source.penalty);

    // Pre-grouped values (newer prompt shape) — take precedence when present
    existing.first_offense =
      cleanOptionalString(source.first_offense) ?? existing.first_offense;
    existing.second_offense =
      cleanOptionalString(source.second_offense) ?? existing.second_offense;
    existing.third_offense =
      cleanOptionalString(source.third_offense) ?? existing.third_offense;

    // Back-compat for the old "one row per offense suffix" shape
    if (tier === 1) existing.first_offense = genericPenalty;
    else if (tier === 2) existing.second_offense = genericPenalty;
    else if (tier === 3) existing.third_offense = genericPenalty;
    else existing.penalty = genericPenalty ?? existing.penalty;

    grouped.set(key, existing);
  }

  return [...grouped.values()];
}

function addDays(date: string, days: number): string | null {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

// If the model didn't classify reporting_period, infer it from progress
// frequency (cycle length in days). Wide bands account for OCR noise.
function deriveReportingPeriod(
  rawPeriod: ContractExtraction['reporting_period'],
  progress: PaymentProgress | null,
): ContractExtraction['reporting_period'] {
  const frequency = progress?.frequency;
  if (frequency) {
    if (frequency <= 7) return 'weekly';
    if (frequency >= 13 && frequency <= 16) return 'biweekly';
    if (frequency >= 27 && frequency <= 31) return 'monthly';
  }
  return rawPeriod;
}

type BoqItem = ContractExtraction['unit_prices'][number];

// Cross-checks every BOQ row (unit_price × quantity == total_cost) and, when
// the row total doesn't reconcile with the overall contract_value, searches
// for a plausible decimal-place error (×10/×100/÷10/÷100 on up to 3 rows)
// that brings the BOQ sum back within tolerance of contract_value. This
// recovers from common OCR/LLM mistakes like dropping or duplicating a zero.
export function reconcileBoq(
  items: BoqItem[],
  contractValue: number | null,
): BoqItem[] {
  // Pass 1 — fix per-row math by recomputing unit_price from total_cost / quantity
  const reconciled = items.map((item) => {
    if (item.quantity <= 0 || item.total_cost <= 0) return item;
    const calculated = item.unit_price * item.quantity;
    const tolerance = Math.max(1, item.total_cost * 0.005);
    if (Math.abs(calculated - item.total_cost) <= tolerance) return item;

    const inferredUnitPrice = item.total_cost / item.quantity;
    if (!Number.isFinite(inferredUnitPrice) || inferredUnitPrice <= 0) {
      return item;
    }
    console.warn(
      `[extract:boq] corrected unit_price for "${item.item}" ` +
        `${item.unit_price} -> ${inferredUnitPrice} using total_cost / quantity`,
    );
    return { ...item, unit_price: inferredUnitPrice };
  });

  if (!contractValue || reconciled.length === 0) return reconciled;
  const targetContractValue = contractValue;
  const currentTotal = reconciled.reduce(
    (sum, item) => sum + item.total_cost,
    0,
  );
  const tolerance = targetContractValue * 0.005;
  if (Math.abs(currentTotal - targetContractValue) <= tolerance) {
    return reconciled;
  }

  // Pass 2 — brute-force search: try every combination of up to 3 rows ×
  // scale factor, looking for the smallest correction that lands the BOQ
  // total within tolerance of contract_value.
  const scaleFactors = [10, 100, 0.1, 0.01];
  type ScaleCorrection = { index: number; factor: number };
  const candidates: ScaleCorrection[] = [];
  reconciled.forEach((_item, index) => {
    scaleFactors.forEach((factor) => candidates.push({ index, factor }));
  });

  let selected: ScaleCorrection[] | undefined;
  let selectedDifference = Number.POSITIVE_INFINITY;

  // Recursive combination search up to targetSize corrections deep
  function search(
    start: number,
    targetSize: number,
    chosen: ScaleCorrection[],
  ): void {
    if (chosen.length === targetSize) {
      const indexes = chosen.map((candidate) => candidate.index);
      // Each row may appear at most once in a single correction set
      if (new Set(indexes).size !== indexes.length) return;
      const candidateTotal = chosen.reduce(
        (total, candidate) =>
          total +
          reconciled[candidate.index].total_cost * (candidate.factor - 1),
        currentTotal,
      );
      const difference = Math.abs(candidateTotal - targetContractValue);
      if (difference <= tolerance && difference < selectedDifference) {
        selected = [...chosen];
        selectedDifference = difference;
      }
      return;
    }

    for (let index = start; index < candidates.length; index += 1) {
      chosen.push(candidates[index]);
      search(index + 1, targetSize, chosen);
      chosen.pop();
    }
  }

  // Prefer the fewest corrections — try 1-row fixes first, then 2-row, then 3.
  for (let correctionCount = 1; correctionCount <= 3; correctionCount += 1) {
    search(0, correctionCount, []);
    if (selected) break;
  }

  if (!selected) return reconciled;
  for (const correction of selected) {
    const item = reconciled[correction.index];
    // Lump-sum rows scale unit_price; quantified rows scale quantity. Total
    // is rescaled either way.
    const isLumpSum =
      /lump|مقطوعية/i.test(item.unit) || item.quantity === 1;
    console.warn(
      `[extract:boq] corrected dropped decimal/zero for "${item.item}" ` +
        `factor=${correction.factor} field=${isLumpSum ? 'unit_price' : 'quantity'}`,
    );
    reconciled[correction.index] = isLumpSum
      ? {
          ...item,
          unit_price: item.unit_price * correction.factor,
          total_cost: item.total_cost * correction.factor,
        }
      : {
          ...item,
          quantity: item.quantity * correction.factor,
          total_cost: item.total_cost * correction.factor,
        };
  }
  return reconciled;
}

// Coerces a raw model response into the canonical ContractExtraction shape,
// applying type checks, mojibake repair, BOQ reconciliation, date derivation,
// and reporting-period inference.
export function normalizeExtraction(
  raw: Partial<ContractExtraction>,
): ContractExtraction {
  const normalizeDate = (value: unknown): string | null =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : null;
  const reportingPeriod = ['weekly', 'biweekly', 'monthly'].includes(
    String(raw.reporting_period),
  )
    ? raw.reporting_period
    : null;
  const contractValue =
    typeof raw.contract_value === 'number' && raw.contract_value >= 0
      ? raw.contract_value
      : null;
  const unitPrices: BoqItem[] = Array.isArray(raw.unit_prices)
    ? raw.unit_prices
        .filter(
          (item) =>
            item &&
            typeof item.item === 'string' &&
            typeof item.unit === 'string' &&
            typeof item.unit_price === 'number' &&
            typeof item.quantity === 'number' &&
            typeof item.total_cost === 'number',
        )
        .map((item) => ({
          item: repairMojibake(item.item.trim()),
          unit: repairMojibake(item.unit.trim()),
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_cost: item.total_cost,
        }))
    : [];
  const paymentProgress = normalizePaymentProgress(raw.paymentProgress);
  const startDate = normalizeDate(raw.start_date);
  const durationDays =
    typeof raw.duration_days === 'number' && raw.duration_days >= 0
      ? raw.duration_days
      : null;
  const extractedEndDate = normalizeDate(raw.end_date);

  // Date derivation: if start + duration are both present, COMPUTE end_date
  // deterministically. Trust math over the model-reported end_date when both exist.
  const endDate =
    startDate && durationDays !== null
      ? addDays(startDate, durationDays)
      : extractedEndDate;

  return {
    parties: Array.isArray(raw.parties)
      ? raw.parties
          .filter(
            (party) =>
              party &&
              typeof party.name === 'string' &&
              typeof party.role === 'string',
          )
          .map((party) => ({
            name: repairMojibake(party.name.trim()),
            role: party.role.trim(),
          }))
      : [],
    contract_value: contractValue,
    currency: typeof raw.currency === 'string' ? raw.currency : null,
    unit_prices: reconcileBoq(unitPrices, contractValue),
    paymentProgress,
    payment_terms: normalizePaymentTerms(raw.payment_terms),
    payment_schedule: Array.isArray(raw.payment_schedule)
      ? raw.payment_schedule
      : [],
    start_date: startDate,
    end_date: endDate,
    duration_days: durationDays,
    reporting_period: deriveReportingPeriod(
      reportingPeriod ?? null,
      paymentProgress,
    ),
    milestones: Array.isArray(raw.milestones) ? raw.milestones : [],
    penalties: normalizePenalties(raw.penalties),
  };
}

// Resilient JSON parser — tries strict, then markdown-fenced, then brace-
// boundary fallback. Models still occasionally emit prose around the JSON.
function parseJson(
  raw: string,
): { parsed: Record<string, unknown>; validJson: boolean } {
  try {
    return { parsed: JSON.parse(raw), validJson: true };
  } catch {
    // Fallback 1 — markdown code-fence
    const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenced?.[1]) {
      try {
        return { parsed: JSON.parse(fenced[1].trim()), validJson: true };
      } catch {
        // continue to object-boundary recovery
      }
    }

    // Fallback 2 — first '{' to last '}' substring
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return {
          parsed: JSON.parse(raw.slice(firstBrace, lastBrace + 1)),
          validJson: true,
        };
      } catch {
        // give up — caller may request a repair pass
      }
    }

    return { parsed: {}, validJson: false };
  }
}

// Lists every quality issue found in a first-pass extraction. A non-empty
// list triggers a second LLM call (repair pass) with these issues attached.
function repairIssues(
  data: ContractExtraction,
  validJson: boolean,
  sourceText: string,
): string[] {
  const issues: string[] = [];
  if (!validJson) issues.push('The response was not valid JSON.');
  if (data.parties.length === 0) issues.push('No contract parties were extracted.');
  if (data.contract_value === null) issues.push('The contract value is missing.');
  if (data.start_date === null) issues.push('The start date is missing.');
  if (data.end_date === null && data.duration_days === null) {
    issues.push('Both the end date and contract duration are missing.');
  }
  // Per-row BOQ math sanity (0.5% tolerance, min $1)
  const invalidBoqRows = data.unit_prices.filter((item) => {
    const calculated = item.unit_price * item.quantity;
    const tolerance = Math.max(1, Math.abs(item.total_cost) * 0.005);
    return Math.abs(calculated - item.total_cost) > tolerance;
  });
  if (invalidBoqRows.length > 0) {
    issues.push(
      `${invalidBoqRows.length} BOQ row(s) violate unit_price × quantity = total_cost.`,
    );
  }
  // BOQ aggregate sanity (1% tolerance)
  if (data.contract_value && data.unit_prices.length > 0) {
    const boqTotal = data.unit_prices.reduce(
      (sum, item) => sum + item.total_cost,
      0,
    );
    const difference = Math.abs(boqTotal - data.contract_value);
    if (difference > data.contract_value * 0.01) {
      issues.push(
        `BOQ total ${boqTotal} does not match contract value ${data.contract_value}; ` +
          'check for omitted or shifted rows.',
      );
    }
  }
  // The source mentions an HSE table but we ended up with no offense tiers —
  // strong signal that the model missed the table entirely.
  if (
    /مخالفات/.test(sourceText) &&
    /السلامة/.test(sourceText) &&
    !data.penalties.some(
      (penalty) =>
        penalty.first_offense ||
        penalty.second_offense ||
        penalty.third_offense,
    )
  ) {
    issues.push(
      'The contract contains an HSE violations table but no grouped offense-tier penalties were extracted.',
    );
  }
  return issues;
}

// "Critical" = the downstream finance planner cannot work without these.
// Forces the contract into pending_review when true.
function missingCriticalFields(data: ContractExtraction): boolean {
  return (
    data.parties.length === 0 ||
    data.contract_value === null ||
    data.start_date === null ||
    (data.end_date === null && data.duration_days === null)
  );
}

// Repair pass — give the model its own partial output PLUS the contract text
// and ask it to fix the listed issues. Failures here are non-fatal: we just
// keep the partial extraction.
async function repairExtraction(
  pages: RasterizedPage[],
  partial: ContractExtraction,
  issues: string[],
  sourcePdfBase64?: string,
): Promise<ContractExtraction | null> {
  const repairSystemPrompt = `${ORDER_SCHEMA}

---

TASK FOR THIS CALL:
Repair the partial extraction using the contract text. Return one complete object
matching the schema. Preserve correct existing values and correct only missing,
invalid, or inconsistent fields.

${JSON_ONLY}`;
  const userPrompt = `Problems found:
${issues.map((issue) => `- ${issue}`).join('\n')}

PARTIAL EXTRACTION:
${JSON.stringify(partial, null, 2)}

CONTRACT TEXT:
${contractText(pages)}`;

  try {
    const response = await requestJsonFromModel({
      label: 'contract-repair',
      systemPrompt: repairSystemPrompt,
      userPrompt,
      userContent: visualEvidenceContent(pages, userPrompt),
      pdfBase64: sourcePdfBase64,
      maxTokens: 8192,
    });
    const repaired = parseJson(response.content);
    if (!repaired.validJson) {
      console.warn('[extract:repair] model returned malformed JSON');
      return null;
    }
    return normalizeExtraction(
      repaired.parsed as Partial<ContractExtraction>,
    );
  } catch (error) {
    console.warn(
      `[extract:repair] repair failed; keeping partial extraction: ${(error as Error).message}`,
    );
    return null;
  }
}

export interface ExtractionResult {
  data: ContractExtraction;
  needsReview: boolean;
}

// PUBLIC entry point — what runContractAnalysis.ts calls.
//
// Strategy: ONE model call against the full contract, with a second "repair"
// call ONLY when the first response is malformed or missing a field critical
// to downstream business logic (parties, value, dates).
export async function extractContractData(
  pages: RasterizedPage[],
  isScanned = false,
  sourcePdfBase64?: string,
): Promise<ExtractionResult> {
  const text = contractText(pages);
  console.log(
    `[extract] single-pass pages=${pages.length} approximateInputTokens=${Math.round(text.length / 4)}`,
  );

  // Main call
  const response = await requestJsonFromModel({
    label: 'contract-extraction',
    systemPrompt: EXTRACTION_SYSTEM_PROMPT,
    userPrompt: `CONTRACT TEXT:\n${text}`,
    userContent: visualEvidenceContent(
      pages,
      `CONTRACT TEXT:\n${text}`,
    ),
    pdfBase64: sourcePdfBase64,
    maxTokens: 8192,
  });
  const firstPass = parseJson(response.content);
  let data = normalizeExtraction(
    firstPass.parsed as Partial<ContractExtraction>,
  );
  const issues = repairIssues(data, firstPass.validJson, text);

  // Repair pass only if needed
  if (issues.length > 0) {
    console.warn(`[extract] repair required: ${issues.join(' ')}`);
    const repaired = await repairExtraction(
      pages,
      data,
      issues,
      sourcePdfBase64,
    );
    if (repaired) data = repaired;
  }

  return {
    data,
    needsReview: missingCriticalFields(data),
  };
}
