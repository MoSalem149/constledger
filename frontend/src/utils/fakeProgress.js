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
 * Start a frontend-simulated progress animation.
 *
 * This is pure eye candy — no polling. The caller is responsible for
 * stopping the simulation when the real work (e.g., `createContract`) is done.
 *
 * @param {Object} callbacks — { onStepChange, onProgress, onEvent }
 * @returns {function} cleanup — call to stop all timers
 */
export function startSimulation(callbacks) {
  const { onStepChange, onProgress, onEvent } = callbacks;

  const startTime = Date.now();
  let isRunning = true;
  let tickInterval = null;

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

  function tick() {
    if (!isRunning) return;
    const elapsed = Date.now() - startTime;

    try {
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
    } catch (e) {
      // Silently ignore errors from setInterval callbacks
      // to prevent unhandled errors in production builds
    }
  }

  // Start tick interval (handles events + progress bar)
  tickInterval = setInterval(tick, TICK_MS);

  function cleanup() {
    isRunning = false;
    if (tickInterval) clearInterval(tickInterval);
  }

  return cleanup;
}
