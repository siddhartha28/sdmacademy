import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role === "TEACHER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const data = await req.json();
  const students: Record<string, string>[] = data.students;

  if (!Array.isArray(students) || students.length === 0) {
    return NextResponse.json({ error: "No student data provided" }, { status: 400 });
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of students) {
    try {
      const section = await prisma.section.findFirst({
        where: {
          class: { name: row.class },
          name: row.section || "A",
        },
        include: { class: true },
      });

      if (!section) {
        errors.push(`Row ${created + skipped + 1}: Class "${row.class}" section "${row.section || "A"}" not found`);
        skipped++;
        continue;
      }

      await prisma.student.create({
        data: {
          name: row.name,
          rollNo: row.rollNo || String(created + 1),
          sectionId: section.id,
          fatherName: row.fatherName,
          motherName: row.motherName,
          phone: row.phone,
          gender: row.gender,
          admissionNo: row.admissionNo,
          admissionYear: Number(row.admissionYear) || new Date().getFullYear(),
        },
      });
      created++;
    } catch (err) {
      errors.push(`Row ${created + skipped + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
      skipped++;
    }
  }

  return NextResponse.json({ created, skipped, errors });
}
