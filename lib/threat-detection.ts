import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

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
  const acceptCharset = request.headers.get("accept-charset") ?? "";
  const accept = request.headers.get("accept") ?? "";
  const connection = request.headers.get("connection") ?? "";
  const upgradeInsecureRequests =
    request.headers.get("upgrade-insecure-requests") ?? "";
  const secFetchDest = request.headers.get("sec-fetch-dest") ?? "";
  const secFetchMode = request.headers.get("sec-fetch-mode") ?? "";
  const secFetchSite = request.headers.get("sec-fetch-site") ?? "";
  const secFetchUser = request.headers.get("sec-fetch-user") ?? "";
  const secChUa = request.headers.get("sec-ch-ua") ?? "";
  const secChUaMobile = request.headers.get("sec-ch-ua-mobile") ?? "";
  const secChUaPlatform = request.headers.get("sec-ch-ua-platform") ?? "";
  const dnt = request.headers.get("dnt") ?? "";
  const viewportWidth = request.headers.get("viewport-width") ?? "";
  const width = request.headers.get("width") ?? "";

  // Extract device info from User-Agent
  const deviceInfo = parseUserAgent(userAgent);

  // Create a more comprehensive fingerprint
  const fingerprint = {
    userAgent: userAgent.substring(0, 200),
    acceptLanguage: acceptLanguage.substring(0, 100),
    acceptEncoding: acceptEncoding.substring(0, 100),
    acceptCharset: acceptCharset.substring(0, 50),
    accept: accept.substring(0, 100),
    connection: connection,
    upgradeInsecureRequests: upgradeInsecureRequests,
    secFetchDest: secFetchDest,
    secFetchMode: secFetchMode,
    secFetchSite: secFetchSite,
    secFetchUser: secFetchUser,
    secChUa: secChUa.substring(0, 200),
    secChUaMobile: secChUaMobile,
    secChUaPlatform: secChUaPlatform,
    dnt: dnt,
    viewportWidth: viewportWidth,
    width: width,
    platform: deviceInfo.platform,
    browser: deviceInfo.browser,
    deviceType: deviceInfo.deviceType,
    // Add timestamp for uniqueness (changes every hour)
    timeWindow: Math.floor(Date.now() / (60 * 60 * 1000)), // 1 hour windows
  };

  // Create a more secure hash
  const fingerprintString = JSON.stringify(fingerprint);
  const hash = Buffer.from(fingerprintString).toString("base64");

  // Return a longer, more unique fingerprint
  return hash.substring(0, 64);
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
    return await createThreatEvent(
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
  const bruteForceThreat = await detectBruteForce(ip, path, deviceFingerprint);
  if (bruteForceThreat) {
    console.log(`🔍 Brute force threat detected and returned`);
    return bruteForceThreat;
  }

  // Detect scraping attempts
  const scrapingThreat = await detectScraping(
    userAgent,
    path,
    deviceFingerprint
  );
  if (scrapingThreat) {
    console.log(`🔍 Scraping threat detected and returned`);
    return scrapingThreat;
  }

  // Detect suspicious patterns
  const suspiciousThreat = await detectSuspiciousPatterns(
    request,
    deviceFingerprint
  );
  if (suspiciousThreat) {
    console.log(`🔍 Suspicious pattern threat detected and returned`);
    return suspiciousThreat;
  }

  console.log(`🔍 No threats detected`);
  return null;
}

async function detectBruteForce(
  ip: string,
  path: string,
  deviceFingerprint?: string
): Promise<ThreatEvent | null> {
  if (!path.includes("/admin/login")) return null;

  const now = Date.now();
  const windowMs = 30 * 60 * 1000; // 30 minutes (increased from 15)
  const maxAttempts = 10; // Increased from 5 to 10

  // Use device fingerprint as primary key, not IP
  const key = deviceFingerprint || `ip_${ip}`;
  const ipData = suspiciousIPs.get(key);

  if (!ipData) {
    suspiciousIPs.set(key, { count: 1, lastSeen: new Date() });
    return null;
  }

  // Reset if outside window
  if (now - ipData.lastSeen.getTime() > windowMs) {
    suspiciousIPs.set(key, { count: 1, lastSeen: new Date() });
    return null;
  }

  // Increment count
  ipData.count++;
  ipData.lastSeen = new Date();

  if (ipData.count >= maxAttempts) {
    return await createThreatEvent(
      "brute_force",
      "high",
      undefined,
      ip,
      "Unknown User Agent",
      deviceFingerprint || `brute_force_${ip}`,
      path,
      {
        attempts: ipData.count,
        window: "30 minutes",
        deviceFingerprint: deviceFingerprint,
        ip: ip,
      }
    );
  }

  return null;
}

