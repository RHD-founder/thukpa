import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { generateSessionToken, getSecurityContext } from "./security";
import prisma from "./db";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: Date;
}

export async function createSession(
  userId: string,
  request?: NextRequest
): Promise<Session> {
  const context = await getSecurityContext(request);
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    },
    include: {
      user: true,
    },
  });

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      isActive: session.user.isActive,
    },
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) return null;

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      // Clean up expired session
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        isActive: session.user.isActive,
      },
      token: session.token,
      expiresAt: session.expiresAt,
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

export async function deleteSession(sessionToken: string): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: { token: sessionToken },
    });
  } catch (error) {
    console.error("Session deletion error:", error);
  }
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: { userId },
    });
  } catch (error) {
    console.error("User sessions deletion error:", error);
  }
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error("Authentication required");
  }

  return session;
}

export async function requireRole(role: string): Promise<Session> {
  const session = await requireAuth();

  if (session.user.role !== role && session.user.role !== "admin") {
    throw new Error("Insufficient permissions");
  }

  return session;
}

export async function updateLastLogin(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  } catch (error) {
    console.error("Last login update error:", error);
  }
}
