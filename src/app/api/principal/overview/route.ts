import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "PRINCIPAL") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [
    totalStudents,
    totalTeachers,
    totalSections,
    sectionsMarkedToday,
    pendingLeaves,
    feeThisMonth,
    upcomingEvents,
    pendingLessonPlans,
    classDistribution,
    lastMonthFee,
  ] = await Promise.all([
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "TEACHER", isActive: true } }),
    prisma.section.count(),
    prisma.attendance.count({ where: { date: today } }),
    prisma.teacherLeave.count({ where: { status: "PENDING" } }),
    prisma.feePayment.aggregate({
      where: { paymentDate: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.schoolEvent.findMany({
      where: { date: { gte: now }, isPublished: true },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.lessonPlan.count({ where: { status: "PLANNED" } }),
    prisma.class.findMany({
      select: {
        id: true,
        name: true,
        order: true,
        sections: {
          select: {
            _count: { select: { students: { where: { status: "ACTIVE" } } } },
          },
        },
      },
      orderBy: { order: "asc" },
    }),
    prisma.feePayment.aggregate({
      where: {
        paymentDate: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lt: startOfMonth,
        },
      },
      _sum: { amount: true },
    }),
  ]);

  // Today's attendance stats
  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { attendance: { date: today } },
    select: { status: true },
  });
  const presentToday = attendanceRecords.filter((r) => r.status === "PRESENT").length;
  const absentToday = attendanceRecords.filter((r) => r.status === "ABSENT").length;
  const totalToday = attendanceRecords.length;
  const attendancePct = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;

  // 14-day attendance trend
  const attendanceTrend = await prisma.attendance.findMany({
    where: { date: { gte: new Date(now.getTime() - 14 * 86400000).toISOString().split("T")[0] } },
    include: { records: { select: { status: true } } },
    orderBy: { date: "asc" },
  });

  const trendByDate: Record<string, { present: number; total: number }> = {};
  for (const a of attendanceTrend) {
    if (!trendByDate[a.date]) trendByDate[a.date] = { present: 0, total: 0 };
    for (const r of a.records) {
      trendByDate[a.date].total++;
      if (r.status === "PRESENT") trendByDate[a.date].present++;
    }
  }
  const trend = Object.entries(trendByDate).map(([date, v]) => ({
    date,
    pct: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
    present: v.present,
    total: v.total,
  }));

  // Classes without attendance today
  const sectionIdsMarked = (await prisma.attendance.findMany({ where: { date: today }, select: { sectionId: true } }))
    .map((a) => a.sectionId);
  const allSections = await prisma.section.findMany({ select: { id: true, name: true, class: { select: { name: true } } } });
  const unmarkedSections = allSections.filter((s) => !sectionIdsMarked.includes(s.id));

  // Class-wise student counts
  const classCounts = classDistribution.map((c) => ({
    id: c.id,
    name: c.name,
    students: c.sections.reduce((sum, s) => sum + s._count.students, 0),
  }));

  // 30-day fee trend
  const feeTrend = await prisma.feePayment.findMany({
    where: { paymentDate: { gte: thirtyDaysAgo } },
    select: { paymentDate: true, amount: true },
    orderBy: { paymentDate: "asc" },
  });
  const feeTrendByDay: Record<string, number> = {};
  for (const p of feeTrend) {
    const d = p.paymentDate.toISOString().split("T")[0];
    feeTrendByDay[d] = (feeTrendByDay[d] ?? 0) + p.amount;
  }

  // Recent teacher leaves
  const recentLeaves = await prisma.teacherLeave.findMany({
    where: { status: "PENDING" },
    include: { teacher: { select: { id: true, name: true } } },
    orderBy: { appliedAt: "desc" },
    take: 5,
  });

  // Pending announcements / recent
  const recentAnnouncements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { author: { select: { name: true } }, class: { select: { name: true } } },
  });

  return NextResponse.json({
    stats: {
      totalStudents,
      totalTeachers,
      totalSections,
      sectionsMarkedToday,
      attendancePct,
      presentToday,
      absentToday,
      pendingLeaves,
      pendingLessonPlans,
      feeThisMonth: feeThisMonth._sum.amount ?? 0,
      lastMonthFee: lastMonthFee._sum.amount ?? 0,
    },
    trend,
    classCounts,
    unmarkedSections,
    upcomingEvents,
    recentLeaves,
    recentAnnouncements,
    feeTrendByDay,
  });
}
