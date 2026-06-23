import { ContractExtraction } from '../../types';
import {
  ContractExtractionModel,
  IContractExtractionDocument,
} from '../../models/ContractExtraction.model';

export interface SaveExtractionInput {
  contractId: string;
  data: ContractExtraction;
  isScanned: boolean;
  validationNotes: string[];
  status: IContractExtractionDocument['status'];
}

// Upsert by contractId — re-running analysis (see reanalyzeContract) overwrites
// the previous extraction record instead of creating a duplicate row.
export async function saveExtraction(
  input: SaveExtractionInput,
): Promise<IContractExtractionDocument> {
  const { contractId, data, isScanned, validationNotes, status } = input;

  const doc = await ContractExtractionModel.findOneAndUpdate(
    { contractId },
    {
      $set: {
        ...data,
        contractId,
        isScanned,
        validationNotes,
        status,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  );

  if (!doc) {
    throw new Error(`[saveExtraction] Failed to upsert extraction for contractId: ${contractId}`);
  }

  console.log(
    `[saveExtraction] Saved extraction for contractId=${contractId} | status=${status}`,
  );

  return doc;
}
