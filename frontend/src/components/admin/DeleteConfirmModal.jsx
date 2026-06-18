import { useState } from "react";
import { userService } from "../../services/userService";
import { classifyUserError, deleteModalMessage } from "../../utils/userErrors";
import CloseModalIcon from "../icons/CloseModalIcon";
import SpinnerIcon from "../icons/SpinnerIcon";

export default function DeleteConfirmModal({
  user,
  blocked = false,
  onClose,
  onDeleted,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  function handleConfirm() {
    setSubmitError(null);
    setSubmitting(true);
    const userId = user.id || user._id;
    userService
      .deleteUser(userId)
      .then(() => onDeleted(user))
      .catch((err) => {
        const type = classifyUserError(err);
        setSubmitError(deleteModalMessage(type));
        setSubmitting(false);
      });
  }

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) handleClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-bg-main rounded-xl w-full max-w-[460px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
      >
        <div className="flex items-start justify-between mb-6 gap-4 p-6 bg-bg-cards1 rounded-t-xl">
          <h2
            id="delete-user-title"
            className="text-lg font-medium text-text-primary"
          >
            Delete User
          </h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            <CloseModalIcon />
          </button>
        </div>

        {blocked ? (
          <div className="px-6 pb-6">
            <p className="text-text-primary text-sm">
              You cannot delete your own account.
            </p>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <p className="text-text-primary text-sm">
              Delete <span className="font-bold">{user?.name}</span>?
            </p>
            <p className="text-text-placeholder text-sm">
              This cannot be undone.
            </p>
            {submitError && (
              <p className="text-status-risk text-sm mt-3">{submitError}</p>
            )}
          </div>
        )}

        <div className="flex gap-3 px-14 pb-8">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 bg-bg-cards1 text-text-secondary border border-border rounded-3xl px-5 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {blocked ? "Close" : "Cancel"}
          </button>
          {!blocked && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 bg-primary text-white rounded-3xl px-7 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <SpinnerIcon className="animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
