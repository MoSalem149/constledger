export type AiProvider = "gemini" | "openrouter" | "groq";

export interface AiEndpointConfig {
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseURL: string;
  defaultHeaders?: Record<string, string>;
}

const asProvider = (
  value: string | undefined,
  fallback: AiProvider,
): AiProvider => {
  if (value === "gemini" || value === "openrouter" || value === "groq") {
    return value;
  }
  return fallback;
};

const positiveInteger = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const booleanValue = (
  value: string | undefined,
  fallback: boolean,
): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
};

// vision = send scanned pages to the model as images (cheap, Gemini-friendly).
// ocr   = run local Tesseract first and send only text (needed for text-only providers).
const scanInputMode = (value: string | undefined): "vision" | "ocr" =>
  value === "ocr" ? "ocr" : "vision";

// Built-in defaults per provider — model + OpenAI-compatible endpoint.
const providerDefaults: Record<AiProvider, { model: string; baseURL: string }> =
  {
    gemini: {
      model: "gemini-2.5-flash",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    },
    openrouter: {
      model: "google/gemini-2.5-flash",
      baseURL: "https://openrouter.ai/api/v1",
    },
    groq: {
      model: "llama-3.3-70b-versatile",
      baseURL: "https://api.groq.com/openai/v1",
    },
  };

function apiKeyFor(provider: AiProvider): string {
  if (provider === "gemini") return process.env.GEMINI_API_KEY || "";
  if (provider === "groq") return process.env.GROQ_API_KEY || "";
  return process.env.OPENROUTER_API_KEY || "";
}

function endpointConfig(
  provider: AiProvider,
  model: string | undefined,
): AiEndpointConfig {
  const defaults = providerDefaults[provider];

  // OpenRouter attribution headers — optional but recommended by OpenRouter
  // for analytics dashboards and rate-limit fairness.
  const defaultHeaders =
    provider === "openrouter"
      ? {
          ...(process.env.OPENROUTER_HTTP_REFERER
            ? { "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER }
            : {}),
          "X-OpenRouter-Title":
            process.env.OPENROUTER_APP_TITLE || "CPMS Contract AI",
        }
      : undefined;

  return {
    provider,
    model: model || defaults.model,
    apiKey: apiKeyFor(provider),
    baseURL: defaults.baseURL,
    defaultHeaders,
  };
}

const primaryProvider = asProvider(process.env.AI_PRIMARY_PROVIDER, "gemini");
const fallbackProvider = asProvider(
  process.env.AI_FALLBACK_PROVIDER,
  "openrouter",
);

// Provider-neutral AI configuration, read once at startup.
//
// maxPrimaryAttempts is the TOTAL number of primary attempts including the
// first request (not "retries on top of" the first attempt). The fallback
// provider is attempted at most once, after the primary is exhausted.
export const aiConfig = {
  primary: endpointConfig(primaryProvider, process.env.AI_PRIMARY_MODEL),
  fallback: endpointConfig(fallbackProvider, process.env.AI_FALLBACK_MODEL),
  requestTimeoutMs: positiveInteger(process.env.AI_REQUEST_TIMEOUT_MS, 90_000),
  maxPrimaryAttempts: positiveInteger(process.env.AI_MAX_RETRIES, 2),
  enablePaidFallback: booleanValue(process.env.AI_ENABLE_PAID_FALLBACK, true),
  scanInputMode: scanInputMode(process.env.AI_SCAN_INPUT_MODE),
};
