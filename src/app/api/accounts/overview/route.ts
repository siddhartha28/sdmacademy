import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["PRINCIPAL", "ACCOUNTS"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalFeeThisMonth,
    totalFeeToday,
    totalExpensesThisMonth,
    pendingWaivers,
    recentPayments,
    recentExpenses,
    pendingSalaries,
    overdueIssues,
  ] = await Promise.all([
    prisma.feePayment.aggregate({ where: { paymentDate: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.feePayment.aggregate({ where: { paymentDate: { gte: startOfToday } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { date: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.feeWaiver.count({ where: { status: "PENDING" } }),
    prisma.feePayment.findMany({
      orderBy: { paymentDate: "desc" },
      take: 5,
      include: { student: { select: { name: true, admissionNo: true } } },
    }),
    prisma.expense.findMany({ orderBy: { date: "desc" }, take: 5 }),
    prisma.salaryRecord.count({ where: { status: "PENDING" } }),
    prisma.libraryIssue.count({ where: { status: "ISSUED", dueDate: { lt: now } } }),
  ]);

  const monthlyFee: Record<string, number> = {};
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const allPayments = await prisma.feePayment.findMany({
    where: { paymentDate: { gte: sixMonthsAgo } },
    select: { paymentDate: true, amount: true },
  });
  for (const p of allPayments) {
    if (!p.paymentDate) continue;
    const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, "0")}`;
    monthlyFee[key] = (monthlyFee[key] || 0) + p.amount;
  }
  const monthlyTrend = Object.entries(monthlyFee)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  return NextResponse.json({
    totalFeeThisMonth: totalFeeThisMonth._sum?.amount || 0,
    totalFeeToday: totalFeeToday._sum?.amount || 0,
    totalExpensesThisMonth: totalExpensesThisMonth._sum.amount || 0,
    pendingWaivers,
    pendingSalaries,
    overdueIssues,
    recentPayments,
    recentExpenses,
    monthlyTrend,
  });
}
