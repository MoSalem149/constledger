import { describe, expect, it } from "vitest";

import {
  buildAllContractsReport,
  parseOptionalYear,
} from "../src/services/reportingService.js";

describe("reportingService", () => {
  it("groups contract totals by currency", () => {
    const report = buildAllContractsReport(
      [
        {
          _id: "1",
          name: "Project A",
          contract_value: 100,
          currency: "EGP",
          status: "active",
        },
        {
          _id: "2",
          name: "Project B",
          contract_value: 50,
          currency: "EGP",
          status: "active",
        },
        {
          _id: "3",
          name: "Project C",
          contract_value: 20,
          currency: "USD",
          status: "pending_review",
        },
      ],
      { year: 2026, status: null },
    );

    expect(report.contractCount).toBe(3);
    expect(report.totalsByCurrency).toEqual([
      { currency: "EGP", contractCount: 2, totalValue: 150 },
      { currency: "USD", contractCount: 1, totalValue: 20 },
    ]);
  });

  it("rejects malformed report years", () => {
    expect(() => parseOptionalYear("26")).toThrow("Year must use YYYY format");
  });
});
