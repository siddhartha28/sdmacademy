import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const publicOnly = searchParams.get("public") === "true";

  const notices = await prisma.notice.findMany({
    where: publicOnly ? { isPublished: true } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notices });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const data = await req.json();

  const notice = await prisma.notice.create({
    data: {
      title: data.title,
      content: data.content,
      category: data.category,
      isPublished: data.isPublished || false,
      publishedAt: data.isPublished ? new Date() : null,
    },
  });

  return NextResponse.json({ notice }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const data = await req.json();

  const notice = await prisma.notice.update({
    where: { id: data.id },
    data: {
      title: data.title,
      content: data.content,
      category: data.category,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null,
    },
  });

  return NextResponse.json({ notice });
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await req.json();
  await prisma.notice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
