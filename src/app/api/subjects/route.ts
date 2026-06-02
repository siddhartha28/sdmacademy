import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const subjects = await prisma.subject.findMany({
    where: classId ? { OR: [{ classId }, { classId: null }] } : {},
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ subjects });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const data = await req.json();
  const subject = await prisma.subject.create({
    data: {
      name: data.name,
      code: data.code,
      maxMarks: data.maxMarks || 100,
      classId: data.classId || null,
    },
  });

  return NextResponse.json({ subject }, { status: 201 });
}
