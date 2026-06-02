import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = await prisma.user.findMany({
    select: { id: true, name: true, phone: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, phone, email, role, password } = body;
  if (!name || !phone || !role || !password) {
    return NextResponse.json({ error: "name, phone, role, password required" }, { status: 400 });
  }
  const validRoles = ["TEACHER", "ADMIN", "ACCOUNTS"];
  if (!validRoles.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: { name, phone, email: email || null, role, password: hashed },
    select: { id: true, name: true, phone: true, email: true, role: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({ user: newUser }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, name, email, isActive, role, password } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email || null;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (role !== undefined) {
    const validRoles = ["TEACHER", "ADMIN", "ACCOUNTS"];
    if (!validRoles.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    updateData.role = role;
  }
  if (password) updateData.password = await bcrypt.hash(password, 10);

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, phone: true, email: true, role: true, isActive: true },
  });
  return NextResponse.json({ user: updated });
}
