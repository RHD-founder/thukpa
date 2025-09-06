import { cookies } from "next/headers";

export interface SimpleUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function setAuthCookie(user: SimpleUser) {
  const cookieStore = await cookies();
  const userData = JSON.stringify(user);
  const encodedUser = Buffer.from(userData).toString("base64");

  cookieStore.set("auth-user", encodedUser, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
  });
}

export async function getAuthUser(): Promise<SimpleUser | null> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("auth-user");

    if (!authCookie) {
      return null;
    }

    const decodedUser = Buffer.from(authCookie.value, "base64").toString(
      "utf-8"
    );
    return JSON.parse(decodedUser);
  } catch (error) {
    console.error("Error parsing auth cookie:", error);
    return null;
  }
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-user");
}
