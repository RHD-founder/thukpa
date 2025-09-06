import { NextRequest } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function validateAuthCookie(request: NextRequest): AuthUser | null {
  try {
    const authCookie = request.cookies.get("auth-user");

    if (!authCookie) {
      return null;
    }

    // Decode and validate the cookie
    const decodedUser = Buffer.from(authCookie.value, "base64").toString(
      "utf-8"
    );
    const user = JSON.parse(decodedUser) as AuthUser;

    // Basic validation
    if (!user.id || !user.email || !user.name || !user.role) {
      return null;
    }

    // Check if user has required fields
    if (typeof user.id !== "string" || typeof user.email !== "string") {
      return null;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      return null;
    }

    // Check for suspicious patterns
    if (
      user.email.includes("<") ||
      user.email.includes(">") ||
      user.email.includes("javascript:")
    ) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Auth cookie validation error:", error);
    return null;
  }
}

export function isAuthenticated(request: NextRequest): boolean {
  return validateAuthCookie(request) !== null;
}
