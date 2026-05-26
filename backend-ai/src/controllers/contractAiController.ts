import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { parseContractFile } from '../services/contract-analysis/parseContractFile';
import { extractContractData } from '../services/contract-analysis/extractContractData';
import { generateBudgetPlan } from '../services/finance-ai/generateBudgetPlan';

export const analyzeContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { contractId } = req.params;
  try {
    // 1. Fetch contract record from core backend
    const { data: { contract } } = await axios.get(
      `${process.env.CORE_SERVICE_URL}/api/contracts/${contractId}`
    );

    // 2. Download & parse the contract file
    const contractText = await parseContractFile(contract.fileUrl);

    // 3. Run LLM extraction
    const extraction = await extractContractData(contractText);

    // 4. Write extraction back to core
    await axios.put(
      `${process.env.CORE_SERVICE_URL}/api/contracts/${contractId}`,
      { ...extraction, status: 'pending_review' }
    );

    // 5. If extraction succeeded, auto-generate budget plan
    if (extraction.contract_value && extraction.start_date && extraction.end_date && extraction.reporting_period) {
      const forecast = generateBudgetPlan({
        contract_value: extraction.contract_value,
        start_date: extraction.start_date,
        end_date: extraction.end_date,
        reporting_period: extraction.reporting_period,
        milestones: extraction.milestones ?? [],
      });
      // POST budget to core finance endpoint
      await axios.post(
        `${process.env.CORE_SERVICE_URL}/api/finance/planned`,
        { contractId, ...forecast }
      ).catch((e: Error) => console.warn('[ai] budget create failed:', e.message));
    }

    res.json({ message: 'Analysis complete', contractId });
  } catch (err) {
    // Mark contract as failed in core
    await axios.put(
      `${process.env.CORE_SERVICE_URL}/api/contracts/${contractId}`,
      { status: 'analysis_failed' }
    ).catch(() => {});
    next(err);
  }
};
