import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["PRINCIPAL", "ACCOUNTS"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const records = await prisma.salaryRecord.findMany({
    where: {
      ...(month ? { month: Number(month) } : {}),
      ...(year ? { year: Number(year) } : {}),
    },
    include: { teacher: { select: { id: true, name: true, role: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ACCOUNTS") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { teacherId, month, year, basicSalary, allowances = 0, deductions = 0, remarks } = body;
  if (!teacherId || !month || !year || !basicSalary) {
    return NextResponse.json({ error: "teacherId, month, year, basicSalary required" }, { status: 400 });
  }
  const netSalary = Number(basicSalary) + Number(allowances) - Number(deductions);
  const record = await prisma.salaryRecord.upsert({
    where: { teacherId_month_year: { teacherId, month: Number(month), year: Number(year) } },
    update: { basicSalary: Number(basicSalary), allowances: Number(allowances), deductions: Number(deductions), netSalary, remarks: remarks || null },
    create: { teacherId, month: Number(month), year: Number(year), basicSalary: Number(basicSalary), allowances: Number(allowances), deductions: Number(deductions), netSalary, remarks: remarks || null },
  });
  return NextResponse.json({ record }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ACCOUNTS") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, status, paymentDate } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const record = await prisma.salaryRecord.update({
    where: { id },
    data: { ...(status ? { status } : {}), ...(paymentDate ? { paymentDate: new Date(paymentDate) } : {}) },
  });
  return NextResponse.json({ record });
}
