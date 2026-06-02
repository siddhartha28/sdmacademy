import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const sectionId = searchParams.get("sectionId");
  const search = searchParams.get("search");
  const status = searchParams.get("status") || "ACTIVE";

  const students = await prisma.student.findMany({
    where: {
      status,
      section: {
        ...(classId ? { classId } : {}),
        ...(sectionId ? { id: sectionId } : {}),
      },
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { admissionNo: { contains: search } },
              { rollNo: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      section: { include: { class: true } },
    },
    orderBy: [{ section: { class: { order: "asc" } } }, { rollNo: "asc" }],
  });

  return NextResponse.json({ students });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const data = await req.json();

  const student = await prisma.student.create({
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
      admissionNo: data.admissionNo,
      admissionYear: Number(data.admissionYear) || new Date().getFullYear(),
    },
    include: { section: { include: { class: true } } },
  });

  return NextResponse.json({ student }, { status: 201 });
}
