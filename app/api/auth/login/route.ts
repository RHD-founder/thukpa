import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { createSession, updateLastLogin } from "@/lib/auth";
import {
  verifyPassword,
  getSecurityContext,
  createAuditLog,
} from "@/lib/security";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = await getSecurityContext(request);

    // Validate input
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Log failed login attempt
      await prisma.auditLog.create({
        data: createAuditLog(
          null,
          "login_failed",
          "user",
          null,
          { email, reason: "user_not_found" },
          context
        ),
      });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      // Log failed login attempt
      await prisma.auditLog.create({
        data: createAuditLog(
          user.id,
          "login_failed",
          "user",
          user.id,
          { email, reason: "account_inactive" },
          context
        ),
      });

      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      // Log failed login attempt
      await prisma.auditLog.create({
        data: createAuditLog(
          user.id,
          "login_failed",
          "user",
          user.id,
          { email, reason: "invalid_password" },
          context
        ),
      });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(user.id, request);

    // Update last login
    await updateLastLogin(user.id);

    // Log successful login
    await prisma.auditLog.create({
      data: createAuditLog(
        user.id,
        "login_success",
        "user",
        user.id,
        { email },
        context
      ),
    });

    // Set session cookie
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: session.user,
      },
      { status: 200 }
    );

    response.cookies.set("session_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Also set simple auth cookie for Edge Runtime compatibility
    const userData = JSON.stringify(session.user);
    const encodedUser = Buffer.from(userData).toString("base64");
    response.cookies.set("auth-user", encodedUser, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
