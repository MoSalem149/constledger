import { parseContractFile } from './parseContractFile';
import { extractContractData } from './extractContractData';
import { validateExtraction } from './validateExtraction';
import { saveExtraction } from './saveExtraction';
import { generateBudgetPlan } from '../finance-ai/generateBudgetPlan';
import { ContractModel } from '../../models/Contract.model';
import { PlannedBudgetModel } from '../../models/PlannedBudget.model';
import { connectDatabase } from '../../config/database';
import { aiConfig } from '../../config/aiConfig';

/**
 * Full AI analysis pipeline: parse PDF → LLM extract → validate → save contract + budget.
 */
export async function runContractAnalysis(
  contractId: string,
  fileSource: string | Buffer,
): Promise<void> {
  if (!aiConfig.apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  await connectDatabase();

  console.log(`[analyze] Starting pipeline for contract ${contractId}`);
  const { pages, isScanned } = await parseContractFile(fileSource);
  console.log(`[analyze] Parsed ${pages.length} page(s), scanned=${isScanned}`);

  const { data: extraction, needsReview: rawNeedsReview } = await extractContractData(pages, isScanned);
  console.log(`[analyze] LLM extraction complete for ${contractId}`);

  const { data: validated, needsReview, validationNotes } = validateExtraction(extraction);

  const status = needsReview || rawNeedsReview ? 'pending_review' : 'active';

  await ContractModel.findByIdAndUpdate(contractId, { ...validated, status });
  console.log(`[analyze] Contract ${contractId} updated → status=${status}`);

  await saveExtraction({
    contractId,
    data: validated,
    isScanned,
    validationNotes,
    status: needsReview || rawNeedsReview ? 'needs_review' : 'active',
  });

  if (
    validated.contract_value &&
    validated.start_date &&
    validated.end_date &&
    validated.reporting_period
  ) {
    const forecast = generateBudgetPlan({
      contract_value: validated.contract_value,
      start_date: validated.start_date,
      end_date: validated.end_date,
      reporting_period: validated.reporting_period,
      milestones: validated.milestones ?? [],
    });

    await PlannedBudgetModel.findOneAndUpdate(
      { contract: contractId },
      {
        periods: forecast.periods.map((p) => ({
          periodLabel: p.label,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
          plannedAmount: p.plannedAmount,
        })),
      },
      { upsert: true, new: true },
    );
  }
}
