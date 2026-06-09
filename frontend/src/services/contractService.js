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
   * GET /contracts/:id/progress
   * Polls the AI processing progress for a contract.
   *! Expected response:
   * {
   *   contractId: string,
   *   status: 'uploading' | 'reading' | 'extracting' | 'active' | 'analysis_failed',
   *   progress: number,      // 0-100
   *   currentStep: number, // 0=Upload, 1=Read, 2=Extract, 3=Review
   *   activityLog: Array<{ timestamp: string, message: string }>
   * }
   */
  getContractProgress: (id) =>
    api.get(`/contracts/${id}/progress`).then((res) => res.data),
};
