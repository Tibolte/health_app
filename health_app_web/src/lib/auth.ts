import { NextRequest } from "next/server";

/**
 * Validates the API key from the Authorization header.
 * Returns true if the request carries a valid Bearer token matching API_SECRET_KEY.
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = process.env.API_SECRET_KEY;
  if (!apiKey) {
    console.error("API_SECRET_KEY is not configured");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice(7);
  if (token.length !== apiKey.length) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ apiKey.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Checks if the request is same-origin (browser calling its own API).
 * Same-origin requests from the web frontend don't need an API key.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!host) return false;

  const requestOrigin = origin || (referer ? new URL(referer).origin : null);
  if (!requestOrigin) {
    // No origin/referer — likely a server-side or non-browser request (e.g. mobile app)
    return false;
  }

  // Compare origin against the host header
  try {
    const originUrl = new URL(requestOrigin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}
