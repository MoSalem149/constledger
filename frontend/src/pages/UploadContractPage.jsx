/**
 * UploadContractPage — drag-and-drop contract upload with S3 presigned URL flow.
 *
 * Upload flow:
 *   idle      → file picker + "What AI Extracts" side panel
 *   processing→ stepper + progress bar + activity log
 *               (Upload step active during S3 upload, then Read/Extract simulation)
 *               while backend runs OCR + AI analysis asynchronously
 *
 * Why async polling instead of waiting on createContract?
 *   Vercel has a hard 60s proxy timeout. The AI pipeline (OCR + 5 LLM calls)
 *   takes 3–5 minutes. The backend now returns 202 immediately and runs
 *   analysis in the background. We poll GET /api/contracts/:id every 4s
 *   until status is no longer 'processing'.
 *
 * S3 flow:
 *   1. signUpload    → get presigned URL
 *   2. putFileToS3   → PUT file directly to S3
 *   3. completeUpload→ notify backend upload is done
 *   4. createContract→ POST { name, uploadId } → 202 { id, status: 'processing' }
 *   5. pollContractReady(id) → polls GET /api/contracts/:id until done
 *
 * Role: contract_manager only (enforced by RoleGuard in App.jsx).
 */
import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import UploadDropzone from "../components/contracts/UploadDropzone";
import AIExtractsPanel from "../components/contracts/AIExtractsPanel";
import ProcessingCard from "../components/contracts/ProcessingCard";
import { contractService } from "../services/contractService";
import { isValidFile } from "../utils/fileValidation";
import { startSimulation } from "../utils/fakeProgress";
import { putFileToS3 } from "../utils/s3Upload";
import { UContractContext } from "../context/UploadedContractContext";

/* ------------------------------------------------------------------ */
// Helpers
/* ------------------------------------------------------------------ */

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
// Page
/* ------------------------------------------------------------------ */

