/**
 * PUT a file to a S3 presigned URL using native fetch.
 *
 * We use native fetch (not Axios) because:
 *   - Presigned URLs don't need auth headers (the URL IS the auth)
 *   - Sending cookies / Authorization headers to AWS would cause 403
 *
 * @param {string} uploadUrl — the presigned S3 URL
 * @param {File} file — the file to upload
 * @returns {Promise<void>}
 */
export async function putFileToS3(uploadUrl, file) {
  const contentType = file.type || "application/pdf";

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!response.ok) {
    const error = new Error(
      `S3 upload failed: ${response.status} ${response.statusText}`
    );
    error.status = response.status;
    throw error;
  }
}
