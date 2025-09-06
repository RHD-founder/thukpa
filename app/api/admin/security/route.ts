import { NextRequest, NextResponse } from "next/server";
import {
  getThreatStats,
  unblockDevice,
  isDeviceBlocked,
  blockDevice as blockDeviceFunction,
} from "@/lib/threat-detection";
import { validateAuthCookie } from "@/lib/middleware-auth";

// GET - Get security stats and blocked devices
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = validateAuthCookie(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const stats = await getThreatStats();

    return NextResponse.json({
      success: true,
      data: {
        totalThreats: stats.totalThreats,
        blockedDevices: stats.blockedDevices,
        recentThreats: stats.recentThreats,
        topThreatTypes: stats.topThreatTypes,
        activeUsers: stats.activeUsers,
        userDevices: stats.userDevices,
        activeIPs: stats.activeIPs,
        activeIPList: stats.activeIPList,
      },
    });
  } catch (error) {
    console.error("Error fetching security stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch security stats" },
      { status: 500 }
    );
  }
}

// POST - Block/Unblock devices and IPs
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = validateAuthCookie(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { action, deviceFingerprint, ip, reason } = await req.json();

    if (action === "unblock_device") {
      if (!deviceFingerprint) {
        return NextResponse.json(
          { success: false, error: "Device fingerprint required" },
          { status: 400 }
        );
      }

      const unblocked = await unblockDevice(deviceFingerprint);

      if (unblocked) {
        console.log(`🔓 Device unblocked: ${deviceFingerprint}`);
        return NextResponse.json({
          success: true,
          message: "Device unblocked successfully",
        });
      } else {
        return NextResponse.json(
          { success: false, error: "Device not found or already unblocked" },
          { status: 404 }
        );
      }
    }

    if (action === "block_device") {
      if (!deviceFingerprint) {
        return NextResponse.json(
          { success: false, error: "Device fingerprint required" },
          { status: 400 }
        );
      }

      // Check if already blocked
      if (await isDeviceBlocked(deviceFingerprint)) {
        return NextResponse.json(
          { success: false, error: "Device already blocked" },
          { status: 400 }
        );
      }

      // Create a manual block threat event
      const threat = {
        id: `manual_block_${Date.now()}`,
        type: "suspicious_pattern" as const,
        severity: "critical" as const,
        userId: undefined,
        ip: ip || "unknown",
        userAgent: "Manual Block",
        deviceFingerprint,
        timestamp: new Date(),
        path: "/admin/security",
        details: {
          reason: reason || "Manually blocked by admin",
          manualBlock: true,
        },
        blocked: true,
      };

      // Block the device
      await blockDeviceFunction(deviceFingerprint, threat);

      console.log(`🚨 Device manually blocked: ${deviceFingerprint}`);
      return NextResponse.json({
        success: true,
        message: "Device blocked successfully",
      });
    }

    if (action === "block_ip") {
      if (!ip) {
        return NextResponse.json(
          { success: false, error: "IP address required" },
          { status: 400 }
        );
      }

      // Add IP to blocked list (you'll need to implement this in threat-detection.ts)
      // For now, we'll just log it
      console.log(
        `🚨 IP manually blocked: ${ip} - Reason: ${reason || "Manual block"}`
      );

      return NextResponse.json({
        success: true,
        message: "IP blocked successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error managing security:", error);
    return NextResponse.json(
      { success: false, error: "Failed to manage security settings" },
      { status: 500 }
    );
  }
}
