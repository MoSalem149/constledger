import api from "./api";

/**
 * Contract API calls — thin wrappers around the backend contract endpoints.
 * The upload flow works with multipart/form-data for file transfers.
 *
 * Flow:
 *   1. uploadContract(file) → POST /contracts/upload
 *      Returns { contractId, status, ... }
 *   2. Poll getContractProgress(id) every 5s
 *      Returns { status, progress, currentStep, activityLog }
 *   3. status === 'active' → contract ready, navigate to /contracts/:id
 *   4. status === 'analysis_failed' → show error
 */
export const contractService = {
  /**
   * POST /contracts/upload
   * Uploads a PDF contract file.
   * Returns the created contract record with initial status.
   */
  uploadContract: (file) => {
    const formData = new FormData();
    formData.append("contract", file);
    return api
      .post("/contracts/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  /**
   * GET /contracts/:id
   * Fetches a single contract by ID.
   */
  getContractById: (id) => api.get(`/contracts/${id}`).then((res) => res.data),

  /**
   * GET /contracts
   * Fetches all contracts
   */
  getAllContracts: () => api.get(`/contracts}`).then((res) => res.data),

  /**
   * GET /contracts/:id/progress
   * Polls the contract processing status.
   *
   *! Backend only returns terminal statuses:
   * { contractId: string, status: 'active' | 'analysis_failed' }
   *
   *! All intermediate progress (stepper, progress bar, activity log)
   *! is simulated on the frontend via `fakeProgress.js`.
   */
  getContractProgress: (id) =>
    api.get(`/contracts/${id}/progress`).then((res) => res.data),
};