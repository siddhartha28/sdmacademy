import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["ADMIN", "PRINCIPAL"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const books = await prisma.libraryBook.findMany({
    where: q ? { OR: [{ title: { contains: q } }, { author: { contains: q } }, { isbn: { contains: q } }] } : {},
    include: { _count: { select: { issues: { where: { status: "ISSUED" } } } } },
    orderBy: { title: "asc" },
  });
  return NextResponse.json({ books });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, author, isbn, subject, publisher, edition, totalCopies = 1 } = body;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const book = await prisma.libraryBook.create({
    data: { title, author: author || null, isbn: isbn || null, subject: subject || null, publisher: publisher || null, edition: edition || null, totalCopies: Number(totalCopies), availableCopies: Number(totalCopies) },
  });
  return NextResponse.json({ book }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const book = await prisma.libraryBook.update({ where: { id }, data: updates });
  return NextResponse.json({ book });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.libraryBook.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
