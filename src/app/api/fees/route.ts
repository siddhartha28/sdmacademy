import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateReceiptNo } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "structure" | "payments"
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");
  const academicYear = searchParams.get("academicYear");

  if (type === "structure") {
    const structures = await prisma.feeStructure.findMany({
      where: {
        ...(classId ? { classId } : {}),
        ...(academicYear ? { academicYear } : {}),
      },
      include: { class: true },
      orderBy: [{ class: { order: "asc" } }, { feeType: "asc" }],
    });
    return NextResponse.json({ structures });
  }

  const payments = await prisma.feePayment.findMany({
    where: {
      ...(studentId ? { studentId } : {}),
    },
    include: {
      student: { include: { section: { include: { class: true } } } },
      feeStructure: true,
    },
    orderBy: { paymentDate: "desc" },
  });

  return NextResponse.json({ payments });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const data = await req.json();

  if (data.type === "structure") {
    const structure = await prisma.feeStructure.upsert({
      where: {
        classId_feeType_academicYear: {
          classId: data.classId,
          feeType: data.feeType,
          academicYear: data.academicYear,
        },
      },
      create: {
        classId: data.classId,
        feeType: data.feeType,
        amount: Number(data.amount),
        academicYear: data.academicYear,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      update: { amount: Number(data.amount) },
    });
    return NextResponse.json({ structure }, { status: 201 });
  }

  // Record payment
  const payment = await prisma.feePayment.create({
    data: {
      studentId: data.studentId,
      feeStructureId: data.feeStructureId || undefined,
      amount: Number(data.amount),
      mode: data.mode || "CASH",
      receiptNo: generateReceiptNo(),
      remarks: data.remarks,
      isWaived: data.isWaived || false,
      lateFine: Number(data.lateFine) || 0,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
    },
    include: { student: true, feeStructure: true },
  });

  return NextResponse.json({ payment }, { status: 201 });
}
