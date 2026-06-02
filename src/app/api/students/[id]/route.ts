import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      section: { include: { class: true } },
      feePayments: { orderBy: { paymentDate: "desc" } },
      marksEntries: {
        include: { exam: true, subject: true },
        orderBy: { exam: { year: "desc" } },
      },
      attendanceRecords: {
        include: { attendance: true },
        orderBy: { attendance: { date: "desc" } },
        take: 60,
      },
    },
  });

  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ student });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const data = await req.json();

  const student = await prisma.student.update({
    where: { id },
    data: {
      name: data.name,
      rollNo: data.rollNo,
      sectionId: data.sectionId,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
      fatherName: data.fatherName,
      motherName: data.motherName,
      phone: data.phone,
      address: data.address,
      status: data.status,
    },
    include: { section: { include: { class: true } } },
  });

  return NextResponse.json({ student });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "PRINCIPAL")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  await prisma.student.update({ where: { id }, data: { status: "ARCHIVED" } });
  return NextResponse.json({ success: true });
}
