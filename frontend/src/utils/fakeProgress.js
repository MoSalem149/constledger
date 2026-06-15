import { contractService } from "../services/contractService";

const TICK_MS = 100;

/**
 * Phase definitions for the simulated progress.
 *
 * The simulation runs through Read → Extract → Hold.
 * Upload is already completed when the simulation starts (the file was just POSTed).
 */
const PHASES = [
  {
    name: "read",
    at: 0,
    stepStatus: ["completed", "active", "pending", "pending"],
    events: [
      { at: 0, message: "Contract uploaded successfully" },
      { at: 500, message: "Starting document analysis..." },
      { at: 1500, message: "Reading document structure..." },
      { at: 3500, message: "Parsing pages..." },
      { at: 5500, message: "Extracting text content..." },
      { at: 7500, message: "Document read successfully" },
    ],
  },
  {
    name: "extract",
    at: 8000,
    stepStatus: ["completed", "completed", "active", "pending"],
    progressLabel: "AI Analyzing Contract Structure...",
    progressStart: 5,
    progressEnd: 92,
    duration: 15000,
    events: [
      { at: 8500, message: "Extracting parties and roles..." },
      { at: 10500, message: "Identifying contract value..." },
      { at: 13500, message: "Parsing milestone schedules..." },
      { at: 16500, message: "Extracting payment terms..." },
      { at: 18500, message: "Analyzing penalty clauses..." },
    ],
  },
];

/** Format current time as "HH:MM AM/PM" */
function getTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Start a frontend-simulated progress animation while polling the backend.
 *
 * The backend only returns terminal statuses ("active" or "analysis_failed").
 * All intermediate states (stepper, progress bar, activity log) are faked
 * on the frontend to provide a smooth UX.
 *
 * @param {string} contractId — the contract ID to poll
 * @param {Object} callbacks — { onStepChange, onProgress, onEvent, onDone, onFail }
 * @returns {function} cleanup — call to stop all timers and polling
 */
export function startSimulation(contractId, callbacks) {
  const { onStepChange, onProgress, onEvent, onDone, onFail } = callbacks;

  const startTime = Date.now();
  let isRunning = true;
  let tickInterval = null;
  let pollInterval = null;

  // Flatten all scheduled events from phases
  const scheduledEvents = [];
  PHASES.forEach((phase) => {
    scheduledEvents.push({
      at: phase.at,
      type: "step",
      stepStatus: phase.stepStatus,
    });
    phase.events.forEach((evt) => {
      scheduledEvents.push({
        at: evt.at,
        type: "event",
        message: evt.message,
      });
    });
  });
  scheduledEvents.sort((a, b) => a.at - b.at);

  let nextEventIndex = 0;
  let holdMode = false;
  let holdStartTime = null;

  function tick() {
    if (!isRunning) return;
    const elapsed = Date.now() - startTime;

    // Process scheduled events
    while (
      nextEventIndex < scheduledEvents.length &&
      scheduledEvents[nextEventIndex].at <= elapsed
    ) {
      const event = scheduledEvents[nextEventIndex++];
      if (event.type === "step") {
        onStepChange(event.stepStatus);
      } else if (event.type === "event") {
        onEvent({ timestamp: getTimestamp(), message: event.message });
      }
    }

    // Calculate progress bar (visible from the start)
    const readDuration = 8000;
    const extractDuration = 15000;
    const holdDuration = 10000;

    let percent;
    let label;

    if (elapsed < readDuration) {
      // 0% → 5% over 8s (linear start — document reading)
      const ratio = elapsed / readDuration;
      percent = Math.round(5 * ratio);
      label = "Reading document...";
    } else if (elapsed < readDuration + extractDuration) {
      // 5% → 92% over 15s (ease-out cubic — AI extracting)
      const extractElapsed = elapsed - readDuration;
      const ratio = extractElapsed / extractDuration;
      const eased = 1 - Math.pow(1 - ratio, 3);
      percent = Math.round(5 + (92 - 5) * eased);
      label = "AI Analyzing Contract Structure...";
    } else if (elapsed < readDuration + extractDuration + holdDuration) {
      // 92% → 99% over 10s (ease-out quadratic — slow creep)
      const holdElapsed = elapsed - readDuration - extractDuration;
      const ratio = holdElapsed / holdDuration;
      const eased = 1 - Math.pow(1 - ratio, 2);
      percent = Math.round(92 + (99 - 92) * eased);
      label = "AI Analyzing Contract Structure...";
    } else {
      percent = 99;
      label = "AI Analyzing Contract Structure...";
    }

    onProgress({ label, percent });
  }

  // Start tick interval (handles events + progress bar)
  tickInterval = setInterval(tick, TICK_MS);

  // Start polling for terminal status (active / analysis_failed)
  pollInterval = setInterval(async () => {
    try {
      const data = await contractService.getContractProgress(contractId);
      if (data.status === "active") {
        cleanup();
        onDone(contractId);
      } else if (data.status === "analysis_failed") {
        cleanup();
        onFail("AI analysis failed. Please try again.");
      }
    } catch {
      // Network blip — keep polling and simulating
    }
  }, 5000);

  function cleanup() {
    isRunning = false;
    if (tickInterval) clearInterval(tickInterval);
    if (pollInterval) clearInterval(pollInterval);
  }

  return cleanup;
}