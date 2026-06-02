import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSession({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role as "PRINCIPAL" | "ADMIN" | "TEACHER",
      classId: user.classId,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role, classId: user.classId },
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Login error:", msg);
    return NextResponse.json({ error: "Server error", detail: msg }, { status: 500 });
  }
}