export default function UploadContractPage() {
  const { setContractData } = useContext(UContractContext);
  const navigate = useNavigate();
  const [pageState, setPageState] = useState("idle");
  const [error, setError] = useState(null);

  // Processing state
  const [fileInfo, setFileInfo] = useState(null);
  const [stepStatus, setStepStatus] = useState([
    "pending",
    "pending",
    "pending",
    "pending",
  ]);
  const [progress, setProgress] = useState(null);
  const [activityLog, setActivityLog] = useState([]);

  // Refs for cleanup
  const cleanupRef = useRef(null);
  // Track whether the component is still mounted to avoid state updates after unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Global error handlers to catch errors that escape the try-catch
    // (e.g. from setInterval callbacks, unhandled rejections, etc.)
    const onError = (evt) => {
      console.error("Global error:", evt.error || evt.message);
      if (mountedRef.current) {
        setError(
          "Something went wrong while uploading your contract. Please try again.",
        );
        setPageState("idle");
      }
    };
    const onRejection = (evt) => {
      console.error("Unhandled rejection:", evt.reason);
      if (mountedRef.current) {
        setError(
          `[UnhandledRejection] ${evt.reason?.message || String(evt.reason)}`,
        );
        setPageState("idle");
      }
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  /* ---------------------------------------------------------------- */
  // Main upload + poll handler
  /* ---------------------------------------------------------------- */

  const handleFileSelect = useCallback(
    async (file) => {
      let cleanup = null;

      try {
        if (!file) return;

        if (!isValidFile(file)) {
          setError("Only PDF and DOCX files are allowed.");
          return;
        }

        if (file.size > 50 * 1024 * 1024) {
          setError("File size exceeds 50 MB limit.");
          return;
        }

        setError(null);
        setFileInfo({
          name: file.name,
          size: formatFileSize(file.size),
        });

        setPageState("processing");
        setActivityLog([
          {
            timestamp: getTimestamp(),
            message: "Uploading file to secure storage...",
          },
        ]);
        setProgress({ label: "Uploading file...", percent: 0 });
        setStepStatus(["active", "pending", "pending", "pending"]);

        const fileHash = await hashFile(file).catch((err) => {
          throw new Error(`[Step 0: hashFile] ${err?.message || err}`);
        });

        const { uploadUrl, key } = await contractService
          .signUpload({
            filename: file.name,
            mimeType: file.type,
            size: file.size,
          })
          .catch((err) => {
            throw new Error(`[Step 1: signUpload] ${err?.message || err}`);
          });

        await putFileToS3(uploadUrl, file).catch((err) => {
          throw new Error(`[Step 2: putFileToS3] ${err?.message || err}`);
        });

        if (cancelledRef.current) return;

        const { uploadId } = await contractService
          .completeUpload({
            s3Key: key,
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
          })
          .catch((err) => {
            throw new Error(`[Step 3: completeUpload] ${err?.message || err}`);
          });

        setStepStatus(["completed", "active", "pending", "pending"]);

        if (cancelledRef.current) return;

        cleanup = startSimulation({
          onStepChange: (nextStepStatus) => {
            if (!mountedRef.current) return;
            setStepStatus(nextStepStatus);
          },
          onProgress: (nextProgress) => {
            if (!mountedRef.current) return;
            setProgress(nextProgress);
          },
          onEvent: (evt) => {
            if (!mountedRef.current) return;
            setActivityLog((prev) => [...prev, evt]);
          },
          onError: (simError) => {
            console.error("Simulation error:", simError);

            if (!mountedRef.current) return;

            setError(
              "Something went wrong while analyzing your document. Please try again.",
            );
            setPageState("idle");
          },
        });

        if (typeof cleanup !== "function") {
          throw new Error(
            `cleanup is ${typeof cleanup} — startSimulation did not return a function`,
          );
        }

        cleanupRef.current = cleanup;

        const { id: contractId } = await contractService
          .createContract(file.name, uploadId)
          .catch((err) => {
            throw new Error(`[Step 4: createContract] ${err?.message || err}`);
          });

        contractIdRef.current = contractId;

        if (cancelledRef.current) {
          // User cancelled while the contract was being created — clean it
          // up best-effort so we don't leave an orphaned "processing" record.
          contractService.deleteContract(contractId).catch(() => {});
          return;
        }

        const contract = await contractService
          .pollContractReady(contractId)
          .catch((err) => {
            throw new Error(
              `[Step 5: pollContractReady] ${err?.message || err}`,
            );
          });

        if (!mountedRef.current) return;

        if (cancelledRef.current) {
          contractService.deleteContract(contractId).catch(() => {});
          return;
        }

        if (typeof cleanupRef.current === "function") {
          cleanupRef.current();
        }
        cleanupRef.current = null;
        cleanup = null;

        if (typeof setContractData !== "function") {
          throw new Error(
            `setContractData is ${typeof setContractData} — context value may be corrupted`,
          );
        }

        if (typeof navigate !== "function") {
          throw new Error(
            `navigate is ${typeof navigate} — router hook may be corrupted`,
          );
        }

        setContractData(contract);

        if (contract.status === "analysis_failed") {
          navigate(`/contracts/${contract.id}/edit`, {
            state: {
              analysisError: "AI analysis failed. Some fields may be missing.",
              partialData: true,
            },
          });
        } else {
          navigate(`/contracts/${contract.id}/edit`);
        }
      } catch (err) {
        console.error("Upload failed:", err);

        if (!mountedRef.current) return;

        if (typeof cleanup === "function") {
          cleanup();
        }

        if (typeof cleanupRef.current === "function") {
          cleanupRef.current();
        }

        cleanupRef.current = null;

        const status = err?.response?.status;
        const data = err?.response?.data;

        let friendlyMessage;

        if (err?.isUserFacing) {
          // Errors we deliberately threw with an end-user-ready message
          // (e.g. "this file was already uploaded") — show as-is.
          friendlyMessage = err.message;
        } else if (status === 409) {
          friendlyMessage =
            data?.message ||
            "This file is already linked to a contract. Please upload a different file.";
        } else if (status === 413) {
          friendlyMessage =
            "This file is too large to upload. Please try a smaller file.";
        } else if (status >= 500) {
          friendlyMessage =
            "Our servers had trouble processing this upload. Please try again in a moment.";
        } else if (
          typeof navigator !== "undefined" &&
          navigator.onLine === false
        ) {
          friendlyMessage =
            "You appear to be offline. Please check your connection and try again.";
        } else {
          setError(diagMsg);
        }

        setError(friendlyMessage);
        setPageState("idle");
      }
    },
    [navigate, setContractData],
  );

  const handleBack = useCallback(() => {
    if (typeof cleanupRef.current === "function") {
      cleanupRef.current();
    }

    cleanupRef.current = null;
    navigate("/contracts");
  }, [navigate]);

  /* ---------------------------------------------------------------- */
  // Cleanup on unmount
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    return () => {
      if (typeof cleanupRef.current === "function") {
        cleanupRef.current();
      }

      cleanupRef.current = null;
    };
  }, []);

  /* ---------------------------------------------------------------- */
  // Subtitle text based on state
  /* ---------------------------------------------------------------- */

  const subtitleText =
    pageState === "processing"
      ? stepStatus[0] === "active"
        ? "Uploading your contract to secure storage..."
        : "AI is processing your document. This may take a few moments."
      : "Drop your signed contract - our AI will read it and extract the key terms. You'll review and confirm everything before it goes live.";

  /* ---------------------------------------------------------------- */
  // Render
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-6 pr-10">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {/* Left: breadcrumb + title + subtitle */}
        <div className="flex flex-col gap-3 max-w-[750px]">
          <span className="text-xs font-normal text-text-placeholder leading-[18px] font-sans">
            PROJECTS . NEW
          </span>
          <h1 className="text-2xl font-medium font-sans text-text-primary leading-5">
            Add a New Project
          </h1>
          <p className="text-xs text-text-secondary leading-[18px] font-sans">
            {subtitleText}
          </p>
        </div>

        {/* Right: Back button */}
        <button
          onClick={handleBack}
          className="
            h-10 px-4 bg-white rounded-[28px]
            shadow-[0_2px_8px_rgba(136,136,136,0.1)]
            flex items-center gap-2
            text-xs text-text-primary font-normal
            hover:bg-gray-100 transition-colors
          "
        >
          <ArrowLeftIcon className="w-5 h-5 text-text-primary" />
          Back to Projects
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-bg-atRisk200 text-status-risk px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Content area */}
      {pageState === "idle" && (
        <div className="flex flex-col lg:flex-row gap-4">
          <UploadDropzone onFileSelect={handleFileSelect} onError={setError} />
          <AIExtractsPanel />
        </div>
      )}

      {pageState === "processing" && fileInfo && (
        <ProcessingCard
          fileName={fileInfo.name}
          fileSize={fileInfo.size}
          stepStatus={stepStatus}
          progress={progress}
          activityLog={activityLog}
        />
      )}
    </div>
  );
}
