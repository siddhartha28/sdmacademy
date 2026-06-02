import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "PRINCIPAL") {
    return NextResponse.json({ error: "Only principal can unlock attendance" }, { status: 403 });
  }

  const { date, sectionId } = await req.json();

  await prisma.attendance.update({
    where: { date_sectionId: { date, sectionId } },
    data: { isLocked: false },
  });

  return NextResponse.json({ success: true });
}
