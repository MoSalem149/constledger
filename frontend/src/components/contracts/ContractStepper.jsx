/**
 * ContractStepper — reusable 4-step stepper for contract upload & review flow.
 *
 * Used on:
 *   - UploadContractPage  (steps: Upload → Read → Extract → Review)
 *   - ReviewEditFormPage  (steps: Upload → Read → Extract → Review, where Review is active-review)
 */
import CheckCircleIcon from "../icons/CheckCircleIcon";
import SpinnerIcon from "../icons/SpinnerIcon";

const STEP_COUNT = 4;

function StepCircle({ status, stepIndex }) {
  if (status === "completed") {
    return (
      <div className="w-10 h-10 rounded-full bg-status-track flex items-center justify-center">
        <CheckCircleIcon className="text-white" />
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
        <SpinnerIcon className="text-white animate-spin" />
      </div>
    );
  }

  if (status === "active-review") {
    return (
      <div className="w-10 h-10 rounded-full bg-bg-mainColor flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <CheckCircleIcon className="text-white" />
        </div>
      </div>
    );
  }

  // pending
  return (
    <div className="w-10 h-10 rounded-full bg-bg-main border-[1.6px] border-gray-100 flex items-center justify-center">
      <span className="text-sm font-medium text-text-secondary">
        {stepIndex + 1}
      </span>
    </div>
  );
}

export default function ContractStepper({
  steps,
  currentStep,
  stepStatus,
  progress,
}) {
  return (
    <div className="flex flex-col w-full bg-bg-cards1 p-4 rounded">
      {/* Stepper row */}
      <div className="flex items-center justify-center gap-0">
        {steps.map((step, index) => {
          const status = stepStatus[index] || "pending";
          const isLast = index === STEP_COUNT - 1;

          return (
            <div key={step.key} className="flex items-center">
              {/* Step node */}
              <div className="flex items-center gap-4">
                <StepCircle status={status} stepIndex={index} />
                <div className="flex flex-col justify-center h-10">
                  <span
                    className={`text-sm font-medium ${
                      status === "pending"
                        ? "text-text-secondary"
                        : "text-text-primary"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.subLabel && (
                    <span className="text-xs font-medium text-text-placeholder">
                      {step.subLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className="mx-3 w-[72px] h-0.5 rounded-2xl bg-gray-100 data-[completed=true]:bg-status-track"
                  data-completed={status === "completed"}
                  style={
                    status === "completed" ? { backgroundColor: "#007D0F" } : {}
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar (only shown during Extract step) */}
      {progress && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-placeholder">
              {progress.label}
            </span>
            <span className="text-xs font-medium text-text-primary">
              {progress.percent}%
            </span>
          </div>
          <div className="w-full h-[9px] bg-gray-100 rounded-2xl overflow-hidden">
            <div
              className="h-full bg-primary rounded-2xl transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
