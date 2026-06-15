/**
 * saveExtraction.ts
 *
 * Persists a validated ContractExtraction to MongoDB.
 * Upserts by contractId so re-running analysis overwrites the previous record.
 */

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

/**
 * Upsert the extraction for a given contractId.
 * Returns the saved document (either newly created or updated).
 */
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
