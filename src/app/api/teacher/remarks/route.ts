import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const classId = searchParams.get("classId");

  let where: Record<string, unknown> = {};

  if (user.role === "TEACHER") {
    where = { teacherId: user.id };
  }

  if (studentId) {
    where.studentId = studentId;
  } else if (classId) {
    const students = await prisma.student.findMany({
      where: { section: { classId }, status: "ACTIVE" },
      select: { id: true },
    });
    where.studentId = { in: students.map((s) => s.id) };
  }

  const remarks = await prisma.behaviourRemark.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, rollNo: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json({ remarks });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Only teachers can add remarks" }, { status: 401 });
  }

  const body = await req.json();
  const { studentId, remark, type = "GENERAL" } = body;

  if (!studentId || !remark) {
    return NextResponse.json({ error: "studentId and remark required" }, { status: 400 });
  }

  // Check if teacher is class teacher for this student
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { section: true },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: user.id,
      classId: student.section.classId,
      isClassTeacher: true,
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Only class teachers can add behaviour remarks" }, { status: 403 });
  }

  const behaviourRemark = await prisma.behaviourRemark.create({
    data: {
      studentId,
      teacherId: user.id,
      remark,
      type,
    },
    include: {
      student: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ remark: behaviourRemark }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const r = await prisma.behaviourRemark.findUnique({ where: { id } });
  if (!r || r.teacherId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.behaviourRemark.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
