/**
 * ProcessingCard — the full-width card shown after uploading a contract.
 *
 * Displays:
 *   - File name/size + dynamic status badge
 *   - 4-step stepper (Upload → Read → Extract → Review)
 *   - Progress bar (during Extract step)
 *   - Activity log
 */
import FileDocIcon from "../icons/FileDocIcon";
import ContractStepper from "./ContractStepper";
import ActivityLog from "./ActivityLog";

export default function ProcessingCard({
  fileName,
  fileSize,
  stepStatus,
  progress,
  activityLog,
}) {
  const steps = [
    { key: "upload", label: "Upload", subLabel: "File Received" },
    { key: "read", label: "Read", subLabel: "Parsing document" },
    { key: "extract", label: "Extract", subLabel: "AI Analysis" },
    { key: "review", label: "Review", subLabel: "Confirm Fields" },
  ];

  const currentStepIndex = stepStatus.findIndex(
    (s) => s === "active" || s === "active-review",
  );

  // If no active step found (all pending), default to first
  const currentStep =
    currentStepIndex >= 0 ? currentStepIndex : stepStatus.length - 1;

  return (
    <div className="w-full bg-white rounded-lg shadow-[0_2px_8px_rgba(136,136,136,0.1)] p-6">
      <div className="flex flex-col gap-6">
        {/* File info row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
          {/* Left: file name + size */}
          <div className="flex items-center gap-4 min-w-0">
            <FileDocIcon className="text-text-secondary w-6 h-7 shrink-0" />
            <div className="flex flex-col gap-2 min-w-0">
              <span className="text-sm font-medium text-text-primary truncate max-w-[200px] sm:max-w-[400px]">
                {fileName}
              </span>
              <span className="text-xs text-text-placeholder">{fileSize}</span>
            </div>
          </div>

          {/* Right: status badge */}
          <div className="bg-bg-mainColor rounded-[28px] px-2.5 py-[3px] flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {["Uploading…", "Reading…", "Extracting…", "Reviewing…"][
                currentStep
              ] ?? "Processing…"}
            </span>
          </div>
        </div>

        {/* Stepper */}
        <div className="pb-4 border-b border-gray-100">
          <ContractStepper
            steps={steps}
            currentStep={currentStep}
            stepStatus={stepStatus}
            progress={progress}
          />
        </div>

        {/* Activity Log */}
        <ActivityLog events={activityLog} />
      </div>
    </div>
  );
}
