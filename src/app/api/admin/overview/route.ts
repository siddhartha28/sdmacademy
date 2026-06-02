import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["ADMIN", "PRINCIPAL"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [
    totalStudents,
    totalTeachers,
    openComplaints,
    booksAvailable,
    totalBooks,
    upcomingEvents,
    recentAdmissions,
    attendanceSummary,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.user.count({ where: { role: "TEACHER", isActive: true } }),
    prisma.complaint.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.libraryBook.aggregate({ _sum: { availableCopies: true } }),
    prisma.libraryBook.count(),
    prisma.schoolEvent.findMany({ where: { date: { gte: startOfToday } }, orderBy: { date: "asc" }, take: 5 }),
    prisma.student.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, admissionNo: true, createdAt: true, section: { include: { class: true } } } }),
    prisma.attendance.findMany({ where: { date: startOfToday.toISOString() }, include: { _count: { select: { records: true } }, section: { include: { class: true } } }, take: 20 }),
  ]);

  const markedSections = attendanceSummary.length;

  return NextResponse.json({
    totalStudents,
    totalTeachers,
    openComplaints,
    booksAvailable: booksAvailable._sum.availableCopies || 0,
    totalBooks,
    upcomingEvents,
    recentAdmissions,
    markedSections,
  });
}
