/**
 * UploadContractPage — drag-and-drop contract upload with async polling.
 *
 * Sprint 2 builds the full screen:
 *   idle      → file picker + "What AI Extracts" side panel
 *   uploading → brief loading state while POST is in flight
 *   processing→ stepper + progress bar + activity log (polling every 5s)
 *
 * The "Back to Projects" button navigates to /dashboard.
 * Pass ?demo=1 in the URL to preview the processing state with mock data.
 *
 * Role: contractManager only (enforced by RoleGuard in App.jsx).
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import UploadDropzone from "../components/contracts/UploadDropzone";
import AIExtractsPanel from "../components/contracts/AIExtractsPanel";
import ProcessingCard from "../components/contracts/ProcessingCard";
import { contractService } from "../services/contractService";

/* ------------------------------------------------------------------ */
// Helpers
/* ------------------------------------------------------------------ */

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusToStepStatus(status) {
  switch (status) {
    case "uploading":
      return ["active", "pending", "pending", "pending"];
    case "reading":
      return ["completed", "active", "pending", "pending"];
    case "extracting":
      return ["completed", "completed", "active", "pending"];
    case "active":
      return ["completed", "completed", "completed", "active-review"];
    case "analysis_failed":
      return ["completed", "completed", "completed", "active-review"];
    default:
      return ["pending", "pending", "pending", "pending"];
  }
}

/* ------------------------------------------------------------------ */
// Mock data for ?demo=1
/* ------------------------------------------------------------------ */

const DEMO_FILE = { name: "Aswan_Solar_Park.pdf", size: 7130317 }; // ~6.8 MB

const DEMO_EVENTS = [
  { timestamp: "10:30 AM", message: "Contract uploaded successfully" },
  { timestamp: "10:30 AM", message: "AI is reading the document..." },
  { timestamp: "10:31 AM", message: "Extracting contract structure..." },
  { timestamp: "10:31 AM", message: "Parsing milestone schedules..." },
  { timestamp: "10:32 AM", message: "Identifying payment terms..." },
];

/* ------------------------------------------------------------------ */
// Page
/* ------------------------------------------------------------------ */

export default function UploadContractPage() {
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
  const [contractId, setContractId] = useState(null);
  const [stepStatus, setStepStatus] = useState(
    isDemo
      ? ["completed", "completed", "active", "pending"]
      : ["pending", "pending", "pending", "pending"],
  );
  const [progress, setProgress] = useState(
    isDemo
      ? { label: "AI Analyzing Contract Structure...", percent: 91 }
      : null,
  );
  const [activityLog, setActivityLog] = useState(isDemo ? DEMO_EVENTS : []);

  // Polling ref — stores the setInterval timer ID so we can clear it later
  // without triggering re-renders. useRef persists across renders.
  const pollRef = useRef(null);

  /* ---------------------------------------------------------------- */
  // Demo mode simulation
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!isDemo || pageState !== "processing") return;

    let progressVal = 91;
    let eventIdx = DEMO_EVENTS.length - 1;
    const interval = setInterval(() => {
      progressVal = Math.min(progressVal + Math.random() * 3, 99);
      setProgress({
        label: "AI Analyzing Contract Structure...",
        percent: Math.round(progressVal),
      });

      // Simulate adding events
      if (Math.random() > 0.7 && eventIdx < 8) {
        eventIdx++;
        setActivityLog((prev) => [
          ...prev,
          {
            timestamp: "10:32 AM",
            message: `Processing field group ${eventIdx - 2}...`,
          },
        ]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isDemo, pageState]);

  /* ---------------------------------------------------------------- */
  // Real polling
  /* ---------------------------------------------------------------- */

  const startPolling = useCallback(
    (id) => {
      if (pollRef.current) clearInterval(pollRef.current);

      pollRef.current = setInterval(async () => {
        try {
          const data = await contractService.getContractProgress(id);
          setStepStatus(statusToStepStatus(data.status));
          setProgress({
            label:
              data.status === "reading"
                ? "AI is reading the document..."
                : data.status === "extracting"
                  ? "AI Analyzing Contract Structure..."
                  : "Processing...",
            percent: data.progress ?? 0,
          });
          setActivityLog(data.activityLog ?? []);

          if (data.status === "active") {
            clearInterval(pollRef.current);
            pollRef.current = null;
            navigate(`/contracts/${id}`);
          }

          if (data.status === "analysis_failed") {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setError("AI analysis failed. Please try again.");
            setPageState("idle");
          }
        } catch {
          // Network errors during polling — keep polling
        }
      }, 5000);
    },
    [navigate],
  );

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  /* ---------------------------------------------------------------- */
  // Handlers
  /* ---------------------------------------------------------------- */

  const handleFileSelect = useCallback(
    async (file) => {
      if (!file) return;
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError("File size exceeds 50 MB limit.");
        return;
      }

      setError(null);
      setFileInfo({ name: file.name, size: formatFileSize(file.size) });
      setPageState("uploading");

      try {
        const result = await contractService.uploadContract(file);
        setContractId(result.contractId);
        setPageState("processing");
        setStepStatus(statusToStepStatus(result.status || "uploading"));
        setProgress({
          label: "AI Analyzing Contract Structure...",
          percent: result.progress ?? 0,
        });
        setActivityLog(result.activityLog ?? []);
        startPolling(result.contractId);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Upload failed. Please check your connection and try again.",
        );
        setPageState("idle");
      }
    },
    [startPolling],
  );

  const handleBack = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    navigate("/dashboard");
  }, [navigate]);

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
