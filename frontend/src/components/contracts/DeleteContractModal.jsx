import { useState } from "react";
import { contractService } from "../../services/contractService";
import CloseModalIcon from "../icons/CloseModalIcon";
import SpinnerIcon from "../icons/SpinnerIcon";

/**
 * DeleteContractModal — confirmation dialog for deleting a contract.
 * Delete is restricted to contract_manager on the backend; the button that
 * opens this modal is similarly gated in ContractsPage.
 */
export default function DeleteContractModal({ contract, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  function handleConfirm() {
    setSubmitError(null);
    setSubmitting(true);
    contractService
      .deleteContract(contract.id)
      .then(() => onDeleted(contract))
      .catch((err) => {
        const message =
          err?.response?.data?.message ||
          "Failed to delete the project. Please try again.";
        setSubmitError(message);
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
        aria-labelledby="delete-contract-title"
      >
        <div className="flex items-start justify-between mb-6 gap-4 p-6 bg-bg-cards1 rounded-t-xl">
          <h2
            id="delete-contract-title"
            className="text-lg font-medium text-text-primary"
          >
            Delete Project
          </h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            <CloseModalIcon />
          </button>
        </div>

        <div className="px-6 pb-6">
          <p className="text-text-primary text-sm">
            Delete <span className="font-bold">{contract?.name}</span>?
          </p>
          <p className="text-text-placeholder text-sm">
            This will permanently remove the project and its uploaded
            document. This cannot be undone.
          </p>
          {submitError && (
            <p className="text-status-risk text-sm mt-3">{submitError}</p>
          )}
        </div>

        <div className="flex gap-3 px-14 pb-8">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 bg-bg-cards1 text-text-secondary border border-border rounded-3xl px-5 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
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
        </div>
      </div>
    </div>
  );
}
