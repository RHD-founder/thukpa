import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest) => {
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const now = Date.now();

    const current = rateLimitMap.get(ip);

    if (!current || current.resetTime < now) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + config.windowMs });
      return { success: true, remaining: config.maxRequests - 1 };
    }

    if (current.count >= config.maxRequests) {
      return {
        success: false,
        error: "Too many requests",
        resetTime: current.resetTime,
      };
    }

    current.count++;
    return { success: true, remaining: config.maxRequests - current.count };
  };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (data.resetTime < now) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000); // Clean up every minute
