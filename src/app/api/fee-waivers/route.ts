import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["PRINCIPAL", "ACCOUNTS"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const waivers = await prisma.feeWaiver.findMany({
    include: { student: { select: { id: true, name: true, admissionNo: true, section: { include: { class: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ waivers });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ACCOUNTS") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { studentId, amount, reason, type = "DISCOUNT" } = body;
  if (!studentId || !amount || !reason) {
    return NextResponse.json({ error: "studentId, amount, reason required" }, { status: 400 });
  }
  const waiver = await prisma.feeWaiver.create({
    data: { studentId, amount: Number(amount), reason, type, requestedBy: user.name },
  });
  return NextResponse.json({ waiver }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["PRINCIPAL", "ACCOUNTS"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, status, remarks } = body;
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
  if (status !== "PENDING" && user.role !== "PRINCIPAL") {
    return NextResponse.json({ error: "Only principal can approve/reject waivers" }, { status: 403 });
  }
  const waiver = await prisma.feeWaiver.update({
    where: { id },
    data: {
      status,
      remarks: remarks || null,
      ...(status === "APPROVED" ? { approvedBy: user.name, approvedAt: new Date() } : {}),
    },
  });
  return NextResponse.json({ waiver });
}
