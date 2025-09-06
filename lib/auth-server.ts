import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function getUser(): Promise<User | null> {
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

export async function requireAuth(): Promise<User> {
  const user = await getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}
