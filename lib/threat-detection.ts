import { NextRequest } from "next/server";
// Temporarily disable database features due to Prisma generation issues
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

interface ThreatEvent {
  id: string;
  type:
    | "brute_force"
    | "scraping"
    | "suspicious_pattern"
    | "rate_limit_exceeded";
  severity: "low" | "medium" | "high" | "critical";
  userId?: string;
  ip: string;
  userAgent: string;
  deviceFingerprint: string;
  timestamp: Date;
  path: string;
  details: Record<string, unknown>;
  blocked: boolean;
}

// Removed unused interface

// In-memory threat store (in production, use Redis or database)
const threatStore = new Map<string, ThreatEvent[]>();
const blockedDevices = new Set<string>();
const suspiciousIPs = new Map<string, { count: number; lastSeen: Date }>();
const activeIPs = new Map<
  string,
  {
    ip: string;
    lastSeen: Date;
    userAgent: string;
    deviceFingerprint: string;
    requestCount: number;
  }
>();

// Blocked devices are now managed through admin panel

// Live data only - no demo data

export function generateDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get("user-agent") ?? "";
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const acceptEncoding = request.headers.get("accept-encoding") ?? "";

  // Extract device info from User-Agent
  const deviceInfo = parseUserAgent(userAgent);

  const fingerprint = {
    userAgent: userAgent.substring(0, 100), // Truncate for consistency
    acceptLanguage: acceptLanguage.substring(0, 50),
    acceptEncoding: acceptEncoding.substring(0, 50),
    platform: deviceInfo.platform,
    browser: deviceInfo.browser,
    deviceType: deviceInfo.deviceType,
  };

  // Create a hash of the fingerprint
  return Buffer.from(JSON.stringify(fingerprint))
    .toString("base64")
    .substring(0, 32);
}

function parseUserAgent(userAgent: string): {
  platform: string;
  browser: string;
  deviceType: string;
} {
  const ua = userAgent.toLowerCase();

  let platform = "unknown";
  let browser = "unknown";
  let deviceType = "desktop";

  // Platform detection
  if (ua.includes("windows")) platform = "windows";
  else if (ua.includes("mac")) platform = "mac";
  else if (ua.includes("linux")) platform = "linux";
  else if (ua.includes("android")) platform = "android";
  else if (ua.includes("ios")) platform = "ios";

  // Browser detection
  if (ua.includes("chrome")) browser = "chrome";
  else if (ua.includes("firefox")) browser = "firefox";
  else if (ua.includes("safari")) browser = "safari";
  else if (ua.includes("edge")) browser = "edge";

  // Device type detection
  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone")
  ) {
    deviceType = "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    deviceType = "tablet";
  }

  return { platform, browser, deviceType };
}

export async function detectThreats(
  request: NextRequest,
  userId?: string
): Promise<ThreatEvent | null> {
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const userAgent = request.headers.get("user-agent") ?? "";
  const deviceFingerprint = generateDeviceFingerprint(request);
  const path = request.nextUrl.pathname;

  // Track active IP
  trackActiveIP(ip, userAgent, deviceFingerprint);

  console.log(`🔍 detectThreats called:`, {
    ip,
    path,
    deviceFingerprint: deviceFingerprint.substring(0, 10) + "...",
    userId,
  });

  // Check if device is already blocked
  if (await isDeviceBlocked(deviceFingerprint)) {
    console.log(`🚫 Device already blocked: ${deviceFingerprint}`);
    return createThreatEvent(
      "scraping",
      "critical",
      userId,
      ip,
      userAgent,
      deviceFingerprint,
      path,
      {
        reason: "device_blocked",
        message: "Device is permanently blocked",
      }
    );
  }

  // Detect brute force attacks
  const bruteForceThreat = detectBruteForce(ip, path, deviceFingerprint);
  if (bruteForceThreat) {
    console.log(`🔍 Brute force threat detected and returned`);
    return bruteForceThreat;
  }

  // Detect scraping attempts
  const scrapingThreat = detectScraping(userAgent, path, deviceFingerprint);
  if (scrapingThreat) {
    console.log(`🔍 Scraping threat detected and returned`);
    return scrapingThreat;
  }

  // Detect suspicious patterns
  const suspiciousThreat = detectSuspiciousPatterns(request, deviceFingerprint);
  if (suspiciousThreat) {
    console.log(`🔍 Suspicious pattern threat detected and returned`);
    return suspiciousThreat;
  }

  console.log(`🔍 No threats detected`);
  return null;
}

