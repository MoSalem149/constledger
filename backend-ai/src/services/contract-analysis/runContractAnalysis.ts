import { parseContractFile } from './parseContractFile';
import { extractContractData } from './extractContractDataSinglePass';
import { validateExtraction } from './validateExtraction';
import { saveExtraction } from './saveExtraction';
import { ContractModel } from '../../models/Contract.model';
import { connectDatabase } from '../../config/database';
import { aiConfig } from '../../config/aiConfig';

// Full AI analysis pipeline:
//   parse PDF -> LLM extract -> validate -> save (both Contract and ContractExtraction).
//
// Runs in the BACKGROUND (see contractController) and writes directly to
// MongoDB. The HTTP request that triggered it has already responded by the
// time this function executes.
export async function runContractAnalysis(
  contractId: string,
  fileSource: string | Buffer,
): Promise<void> {
  // Fail fast — without an API key for primary AND an enabled fallback, we
  // would silently mark the contract analysis_failed after burning S3 + parse
  // costs.
  if (
    !aiConfig.primary.apiKey &&
    !(aiConfig.enablePaidFallback && aiConfig.fallback.apiKey)
  ) {
    throw new Error(
      `No AI API key is configured. Set GEMINI_API_KEY for the primary provider ` +
      `or OPENROUTER_API_KEY for the fallback provider.`,
    );
  }

  // Ensure Mongo is connected — this function runs detached from the
  // request that bootstrapped the connection.
  await connectDatabase();

  console.log(`[analyze] Starting pipeline for contract ${contractId}`);
  const { pages, isScanned, sourcePdfBase64 } =
    await parseContractFile(fileSource);
  console.log(`[analyze] Parsed ${pages.length} page(s), scanned=${isScanned}`);

  const { data: extraction, needsReview: rawNeedsReview } =
    await extractContractData(pages, isScanned, sourcePdfBase64);
  console.log(`[analyze] LLM extraction complete for ${contractId}`);

  const { data: validated, needsReview, validationNotes } = validateExtraction(extraction);

  // Always require human approval after AI extraction/validation.
  // AI can populate the data, but it must not auto-activate the contract.
  const status: 'pending_review' = 'pending_review';

  await ContractModel.findByIdAndUpdate(contractId, { ...validated, status });
  console.log(`[analyze] Contract ${contractId} updated → status=${status}`);

  // Persist the canonical, strict-schema copy of the extraction with notes.
  await saveExtraction({
    contractId,
    data: validated,
    isScanned,
    validationNotes,
    status: 'needs_review',
  });
}
