import { NextRequest, NextResponse } from "next/server";
import { getThreatStats } from "@/lib/threat-detection";

export async function GET(request: NextRequest) {
  try {
    console.log("📊 API: Fetching threat stats...");
    const stats = getThreatStats();
    console.log("📊 API: Threat stats retrieved:", {
      totalThreats: stats.totalThreats,
      blockedDevices: stats.blockedDevices,
      recentThreats: stats.recentThreats.length,
      activeUsers: stats.activeUsers,
    });
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch threat stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch threat data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, deviceFingerprint } = await request.json();

    if (action === "unblock" && deviceFingerprint) {
      const { unblockDevice } = await import("@/lib/threat-detection");
      const success = unblockDevice(deviceFingerprint);

      if (success) {
        return NextResponse.json({ message: "Device unblocked successfully" });
      } else {
        return NextResponse.json(
          { error: "Device not found or already unblocked" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to process threat action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
