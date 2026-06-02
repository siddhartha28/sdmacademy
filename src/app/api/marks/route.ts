import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");

  const marks = await prisma.marksEntry.findMany({
    where: {
      ...(examId ? { examId } : {}),
      ...(studentId ? { studentId } : {}),
      ...(classId
        ? { student: { section: { classId } } }
        : {}),
    },
    include: {
      student: { include: { section: { include: { class: true } } } },
      exam: true,
      subject: true,
    },
    orderBy: [{ student: { rollNo: "asc" } }, { subject: { name: "asc" } }],
  });

  return NextResponse.json({ marks });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entries } = await req.json();

  const results = await Promise.all(
    entries.map((e: { studentId: string; examId: string; subjectId: string; marks: number | null; isAbsent: boolean }) =>
      prisma.marksEntry.upsert({
        where: {
          studentId_examId_subjectId: {
            studentId: e.studentId,
            examId: e.examId,
            subjectId: e.subjectId,
          },
        },
        create: {
          studentId: e.studentId,
          examId: e.examId,
          subjectId: e.subjectId,
          marks: e.marks,
          isAbsent: e.isAbsent || false,
        },
        update: {
          marks: e.marks,
          isAbsent: e.isAbsent || false,
        },
      })
    )
  );

  return NextResponse.json({ success: true, count: results.length });
}
