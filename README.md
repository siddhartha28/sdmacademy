# S.D.M. Academy Shaulana — School Management System

A full-stack school ERP and public website for **S.D.M. Academy Shaulana**, built with Next.js 16, Prisma, and Tailwind CSS v4. The system serves as both a public-facing school website and a comprehensive internal management platform for all stakeholders.

---

## Overview

The platform is split into two parts:

- **Public Website** — accessible to anyone, presenting the school's information, notices, gallery, and admissions details.
- **ERP Dashboard** — a role-based internal portal for managing every aspect of the school's day-to-day operations.

---

## Public Website

The public website includes the following sections:

- **Home** — school introduction, principal's message, highlights, and recent announcements
- **About** — school history, vision, mission, and values
- **Academics** — curriculum overview and programmes offered
- **Facilities** — infrastructure, labs, library, sports, and other amenities
- **Faculty** — teacher profiles and department information
- **Admissions** — admission process, eligibility, and contact details
- **Notices** — publicly published circulars and notices from the school
- **Contact** — address, phone, email, and location map

---

## ERP Roles & Portals

### Principal
The principal has the highest academic authority with a monitoring and approval-focused portal.

- School-wide dashboard with attendance, fee, and performance summaries
- Academic oversight — lesson plans, homework completion rates, syllabus progress
- Staff management — view teacher profiles, assignments, attendance, and leave status
- Student management — view all student profiles, academic progress, and conduct history
- Approvals centre — teacher leaves, fee waivers, lesson plan reviews, TC requests
- Attendance monitoring — school-wide daily attendance with alerts for unmarked sections
- Results and performance — class-wise and subject-wise result summaries
- Fee oversight — collection status, defaulter overview, waiver approvals
- Communication — send school-wide announcements and notices
- Events and calendar — add school events and holidays
- Reports — generate and export school-wide reports as CSV

### Admin
The admin manages school operations, records, and all public-facing content.

- **User Management** — create, edit, and deactivate user accounts (teachers, admin, accounts staff)
- **Student Records** — admissions, profile management, class assignment, bulk Excel import
- **Staff Records** — teacher and staff profiles, designations, and joining records
- **Classes & Sections** — create and manage classes and sections
- **Subjects** — manage subjects and map them to classes
- **Teacher Assignments** — assign teachers to classes and subjects (drives teacher portal permissions)
- **Attendance** — view attendance reports (read-only)
- **Library** — book catalog, issue and return tracking, overdue management
- **Complaints** — log, assign, and track resolution of parent and student complaints
- **Notices & Circulars** — manage internal and public-facing notices with a publish toggle
- **Gallery & Media** — upload and organise school photos by event
- **Events & Calendar** — create school events, publish them to the website
- **Settings** — school name, academic year, and system configuration

> Admin does not have access to fee collection, payroll, student marks, or leave approvals.

### Accounts
The accounts role manages all financial operations of the school.

- **Fee Collection** — record cash and online fee payments with digital receipts
- **Fee Structures** — define and manage fee heads (tuition, transport, activity, etc.)
- **Expenses** — record and categorise school expenses with vendor and invoice details
- **Payroll** — manage monthly salary records for all staff, mark payments, export slips
- **Fee Waivers** — raise waiver and concession requests (routed to principal for approval)
- **Financial Reports** — generate and export fee collection, expense, payroll, and waiver reports

> Accounts does not have access to student academic records, teacher data, or system configuration.

### Teacher
Each teacher's portal is scoped to their assigned classes and subjects.

- **Attendance** — mark daily student attendance (present, absent, leave) with avatar thumbnails
- **Marks Entry** — enter exam marks for assigned subjects
- **Homework** — assign and track homework for each class and subject
- **Lesson Plans** — create and manage lesson plans with status tracking (Planned, Completed, Skipped)
- **Announcements** — post class-specific or school-wide announcements
- **Student Remarks** — add behavioural and conduct remarks (class teachers only)
- **Study Material** — share links and resources with students
- **PTM Slots** — create and manage parent-teacher meeting slots (class teachers only)
- **Leave Application** — apply for leave and track approval status
- **My Students** — view the full list of students in assigned classes with contact details

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.7 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| ORM | Prisma v7 with `@prisma/adapter-libsql` |
| Database (local) | SQLite |
| Database (production) | Turso (LibSQL cloud) |
| Authentication | Custom JWT via `jose` (HTTP-only cookies) |
| Charts | Recharts |
| Notifications | Sonner |
| Icons | Lucide React |
| Hosting | Vercel |

---

## Database Models

The system uses the following primary data models:

**Core** — `User`, `AcademicYear`, `Class`, `Section`, `Student`, `Subject`

**Academic** — `TeacherAssignment`, `Attendance`, `AttendanceRecord`, `Exam`, `MarksEntry`

**Teacher Portal** — `Homework`, `HomeworkSubmission`, `LessonPlan`, `Announcement`, `BehaviourRemark`, `TeacherLeave`, `StudyMaterial`, `PTMSlot`

**Finance** — `FeeStructure`, `FeePayment`, `Expense`, `SalaryRecord`, `FeeWaiver`

**Operations** — `LibraryBook`, `LibraryIssue`, `Complaint`, `BusRoute`

**Content** — `Notice`, `GalleryAlbum`, `Gallery`, `Circular`, `SchoolEvent`, `SchoolSettings`

---

## Local Development

```bash
# Clone and install dependencies
git clone https://github.com/siddhartha28/sdmacademy.git
cd sdmacademy
npm install

# Set up environment variables
cp .env.example .env

# Push schema to local SQLite and seed demo data
npm run db:push
npm run db:seed

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Deployment

The project is designed to deploy on **Vercel** with **Turso** as the production database.

1. Create a free database at [turso.tech](https://turso.tech)
2. Set the following environment variables in your Vercel project:
   - `DATABASE_URL` — your Turso database URL (`libsql://...`)
   - `TURSO_AUTH_TOKEN` — your Turso auth token
   - `JWT_SECRET` — a strong random secret string
3. Push schema to Turso before first deploy: `npm run db:migrate`
4. Deploy via Vercel — the build command `prisma generate && next build` runs automatically

---

## Project Structure

```
src/
├── app/
│   ├── (public)/          # Public website pages
│   ├── dashboard/
│   │   ├── admin/         # Admin portal pages
│   │   ├── accounts/      # Accounts portal pages
│   │   ├── principal/     # Principal portal pages
│   │   └── teacher/       # Teacher portal pages
│   └── api/               # API routes
├── components/
│   ├── layout/            # Sidebar, header, dashboard shell
│   └── ui/                # Reusable UI components
├── lib/                   # Auth, Prisma client, utilities
└── proxy.ts               # Next.js middleware (routing + auth guard)
prisma/
├── schema.prisma          # Database schema
├── turso-migrate.ts       # Production schema migration script
└── demo-seed.ts           # Demo data seeder
```
