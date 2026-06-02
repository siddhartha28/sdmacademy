import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PRINCIPAL", "ADMIN"].includes(user.role);

  const leaves = await prisma.teacherLeave.findMany({
    where: isAdmin ? {} : { teacherId: user.id },
    include: {
      teacher: { select: { id: true, name: true } },
      substitute: { select: { id: true, name: true } },
    },
    orderBy: { appliedAt: "desc" },
  });

  return NextResponse.json({ leaves });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { fromDate, toDate, reason, leaveType = "CASUAL", substituteId } = body;

  if (!fromDate || !toDate || !reason) {
    return NextResponse.json({ error: "fromDate, toDate, and reason are required" }, { status: 400 });
  }

  const leave = await prisma.teacherLeave.create({
    data: {
      teacherId: user.id,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      leaveType,
      substituteId: substituteId || null,
    },
    include: {
      teacher: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ leave }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["PRINCIPAL", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, status, remarks } = body;
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

  const leave = await prisma.teacherLeave.update({
    where: { id },
    data: {
      status,
      remarks: remarks || null,
      reviewedBy: user.name,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ leave });
}
