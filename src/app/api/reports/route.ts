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
    const [totalStudents, totalTeachers, totalFeeThisMonth, todayAttendance] = await Promise.all([
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.feePayment.aggregate({
        where: {
          paymentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
      prisma.attendance.findMany({
        where: { date: new Date().toISOString().split("T")[0] },
        include: {
          _count: { select: { records: true } },
          records: { where: { status: "PRESENT" } },
        },
      }),
    ]);

    const totalPresent = todayAttendance.reduce((sum, a) => sum + a.records.length, 0);
    const totalRecords = todayAttendance.reduce((sum, a) => sum + a._count.records, 0);

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      feeCollectedThisMonth: totalFeeThisMonth._sum.amount || 0,
      todayAttendancePercent: totalRecords
        ? Math.round((totalPresent / totalRecords) * 100)
        : null,
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

    const trend = attendances.map((a) => {
      const total = a.records.length;
      const present = a.records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
      return {
        date: a.date,
        percent: total ? Math.round((present / total) * 100) : 0,
        total,
        present,
      };
    });

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
