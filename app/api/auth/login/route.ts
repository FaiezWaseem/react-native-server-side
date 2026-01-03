"use server";

import { NextResponse } from "next/server";
import { db } from "@/lib/prismadb";
import { loginSchema } from "@/schema/auth";
import { verifyPassword, signAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth";

/**
 * Handles user login with email and password.
 * - Validates input
 * - Verifies credentials
 * - Issues JWT and sets auth cookie
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, image: true, password: true },
    });
    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { password: _, ...safeUser } = user;
    const token = signAuthToken({ sub: user.id, role: user.role });
    const res = NextResponse.json({ user: safeUser }, { status: 200 });
    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