function detectBruteForce(
  ip: string,
  path: string,
  deviceFingerprint?: string
): ThreatEvent | null {
  if (!path.includes("/admin/login")) return null;

  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const ipData = suspiciousIPs.get(ip);

  if (!ipData) {
    suspiciousIPs.set(ip, { count: 1, lastSeen: new Date() });
    return null;
  }

  // Reset if outside window
  if (now - ipData.lastSeen.getTime() > windowMs) {
    suspiciousIPs.set(ip, { count: 1, lastSeen: new Date() });
    return null;
  }

  // Increment count
  ipData.count++;
  ipData.lastSeen = new Date();

  if (ipData.count >= maxAttempts) {
    return createThreatEvent(
      "brute_force",
      "high",
      undefined,
      ip,
      "Unknown User Agent",
      deviceFingerprint || `brute_force_${ip}`,
      path,
      {
        attempts: ipData.count,
        window: "15 minutes",
      }
    );
  }

  return null;
}

function detectScraping(
  userAgent: string,
  path: string,
  deviceFingerprint: string
): ThreatEvent | null {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /requests/i,
    /scrapy/i,
    /selenium/i,
    /phantom/i,
    /headless/i,
  ];

  const isSuspicious = suspiciousPatterns.some((pattern) =>
    pattern.test(userAgent)
  );

  if (isSuspicious) {
    return createThreatEvent(
      "scraping",
      "medium",
      undefined,
      "",
      userAgent,
      deviceFingerprint,
      path,
      {
        detectedPattern: userAgent,
        reason: "suspicious_user_agent",
      }
    );
  }

  return null;
}

function detectSuspiciousPatterns(
  request: NextRequest,
  deviceFingerprint: string
): ThreatEvent | null {
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") ?? "";

  // Detect rapid requests to different endpoints
  // Detect requests to non-existent endpoints
  // Detect unusual header patterns

  if (path.includes("..") || path.includes("//")) {
    return createThreatEvent(
      "suspicious_pattern",
      "medium",
      undefined,
      "",
      userAgent,
      deviceFingerprint,
      path,
      {
        reason: "path_traversal_attempt",
        suspiciousPath: path,
      }
    );
  }

  return null;
}

function createThreatEvent(
  type: ThreatEvent["type"],
  severity: ThreatEvent["severity"],
  userId: string | undefined,
  ip: string,
  userAgent: string,
  deviceFingerprint: string,
  path: string,
  details: Record<string, unknown>
): ThreatEvent {
  const threat: ThreatEvent = {
    id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    severity,
    userId,
    ip,
    userAgent,
    deviceFingerprint,
    timestamp: new Date(),
    path,
    details,
    blocked: false,
  };

  // Store threat event
  const deviceThreats = threatStore.get(deviceFingerprint) || [];
  deviceThreats.push(threat);
  threatStore.set(deviceFingerprint, deviceThreats);

  // Debug logging
  console.log(`💾 Threat stored:`, {
    id: threat.id,
    type: threat.type,
    severity: threat.severity,
    deviceFingerprint,
    totalThreatsForDevice: deviceThreats.length,
    threatStoreSize: threatStore.size,
  });

  // Auto-block based on severity and frequency
  if (shouldBlockDevice(deviceFingerprint, threat)) {
    // Don't await here to avoid blocking the response
    blockDevice(deviceFingerprint, threat).catch(console.error);
    threat.blocked = true;
  }

  return threat;
}

function shouldBlockDevice(
  deviceFingerprint: string,
  currentThreat: ThreatEvent
): boolean {
  const deviceThreats = threatStore.get(deviceFingerprint) || [];

  // Block if critical threat
  if (currentThreat.severity === "critical") {
    return true;
  }

  // Block if multiple high-severity threats in short time
  const recentThreats = deviceThreats.filter(
    (t) =>
      Date.now() - t.timestamp.getTime() < 60 * 60 * 1000 && // Last hour
      t.severity === "high"
  );

  if (recentThreats.length >= 3) {
    return true;
  }

  // Block if too many threats overall
  if (deviceThreats.length >= 10) {
    return true;
  }

  return false;
}

