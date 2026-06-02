/**
 * Seeds TeacherAssignment rows for existing teachers.
 * - Assigns each teacher with a classId as class teacher of that class
 * - Assigns all subjects for that class to that teacher
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";

const url = process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, authToken });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const YEAR = "2025-26";

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", isActive: true },
  });

  const classes = await prisma.class.findMany();
  const subjects = await prisma.subject.findMany();

  let created = 0;
  let skipped = 0;

  for (const teacher of teachers) {
    // If teacher already has classId (legacy), use that as primary assignment
    const classId = teacher.classId ?? classes[0]?.id;
    if (!classId) continue;

    const theClass = classes.find((c) => c.id === classId);
    if (!theClass) continue;

    // Class teacher assignment (no subject)
    try {
      await prisma.teacherAssignment.create({
        data: {
          teacherId: teacher.id,
          classId,
          subjectId: null,
          isClassTeacher: true,
          academicYear: YEAR,
        },
      });
      created++;
    } catch {
      skipped++;
    }

    // Subject assignments for subjects belonging to this class
    const classSubjects = subjects.filter((s) => s.classId === classId);
    for (const subject of classSubjects) {
      try {
        await prisma.teacherAssignment.create({
          data: {
            teacherId: teacher.id,
            classId,
            subjectId: subject.id,
            isClassTeacher: false,
            academicYear: YEAR,
          },
        });
        created++;
      } catch {
        skipped++;
      }
    }

    console.log(`✅ ${teacher.name} → ${theClass.name} (${classSubjects.length} subjects)`);
  }

  console.log(`\n📊 Done: ${created} assignments created, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
