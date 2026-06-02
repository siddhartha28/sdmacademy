import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const where = user.role === "TEACHER"
    ? { authorId: user.id, ...(classId ? { classId } : {}) }
    : { ...(classId ? { classId } : {}) };

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, content, classId, scope = "CLASS" } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      authorId: user.id,
      scope,
      classId: classId || null,
    },
    include: {
      class: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ announcement }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement || (user.role === "TEACHER" && announcement.authorId !== user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
