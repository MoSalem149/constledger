/**
 * Generic `_id` → `id` normalizer.
 *
 * Backend (MongoDB) returns `_id` in most endpoints. The frontend standard
 * is `id` everywhere. This normalizer strips `_id` and promotes it to `id`
 * (if `id` is not already present).
 *
 * Also normalizes nested objects that have `_id` (e.g., `uploadedBy`).
 */

function normalizeId(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(normalizeId);

  const { _id, ...rest } = obj;
  const normalized = { ...rest };

  if (rest.id == null && _id != null) {
    normalized.id = _id;
  }

  // Recurse into nested objects that might have _id
  for (const key in normalized) {
    if (normalized[key] && typeof normalized[key] === "object") {
      normalized[key] = normalizeId(normalized[key]);
    }
  }

  return normalized;
}

function normalizeIdArray(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map(normalizeId);
}

export { normalizeId, normalizeIdArray };
