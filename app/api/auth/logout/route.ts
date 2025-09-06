import { NextRequest, NextResponse } from "next/server";
import { getSession, deleteSession } from "@/lib/auth";
import { getSecurityContext, createAuditLog } from "@/lib/security";
import { clearAuthCookie } from "@/lib/simple-auth";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const context = await getSecurityContext(request);
    const session = await getSession();

    if (session) {
      // Delete session
      await deleteSession(session.token);

      // Log logout
      await prisma.auditLog.create({
        data: createAuditLog(
          session.user.id,
          "logout",
          "user",
          session.user.id,
          { email: session.user.email },
          context
        ),
      });
    }

    // Clear session cookie
    const response = NextResponse.json(
      { message: "Logout successful" },
      { status: 200 }
    );

    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    // Also clear simple auth cookie
    await clearAuthCookie();

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
