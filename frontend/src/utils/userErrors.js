export const USER_ERROR_TYPES = {
  NETWORK: "network",
  DUPLICATE_EMAIL: "duplicate-email",
  VALIDATION: "validation",
  NOT_FOUND: "not-found",
  PERMISSION_DENIED: "permission-denied",
  PROTECTED: "protected",
  GENERIC: "generic",
};

export function classifyUserError(err) {
  if (!err || !err.response) return USER_ERROR_TYPES.NETWORK;
  const status = err.response.status;
  const data = err.response.data || {};
  const msg = typeof data.message === "string" ? data.message : "";
  if (status === 409 || data.code === 11000 || /duplicate key|E11000/i.test(msg)) {
    return USER_ERROR_TYPES.DUPLICATE_EMAIL;
  }
  if (status === 400) return USER_ERROR_TYPES.VALIDATION;
  if (status === 404) return USER_ERROR_TYPES.NOT_FOUND;
  if (status === 403) {
    if (/is not allowed/i.test(msg)) return USER_ERROR_TYPES.PERMISSION_DENIED;
    return USER_ERROR_TYPES.PROTECTED;
  }
  return USER_ERROR_TYPES.GENERIC;
}

function isSafeHint(message) {
  if (typeof message !== "string") return null;
  if (message.length > 120) return null;
  if (/[\/\\]/.test(message)) return null;
  if (/\bat\b/.test(message)) return null;
  return message;
}

export function userModalMessage(type, err) {
  switch (type) {
    case USER_ERROR_TYPES.DUPLICATE_EMAIL:
      return "This email is already in use";
    case USER_ERROR_TYPES.NOT_FOUND:
      return "This user no longer exists";
    case USER_ERROR_TYPES.PERMISSION_DENIED:
      return "You no longer have permission to perform this action.";
    case USER_ERROR_TYPES.PROTECTED:
      return "You cannot modify this user.";
    case USER_ERROR_TYPES.VALIDATION: {
      const hint = isSafeHint(err?.response?.data?.message);
      return hint
        ? "Please check your input: " + hint
        : "Please check your input and try again.";
    }
    case USER_ERROR_TYPES.NETWORK:
      return "You appear to be offline. Check your connection and try again.";
    case USER_ERROR_TYPES.GENERIC:
    default:
      return "Something went wrong. Please try again.";
  }
}

export function deleteModalMessage(type) {
  switch (type) {
    case USER_ERROR_TYPES.NOT_FOUND:
      return "This user no longer exists";
    case USER_ERROR_TYPES.PERMISSION_DENIED:
      return "You no longer have permission to perform this action.";
    case USER_ERROR_TYPES.PROTECTED:
      return "This user cannot be deleted.";
    case USER_ERROR_TYPES.NETWORK:
      return "You appear to be offline. Check your connection and try again.";
    case USER_ERROR_TYPES.GENERIC:
    default:
      return "Something went wrong. Please try again.";
  }
}
