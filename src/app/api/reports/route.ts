import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "overview") {
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalStudents, totalTeachers, totalFeeThisMonth, todayAttendance, totalNotices] = await Promise.all([
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { isActive: true, role: "TEACHER" } }),
      prisma.feePayment.aggregate({
        where: { paymentDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.attendance.findMany({
        where: { date: today },
        include: {
          _count: { select: { records: true } },
          records: { where: { status: { in: ["PRESENT", "LATE"] } } },
        },
      }),
      prisma.notice.count({ where: { isPublished: true } }),
    ]);

    const totalPresent = todayAttendance.reduce((sum, a) => sum + a.records.length, 0);
    const totalRecords = todayAttendance.reduce((sum, a) => sum + a._count.records, 0);

    // Class-wise student counts
    const classCounts = await prisma.class.findMany({
      orderBy: { order: "asc" },
      include: {
        sections: {
          include: { _count: { select: { students: { where: { status: "ACTIVE" } } } } },
        },
      },
    });

    const studentsByClass = classCounts.map((c) => ({
      name: c.name,
      count: c.sections.reduce((sum, s) => sum + s._count.students, 0),
    })).filter((c) => c.count > 0);

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalNotices,
      feeCollectedThisMonth: totalFeeThisMonth._sum.amount || 0,
      todayAttendancePercent: totalRecords
        ? Math.round((totalPresent / totalRecords) * 100)
        : null,
      todayPresent: totalPresent,
      todayTotal: totalRecords,
      studentsByClass,
    });
  }

  if (type === "attendance-trend") {
    const days = parseInt(searchParams.get("days") || "30");
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate.toISOString().split("T")[0],
          lte: endDate.toISOString().split("T")[0],
        },
      },
      include: {
        records: { select: { status: true } },
      },
      orderBy: { date: "asc" },
    });

    // Aggregate multiple sections per day into one data point
    const byDate = new Map<string, { total: number; present: number }>();
    for (const a of attendances) {
      const total = a.records.length;
      const present = a.records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
      const existing = byDate.get(a.date) || { total: 0, present: 0 };
      byDate.set(a.date, { total: existing.total + total, present: existing.present + present });
    }

    const trend = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { total, present }]) => ({
        date,
        percent: total ? Math.round((present / total) * 100) : 0,
        total,
        present,
      }));

    return NextResponse.json({ trend });
  }

  if (type === "fee-summary") {
    const classData = await prisma.class.findMany({
      include: {
        sections: {
          include: {
            students: {
              include: { feePayments: true },
              where: { status: "ACTIVE" },
            },
          },
        },
        feeStructures: true,
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ classData });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
