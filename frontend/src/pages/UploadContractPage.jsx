/**
 * UploadContractPage — drag-and-drop contract upload with S3 presigned URL flow.
 *
 * Sprint 2 builds the full screen:
 *   idle      → file picker + "What AI Extracts" side panel
 *   uploading → stepper steps 1-3 (S3 sign, S3 PUT, complete upload)
 *   processing→ stepper step 4 active + progress bar + activity log (frontend simulation)
 *
 * The backend only returns terminal status after `createContract` completes.
 * `createContract` is synchronous (blocks 20-30s during AI analysis).
 * All intermediate progress (stepper, progress bar, activity log) is simulated
 * on the frontend via `fakeProgress.js` for a smooth UX.
 *
 * S3 flow:
 *   1. signUpload    → get presigned URL
 *   2. putFileToS3   → PUT file directly to S3
 *   3. completeUpload→ notify backend upload is done
 *   4. createContract→ POST JSON { name, uploadId } (blocks until AI finishes)
 *                      Backend downloads the file from S3 itself.
 *
 * The "Back to Projects" button navigates to /dashboard.
 * Pass ?demo=1 in the URL to preview the processing state with mock data.
 *
 * Role: contract_manager only (enforced by RoleGuard in App.jsx).
 */
import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

/* ------------------------------------------------------------------ */
// Mock data for ?demo=1
/* ------------------------------------------------------------------ */

const DEMO_FILE = { name: "Aswan_Solar_Park.pdf", size: 7130317 }; // ~6.8 MB

/* ------------------------------------------------------------------ */
// Page
/* ------------------------------------------------------------------ */

export default function UploadContractPage() {
  const { saveContractData } = useContext(UContractContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";

  // Page state machine: idle | uploading | processing | error
  const [pageState, setPageState] = useState(isDemo ? "processing" : "idle");
  const [error, setError] = useState(null);

  // Processing state
  const [fileInfo, setFileInfo] = useState(
    isDemo
      ? { name: DEMO_FILE.name, size: formatFileSize(DEMO_FILE.size) }
      : null,
  );
  const [stepStatus, setStepStatus] = useState(
    isDemo
      ? ["completed", "active", "pending", "pending"]
      : ["pending", "pending", "pending", "pending"],
  );
  const [progress, setProgress] = useState(null);
  const [activityLog, setActivityLog] = useState([]);

  // Refs for cleanup
  const cleanupRef = useRef(null);
  const demoTimerRef = useRef(null);

  /* ---------------------------------------------------------------- */
  // Demo mode simulation
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!isDemo || pageState !== "processing") return;

    // Start simulation for visual preview
    const cleanup = startSimulation({
      onStepChange: setStepStatus,
      onProgress: setProgress,
      onEvent: (evt) => setActivityLog((prev) => [...prev, evt]),
    });
    cleanupRef.current = cleanup;

    // Auto-navigate after ~30s
    demoTimerRef.current = setTimeout(() => {
      cleanup();
      cleanupRef.current = null;
      navigate("/contracts/demo/edit");
    }, 30000);

    return () => {
      cleanup();
      cleanupRef.current = null;
      if (demoTimerRef.current) {
        clearTimeout(demoTimerRef.current);
        demoTimerRef.current = null;
      }
    };
  }, [isDemo, pageState, navigate]);

  /* ---------------------------------------------------------------- */
  // Handlers
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
      setPageState("uploading");
      setActivityLog([]);
      setProgress(null);
      setStepStatus(["completed", "active", "pending", "pending"]);

      try {
        // Step 1: Request presigned S3 URL
        const { uploadUrl, key } = await contractService.signUpload({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });

        // Step 2: Upload file directly to S3
        await putFileToS3(uploadUrl, file);

        // Step 3: Notify backend upload is complete
        const { uploadId } = await contractService.completeUpload({
          s3Key: key,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        });

        // Step 4: Create contract (synchronous — blocks until AI analysis finishes)
        setPageState("processing");
        setStepStatus(["completed", "completed", "active", "pending"]);

        const cleanup = startSimulation({
          onStepChange: setStepStatus,
          onProgress: setProgress,
          onEvent: (evt) => setActivityLog((prev) => [...prev, evt]),
        });
        cleanupRef.current = cleanup;

        const contract = await contractService.createContract(
          file.name,
          uploadId,
        );

        // send uploded contract to context

        saveContractData(contract);

        // Success — stop simulation and navigate to review form
        cleanup();
        cleanupRef.current = null;
        navigate(`/contracts/${contract.id}/edit`);
      } catch (err) {
        // Clean up any running simulation
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }

        const status = err?.response?.status;
        const data = err?.response?.data;

        if (status === 409) {
          // Upload already linked to a contract
          setError(
            data?.message ||
              "This file is already linked to a contract. Please upload a different file.",
          );
        } else if (status === 422) {
          // AI analysis failed — contract may have partial data
          const contract = data?.contract;
          if (contract?._id || contract?.id) {
            // Navigate to edit page so user can see partial data
            saveContractData(contract);
            const id = contract.id || contract._id;
            navigate(`/contracts/${id}/edit`, {
              state: {
                analysisError: data?.error || "AI analysis failed",
                partialData: true,
              },
            });
            return;
          }
          setError(
            data?.message ||
              data?.error ||
              "AI analysis failed. Please try again or contact support.",
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
    [navigate],
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
      if (demoTimerRef.current) {
        clearTimeout(demoTimerRef.current);
        demoTimerRef.current = null;
      }
    };
  }, []);

  /* ---------------------------------------------------------------- */
  // Subtitle text based on state
  /* ---------------------------------------------------------------- */

  const subtitleText =
    pageState === "processing"
      ? "AI is processing your document. This may take a few moments."
      : "Drop your signed contract - our AI will read it and extract the key terms. You'll review and confirm everything before it goes live.";

  /* ---------------------------------------------------------------- */
  // Render
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
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
        <div className="flex gap-4 mr-16">
          <UploadDropzone onFileSelect={handleFileSelect} />
          <AIExtractsPanel />
        </div>
      )}

      {pageState === "uploading" && (
        <div className="flex items-center justify-center h-[428px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-text-secondary">Uploading contract...</p>
          </div>
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
