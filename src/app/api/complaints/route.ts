import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["ADMIN", "PRINCIPAL"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const complaints = await prisma.complaint.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ complaints });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { complainantName, complainantType = "PARENT", phone, category = "OTHER", description } = body;
  if (!complainantName || !description) return NextResponse.json({ error: "complainantName and description required" }, { status: 400 });
  const complaint = await prisma.complaint.create({
    data: { complainantName, complainantType, phone: phone || null, category, description },
  });
  return NextResponse.json({ complaint }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["ADMIN", "PRINCIPAL"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, status, assignedTo, resolution } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(assignedTo !== undefined ? { assignedTo } : {}),
      ...(resolution !== undefined ? { resolution } : {}),
    },
  });
  return NextResponse.json({ complaint });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.complaint.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
