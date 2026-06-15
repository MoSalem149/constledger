import api from "./api";
import axios from "axios";
import { normalizeId } from "../utils/normalizeId";

/**
 * Separate Axios instance for the AI service (S3 sign & complete).
 * Uses VITE_AI_API_URL instead of VITE_API_URL.
 */
const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

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
 *      Sends JSON { name, uploadId }. Backend downloads the file from S3.
 *      Returns full contract record (normalized _id → id).
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
    aiApi
      .post("/uploads/sign", { filename, mimeType, size })
      .then((res) => res.data),

  /**
   * POST /api/uploads/complete
   * Notify the backend that the file has been uploaded to S3.
   */
  completeUpload: ({ s3Key, fileName, mimeType, size }) =>
    aiApi
      .post("/uploads/complete", { s3Key, fileName, mimeType, size })
      .then((res) => res.data),

  /**
   * POST /api/contracts/upload
   * Create the contract record with the uploaded file.
   *
   * The backend reads the file from S3 (no binary upload needed).
   * Backend runs AI analysis synchronously (blocks 20-30s).
   *
   * On success (201): returns the full contract record with normalized `id`.
   * On failure (422): returns { message, error, contract } where contract has
   *   status: "analysis_failed" and may contain partial data.
   * On conflict (409): returns { message } when upload is already linked.
   *
   * @param {string} name — contract name (defaults to fileName on backend)
   * @param {string} uploadId — the uploadId from completeUpload
   */
  createContract: (name, uploadId) =>
    api
      .post("/contracts/upload", { name, uploadId })
      .then((res) => normalizeId(res.data)),

  /* ------------------------------------------------------------------ */
  // 2. Contract CRUD
  /* ------------------------------------------------------------------ */

  /**
   * GET /api/contracts/:id
   * Fetch a single contract by ID.
   *
   * The backend already normalizes _id → id, but we run it through
   * normalizeId as a safety net for any edge cases (e.g., populated
   * contractDocId with _id).
   */
  getContractById: (id) =>
    api.get(`/contracts/${id}`).then((res) => normalizeId(res.data)),

  /**
   * GET /api/contracts
   * List contracts with optional filters.
   *
   * Query params (all optional):
   *   status, year, name, search, limit, skip
   *
   * The backend already returns a normalized flat array:
   *   { id, name, status, contractValue, currency, startDate, endDate }
   * No additional normalization needed.
   */
  getContracts: (params = {}) =>
    api.get("/contracts", { params }).then((res) => res.data),

  /**
   * PUT /api/contracts/:id
   * Update any contract fields. The backend uses findByIdAndUpdate
   * with the full request body, so any field can be updated.
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
};