import { AiEngineError } from "./utils";

const RETRYABLE_HTTP_STATUS = new Set([429, 500, 502, 503, 504, 529]);

export function getHttpStatusFromError(error: unknown): number | null {
  if (
    error instanceof AiEngineError &&
    typeof error.details === "object" &&
    error.details !== null &&
    "status" in error.details &&
    typeof error.details.status === "number"
  ) {
    return error.details.status;
  }

  return null;
}

export function isRetryableAiError(error: unknown): boolean {
  if (error instanceof AiEngineError) {
    if (error.code === "AI_PROVIDER_TIMEOUT") {
      return true;
    }

    if (error.code === "AI_PROVIDER_RESPONSE_INVALID") {
      return false;
    }

    if (error.code === "AI_PROVIDER_NOT_CONFIGURED") {
      return false;
    }

    const status = getHttpStatusFromError(error);

    if (status !== null) {
      return RETRYABLE_HTTP_STATUS.has(status);
    }

    return error.code === "AI_PROVIDER_ERROR";
  }

  if (error instanceof TypeError) {
    return true;
  }

  return false;
}

export function createProviderHttpError(
  provider: string,
  status: number,
  body: unknown,
): AiEngineError {
  return new AiEngineError(
    "AI_PROVIDER_ERROR",
    `${provider} HTTP ${status}`,
    {
      provider,
      status,
      body,
      retryable: RETRYABLE_HTTP_STATUS.has(status),
    },
  );
}