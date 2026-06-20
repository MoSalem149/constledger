export const ALLOWED_EXTENSIONS = ["pdf", "docx"];
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function isValidFile(file) {
  if (!file) return false;
  // MIME type check (primary)
  if (ALLOWED_MIME_TYPES.includes(file.type)) return true;
  // Extension fallback (handles MIME spoofing/empty for DOCX on Windows)
  const ext = file.name.split(".").pop().toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}