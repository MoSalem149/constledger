import api from "./api";
import { normalizeIdArray } from "../utils/normalizeId";

export const reportService = {
  /**
   * GET /api/reports/contracts
   * Returns aggregated contract stats + contracts array.
   *
   * Query params (all optional): year, status
   */
  getContracts: (params = {}) =>
    api.get("/reports/contracts", { params }).then((res) => {
      const data = res.data;
      return {
        ...data,
        contracts: normalizeIdArray(data.contracts),
      };
    }),

  getActiveConfirmed: () =>
    api.get("/reports/contracts/active-confirmed").then((res) => {
      const data = res.data;
      return {
        ...data,
        contracts: normalizeIdArray(data.contracts),
      };
    }),

  /**
   * GET /api/finance/:contractId/plan
   * Returns the finance plan for a specific contract.
   *
   * Path param: contractId (required)
   */
  getPlannedBudget: (contractId) =>
    api.get(`/finance/${contractId}/plan`).then((res) => res.data),

  /**
   * GET /api/reports/planned-budget/export
   * Downloads the planned budget report as an Excel (.xlsx) file.
   *
   * Query params: contractId (required), year (optional)
   */
  exportPlannedBudget: async (contractId, params = {}) => {
    const response = await api.get(`finance/${contractId}/plan/export`, {
      params,
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type:
        response.headers["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Use filename from Content-Disposition header if present, else fallback
    const cd = response.headers["content-disposition"] || "";
    const match = cd.match(/filename="?([^"]+)"?/);
    a.download = match ? match[1] : "planned-budget.xlsx";

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  /**
   * GET /api/reports/contracts/export
   * Downloads the contracts report as an Excel (.xlsx) file.
   *
   * Query params (all optional): year, status
   */
  exportContracts: async (params = {}) => {
    const response = await api.get("/reports/contracts/export", {
      params,
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type:
        response.headers["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Use filename from Content-Disposition header if present, else fallback
    const cd = response.headers["content-disposition"] || "";
    const match = cd.match(/filename="?([^"]+)"?/);
    a.download = match ? match[1] : "contracts-report.xlsx";

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
