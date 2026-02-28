import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, isSameOrigin } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// Rate limit configuration
const RATE_LIMITS = {
  GET: { maxRequests: 60, windowMs: 60_000 },
  POST: { maxRequests: 10, windowMs: 60_000 },
} as const;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /api/* routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip auth for health check
  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  // Allow OPTIONS (CORS preflight) without auth
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  // Same-origin requests (web frontend) don't need an API key
  const sameOrigin = isSameOrigin(request);

  if (!sameOrigin && !validateApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Rate limiting by IP + method
  const ip = getClientIp(request);
  const method = request.method as keyof typeof RATE_LIMITS;
  const limits = RATE_LIMITS[method] || RATE_LIMITS.GET;
  const rateLimitKey = `${ip}:${method}`;

  const result = checkRateLimit(rateLimitKey, limits.maxRequests, limits.windowMs);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.resetInSeconds),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
