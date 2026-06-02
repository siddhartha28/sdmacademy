/**
 * Returns the current teacher's assignments, classes, and subjects.
 * Used by teacher portal pages to determine scoped access.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ?? "2025-26";

  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId: user.id, academicYear: year },
    include: {
      class: { select: { id: true, name: true, order: true } },
      subject: { select: { id: true, name: true, code: true, maxMarks: true } },
    },
    orderBy: [{ class: { order: "asc" } }],
  });

  // Derive unique classes and subjects from assignments
  const classMap: Record<string, { id: string; name: string; order: number; isClassTeacher: boolean }> = {};
  const subjectIds = new Set<string>();

  for (const a of assignments) {
    if (!classMap[a.classId]) {
      classMap[a.classId] = { ...a.class, isClassTeacher: a.isClassTeacher };
    } else if (a.isClassTeacher) {
      classMap[a.classId].isClassTeacher = true;
    }
    if (a.subjectId) subjectIds.add(a.subjectId);
  }

  const classes = Object.values(classMap).sort((a, b) => a.order - b.order);
  const isClassTeacher = classes.some((c) => c.isClassTeacher);

  return NextResponse.json({
    teacher: { id: user.id, name: user.name, role: user.role },
    assignments,
    classes,
    isClassTeacher,
    academicYear: year,
  });
}
