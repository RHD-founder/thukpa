"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
// Removed unused import

interface LoginState {
  error: string;
}

export async function loginAction(prevState: LoginState, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "Invalid credentials" };
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return { error: "Invalid credentials" };
  }

  // Set auth cookie
  const userData = JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const encodedUser = Buffer.from(userData).toString("base64");

  const cookieStore = await cookies();
  cookieStore.set("auth-user", encodedUser, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/",
  });

  // Track user login for device fingerprinting
  // Note: We can't access request object in Server Actions, so we'll track in middleware

  // Redirect to dashboard (this will throw NEXT_REDIRECT which is expected)
  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-user");
  redirect("/admin/login");
}
