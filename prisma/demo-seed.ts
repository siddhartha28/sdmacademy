/**
 * Demo data seed — adds rich data across all modules for client demo.
 * Safe to run multiple times (uses upsert / skip-if-exists).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import "dotenv/config";

const url = process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ─── helpers ─────────────────────────────────────────────────────────────────
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function pastDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function dateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Skip weekends
function workingDays(n: number): string[] {
  const days: string[] = [];
  let offset = 0;
  while (days.length < n) {
    offset++;
    const d = pastDate(offset);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days.push(dateStr(d));
  }
  return days;
}

async function main() {
  console.log("🚀 Adding demo data...\n");

  // ── 1. Get existing classes & sections ──────────────────────────────────────
  const allClasses = await prisma.class.findMany({ include: { sections: true } });
  const byName = (n: string) => allClasses.find((c) => c.name === n)!;

  // ── 2. Additional teachers ───────────────────────────────────────────────────
  const teacherData = [
    { name: "Reena Tyagi",   phone: "9999999996", class: "Class 2" },
    { name: "Mohit Sharma",  phone: "9999999995", class: "Class 3" },
    { name: "Anita Verma",   phone: "9999999994", class: "Class 4" },
    { name: "Pankaj Kumar",  phone: "9999999993", class: "Class 5" },
    { name: "Savita Rani",   phone: "9999999992", class: "Class 6" },
    { name: "Deepak Singh",  phone: "9999999991", class: "Class 7" },
    { name: "Kavita Mishra", phone: "9999999990", class: "Class 8" },
  ];
  const pwd = await bcrypt.hash("teacher123", 10);
  for (const t of teacherData) {
    const cls = byName(t.class);
    await prisma.user.upsert({
      where: { phone: t.phone },
      create: { name: t.name, phone: t.phone, password: pwd, role: "TEACHER", classId: cls?.id },
      update: {},
    });
  }
  console.log(`✅ ${teacherData.length} additional teachers added`);

  // ── 3. Students across classes ───────────────────────────────────────────────
  const studentsByClass: Record<string, string[]> = {
    "Play":    ["Aryan Gupta","Mia Singh","Ravi Kumar","Pia Sharma","Dev Yadav"],
    "Nursery": ["Kabir Jain","Sanya Patel","Arjun Nair","Preet Kaur","Nikhil Raj"],
    "KG":      ["Anika Das","Vivaan Tiwari","Ishaan Verma","Myra Mishra","Krish Joshi"],
    "Class 1": [], // already seeded
    "Class 2": ["Amit Sahu","Neha Rawat","Suresh Bind","Geeta Devi","Rakesh Pal","Anita Kumari","Deepak Raj","Sunita Bai","Prem Kumar","Lata Devi"],
    "Class 3": ["Rajan Gupta","Swati Singh","Vikram Jha","Pooja Tiwari","Ajay Kumar","Reena Verma","Sanjay Yadav","Kavita Sharma","Mohan Das","Priya Chauhan"],
    "Class 4": ["Rohit Mishra","Anjali Patel","Sachin Kumar","Divya Singh","Sunil Joshi","Rekha Devi","Vikas Nagar","Simran Kaur","Nitin Rawat","Puja Rani"],
    "Class 5": ["Harsh Agarwal","Ritu Singh","Gaurav Yadav","Nidhi Sharma","Shivam Tiwari","Priyanka Raj","Abhishek Kumar","Manisha Verma","Deepak Jain","Sunita Gupta"],
    "Class 6": ["Akash Verma","Komal Singh","Rahul Tiwari","Sneha Kumar","Anand Yadav","Pooja Mishra","Santosh Raj","Kavita Joshi","Mohit Chauhan","Ruchi Devi"],
    "Class 7": ["Saurabh Garg","Priyanka Pal","Tarun Gupta","Nisha Rawat","Aakash Singh","Rekha Mishra","Vishal Jha","Ritu Verma","Ramesh Das","Sunita Yadav"],
    "Class 8": ["Niraj Kumar","Ankita Sharma","Pankaj Tiwari","Seema Singh","Yogesh Yadav","Meena Devi","Sunil Jain","Geeta Gupta","Ramesh Verma","Puja Kumari"],
  };

  let studentTotal = 0;
  const allStudents: { id: string; sectionId: string; classId: string }[] = [];

  for (const [className, names] of Object.entries(studentsByClass)) {
    if (!names.length) continue;
    const cls = byName(className);
    const section = cls?.sections[0];
    if (!cls || !section) continue;

    for (let i = 0; i < names.length; i++) {
      const rollNo = String(i + 11).padStart(2, "0"); // start from 11 to avoid clash with existing
      const student = await prisma.student.upsert({
        where: { sectionId_rollNo: { sectionId: section.id, rollNo } },
        create: {
          name: names[i],
          rollNo,
          sectionId: section.id,
          gender: i % 2 === 0 ? "Male" : "Female",
          admissionNo: `ADM-2025-${className.replace(/ /g,"-")}-${String(i+1).padStart(2,"0")}`,
          admissionYear: 2025,
          fatherName: `Sh. ${names[i].split(" ")[1] || "Kumar"}`,
          phone: `9876${String(500000 + studentTotal).padStart(6, "0")}`,
        },
        update: {},
      });
      allStudents.push({ id: student.id, sectionId: section.id, classId: cls.id });
      studentTotal++;
    }
  }

  // Also collect existing Class 1 students
  const cls1 = byName("Class 1");
  const cls1Section = cls1?.sections[0];
  if (cls1Section) {
    const existing = await prisma.student.findMany({ where: { sectionId: cls1Section.id } });
    existing.forEach((s) => allStudents.push({ id: s.id, sectionId: cls1Section.id, classId: cls1.id }));
  }

  console.log(`✅ ${studentTotal} more students added (${allStudents.length} total)`);

  // ── 4. Attendance — 25 working days ─────────────────────────────────────────
  const teacher1 = await prisma.user.findUnique({ where: { phone: "9999999997" } });
  const days = workingDays(25);

  // Only do attendance for a few classes to keep it manageable
  const attendanceClasses = ["Class 1","Class 3","Class 5","Class 8"];
  let attCount = 0;

  for (const className of attendanceClasses) {
    const cls = byName(className);
    const section = cls?.sections[0];
    if (!cls || !section || !teacher1) continue;

    const sectionStudents = await prisma.student.findMany({ where: { sectionId: section.id } });

    for (const day of days) {
      const att = await prisma.attendance.upsert({
        where: { date_sectionId: { date: day, sectionId: section.id } },
        create: {
          date: day,
          sectionId: section.id,
          submittedBy: teacher1.id,
          isLocked: true,
        },
        update: {},
      });

      for (const student of sectionStudents) {
        // ~88% present rate
        const status = Math.random() < 0.88 ? "PRESENT" : "ABSENT";
        await prisma.attendanceRecord.upsert({
          where: { attendanceId_studentId: { attendanceId: att.id, studentId: student.id } },
          create: { attendanceId: att.id, studentId: student.id, status },
          update: {},
        });
      }
      attCount++;
    }
  }
  console.log(`✅ ${attCount} attendance sessions created (25 working days, 4 classes)`);

  // ── 5. Marks — Unit Test 1 & Half Yearly ────────────────────────────────────
  const exams = await prisma.exam.findMany();
  const ut1 = exams.find((e) => e.name === "Unit Test 1");
  const hy  = exams.find((e) => e.name === "Half Yearly");

  const marksClasses = ["Class 1","Class 3","Class 5","Class 8"];
  let marksCount = 0;

  for (const className of marksClasses) {
    const cls = byName(className);
    const section = cls?.sections[0];
    if (!cls || !section) continue;

    const subjects = await prisma.subject.findMany({ where: { classId: cls.id } });
    const students = await prisma.student.findMany({ where: { sectionId: section.id } });

    for (const exam of [ut1, hy].filter(Boolean) as typeof exams) {
      const maxM = exam.name === "Unit Test 1" ? 25 : 100;
      for (const student of students) {
        for (const subject of subjects) {
          await prisma.marksEntry.upsert({
            where: { studentId_examId_subjectId: { studentId: student.id, examId: exam.id, subjectId: subject.id } },
            create: {
              studentId: student.id,
              examId: exam.id,
              subjectId: subject.id,
              marks: rnd(Math.floor(maxM * 0.45), maxM),
            },
            update: {},
          });
          marksCount++;
        }
      }
    }
  }
  console.log(`✅ ${marksCount} marks entries created`);

  // ── 6. Fee structures & payments ────────────────────────────────────────────
  const feeClasses = allClasses.slice(3); // Class 1 to 8
  const feeTypes = [
    { type: "Admission Fee",  amount: 500 },
    { type: "Tuition Fee",    amount: 800 },
    { type: "Annual Charges", amount: 1200 },
    { type: "Computer Fee",   amount: 300 },
  ];

  const structures: { id: string; classId: string; amount: number }[] = [];

  for (const cls of feeClasses) {
    for (const ft of feeTypes) {
      const fs = await prisma.feeStructure.upsert({
        where: { classId_feeType_academicYear: { classId: cls.id, feeType: ft.type, academicYear: "2025-26" } },
        create: { classId: cls.id, feeType: ft.type, amount: ft.amount, academicYear: "2025-26" },
        update: {},
      });
      structures.push({ id: fs.id, classId: cls.id, amount: ft.amount });
    }
  }

  // Payments — one per student for tuition fee, spread over last 90 days
  const allActiveStudents = await prisma.student.findMany({ where: { status: "ACTIVE" } });
  let payCount = 0;
  let receiptIdx = 1000;

  for (const student of allActiveStudents) {
    const section = await prisma.section.findUnique({ where: { id: student.sectionId } });
    if (!section) continue;
    const classStructures = structures.filter((s) => s.classId === section.classId);
    if (!classStructures.length) continue;

    const fs = classStructures.find((s) => s.amount === 800); // tuition fee
    if (!fs) continue;

    receiptIdx++;
    const existing = await prisma.feePayment.findFirst({ where: { studentId: student.id } });
    if (existing) continue;

    const daysAgo = rnd(1, 90);
    await prisma.feePayment.create({
      data: {
        studentId: student.id,
        feeStructureId: fs.id,
        amount: 800,
        paymentDate: pastDate(daysAgo),
        mode: pick(["CASH", "CASH", "CASH", "ONLINE"]),
        receiptNo: `RCP-2025-${receiptIdx}`,
      },
    });
    payCount++;
  }
  console.log(`✅ ${payCount} fee payments recorded`);

  // ── 7. Notices ───────────────────────────────────────────────────────────────
  const notices = [
    {
      id: "notice-annual-day",
      title: "Annual Day Celebration — 15 January 2026",
      content: "We are pleased to announce that the Annual Day celebration will be held on 15th January 2026. All students must participate in cultural programs. Dress rehearsal will be conducted on 13th January. Parents are cordially invited.",
      category: "Event",
      isPublished: true,
    },
    {
      id: "notice-exam-schedule",
      title: "Half Yearly Examination Schedule",
      content: "The Half Yearly Examinations will commence from 1st October 2025. Admit cards will be distributed one week before the exams. Students must carry their admit cards to the examination hall. No student will be allowed without proper uniform.",
      category: "Exam",
      isPublished: true,
    },
    {
      id: "notice-fee-reminder",
      title: "Fee Submission Reminder — Last Date 15th July",
      content: "This is to inform all parents that the tuition fee for the month of July must be submitted by 15th July 2025. A late fine of ₹50 per day will be charged after the due date. Kindly cooperate.",
      category: "Fee",
      isPublished: true,
    },
    {
      id: "notice-ptm",
      title: "Parent Teacher Meeting — 20 June 2025",
      content: "A Parent Teacher Meeting (PTM) is scheduled for 20th June 2025 from 9:00 AM to 1:00 PM. All parents are requested to attend. The purpose of the meeting is to discuss the academic progress of the students. Your presence is highly appreciated.",
      category: "General",
      isPublished: true,
    },
    {
      id: "notice-sports-day",
      title: "Annual Sports Day — 5 December 2025",
      content: "Annual Sports Day will be organized on 5th December 2025 at the school ground. Events include 100m race, relay race, tug of war, and various field events. Students interested in participating should register with their class teacher by 25th November.",
      category: "Event",
      isPublished: true,
    },
    {
      id: "notice-holiday",
      title: "School Holiday Notice — Diwali Break",
      content: "The school will remain closed from 20th October to 25th October 2025 on account of Diwali vacation. School will reopen on 26th October 2025. Wishing all students and their families a very Happy Diwali!",
      category: "Holiday",
      isPublished: true,
    },
    {
      id: "notice-admission-open",
      title: "Admissions Open for Session 2026-27",
      content: "Admissions for the academic session 2026-27 are now open for classes Play to Class 8. Interested parents may contact the school office between 9 AM to 2 PM on working days. Limited seats available. Early admission is encouraged.",
      category: "Admission",
      isPublished: true,
    },
  ];

  for (const n of notices) {
    await prisma.notice.upsert({
      where: { id: n.id },
      create: { ...n, publishedAt: new Date(), createdAt: pastDate(rnd(5, 60)), updatedAt: new Date() },
      update: {},
    });
  }
  console.log(`✅ ${notices.length} notices added`);

  // ── 8. Gallery albums ────────────────────────────────────────────────────────
  const albums = [
    {
      id: "album-annual-day",
      title: "Annual Day 2025",
      description: "Highlights from our Annual Day celebration",
      coverUrl: "https://images.unsplash.com/photo-1544531585-9847b68c8c86?w=600",
      images: [
        { url: "https://images.unsplash.com/photo-1544531585-9847b68c8c86?w=800", caption: "Opening ceremony" },
        { url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800", caption: "Cultural performance" },
        { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800", caption: "Prize distribution" },
      ],
    },
    {
      id: "album-sports-day",
      title: "Sports Day 2025",
      description: "Annual Sports Day events and celebrations",
      coverUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600",
      images: [
        { url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800", caption: "100m race" },
        { url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800", caption: "Relay race" },
        { url: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800", caption: "Prize ceremony" },
      ],
    },
    {
      id: "album-classroom",
      title: "Classroom Activities",
      description: "Day to day learning activities",
      coverUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600",
      images: [
        { url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800", caption: "Science activity" },
        { url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800", caption: "Math class" },
        { url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800", caption: "Reading session" },
      ],
    },
  ];

  for (const album of albums) {
    const a = await prisma.galleryAlbum.upsert({
      where: { id: album.id },
      create: { id: album.id, title: album.title, description: album.description, coverUrl: album.coverUrl },
      update: {},
    });
    for (let i = 0; i < album.images.length; i++) {
      const img = album.images[i];
      const existing = await prisma.gallery.findFirst({ where: { albumId: a.id, imageUrl: img.url } });
      if (!existing) {
        await prisma.gallery.create({ data: { albumId: a.id, imageUrl: img.url, caption: img.caption, order: i } });
      }
    }
  }
  console.log(`✅ ${albums.length} gallery albums with images added`);

  // ── 9. School settings ───────────────────────────────────────────────────────
  const settings = [
    { key: "schoolName",     value: "S.D.M. Academy Shaulana" },
    { key: "academicYear",   value: "2025-26" },
    { key: "principalName",  value: "Ms. Mansi Sharma" },
    { key: "phone",          value: "9876543210" },
    { key: "email",          value: "sdmacademyshaulana@gmail.com" },
    { key: "address",        value: "Shaulana, Dhaulana, Hapur, Uttar Pradesh - 245101" },
    { key: "affiliation",    value: "UP Board (Uttar Pradesh Madhyamik Shiksha Parishad)" },
    { key: "established",    value: "2006" },
  ];
  for (const s of settings) {
    await prisma.schoolSettings.upsert({ where: { key: s.key }, create: s, update: { value: s.value } });
  }
  console.log("✅ School settings updated");

  console.log("\n🎉 Demo data ready! Summary:");
  const totalStudents = await prisma.student.count();
  const totalTeachers = await prisma.user.count({ where: { role: "TEACHER" } });
  const totalAttendance = await prisma.attendance.count();
  const totalMarks = await prisma.marksEntry.count();
  const totalFees = await prisma.feePayment.count();
  const totalNotices = await prisma.notice.count();
  console.log(`  Students:   ${totalStudents}`);
  console.log(`  Teachers:   ${totalTeachers}`);
  console.log(`  Attendance: ${totalAttendance} sessions`);
  console.log(`  Marks:      ${totalMarks} entries`);
  console.log(`  Payments:   ${totalFees}`);
  console.log(`  Notices:    ${totalNotices}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
