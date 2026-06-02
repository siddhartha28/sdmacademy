import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const exams = await prisma.exam.findMany({
    where: classId ? { OR: [{ classId }, { classId: null }] } : {},
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ exams });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const data = await req.json();
  const exam = await prisma.exam.create({
    data: {
      name: data.name,
      year: data.year || new Date().getFullYear(),
      classId: data.classId || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });

  return NextResponse.json({ exam }, { status: 201 });
}
