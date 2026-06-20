import api from "./api";

export const financeService = {
  async generatePlan(contractId, strategy, params = {}) {
    const { data } = await api.post(`/finance/${contractId}/plans/generate`, {
      strategy,
      params,
    });
    return data;
  },

  async getPlan(contractId) {
    const { data } = await api.get(`/finance/${contractId}/plan`);
    return data;
  },

  async updatePlan(contractId, periods) {
    const { data } = await api.put(`/finance/${contractId}/plan`, {
      periods,
    });
    return data;
  },

  async confirmPlan(contractId) {
    const { data } = await api.post(`/finance/${contractId}/plan/confirm`);
    return data;
  },

  async getPaymentSchedule(contractId) {
    const { data } = await api.get(`/finance/${contractId}/payment-schedule`);
    return data;
  },

  async exportPlan(contractId) {
    const response = await api.get(`/finance/${contractId}/plan/export`, {
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
    const cd = response.headers["content-disposition"] || "";
    const match = cd.match(/filename="?([^"]+)"?/);
    a.download = match ? match[1] : `plan-${contractId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  },
};
