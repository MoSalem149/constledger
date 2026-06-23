import { describe, expect, it } from "vitest";

import {
  generatePlan,
  sCurve,
  validateBalance,
} from "../src/services/planningService.js";

const makeContract = (overrides = {}) => ({
  _id: "507f1f77bcf86cd799439011",
  name: "Office Renovation",
  contract_value: 100_000,
  currency: "EGP",
  start_date: "2026-01-01",
  end_date: "2026-01-29",
  reporting_period: "weekly",
  milestones: [],
  ...overrides,
});

describe("planningService", () => {
  it("generates a balanced straight-line plan for the contract timeline", () => {
    const result = generatePlan(makeContract(), "straight_line");
    const amounts = result.periods.map((period) => period.plannedAmount);

    expect(result.periods).toHaveLength(4);
    expect(result.periods.at(-1).periodEnd).toEqual(
      new Date("2026-01-29"),
    );
    expect(result.periods.at(-1).cumulativePlanned).toBe(100_000);
    expect(validateBalance(amounts, 100_000).isValid).toBe(true);
  });

  it("creates an S-curve that starts and ends lighter than the middle", () => {
    const amounts = sCurve(120_000, 6);

    expect(amounts).toHaveLength(6);
    expect(amounts[0]).toBeLessThan(amounts[2]);
    expect(amounts[5]).toBeLessThan(amounts[3]);
    expect(amounts.reduce((sum, amount) => sum + amount, 0)).toBeCloseTo(
      120_000,
      6,
    );
  });

  it("falls back safely when milestone-weighted planning has no usable milestone", () => {
    const result = generatePlan(
      makeContract({
        milestones: [
          { name: "Handover", due_date: "not-a-date", value: 25_000 },
        ],
      }),
      "milestone_weighted",
    );

    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "milestone_ignored" }),
        expect.objectContaining({ code: "milestone_fallback" }),
      ]),
    );
    expect(result.periods.at(-1).cumulativePlanned).toBe(100_000);
  });

  it("rejects contracts that are missing planning requirements", () => {
    expect(() =>
      generatePlan(
        makeContract({ reporting_period: undefined }),
        "straight_line",
      ),
    ).toThrow("missing_reporting_period");
  });
});