export async function isDeviceBlocked(
  deviceFingerprint: string
): Promise<boolean> {
  // Check in-memory cache first
  if (blockedDevices.has(deviceFingerprint)) {
    return true;
  }

  // Check database (temporarily disabled)
  // try {
  //   const blockedDevice = await prisma.blockedDevice.findFirst({
  //     where: {
  //       deviceFingerprint,
  //       isActive: true,
  //     },
  //   });

  //   if (blockedDevice) {
  //     // Add to in-memory cache
  //     blockedDevices.add(deviceFingerprint);
  //     return true;
  //   }
  // } catch (error) {
  //   console.error("Error checking blocked device:", error);
  // }

  return false;
}

// Track active users and their device fingerprints
const activeUsers = new Map<
  string,
  {
    userId: string;
    deviceFingerprint: string;
    userAgent: string;
    platform: string;
    browser: string;
    deviceType: string;
    lastSeen: Date;
    loginTime: Date;
    ip: string;
  }
>();

export function trackUserLogin(userId: string, request: NextRequest) {
  const deviceFingerprint = generateDeviceFingerprint(request);
  const userAgent = request.headers.get("user-agent") ?? "";
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const deviceInfo = parseUserAgent(userAgent);

  activeUsers.set(userId, {
    userId,
    deviceFingerprint,
    userAgent: userAgent.substring(0, 100),
    platform: deviceInfo.platform,
    browser: deviceInfo.browser,
    deviceType: deviceInfo.deviceType,
    lastSeen: new Date(),
    loginTime: new Date(),
    ip,
  });
}

export function updateUserActivity(userId: string) {
  const user = activeUsers.get(userId);
  if (user) {
    user.lastSeen = new Date();
  }
}

export function removeUser(userId: string) {
  activeUsers.delete(userId);
}

export function getActiveUsers() {
  return Array.from(activeUsers.values());
}

// Track active IPs
function trackActiveIP(
  ip: string,
  userAgent: string,
  deviceFingerprint: string
) {
  const existing = activeIPs.get(ip);
  if (existing) {
    existing.lastSeen = new Date();
    existing.requestCount++;
    existing.userAgent = userAgent;
    existing.deviceFingerprint = deviceFingerprint;
  } else {
    activeIPs.set(ip, {
      ip,
      lastSeen: new Date(),
      userAgent,
      deviceFingerprint,
      requestCount: 1,
    });
  }

  // Clean up old IPs (older than 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  for (const [ipKey, data] of activeIPs.entries()) {
    if (data.lastSeen < fiveMinutesAgo) {
      activeIPs.delete(ipKey);
    }
  }
}

