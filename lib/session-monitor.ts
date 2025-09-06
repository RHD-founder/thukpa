import { NextRequest } from "next/server";

interface SessionEvent {
  userId: string;
  action: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
  path: string;
}

export function logSessionEvent(
  request: NextRequest,
  userId: string,
  action: string
) {
  const event: SessionEvent = {
    userId,
    action,
    timestamp: new Date(),
    ip:
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown",
    userAgent: request.headers.get("user-agent") ?? "unknown",
    path: request.nextUrl.pathname,
  };

  // In production, this would be sent to a monitoring service
  console.log("Session Event:", JSON.stringify(event, null, 2));
}

export function detectSuspiciousActivity(
  request: NextRequest,
  userId: string
): boolean {
  const userAgent = request.headers.get("user-agent") ?? "";
  const _ip = request.headers.get("x-forwarded-for") ?? "unknown";

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];

  // Check for rapid requests (basic rate limiting)
  // In production, this would use Redis or similar
  const isSuspicious = suspiciousPatterns.some((pattern) =>
    pattern.test(userAgent)
  );

  if (isSuspicious) {
    logSessionEvent(request, userId, "suspicious_activity_detected");
  }

  return isSuspicious;
}
