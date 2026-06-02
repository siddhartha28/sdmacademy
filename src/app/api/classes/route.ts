import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classes = await prisma.class.findMany({
    include: {
      sections: {
        include: { _count: { select: { students: true } } },
      },
      _count: { select: { teachers: true } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ classes });
}