export async function getThreatStats(): Promise<{
  totalThreats: number;
  blockedDevices: number;
  recentThreats: ThreatEvent[];
  topThreatTypes: Record<string, number>;
  activeUsers: number;
  activeIPs: number;
  userDevices: Array<{
    userId: string;
    deviceFingerprint: string;
    userAgent: string;
    platform: string;
    browser: string;
    deviceType: string;
    lastSeen: string;
    loginTime: string;
    ip: string;
  }>;
  activeIPList: Array<{
    ip: string;
    lastSeen: string;
    userAgent: string;
    deviceFingerprint: string;
    requestCount: number;
  }>;
}> {
  // Get threats from database
  const dbThreats: Array<{
    id: string;
    type: string;
    severity: string;
    userId: string | null;
    ipAddress: string;
    userAgent: string | null;
    deviceFingerprint: string;
    path: string;
    details: Record<string, unknown>;
    blocked: boolean;
    createdAt: Date;
  }> = [];
  const dbBlockedDevices = 0;

  // Database queries temporarily disabled
  // try {
  //   // Get recent threats from database
  //   dbThreats = await prisma.threatEvent.findMany({
  //     where: {
  //       createdAt: {
  //         gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
  //       },
  //     },
  //     orderBy: {
  //       createdAt: "desc",
  //     },
  //   });

  //   // Get active blocked devices from database
  //   const blockedDevicesResult = await prisma.blockedDevice.count({
  //     where: {
  //       isActive: true,
  //     },
  //   });
  //   dbBlockedDevices = blockedDevicesResult;
  // } catch (error) {
  //   console.error("Error fetching threat stats from database:", error);
  // }

  // Combine with in-memory data
  const allThreats: ThreatEvent[] = [];
  threatStore.forEach((threats) => allThreats.push(...threats));

  // Convert database threats to ThreatEvent format
  const dbThreatEvents: ThreatEvent[] = dbThreats.map((t) => ({
    id: t.id,
    type: t.type as ThreatEvent["type"],
    severity: t.severity as ThreatEvent["severity"],
    userId: t.userId || undefined,
    ip: t.ipAddress,
    userAgent: t.userAgent || "",
    deviceFingerprint: t.deviceFingerprint,
    timestamp: t.createdAt,
    path: t.path,
    details: t.details as Record<string, unknown>,
    blocked: t.blocked,
  }));

  // Combine all threats
  const combinedThreats = [...allThreats, ...dbThreatEvents];

  // Debug logging
  console.log("🔍 Threat Stats Debug:", {
    threatStoreSize: threatStore.size,
    dbThreatsCount: dbThreats.length,
    allThreatsCount: combinedThreats.length,
    blockedDevicesCount: blockedDevices.size,
    dbBlockedDevicesCount: dbBlockedDevices,
    activeUsersCount: activeUsers.size,
  });

  const recentThreats = combinedThreats.filter(
    (t) => Date.now() - t.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
  );

  const threatTypes: Record<string, number> = {};
  combinedThreats.forEach((threat) => {
    threatTypes[threat.type] = (threatTypes[threat.type] || 0) + 1;
  });

  // Convert active users to serializable format
  const userDevices = Array.from(activeUsers.values()).map((user) => ({
    userId: user.userId,
    deviceFingerprint: user.deviceFingerprint,
    userAgent: user.userAgent,
    platform: user.platform,
    browser: user.browser,
    deviceType: user.deviceType,
    lastSeen: user.lastSeen.toISOString(),
    loginTime: user.loginTime.toISOString(),
    ip: user.ip,
  }));

  // Convert active IPs to serializable format
  const activeIPList = Array.from(activeIPs.values()).map((ipData) => ({
    ip: ipData.ip,
    lastSeen: ipData.lastSeen.toISOString(),
    userAgent: ipData.userAgent,
    deviceFingerprint: ipData.deviceFingerprint,
    requestCount: ipData.requestCount,
  }));

  return {
    totalThreats: combinedThreats.length,
    blockedDevices: blockedDevices.size + dbBlockedDevices,
    recentThreats: recentThreats.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    ),
    topThreatTypes: threatTypes,
    activeUsers: activeUsers.size,
    activeIPs: activeIPs.size,
    userDevices,
    activeIPList,
  };
}

export async function unblockDevice(
  deviceFingerprint: string
): Promise<boolean> {
  try {
    // Database update temporarily disabled
    // const result = await prisma.blockedDevice.updateMany({
    //   where: {
    //     deviceFingerprint,
    //     isActive: true,
    //   },
    //   data: {
    //     isActive: false,
    //   },
    // });

    // Remove from in-memory cache
    const removed = blockedDevices.delete(deviceFingerprint);

    console.log(`🔓 Device unblocked: ${deviceFingerprint}`, {
      inMemoryRemoved: removed,
    });

    return removed;
  } catch (error) {
    console.error("Error unblocking device:", error);
    // Fallback to in-memory only
    return blockedDevices.delete(deviceFingerprint);
  }
}

export async function blockDevice(
  deviceFingerprint: string,
  threat: ThreatEvent,
  _blockedBy?: string
): Promise<void> {
  try {
    // Database creation temporarily disabled
    // await prisma.blockedDevice.create({
    //   data: {
    //     deviceFingerprint,
    //     reason: threat.details?.reason || "Automatic block due to threat",
    //     blockedBy,
    //     ipAddress: threat.ip,
    //     userAgent: threat.userAgent,
    //     details: threat.details,
    //   },
    // });

    // Add to in-memory cache
    blockedDevices.add(deviceFingerprint);

    console.log(`🚨 DEVICE BLOCKED: ${deviceFingerprint}`, {
      reason: threat.details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error blocking device:", error);
    // Fallback to in-memory only
    blockedDevices.add(deviceFingerprint);
  }
}
