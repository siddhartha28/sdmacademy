import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import "dotenv/config";

const url = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("🌱 Seeding database...");

  // Classes
  const classData = [
    { name: "Play", order: 1 },
    { name: "Nursery", order: 2 },
    { name: "KG", order: 3 },
    { name: "Class 1", order: 4 },
    { name: "Class 2", order: 5 },
    { name: "Class 3", order: 6 },
    { name: "Class 4", order: 7 },
    { name: "Class 5", order: 8 },
    { name: "Class 6", order: 9 },
    { name: "Class 7", order: 10 },
    { name: "Class 8", order: 11 },
  ];

  const classes = await Promise.all(
    classData.map((c) =>
      prisma.class.upsert({
        where: { name: c.name },
        create: c,
        update: c,
      })
    )
  );
  console.log(`✅ ${classes.length} classes created`);

  // Sections (A for each class)
  await Promise.all(
    classes.map((c) =>
      prisma.section.upsert({
        where: { classId_name: { classId: c.id, name: "A" } },
        create: { classId: c.id, name: "A" },
        update: {},
      })
    )
  );
  console.log("✅ Sections created");

  // Subjects per class
  const subjectsByClass: Record<string, string[]> = {
    "Play": ["English", "Hindi", "Mathematics", "Drawing", "Activity"],
    "Nursery": ["English", "Hindi", "Mathematics", "Drawing", "Activity"],
    "KG": ["English", "Hindi", "Mathematics", "Drawing", "Activity", "EVS"],
    "Class 1": ["English", "Hindi", "Mathematics", "EVS", "Drawing", "Computer"],
    "Class 2": ["English", "Hindi", "Mathematics", "EVS", "Drawing", "Computer"],
    "Class 3": ["English", "Hindi", "Mathematics", "EVS", "Drawing", "Computer"],
    "Class 4": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Drawing", "Computer"],
    "Class 5": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Drawing", "Computer"],
    "Class 6": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit", "Computer", "Drawing"],
    "Class 7": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit", "Computer", "Drawing"],
    "Class 8": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit", "Computer", "Drawing"],
  };

  let subjectCount = 0;
  for (const cls of classes) {
    const subjects = subjectsByClass[cls.name] || [];
    for (const name of subjects) {
      await prisma.subject.upsert({
        where: { id: `${cls.id}-${name}` },
        create: { id: `${cls.id}-${name}`, name, classId: cls.id, maxMarks: 100 },
        update: {},
      }).catch(async () => {
        const existing = await prisma.subject.findFirst({ where: { name, classId: cls.id } });
        if (!existing) {
          await prisma.subject.create({ data: { name, classId: cls.id, maxMarks: 100 } });
          subjectCount++;
        }
      });
      subjectCount++;
    }
  }
  console.log(`✅ Subjects created`);

  // Exams
  const examTypes = ["Unit Test 1", "Unit Test 2", "Half Yearly", "Annual"];
  await Promise.all(
    examTypes.map((name) =>
      prisma.exam.upsert({
        where: { id: `exam-${name}-2024` },
        create: { id: `exam-${name}-2024`, name, year: 2024 },
        update: {},
      }).catch(async () => {
        const existing = await prisma.exam.findFirst({ where: { name, year: 2024 } });
        if (!existing) await prisma.exam.create({ data: { name, year: 2024 } });
      })
    )
  );
  console.log("✅ Exams created");

  // Principal account
  const principalPassword = await bcrypt.hash("principal123", 12);
  await prisma.user.upsert({
    where: { phone: "9999999999" },
    create: {
      name: "Ms. Mansi Sharma",
      phone: "9999999999",
      email: "principal@sdmacademy.in",
      password: principalPassword,
      role: "PRINCIPAL",
    },
    update: {},
  });
  console.log("✅ Principal account: phone=9999999999, password=principal123");

  // Admin account
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { phone: "9999999998" },
    create: {
      name: "Admin Staff",
      phone: "9999999998",
      password: adminPassword,
      role: "ADMIN",
    },
    update: {},
  });
  console.log("✅ Admin account: phone=9999999998, password=admin123");

  // Demo teacher for Class 1
  const class1 = classes.find((c) => c.name === "Class 1");
  const teacherPassword = await bcrypt.hash("teacher123", 12);
  await prisma.user.upsert({
    where: { phone: "9999999997" },
    create: {
      name: "Sunita Devi",
      phone: "9999999997",
      password: teacherPassword,
      role: "TEACHER",
      classId: class1?.id,
    },
    update: {},
  });
  console.log("✅ Teacher account: phone=9999999997, password=teacher123 (Class 1)");

  // Demo students in Class 1 Section A
  const class1Section = await prisma.section.findFirst({ where: { classId: class1?.id, name: "A" } });
  if (class1Section) {
    const studentNames = [
      "Aarav Sharma", "Priya Singh", "Rahul Kumar", "Ananya Gupta", "Vikram Tiwari",
      "Sneha Verma", "Arjun Yadav", "Pooja Mishra", "Kunal Joshi", "Riya Patel",
    ];
    for (let i = 0; i < studentNames.length; i++) {
      const rollNo = String(i + 1).padStart(2, "0");
      await prisma.student.upsert({
        where: { sectionId_rollNo: { sectionId: class1Section.id, rollNo } },
        create: {
          name: studentNames[i],
          rollNo,
          sectionId: class1Section.id,
          gender: i % 2 === 0 ? "Male" : "Female",
          admissionNo: `ADM-2024-${String(i + 1).padStart(3, "0")}`,
          admissionYear: 2024,
          fatherName: `Father of ${studentNames[i]}`,
          phone: `98765${String(43210 + i).padStart(5, "0")}`,
        },
        update: {},
      });
    }
    console.log("✅ 10 demo students in Class 1 Section A");
  }

  // School settings
  await Promise.all([
    prisma.schoolSettings.upsert({ where: { key: "schoolName" }, create: { key: "schoolName", value: "S.D.M. Academy Shaulana" }, update: {} }),
    prisma.schoolSettings.upsert({ where: { key: "academicYear" }, create: { key: "academicYear", value: "2024-25" }, update: {} }),
    prisma.schoolSettings.upsert({ where: { key: "principalName" }, create: { key: "principalName", value: "Ms. Mansi Sharma" }, update: {} }),
  ]);
  console.log("✅ School settings initialized");

  // Demo notice
  await prisma.notice.upsert({
    where: { id: "notice-welcome" },
    create: {
      id: "notice-welcome",
      title: "Welcome to Session 2024-25",
      content: "Dear parents and students, we welcome you to the new academic session 2024-25. School will commence from April 1st, 2024. Kindly ensure all fees are paid by April 15th.",
      category: "General",
      isPublished: true,
      publishedAt: new Date(),
    },
    update: {},
  });
  console.log("✅ Demo notice created");

  console.log("\n🎉 Seeding complete!");
  console.log("Login credentials:");
  console.log("  Principal: 9999999999 / principal123");
  console.log("  Admin:     9999999998 / admin123");
  console.log("  Teacher:   9999999997 / teacher123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
