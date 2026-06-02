/**
 * Pushes the full schema to Turso by executing raw CREATE TABLE statements
 * via the @libsql/client HTTP connection.
 */
import { createClient } from "@libsql/client";
import "dotenv/config";

const url = process.env.DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;

if (!url || !authToken) {
  console.error("❌ DATABASE_URL and TURSO_AUTH_TOKEN must be set");
  process.exit(1);
}

const db = createClient({ url, authToken });

const newTables = `
CREATE TABLE IF NOT EXISTS "TeacherAssignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "teacherId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "subjectId" TEXT,
  "isClassTeacher" BOOLEAN NOT NULL DEFAULT false,
  "academicYear" TEXT NOT NULL DEFAULT '2025-26',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TeacherAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TeacherAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE ("teacherId", "classId", "subjectId", "academicYear")
);

CREATE TABLE IF NOT EXISTS "BehaviourRemark" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "remark" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'GENERAL',
  "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BehaviourRemark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "BehaviourRemark_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Homework" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "classId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "dueDate" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Homework_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Homework_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Homework_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "HomeworkSubmission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "homeworkId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "marks" REAL,
  "remarks" TEXT,
  "submittedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HomeworkSubmission_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HomeworkSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE ("homeworkId", "studentId")
);

CREATE TABLE IF NOT EXISTS "LessonPlan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "teacherId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "description" TEXT,
  "date" DATETIME NOT NULL,
  "duration" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonPlan_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LessonPlan_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LessonPlan_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Announcement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'CLASS',
  "classId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Announcement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TeacherLeave" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "teacherId" TEXT NOT NULL,
  "fromDate" DATETIME NOT NULL,
  "toDate" DATETIME NOT NULL,
  "reason" TEXT NOT NULL,
  "leaveType" TEXT NOT NULL DEFAULT 'CASUAL',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "substituteId" TEXT,
  "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedBy" TEXT,
  "reviewedAt" DATETIME,
  "remarks" TEXT,
  CONSTRAINT "TeacherLeave_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TeacherLeave_substituteId_fkey" FOREIGN KEY ("substituteId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "StudyMaterial" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "fileUrl" TEXT NOT NULL,
  "classId" TEXT,
  "subjectId" TEXT,
  "teacherId" TEXT NOT NULL,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudyMaterial_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StudyMaterial_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PTMSlot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "classId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "startTime" TEXT NOT NULL,
  "duration" INTEGER NOT NULL DEFAULT 15,
  "parentName" TEXT,
  "studentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PTMSlot_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PTMSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PTMSlot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
`.trim();

const statements = `
CREATE TABLE IF NOT EXISTS "AcademicYear" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "label" TEXT NOT NULL UNIQUE,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME NOT NULL,
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Class" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "order" INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL UNIQUE,
  "email" TEXT,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'TEACHER',
  "classId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "User_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Section" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE ("classId", "name")
);

CREATE TABLE IF NOT EXISTS "Student" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "rollNo" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dateOfBirth" DATETIME,
  "gender" TEXT,
  "fatherName" TEXT,
  "motherName" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "photoUrl" TEXT,
  "admissionNo" TEXT UNIQUE,
  "admissionYear" INTEGER NOT NULL DEFAULT 2024,
  "sectionId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE ("sectionId", "rollNo")
);

CREATE TABLE IF NOT EXISTS "Attendance" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "submittedBy" TEXT NOT NULL,
  "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "Attendance_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Attendance_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE ("date", "sectionId")
);

CREATE TABLE IF NOT EXISTS "AttendanceRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "attendanceId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PRESENT',
  CONSTRAINT "AttendanceRecord_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE ("attendanceId", "studentId")
);

CREATE TABLE IF NOT EXISTS "Subject" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "maxMarks" INTEGER NOT NULL DEFAULT 100,
  "classId" TEXT
);

CREATE TABLE IF NOT EXISTS "Exam" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "classId" TEXT,
  "year" INTEGER NOT NULL,
  "startDate" DATETIME,
  "endDate" DATETIME,
  CONSTRAINT "Exam_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MarksEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "marks" REAL,
  "isAbsent" BOOLEAN NOT NULL DEFAULT false,
  "remarks" TEXT,
  CONSTRAINT "MarksEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarksEntry_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarksEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE ("studentId", "examId", "subjectId")
);

CREATE TABLE IF NOT EXISTS "FeeStructure" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "classId" TEXT NOT NULL,
  "feeType" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "dueDate" DATETIME,
  "academicYear" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeeStructure_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE ("classId", "feeType", "academicYear")
);

CREATE TABLE IF NOT EXISTS "FeePayment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "feeStructureId" TEXT,
  "amount" REAL NOT NULL,
  "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "mode" TEXT NOT NULL DEFAULT 'CASH',
  "receiptNo" TEXT NOT NULL UNIQUE,
  "remarks" TEXT,
  "isWaived" BOOLEAN NOT NULL DEFAULT false,
  "lateFine" REAL NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeePayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "FeePayment_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Notice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "GalleryAlbum" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "coverUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Gallery" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "albumId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "caption" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Gallery_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "GalleryAlbum" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Circular" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SchoolEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" DATETIME NOT NULL,
  "endDate" DATETIME,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SchoolSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "checksum" TEXT NOT NULL,
  "finished_at" DATETIME,
  "migration_name" TEXT NOT NULL,
  "logs" TEXT,
  "rolled_back_at" DATETIME,
  "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
`.trim();

async function main() {
  console.log("🔧 Pushing schema to Turso...");
  console.log(`   URL: ${url.substring(0, 40)}...`);

  // First push new tables only
  console.log("\n📦 Adding new teacher portal tables...");
  const newSqls = newTables.split(";\n\n").map((s) => s.trim()).filter(Boolean);
  for (const sql of newSqls) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1] ?? "?";
    try {
      await db.execute(sql);
      console.log(`  ✅ ${tableName}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already exists")) {
        console.log(`  ⏭  ${tableName} (already exists)`);
      } else {
        console.log(`  ❌ ${tableName}: ${msg}`);
      }
    }
  }

  console.log("\n📦 Ensuring base tables...");
  const sqls = statements.split(";\n\n").map((s) => s.trim()).filter(Boolean);

  let ok = 0;
  for (const sql of sqls) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1] ?? "?";
    try {
      await db.execute(sql);
      console.log(`  ✅ ${tableName}`);
      ok++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already exists")) {
        console.log(`  ⏭  ${tableName} (already exists)`);
      } else {
        console.log(`  ❌ ${tableName}: ${msg}`);
      }
    }
  }

  console.log(`\n✅ Done — ${ok}/${sqls.length} tables created`);

  // Verify
  const res = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log(`📊 Tables in Turso: ${res.rows.map((r) => r.name).join(", ")}`);
}

main()
  .catch(console.error)
  .finally(() => db.close());