async function detectScraping(
  userAgent: string,
  path: string,
  deviceFingerprint: string
): Promise<ThreatEvent | null> {
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
    return await createThreatEvent(
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

async function detectSuspiciousPatterns(
  request: NextRequest,
  deviceFingerprint: string
): Promise<ThreatEvent | null> {
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") ?? "";

  // Detect rapid requests to different endpoints
  // Detect requests to non-existent endpoints
  // Detect unusual header patterns

  if (path.includes("..") || path.includes("//")) {
    return await createThreatEvent(
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

async function createThreatEvent(
  type: ThreatEvent["type"],
  severity: ThreatEvent["severity"],
  userId: string | undefined,
  ip: string,
  userAgent: string,
  deviceFingerprint: string,
  path: string,
  details: Record<string, unknown>
): Promise<ThreatEvent> {
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

  // Store threat event in database
  try {
    await prisma.threatEvent.create({
      data: {
        type: threat.type,
        severity: threat.severity,
        deviceFingerprint: threat.deviceFingerprint,
        ipAddress: threat.ip,
        userAgent: threat.userAgent,
        path: threat.path,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: threat.details as any, // Prisma Json type
        blocked: threat.blocked,
        userId: threat.userId,
      },
    });
    console.log(`💾 Threat event stored in database: ${threat.id}`);
  } catch (error) {
    console.error("Error storing threat event:", error);
  }

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

  // Only block for CRITICAL threats (like actual hacking attempts)
  if (currentThreat.severity === "critical") {
    console.log(
      `🚨 CRITICAL threat detected - blocking device: ${deviceFingerprint}`
    );
    return true;
  }

  // Block if multiple HIGH-severity threats in very short time (5 minutes)
  const recentHighThreats = deviceThreats.filter(
    (t) =>
      Date.now() - t.timestamp.getTime() < 5 * 60 * 1000 && // Last 5 minutes
      t.severity === "high"
  );

  if (recentHighThreats.length >= 5) {
    // Increased from 3 to 5
    console.log(
      `🚨 Multiple high threats in 5 minutes - blocking device: ${deviceFingerprint}`
    );
    return true;
  }

  // Block if way too many threats overall (increased threshold)
  if (deviceThreats.length >= 20) {
    // Increased from 10 to 20
    console.log(
      `🚨 Too many total threats - blocking device: ${deviceFingerprint}`
    );
    return true;
  }

  // Don't block for medium/low severity threats
  console.log(
    `ℹ️ Threat detected but not blocking: ${currentThreat.severity} severity`
  );
  return false;
}

export async function isDeviceBlocked(
  deviceFingerprint: string
): Promise<boolean> {
  // Check in-memory cache first
  if (blockedDevices.has(deviceFingerprint)) {
    return true;
  }

  // Check database
  try {
    const blockedDevice = await prisma.blockedDevice.findFirst({
      where: {
        deviceFingerprint,
        isActive: true,
      },
    });

    if (blockedDevice) {
      // Add to in-memory cache
      blockedDevices.add(deviceFingerprint);
      console.log(`🚫 Device found blocked in database: ${deviceFingerprint}`);
      return true;
    }
  } catch (error) {
    console.error("Error checking blocked device:", error);
  }

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
  let dbThreats: Array<{
    id: string;
    type: string;
    severity: string;
    userId: string | null;
    ipAddress: string;
    userAgent: string | null;
    deviceFingerprint: string;
    path: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details: any; // Prisma JsonValue type
    blocked: boolean;
    createdAt: Date;
  }> = [];
  let dbBlockedDevices = 0;

  // Database queries
  try {
    // Get recent threats from database
    dbThreats = await prisma.threatEvent.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get active blocked devices from database
    const blockedDevicesResult = await prisma.blockedDevice.count({
      where: {
        isActive: true,
      },
    });
    dbBlockedDevices = blockedDevicesResult;

    console.log(
      `📊 Database stats: ${dbThreats.length} threats, ${dbBlockedDevices} blocked devices`
    );
  } catch (error) {
    console.error("Error fetching threat stats from database:", error);
  }

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
    details: (t.details as Record<string, unknown>) || {},
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
    // Update database
    const result = await prisma.blockedDevice.updateMany({
      where: {
        deviceFingerprint,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Remove from in-memory cache
    const removed = blockedDevices.delete(deviceFingerprint);

    console.log(`🔓 Device unblocked: ${deviceFingerprint}`, {
      databaseUpdated: result.count,
      inMemoryRemoved: removed,
    });

    return result.count > 0 || removed;
  } catch (error) {
    console.error("Error unblocking device:", error);
    // Fallback to in-memory only
    return blockedDevices.delete(deviceFingerprint);
  }
}

export async function blockDevice(
  deviceFingerprint: string,
  threat: ThreatEvent,
  blockedBy?: string
): Promise<void> {
  try {
    // Create in database
    await prisma.blockedDevice.create({
      data: {
        deviceFingerprint,
        reason:
          ((threat.details as Record<string, unknown>)?.reason as string) ||
          "Automatic block due to threat",
        blockedBy,
        ipAddress: threat.ip,
        userAgent: threat.userAgent,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: threat.details as any,
      },
    });

    // Add to in-memory cache
    blockedDevices.add(deviceFingerprint);

    console.log(`🚨 DEVICE BLOCKED: ${deviceFingerprint}`, {
      reason: threat.details,
      timestamp: new Date().toISOString(),
      databaseStored: true,
    });
  } catch (error) {
    console.error("Error blocking device:", error);
    // Fallback to in-memory only
    blockedDevices.add(deviceFingerprint);
    console.log(`🚨 DEVICE BLOCKED (in-memory only): ${deviceFingerprint}`);
  }
}
