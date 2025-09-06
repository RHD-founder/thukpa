import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "./lib/rate-limit";
import { isAuthenticated, validateAuthCookie } from "./lib/middleware-auth";
import {
  logSessionEvent,
  detectSuspiciousActivity,
} from "./lib/session-monitor";
import {
  detectThreats,
  isDeviceBlocked,
  generateDeviceFingerprint,
  updateUserActivity,
  trackUserLogin,
} from "./lib/threat-detection";

// Define protected routes
const protectedRoutes = ["/dashboard"];
const adminRoutes = ["/admin"];
const publicRoutes = ["/admin/login"];

// Rate limiting for login attempts
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per window
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate device fingerprint for threat detection
  const deviceFingerprint = generateDeviceFingerprint(request);

  // Check if device is blocked
  if (await isDeviceBlocked(deviceFingerprint)) {
    console.log(`🚨 Blocked device attempted access: ${deviceFingerprint}`);
    return NextResponse.json(
      {
        error:
          "Access denied. Your device has been blocked due to suspicious activity.",
        code: "DEVICE_BLOCKED",
      },
      { status: 403 }
    );
  }

  // Apply rate limiting to login route
  if (pathname === "/admin/login" && request.method === "POST") {
    const rateLimitResult = loginRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }
  }

  // Check authentication status with proper validation
  const userIsAuthenticated = isAuthenticated(request);
  const user = validateAuthCookie(request);

  // Only detect threats for admin login attempts and suspicious paths
  if (
    pathname === "/admin/login" ||
    pathname.includes("..") ||
    pathname.includes("//")
  ) {
    const threat = await detectThreats(request, user?.id);
    if (threat) {
      console.log(`🚨 Threat detected:`, {
        type: threat.type,
        severity: threat.severity,
        device: deviceFingerprint,
        ip: threat.ip,
        path: pathname,
      });

      // If critical threat, block immediately
      if (threat.severity === "critical" || threat.blocked) {
        return NextResponse.json(
          {
            error: "Access denied due to suspicious activity.",
            code: "THREAT_DETECTED",
          },
          { status: 403 }
        );
      }
    }
  }

  // Log session events for authenticated users
  if (userIsAuthenticated && user) {
    logSessionEvent(request, user.id, "page_access");

    // Track user activity and device fingerprint
    updateUserActivity(user.id);

    // Detect suspicious activity
    if (detectSuspiciousActivity(request, user.id)) {
      // In production, you might want to block or alert
      console.warn("Suspicious activity detected for user:", user.id);
    }
  }

  // Track successful logins for device fingerprinting
  if (pathname === "/dashboard" && userIsAuthenticated && user) {
    // This means user just logged in and was redirected to dashboard
    trackUserLogin(user.id, request);
    console.log(`👤 User ${user.id} logged in - device tracked`);
  }

  // Check route types
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Handle authenticated users trying to access login page
  if (userIsAuthenticated && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Handle admin routes (except login) - redirect to login if not authenticated
  if (isAdminRoute && !isPublicRoute && !userIsAuthenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle protected routes - redirect to login if not authenticated
  if (isProtectedRoute && !userIsAuthenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add enterprise-level security headers
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Force HTTPS
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // XSS Protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
  );

  // Additional security headers
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Download-Options", "noopen");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
