import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { LOCK_HOUR } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const sectionId = searchParams.get("sectionId");

  if (!date || !sectionId) {
    return NextResponse.json({ error: "date and sectionId required" }, { status: 400 });
  }

  const attendance = await prisma.attendance.findUnique({
    where: { date_sectionId: { date, sectionId } },
    include: {
      records: { include: { student: true } },
    },
  });

  return NextResponse.json({ attendance });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, sectionId, records } = await req.json();

  if (!date || !sectionId || !records) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Check lock time — teachers cannot submit after lock hour
  const now = new Date();
  const isToday = date === now.toISOString().split("T")[0];
  const isLocked = isToday && now.getHours() >= LOCK_HOUR && user.role === "TEACHER";

  if (isLocked) {
    return NextResponse.json(
      { error: `Attendance is locked after ${LOCK_HOUR}:00 AM` },
      { status: 403 }
    );
  }

  // Upsert attendance
  const attendance = await prisma.attendance.upsert({
    where: { date_sectionId: { date, sectionId } },
    create: {
      date,
      sectionId,
      submittedBy: user.id,
    },
    update: {
      submittedBy: user.id,
      submittedAt: new Date(),
    },
  });

  // Delete old records and insert new ones
  await prisma.attendanceRecord.deleteMany({ where: { attendanceId: attendance.id } });

  await prisma.attendanceRecord.createMany({
    data: records.map((r: { studentId: string; status: string }) => ({
      attendanceId: attendance.id,
      studentId: r.studentId,
      status: r.status,
    })),
  });

  return NextResponse.json({ success: true, attendanceId: attendance.id });
}
