import api from "./api";

export const reportService = {
  async getAllContractsReport({ year, status } = {}) {
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    if (status) params.append("status", status);
    const query = params.toString();
    const { data } = await api.get(`/reports/contracts${query ? "?" + query : ""}`);
    return data;
  },

  async getPlannedBudgetReport(contractId, year) {
    const { data } = await api.get(`/reports/planned-budget?contractId=${contractId}&year=${year}`);
    return data;
  },

  async getPaymentScheduleReport(contractId) {
    const { data } = await api.get(`/reports/payment-schedule?contractId=${contractId}`);
    return data;
  },

  async getProjectSummaryReport(contractId) {
    const { data } = await api.get(`/reports/project/${contractId}/summary`);
    return data;
  },
};