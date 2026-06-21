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
 * @param {Object} callbacks
 * @param {Function} callbacks.onStepChange
 * @param {Function} callbacks.onProgress
 * @param {Function} callbacks.onEvent
 * @param {Function} [callbacks.onError]
 * @returns {Function} cleanup
 */
export function startSimulation(callbacks = {}) {
  const { onStepChange, onProgress, onEvent, onError } = callbacks;

  if (typeof onStepChange !== "function") {
    throw new Error(
      `startSimulation: onStepChange must be a function, got ${typeof onStepChange}`
    );
  }

  if (typeof onProgress !== "function") {
    throw new Error(
      `startSimulation: onProgress must be a function, got ${typeof onProgress}`
    );
  }

  if (typeof onEvent !== "function") {
    throw new Error(
      `startSimulation: onEvent must be a function, got ${typeof onEvent}`
    );
  }

  if (onError != null && typeof onError !== "function") {
    throw new Error(
      `startSimulation: onError must be a function, got ${typeof onError}`
    );
  }

  const startTime = Date.now();
  let isRunning = true;
  let tickInterval = null;

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

  function stopWithError(error) {
    isRunning = false;

    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }

    if (typeof onError === "function") {
      onError(error);
      return;
    }

    throw error;
  }

  function tick() {
    if (!isRunning) return;

    const elapsed = Date.now() - startTime;

    try {
      while (
        nextEventIndex < scheduledEvents.length &&
        scheduledEvents[nextEventIndex].at <= elapsed
      ) {
        const event = scheduledEvents[nextEventIndex++];

        if (event.type === "step") {
          onStepChange(event.stepStatus);
        } else if (event.type === "event") {
          onEvent({
            timestamp: getTimestamp(),
            message: event.message,
          });
        }
      }

      const readDuration = 8000;
      const extractDuration = 15000;
      const holdDuration = 10000;

      let percent;
      let label;

      if (elapsed < readDuration) {
        const ratio = elapsed / readDuration;
        percent = Math.round(5 * ratio);
        label = "Reading document...";
      } else if (elapsed < readDuration + extractDuration) {
        const extractElapsed = elapsed - readDuration;
        const ratio = extractElapsed / extractDuration;
        const eased = 1 - Math.pow(1 - ratio, 3);
        percent = Math.round(5 + (92 - 5) * eased);
        label = "AI Analyzing Contract Structure...";
      } else if (elapsed < readDuration + extractDuration + holdDuration) {
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
    } catch (error) {
      console.error("startSimulation tick failed:", error);
      stopWithError(error);
    }
  }

  tickInterval = setInterval(tick, TICK_MS);
  tick();

  function cleanup() {
    isRunning = false;

    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }

  return cleanup;
}