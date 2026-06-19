import api from "./api";
import { normalizeId } from "../utils/normalizeId";

/**
 * Contract API calls — thin wrappers around the backend contract endpoints.
 *
 * The upload flow is a 4-step S3 presigned URL process:
 *   1. signUpload({ filename, mimeType, size }) → POST /api/uploads/sign
 *      Returns { uploadUrl, key, expiresIn }
 *   2. PUT file to uploadUrl (direct to S3, no auth headers)
 *   3. completeUpload({ s3Key, fileName, mimeType, size }) → POST /api/uploads/complete
 *      Returns { uploadId, s3Key, status }
 *   4. createContract(name, uploadId) → POST /api/contracts/upload
 *      Sends JSON { name, uploadId }. Backend starts AI analysis in background.
 *      Returns { id, name, status: 'processing' } immediately (202).
 *      Frontend must then call pollContractReady(id) to wait for completion.
 *
 * All responses that may contain `_id` are normalized to `id` where needed.
 */
export const contractService = {
  /* ------------------------------------------------------------------ */
  // 1. S3 upload flow
  /* ------------------------------------------------------------------ */

  /**
   * POST /api/uploads/sign
   * Request a presigned S3 URL for file upload.
   */
  signUpload: ({ filename, mimeType, size }) =>
    api
      .post("/uploads/sign", { filename, mimeType, size })
      .then((res) => res.data),

  /**
   * POST /api/uploads/complete
   * Notify the backend that the file has been uploaded to S3.
   */
  completeUpload: ({ s3Key, fileName, mimeType, size }) =>
    api
      .post("/uploads/complete", { s3Key, fileName, mimeType, size })
      .then((res) => res.data),

  /**
   * POST /api/contracts/upload
   * Create the contract record and kick off AI analysis in the background.
   *
   * Returns 202 immediately with { id, name, status: 'processing' }.
   * The AI analysis runs asynchronously on the server — use pollContractReady()
   * to wait for it to finish.
   *
   * On conflict (409): returns { message } when upload is already linked.
   *
   * @param {string} name     — contract name (defaults to fileName on backend)
   * @param {string} uploadId — the uploadId from completeUpload
   */
  createContract: (name, uploadId) =>
    api
      .post("/contracts/upload", { name, uploadId })
      .then((res) => normalizeId(res.data)),

  /**
   * Poll GET /api/contracts/:id every intervalMs until status is no longer
   * 'processing', then resolve with the final contract object.
   *
   * Rejects with an Error if:
   *   - maxWaitMs is exceeded (default 5 minutes)
   *   - the GET request itself fails
   *
   * @param {string} id
   * @param {{ intervalMs?: number, maxWaitMs?: number }} options
   */
  pollContractReady: (id, { intervalMs = 4000, maxWaitMs = 600000 } = {}) => {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + maxWaitMs;

      const tick = async () => {
        try {
          const contract = await contractService.getContractById(id);

          if (contract.status !== "processing") {
            // Analysis finished (success, failed, or pending_review)
            resolve(contract);
          } else if (Date.now() > deadline) {
            reject(new Error("Analysis timed out. Please try again."));
          } else {
            setTimeout(tick, intervalMs);
          }
        } catch (err) {
          reject(err);
        }
      };

      // First poll after one interval — give the server a moment to start
      setTimeout(tick, intervalMs);
    });
  },

  /* ------------------------------------------------------------------ */
  // 2. Contract CRUD
  /* ------------------------------------------------------------------ */

  /**
   * GET /api/contracts/:id
   * Fetch a single contract by ID.
   */
  getContractById: (id) =>
    api.get(`/contracts/${id}`).then((res) => normalizeId(res.data)),

  EditContractById: (id, data) =>
    api.put(`/contracts/${id}`, data).then((res) => {
      return normalizeId(res.data);
    }),

  /**
   * GET /api/contracts
   * List contracts with optional filters.
   *
   * Query params (all optional):
   *   status, year, name, search, limit, skip
   */
  getContracts: (params = {}) =>
    api.get("/contracts", { params }).then((res) => res.data),

  /**
   * PUT /api/contracts/:id
   * Update any contract fields.
   *
   * Response: { message, id }
   */
  updateContract: (id, data) =>
    api.put(`/contracts/${id}`, data).then((res) => res.data),

  /**
   * POST /api/contracts/:id/analyze
   * Re-trigger AI analysis for an existing contract.
   * Returns { message } immediately (analysis runs asynchronously).
   */
  reanalyzeContract: (id) =>
    api.post(`/contracts/${id}/analyze`).then((res) => res.data),

  /**
   * GET /api/contracts/:id/timeline
   * Get milestone timeline for a contract.
   * Returns { milestones, start_date, end_date }
   */
  getContractTimeline: (id) =>
    api.get(`/contracts/${id}/timeline`).then((res) => res.data),
  /* Response: { message, id }
   */
  updateContract: (id, data) =>
    api.put(`/contracts/${id}`, data).then((res) => res.data),

  /**
   * POST /api/contracts/:id/analyze
   * Re-trigger AI analysis for an existing contract.
   * Returns { message } immediately (analysis runs asynchronously).
   */
  reanalyzeContract: (id) =>
    api.post(`/contracts/${id}/analyze`).then((res) => res.data),

  /**
   * GET /api/contracts/:id/timeline
   * Get milestone timeline for a contract.
   * Returns { milestones, start_date, end_date }
   */
  getContractTimeline: (id) =>
    api.get(`/contracts/${id}/timeline`).then((res) => res.data),
};
