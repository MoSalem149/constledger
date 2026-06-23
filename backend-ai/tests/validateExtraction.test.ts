import { describe, expect, it } from 'vitest';

import { validateExtraction } from '../src/services/contract-analysis/validateExtraction';
import type { ContractExtraction } from '../src/types';

const makeExtraction = (): ContractExtraction => ({
  parties: [
    { name: 'Main Builder', role: 'main_contractor' },
    { name: 'Specialist Works', role: 'subcontractor' },
  ],
  contract_value: 100_000,
  currency: 'EGP',
  unit_prices: [
    {
      item: 'Concrete works',
      unit: 'm3',
      unit_price: 1_000,
      quantity: 100,
      total_cost: 100_000,
    },
  ],
  paymentProgress: {
    basis: 'completed work',
    frequency: 1,
    dueTo: 30,
  },
  payment_terms: [
    { name: 'Progress payment', percentage: 100, description: null },
  ],
  payment_schedule: [
    { date: '2026-02-01', amount: 100_000 },
  ],
  start_date: '2026-01-01',
  end_date: '2026-02-01',
  duration_days: 31,
  reporting_period: 'monthly',
  milestones: [
    { name: 'Completion', due_date: '2026-02-01', value: 100_000 },
  ],
  penalties: [],
});

describe('validateExtraction', () => {
  it('accepts a complete and internally consistent extraction', () => {
    const extraction = makeExtraction();

    const result = validateExtraction(extraction);

    expect(result.data).toBe(extraction);
    expect(result.needsReview).toBe(false);
    expect(result.validationNotes).toEqual([]);
  });

  it('keeps plausible data but records soft validation issues', () => {
    const extraction = makeExtraction();
    extraction.unit_prices[0].total_cost = 90_000;
    extraction.payment_schedule[0].amount = 120_000;
    extraction.parties = [{ name: 'Main Builder', role: 'contractor' }];

    const result = validateExtraction(extraction);

    expect(result.validationNotes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('V7: BOQ row 1'),
        expect.stringContaining('V7: BOQ total'),
        expect.stringContaining('V8: Sum of payment_schedule'),
        expect.stringContaining('V9: No party with role "subcontractor"'),
      ]),
    );
  });

  it('rejects hard violations before they can be persisted', () => {
    const extraction = makeExtraction();
    extraction.contract_value = -1;

    expect(() => validateExtraction(extraction)).toThrow(
      'V1: contract_value is negative',
    );
  });
});
