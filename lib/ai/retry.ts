import type { AiProviderName } from "./types";
import { aiLog } from "./utils";
import { isRetryableAiError } from "./provider-error-utils";

type RetryOptions = {
  provider: AiProviderName;
  operation: string;
  maxAttempts?: number;
  initialDelayMs?: number;
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withAiRetry<T>(
  options: RetryOptions,
  operation: () => Promise<T>,
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 2;
  const initialDelayMs = options.initialDelayMs ?? 1500;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startedAt = Date.now();

    try {
      aiLog("info", "provider attempt started", {
        provider: options.provider,
        operation: options.operation,
        attempt,
        maxAttempts,
      });

      const result = await operation();

      aiLog("info", "provider attempt succeeded", {
        provider: options.provider,
        operation: options.operation,
        attempt,
        durationMs: Date.now() - startedAt,
      });

      return result;
    } catch (error) {
      lastError = error;

      const retryable = isRetryableAiError(error);

      aiLog("warn", "provider attempt failed", {
        provider: options.provider,
        operation: options.operation,
        attempt,
        maxAttempts,
        retryable,
        durationMs: Date.now() - startedAt,
        error,
      });

      if (!retryable || attempt >= maxAttempts) {
        throw error;
      }

      await wait(initialDelayMs * Math.pow(2, attempt - 1));
    }
  }

  throw lastError;
}