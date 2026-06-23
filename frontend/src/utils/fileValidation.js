// DOCX temporarily disabled — only PDF is accepted for now.
// To re-enable: add "docx" back here and
// "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
// to ALLOWED_MIME_TYPES, and bump the backend's ALLOWED_MIME in s3Upload.ts.
export const ALLOWED_EXTENSIONS = ["pdf"];
export const ALLOWED_MIME_TYPES = ["application/pdf"];

// Recognized so we can give people a specific, helpful message instead of a
// generic "invalid file" error when they try to upload a Word document.
const WORD_EXTENSIONS = ["docx", "doc"];
const WORD_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

function getExtension(file) {
  return (file?.name?.split(".").pop() || "").toLowerCase();
}

export function isValidFile(file) {
  if (!file) return false;
  // MIME type check (primary)
  if (ALLOWED_MIME_TYPES.includes(file.type)) return true;
  // Extension fallback (handles MIME spoofing/empty for DOCX on Windows)
  return ALLOWED_EXTENSIONS.includes(getExtension(file));
}

export function isWordFile(file) {
  if (!file) return false;
  if (WORD_MIME_TYPES.includes(file.type)) return true;
  return WORD_EXTENSIONS.includes(getExtension(file));
}

// Returns a clear, user-friendly explanation for why a file was rejected.
// Only meaningful when isValidFile(file) is false.
export function getFileTypeErrorMessage(file) {
  if (isWordFile(file)) {
    return "Word documents (.doc/.docx) aren't supported yet. Please save or export your contract as a PDF and upload that instead.";
  }
  return "That file type isn't supported. Please upload your contract as a PDF.";
}