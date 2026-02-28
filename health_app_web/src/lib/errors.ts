/**
 * Sanitizes error responses to prevent leaking internal details in production.
 * In development, the real error message is returned for debugging.
 */
export function apiError(
  error: unknown,
  fallbackMessage: string = "Internal server error"
): { success: false; error: string } {
  const isDev = process.env.NODE_ENV === "development";
  const message =
    isDev && error instanceof Error ? error.message : fallbackMessage;

  return { success: false, error: message };
}
