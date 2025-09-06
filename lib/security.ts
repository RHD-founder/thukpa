import { headers } from "next/headers";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface SecurityContext {
  ipAddress: string;
  userAgent: string;
  timestamp: number;
}

export async function getSecurityContext(
  request?: NextRequest
): Promise<SecurityContext> {
  const headersList = request ? request.headers : await headers();

  return {
    ipAddress: getClientIP(headersList),
    userAgent: headersList.get("user-agent") || "unknown",
    timestamp: Date.now(),
  };
}

function getClientIP(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const realIP = headers.get("x-real-ip");
  const cfConnectingIP = headers.get("cf-connecting-ip");

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSecureToken(): string {
  return nanoid(32);
}

export function generateSessionToken(): string {
  return nanoid(48);
}

export function isRateLimited(
  ipAddress: string,
  maxRequests = 100,
  windowMs = 15 * 60 * 1000
): boolean {
  const now = Date.now();
  const key = `rate_limit:${ipAddress}`;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (current.count >= maxRequests) {
    return true;
  }

  current.count++;
  rateLimitStore.set(key, current);
  return false;
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
}

export function detectSuspiciousActivity(
  ipAddress: string,
  userAgent: string
): boolean {
  // Basic suspicious activity detection
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
}

export function createAuditLog(
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string | null,
  details: Record<string, unknown> | null,
  context: SecurityContext
) {
  return {
    userId,
    action,
    resource,
    resourceId,
    details: details ? JSON.stringify(details) : null,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    createdAt: new Date(),
  };
}

// Clean up expired rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes
