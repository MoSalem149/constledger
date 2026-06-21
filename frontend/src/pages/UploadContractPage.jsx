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
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ---------------------------------------------------------------- */
  // Main upload + poll handler
  /* ---------------------------------------------------------------- */

  const handleFileSelect = useCallback(
    async (file) => {
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
      setFileInfo({ name: file.name, size: formatFileSize(file.size) });
      setPageState("processing");
      setActivityLog([
        {
          timestamp: getTimestamp(),
          message: "Uploading file to secure storage...",
        },
      ]);
      setProgress({ label: "Uploading file...", percent: 0 });
      setStepStatus(["active", "pending", "pending", "pending"]);

      try {
        // ── Step 1: Request presigned S3 URL ──────────────────────────
        const { uploadUrl, key } = await contractService.signUpload({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });

        // ── Step 2: Upload file directly to S3 ───────────────────────
        await putFileToS3(uploadUrl, file);

        // ── Step 3: Notify backend upload is complete ─────────────────
        const { uploadId } = await contractService.completeUpload({
          s3Key: key,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        });

        // ── Step 4: Create contract record (returns 202 immediately) ──
        // The backend kicks off AI analysis in the background and responds
        // in <1s with { id, name, status: 'processing' }.
        //
        // Hand off from Upload step to Read step. fakeProgress starts at the
        // read phase and will immediately mark Upload completed + Read active.
        setStepStatus(["completed", "active", "pending", "pending"]);

        // Start the fake progress simulation while we wait for AI
        const cleanup = startSimulation({
          onStepChange: setStepStatus,
          onProgress: setProgress,
          onEvent: (evt) => setActivityLog((prev) => [...prev, evt]),
        });
        cleanupRef.current = cleanup;

        const { id: contractId } = await contractService.createContract(
          file.name,
          uploadId,
        );

        // ── Step 5: Poll until analysis finishes ──────────────────────
        // GET /api/contracts/:id every 4s until status !== 'processing'
        const contract = await contractService.pollContractReady(contractId);

        // Guard: don't update state if the user navigated away
        if (!mountedRef.current) return;

        // Stop the simulation
        cleanup();
        cleanupRef.current = null;

        setContractData?.(contract);

        if (contract.status === "analysis_failed") {
          // AI failed but contract record exists — let user see partial data
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

        // Stop any running simulation
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }

        const status = err?.response?.status;
        const data = err?.response?.data;

        if (status === 409) {
          setError(
            data?.message ||
              "This file is already linked to a contract. Please upload a different file.",
          );
        } else {
          setError(
            data?.message ||
              err?.message ||
              "Upload failed. Please check your connection and try again.",
          );
        }

        setPageState("idle");
      }
    },
    [navigate, setContractData],
  );

  const handleBack = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    navigate("/contracts");
  }, [navigate]);

  /* ---------------------------------------------------------------- */
  // Cleanup on unmount
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
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
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between mr-10">
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
        <div className="flex gap-4 mr-10">
          <UploadDropzone onFileSelect={handleFileSelect} />
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
