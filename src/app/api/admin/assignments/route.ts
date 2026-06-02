import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["PRINCIPAL", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId");
  const year = searchParams.get("year") ?? "2025-26";

  const assignments = await prisma.teacherAssignment.findMany({
    where: {
      ...(teacherId ? { teacherId } : {}),
      academicYear: year,
    },
    include: {
      teacher: { select: { id: true, name: true, phone: true } },
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: [{ class: { order: "asc" } }, { isClassTeacher: "desc" }],
  });

  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["PRINCIPAL", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { teacherId, classId, subjectId, isClassTeacher, academicYear = "2025-26" } = body;

  if (!teacherId || !classId) {
    return NextResponse.json({ error: "teacherId and classId are required" }, { status: 400 });
  }

  try {
    const assignment = await prisma.teacherAssignment.create({
      data: {
        teacherId,
        classId,
        subjectId: subjectId || null,
        isClassTeacher: Boolean(isClassTeacher),
        academicYear,
      },
      include: {
        teacher: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ assignment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Assignment already exists or invalid data" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["PRINCIPAL", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.teacherAssignment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
