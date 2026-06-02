import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming");

  const events = await prisma.schoolEvent.findMany({
    where: upcoming ? { date: { gte: new Date() }, isPublished: true } : {},
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["PRINCIPAL", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, date, endDate, isPublished = true } = body;

  if (!title || !date) {
    return NextResponse.json({ error: "title and date required" }, { status: 400 });
  }

  const event = await prisma.schoolEvent.create({
    data: {
      title,
      description: description || null,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      isPublished,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["PRINCIPAL", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.schoolEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
