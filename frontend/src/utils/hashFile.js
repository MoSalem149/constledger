/**
 * SHA-256 hash of a File's contents, as a lowercase hex string.
 *
 * Used by the upload flow to let the backend reject duplicate file content
 * before issuing a presigned S3 URL (see contractService.signUpload).
 *
 * @param {File} file
 * @returns {Promise<string>} 64-char hex digest
 */
export async function hashFile(file) {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }