import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !["PRINCIPAL", "ACCOUNTS"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const expenses = await prisma.expense.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(from || to ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    },
    orderBy: { date: "desc" },
    take: 200,
  });
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ACCOUNTS") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, category = "OTHER", amount, date, description, vendorName, invoiceNo, paymentMode = "CASH" } = body;
  if (!title || !amount || !date) return NextResponse.json({ error: "title, amount, date required" }, { status: 400 });
  const expense = await prisma.expense.create({
    data: { title, category, amount: Number(amount), date: new Date(date), description: description || null, vendorName: vendorName || null, invoiceNo: invoiceNo || null, paymentMode, createdBy: user.name },
  });
  return NextResponse.json({ expense }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || user.role !== "ACCOUNTS") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
