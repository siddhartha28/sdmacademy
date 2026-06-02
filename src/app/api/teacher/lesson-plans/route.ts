import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");

  const where = user.role === "TEACHER"
    ? { teacherId: user.id, ...(classId ? { classId } : {}), ...(subjectId ? { subjectId } : {}) }
    : { ...(classId ? { classId } : {}), ...(subjectId ? { subjectId } : {}) };

  const plans = await prisma.lessonPlan.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { topic, description, classId, subjectId, date, duration } = body;

  if (!topic || !classId || !subjectId || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const plan = await prisma.lessonPlan.create({
    data: {
      teacherId: user.id,
      classId,
      subjectId,
      topic,
      description: description || null,
      date: new Date(date),
      duration: duration ? Number(duration) : null,
    },
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ plan }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, status, topic, description } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const plan = await prisma.lessonPlan.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(topic ? { topic } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  });

  return NextResponse.json({ plan });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.lessonPlan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
