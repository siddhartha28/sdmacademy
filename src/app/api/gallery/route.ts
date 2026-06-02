import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const albumId = searchParams.get("albumId");

  if (albumId) {
    const album = await prisma.galleryAlbum.findUnique({
      where: { id: albumId },
      include: { images: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json({ album });
  }

  const albums = await prisma.galleryAlbum.findMany({
    include: { _count: { select: { images: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ albums });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const data = await req.json();

  if (data.type === "album") {
    const album = await prisma.galleryAlbum.create({
      data: { title: data.title, description: data.description, coverUrl: data.coverUrl },
    });
    return NextResponse.json({ album }, { status: 201 });
  }

  if (data.type === "image") {
    const image = await prisma.gallery.create({
      data: { albumId: data.albumId, imageUrl: data.imageUrl, caption: data.caption },
    });
    return NextResponse.json({ image }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
