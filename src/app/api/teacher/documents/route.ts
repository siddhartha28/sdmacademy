import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");

  const where =
    user.role === "TEACHER"
      ? {
          OR: [{ teacherId: user.id }, { isPublic: true }],
          ...(classId ? { classId } : {}),
          ...(subjectId ? { subjectId } : {}),
        }
      : {
          ...(classId ? { classId } : {}),
          ...(subjectId ? { subjectId } : {}),
        };

  const materials = await prisma.studyMaterial.findMany({
    where,
    include: {
      teacher: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ materials });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, fileUrl, classId, subjectId, isPublic = true } = body;

  if (!title || !fileUrl) {
    return NextResponse.json({ error: "title and fileUrl required" }, { status: 400 });
  }

  const material = await prisma.studyMaterial.create({
    data: {
      title,
      description: description || null,
      fileUrl,
      classId: classId || null,
      subjectId: subjectId || null,
      teacherId: user.id,
      isPublic: Boolean(isPublic),
    },
    include: {
      subject: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ material }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const mat = await prisma.studyMaterial.findUnique({ where: { id } });
  if (!mat || mat.teacherId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.studyMaterial.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
