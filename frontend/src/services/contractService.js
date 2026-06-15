import api from "./api";
import { normalizeId, normalizeIdArray } from "../utils/normalizeId";

/**
 * Contract API calls — thin wrappers around the backend contract endpoints.
 *
 * The upload flow is now a 4-step S3 presigned URL process:
 *   1. signUpload({ filename, mimeType, size }) → POST /uploads/sign
 *      Returns { uploadUrl, key, expiresIn }
 *   2. PUT file to uploadUrl (direct to S3, no auth headers)
 *   3. completeUpload({ s3Key, fileName, mimeType, size }) → POST /uploads/complete
 *      Returns { uploadId, s3Key, status }
 *   4. createContract(file, name, uploadId) → POST /contracts/upload
 *      Returns full contract record (normalized _id → id)
 *
 * All responses that may contain `_id` are normalized to `id`.
 */
export const contractService = {
  /* ------------------------------------------------------------------ */
  // 1. S3 upload flow
  /* ------------------------------------------------------------------ */

  /**
   * POST /uploads/sign
   * Request a presigned S3 URL for file upload.
   */
  signUpload: ({ filename, mimeType, size }) =>
    api
      .post("/uploads/sign", { filename, mimeType, size })
      .then((res) => res.data),

  /**
   * POST /uploads/complete
   * Notify the backend that the file has been uploaded to S3.
   */
  completeUpload: ({ s3Key, fileName, mimeType, size }) =>
    api
      .post("/uploads/complete", { s3Key, fileName, mimeType, size })
      .then((res) => res.data),

  /**
   * POST /contracts/upload
   * Create the contract record with the uploaded file.
   * Backend runs AI analysis synchronously (blocks 20-30s).
   * Returns the full contract record with normalized `id`.
   */
  createContract: (file, name, uploadId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("uploadId", uploadId);

    return api
      .post("/contracts/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => normalizeId(res.data));
  },

  /* ------------------------------------------------------------------ */
  // 2. Contract CRUD
  /* ------------------------------------------------------------------ */

  /**
   * GET /contracts/:id
   * Fetch a single contract by ID.
   */
  getContractById: (id) =>
    api.get(`/contracts/${id}`).then((res) => normalizeId(res.data)),

  /**
   * GET /contracts
   * Fetch contracts by status and year.
   * Both query params are required by the backend.
   */
  getContracts: ({ status, year }) =>
    api
      .get("/contracts", { params: { status, year } })
      .then((res) => normalizeIdArray(res.data)),

  /**
   * PUT /contracts/:id
   * Update contract status (e.g., to active).
   */
  updateContractStatus: (id, status) =>
    api.put(`/contracts/${id}`, { status }).then((res) => res.data),
};
