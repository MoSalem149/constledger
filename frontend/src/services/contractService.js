import api from "./api";
import { normalizeId } from "../utils/normalizeId";
import { normalizeReportingPeriod } from "../utils/contractValidation";

/** Fields the PUT /api/contracts/:id endpoint accepts — excludes populated refs. */
const CONTRACT_UPDATE_FIELDS = [
  "contractNumber",
  "name",
  "parties",
  "contract_value",
  "currency",
  "unit_prices",
  "paymentProgress",
  "payment_terms",
  "payment_schedule",
  "start_date",
  "end_date",
  "duration_days",
  "reporting_period",
  "milestones",
  "penalties",
  "status",
];

/**
 * Strip read-only / populated API fields before PUT.
 * GET responses include uploadedBy { id, name, email }, document, etc.
 * Sending those back causes Mongoose CastError on ObjectId fields.
 */
export function buildContractUpdatePayload(source, overrides = {}) {
  const payload = { ...overrides };

  for (const key of CONTRACT_UPDATE_FIELDS) {
    if (source?.[key] !== undefined) {
      payload[key] = source[key];
    }
  }

  if (payload.reporting_period != null && payload.reporting_period !== "") {
    const normalized = normalizeReportingPeriod(payload.reporting_period);
    if (normalized) payload.reporting_period = normalized;
  }

  if (payload.contract_value != null && payload.contract_value !== "") {
    payload.contract_value = Number(
      String(payload.contract_value).replace(/,/g, ""),
    );
  }

  if (payload.duration_days != null && payload.duration_days !== "") {
    payload.duration_days = Number(payload.duration_days);
  }

  if (Array.isArray(payload.payment_terms)) {
    payload.payment_terms = payload.payment_terms.map((term) => ({
      ...term,
      percentage:
        term.percentage === "" || term.percentage == null
          ? null
          : Number(term.percentage),
    }));
  }

  if (Array.isArray(payload.milestones)) {
    payload.milestones = payload.milestones.map(
      ({ dueDate, due_date, ...rest }) => ({
        ...rest,
        due_date: due_date ?? dueDate ?? "",
      }),
    );
  }

  return payload;
}

/**
 * Contract API calls — thin wrappers around the backend contract endpoints.
 *
 * The upload flow is a 4-step S3 presigned URL process:
 *   1. signUpload({ filename, mimeType, size, fileHash }) → POST /api/uploads/sign
 *      fileHash is a SHA-256 hex digest of the file (see utils/hashFile.js),
 *      used by the backend to reject duplicate content before issuing a URL.
 *      Returns { uploadUrl, key, expiresIn }
 *   2. PUT file to uploadUrl (direct to S3, no auth headers)
 *   3. completeUpload({ s3Key, fileName, mimeType, size, fileHash }) → POST /api/uploads/complete
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
  signUpload: ({ filename, mimeType, size, fileHash }) =>
    api
      .post("/uploads/sign", { filename, mimeType, size, fileHash })
      .then((res) => res.data),

  /**
   * POST /api/uploads/complete
   * Notify the backend that the file has been uploaded to S3.
   */
  completeUpload: ({ s3Key, fileName, mimeType, size, fileHash }) =>
    api
      .post("/uploads/complete", { s3Key, fileName, mimeType, size, fileHash })
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
    api
      .put(`/contracts/${id}`, buildContractUpdatePayload(data))
      .then((res) => normalizeId(res.data)),

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
    api
      .put(`/contracts/${id}`, buildContractUpdatePayload(data))
      .then((res) => res.data),

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

  /**
   * DELETE /api/contracts/:id
   * Permanently delete a contract (and its linked upload document).
   * Backend restricts this to the contract_manager role.
   * Returns { message, id }
   */
  deleteContract: (id) =>
    api.delete(`/contracts/${id}`).then((res) => res.data),
};