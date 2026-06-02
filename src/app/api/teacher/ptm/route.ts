import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const where =
    user.role === "TEACHER"
      ? { teacherId: user.id, ...(classId ? { classId } : {}) }
      : { ...(classId ? { classId } : {}) };

  const slots = await prisma.pTMSlot.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      student: { select: { id: true, name: true, fatherName: true, phone: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { classId, date, startTime, duration = 15 } = body;

  if (!classId || !date || !startTime) {
    return NextResponse.json({ error: "classId, date, and startTime required" }, { status: 400 });
  }

  const slot = await prisma.pTMSlot.create({
    data: {
      classId,
      teacherId: user.id,
      date: new Date(date),
      startTime,
      duration: Number(duration),
    },
  });

  return NextResponse.json({ slot }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status, parentName, studentId, notes } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const slot = await prisma.pTMSlot.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(parentName !== undefined ? { parentName } : {}),
      ...(studentId !== undefined ? { studentId } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  return NextResponse.json({ slot });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.pTMSlot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
