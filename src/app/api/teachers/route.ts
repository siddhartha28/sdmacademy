import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const teachers = await prisma.user.findMany({
    where: { role: { in: ["TEACHER", "ADMIN", "PRINCIPAL"] } },
    include: { class: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    teachers: teachers.map((t) => ({ ...t, password: undefined })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const data = await req.json();

  const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existing) return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });

  const hashed = await bcrypt.hash(data.password, 12);

  const teacher = await prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      password: hashed,
      role: data.role || "TEACHER",
      classId: data.classId || undefined,
    },
    include: { class: true },
  });

  return NextResponse.json({ teacher: { ...teacher, password: undefined } }, { status: 201 });
}
