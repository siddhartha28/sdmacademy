import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const settings = await prisma.schoolSettings.findMany();
  const obj: Record<string, string> = {};
  settings.forEach((s) => (obj[s.key] = s.value));
  return NextResponse.json({ settings: obj });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "PRINCIPAL")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const data = await req.json();

  await Promise.all(
    Object.entries(data).map(([key, value]) =>
      prisma.schoolSettings.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    )
  );

  return NextResponse.json({ success: true });
}
