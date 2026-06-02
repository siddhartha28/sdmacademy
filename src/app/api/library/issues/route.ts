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
  const issues = await prisma.libraryIssue.findMany({
    where: status ? { status } : {},
    include: {
      book: { select: { id: true, title: true, author: true } },
      student: { select: { id: true, name: true, admissionNo: true } },
    },
    orderBy: { issueDate: "desc" },
    take: 200,
  });
  return NextResponse.json({ issues });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { bookId, studentId, issuedTo, dueDate } = body;
  if (!bookId || !issuedTo || !dueDate) return NextResponse.json({ error: "bookId, issuedTo, dueDate required" }, { status: 400 });

  const book = await prisma.libraryBook.findUnique({ where: { id: bookId } });
  if (!book || book.availableCopies < 1) return NextResponse.json({ error: "No copies available" }, { status: 400 });

  const [issue] = await prisma.$transaction([
    prisma.libraryIssue.create({ data: { bookId, studentId: studentId || null, issuedTo, dueDate: new Date(dueDate) } }),
    prisma.libraryBook.update({ where: { id: bookId }, data: { availableCopies: { decrement: 1 } } }),
  ]);
  return NextResponse.json({ issue }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, fine = 0 } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const issue = await prisma.libraryIssue.findUnique({ where: { id } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await prisma.$transaction([
    prisma.libraryIssue.update({ where: { id }, data: { status: "RETURNED", returnDate: new Date(), fine: Number(fine) } }),
    prisma.libraryBook.update({ where: { id: issue.bookId }, data: { availableCopies: { increment: 1 } } }),
  ]);
  return NextResponse.json({ issue: updated });
}
