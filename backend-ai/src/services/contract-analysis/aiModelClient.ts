import OpenAI from 'openai';

import {
  aiConfig,
  AiEndpointConfig,
} from '../../config/aiConfig';

export interface ModelJsonRequest {
  label: string;
  systemPrompt: string;
  userPrompt: string;
  userContent?: OpenAI.Chat.ChatCompletionContentPart[];
  pdfBase64?: string;
  maxTokens?: number;
}

export interface ModelJsonResponse {
  content: string;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  retryCount: number;
}

type ErrorDetails = {
  category: string;
  retryable: boolean;
  status?: number;
  message: string;
};

const sleep = (durationMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

function createClient(endpoint: AiEndpointConfig): OpenAI {
  // maxRetries: 0 — we handle retries / fallback ourselves so we have one
  // place that owns the policy. Built-in retries would double up.
  return new OpenAI({
    apiKey: endpoint.apiKey,
    baseURL: endpoint.baseURL,
    defaultHeaders: endpoint.defaultHeaders,
    timeout: aiConfig.requestTimeoutMs,
    maxRetries: 0,
  });
}

// Classifies an error so requestJsonFromModel can decide whether to retry
// the primary provider, fall back, or give up. Timeouts and 5xx are
// retryable; 4xx (except 408 / 429) is not.
function describeError(error: unknown): ErrorDetails {
  const candidate = error as {
    status?: number;
    code?: string;
    name?: string;
    message?: string;
  };
  const status = candidate?.status;
  const message =
    candidate?.message || (error instanceof Error ? error.message : String(error));
  const isTimeout =
    candidate?.code === 'ETIMEDOUT' ||
    candidate?.name === 'APIConnectionTimeoutError' ||
    /timed?\s*out/i.test(message);
  const retryable =
    isTimeout ||
    status === 408 ||
    status === 429 ||
    (typeof status === 'number' && status >= 500);

  let category = 'request_error';
  if (isTimeout || status === 408) category = 'timeout';
  else if (status === 429) category = 'rate_limit';
  else if (typeof status === 'number' && status >= 500) category = 'provider_5xx';
  else if (status === 401 || status === 403) category = 'authentication';
  else if (status === 400) category = 'invalid_request';

  return { category, retryable, status, message };
}

async function callEndpoint(
  endpoint: AiEndpointConfig,
  request: ModelJsonRequest,
  retryCount: number,
): Promise<ModelJsonResponse> {
  // Special-case: when calling Gemini WITH a source PDF, use the native
  // generateContent endpoint (PDF bytes inlined) instead of the OpenAI-shaped
  // chat endpoint. This gives Gemini direct document access.
  if (endpoint.provider === 'gemini' && request.pdfBase64) {
    return callGeminiDocument(endpoint, request, retryCount);
  }

  const startedAt = Date.now();
  const client = createClient(endpoint);
  const requestBody = {
    model: endpoint.model,
    temperature: 0,
    max_tokens: request.maxTokens ?? 8192,
    response_format: { type: 'json_object' },
    // Gemini 2.5 supports a reasoning_effort flag — 'none' is fastest /
    // cheapest, which is what we want for structured-extraction tasks.
    ...(endpoint.model.includes('gemini-2.5')
      ? { reasoning_effort: 'none' }
      : {}),
    messages: [
      { role: 'system', content: request.systemPrompt },
      {
        role: 'user',
        content: request.userContent ?? request.userPrompt,
      },
    ],
  };
  const response = await client.chat.completions.create(requestBody as any);
  const durationMs = Date.now() - startedAt;
  const content = response.choices[0]?.message?.content ?? '';

  console.log(
    `[ai:${request.label}] provider=${endpoint.provider} model=${endpoint.model} ` +
      `durationMs=${durationMs} promptTokens=${response.usage?.prompt_tokens ?? 'unknown'} ` +
      `completionTokens=${response.usage?.completion_tokens ?? 'unknown'} retries=${retryCount}`,
  );

  return {
    content,
    provider: endpoint.provider,
    model: endpoint.model,
    promptTokens: response.usage?.prompt_tokens,
    completionTokens: response.usage?.completion_tokens,
    retryCount,
  };
}

// Calls Gemini's native generateContent endpoint directly with the raw PDF
// as inlineData (NOT through the OpenAI-compatible chat endpoint). This lets
// Gemini read the document natively rather than from rasterized page images.
async function callGeminiDocument(
  endpoint: AiEndpointConfig,
  request: ModelJsonRequest,
  retryCount: number,
): Promise<ModelJsonResponse> {
  const startedAt = Date.now();

  // Manual timeout via AbortController — fetch() doesn't take a timeout option
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    aiConfig.requestTimeoutMs,
  );

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(endpoint.model)}:generateContent?key=` +
      encodeURIComponent(endpoint.apiKey);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: request.systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: request.pdfBase64,
                },
              },
              { text: request.userPrompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: request.maxTokens ?? 8192,
          responseMimeType: 'application/json',
          // thinkingBudget: 0 disables Gemini's hidden "thinking" tokens for
          // 2.5 models — saves cost and latency on a structured task.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    const payload = (await response.json()) as {
      error?: { message?: string };
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
      };
    };

    if (!response.ok) {
      const error = new Error(
        payload.error?.message || `Gemini HTTP ${response.status}`,
      ) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    const content =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('') ?? '';
    const durationMs = Date.now() - startedAt;
    console.log(
      `[ai:${request.label}] provider=${endpoint.provider} model=${endpoint.model} ` +
        `input=native-pdf durationMs=${durationMs} ` +
        `promptTokens=${payload.usageMetadata?.promptTokenCount ?? 'unknown'} ` +
        `completionTokens=${payload.usageMetadata?.candidatesTokenCount ?? 'unknown'} ` +
        `retries=${retryCount}`,
    );

    return {
      content,
      provider: endpoint.provider,
      model: endpoint.model,
      promptTokens: payload.usageMetadata?.promptTokenCount,
      completionTokens: payload.usageMetadata?.candidatesTokenCount,
      retryCount,
    };
  } catch (error) {
    // Translate AbortError into a 408-shaped error so describeError() treats
    // it as a retryable timeout in the upper retry loop.
    if ((error as Error).name === 'AbortError') {
      const timeoutError = new Error(
        `Gemini document request timed out after ${aiConfig.requestTimeoutMs}ms`,
      ) as Error & { status?: number; code?: string };
      timeoutError.status = 408;
      timeoutError.code = 'ETIMEDOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function hasConfiguredAiProvider(): boolean {
  return Boolean(
    aiConfig.primary.apiKey ||
      (aiConfig.enablePaidFallback && aiConfig.fallback.apiKey),
  );
}

// PUBLIC entry point — called by every extraction prompt.
//
// Policy:
//   1. Try the primary provider up to aiConfig.maxPrimaryAttempts times,
//      with exponential backoff (1s, 2s, 4s capped).
//   2. If primary is exhausted with a retryable error (or was never
//      configured), and enablePaidFallback is true, try the fallback ONCE.
//   3. Otherwise rethrow the last error.
export async function requestJsonFromModel(
  request: ModelJsonRequest,
): Promise<ModelJsonResponse> {
  let lastError: unknown;

  if (aiConfig.primary.apiKey) {
    for (let attempt = 1; attempt <= aiConfig.maxPrimaryAttempts; attempt += 1) {
      try {
        return await callEndpoint(aiConfig.primary, request, attempt - 1);
      } catch (error) {
        lastError = error;
        const details = describeError(error);
        console.warn(
          `[ai:${request.label}] provider=${aiConfig.primary.provider} ` +
            `model=${aiConfig.primary.model} attempt=${attempt}/${aiConfig.maxPrimaryAttempts} ` +
            `failure=${details.category} status=${details.status ?? 'none'} ` +
            `message=${details.message}`,
        );

        // Stop retrying primary on a non-retryable error or after the last attempt
        if (!details.retryable || attempt === aiConfig.maxPrimaryAttempts) break;
        await sleep(Math.min(1000 * 2 ** (attempt - 1), 4000));
      }
    }
  } else {
    lastError = new Error(
      `API key for primary provider "${aiConfig.primary.provider}" is not configured`,
    );
    console.warn(`[ai:${request.label}] ${(lastError as Error).message}`);
  }

  const primaryFailure = describeError(lastError);

  // Only fall back when the primary's failure was retryable (or primary
  // was never available). Permanent failures (auth, 400) shouldn't burn
  // the paid fallback budget too.
  const mayFallback =
    aiConfig.enablePaidFallback &&
    aiConfig.fallback.apiKey &&
    (primaryFailure.retryable || !aiConfig.primary.apiKey);

  if (mayFallback) {
    console.warn(
      `[ai:${request.label}] activating fallback provider=${aiConfig.fallback.provider} ` +
        `model=${aiConfig.fallback.model} paidFallback=true`,
    );
    try {
      return await callEndpoint(
        aiConfig.fallback,
        request,
        aiConfig.maxPrimaryAttempts,
      );
    } catch (error) {
      const details = describeError(error);
      console.error(
        `[ai:${request.label}] fallback failed provider=${aiConfig.fallback.provider} ` +
          `model=${aiConfig.fallback.model} failure=${details.category} ` +
          `status=${details.status ?? 'none'} message=${details.message}`,
      );
      throw error;
    }
  }

  throw lastError;
}
