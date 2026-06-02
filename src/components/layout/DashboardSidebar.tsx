"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, BookOpen,
  DollarSign, Bell, Image, LogOut, UserCheck,
  BarChart3, X, FileText, Calendar, MessageSquare,
  FolderOpen, BookMarked, CalendarClock, Award,
  CheckSquare, TrendingUp, GraduationCap, Settings,
  FileBarChart, ShieldCheck, AlertCircle,
} from "lucide-react";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

interface SidebarProps {
  user: SessionUser;
  onClose?: () => void;
}

function NavItem({ href, icon: Icon, label, active, onClick, badge }: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active: boolean;
  onClick?: () => void;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-primary-500 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <Icon size={18} className="flex-shrink-0" />
      <span className="flex-1 min-w-0 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <p className="px-2 pt-2 pb-0.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>;
}

function Divider() {
  return <div className="my-1 border-t border-gray-100" />;
}

export default function DashboardSidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";
  const isPrincipal = user.role === "PRINCIPAL";
  const isTeacher = user.role === "TEACHER";

  const active = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  // ─── PRINCIPAL NAV ────────────────────────────────────────────────────────
  const principalNav = [
    {
      label: "Overview",
      links: [
        { href: "/dashboard/principal", label: "Dashboard", icon: LayoutDashboard, exact: true },
      ],
    },
    {
      label: "Academic",
      links: [
        { href: "/dashboard/principal/attendance", label: "Attendance Overview", icon: ClipboardList },
        { href: "/dashboard/principal/academics", label: "Academic Oversight", icon: BookMarked },
        { href: "/dashboard/principal/results", label: "Results & Performance", icon: TrendingUp },
      ],
    },
    {
      label: "Management",
      links: [
        { href: "/dashboard/principal/students", label: "Students", icon: GraduationCap },
        { href: "/dashboard/principal/teachers", label: "Staff & Teachers", icon: UserCheck },
      ],
    },
    {
      label: "Administration",
      links: [
        { href: "/dashboard/principal/approvals", label: "Approvals Center", icon: CheckSquare },
        { href: "/dashboard/principal/fees", label: "Fee Management", icon: DollarSign },
        { href: "/dashboard/principal/communication", label: "Communication", icon: MessageSquare },
        { href: "/dashboard/principal/events", label: "Events & Calendar", icon: Calendar },
      ],
    },
    {
      label: "Analytics",
      links: [
        { href: "/dashboard/principal/reports", label: "Reports & Export", icon: FileBarChart },
      ],
    },
  ];

  // ─── ADMIN NAV ────────────────────────────────────────────────────────────
  const adminNav = [
    {
      label: "Management",
      links: [
        { href: "/dashboard/admin/students", label: "Students", icon: Users },
        { href: "/dashboard/admin/teachers", label: "Teachers", icon: UserCheck },
        { href: "/dashboard/admin/assignments", label: "Teacher Assignments", icon: Award },
        { href: "/dashboard/admin/attendance", label: "Attendance", icon: ClipboardList },
        { href: "/dashboard/admin/marks", label: "Marks & Results", icon: BookOpen },
        { href: "/dashboard/admin/fees", label: "Fee Management", icon: DollarSign },
      ],
    },
    {
      label: "Content",
      links: [
        { href: "/dashboard/admin/notices", label: "Notices", icon: Bell },
        { href: "/dashboard/admin/gallery", label: "Gallery & Media", icon: Image },
      ],
    },
    {
      label: "Admin",
      links: [
        { href: "/dashboard/admin/leave", label: "Leave Approvals", icon: CalendarClock },
        { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  // ─── TEACHER NAV ─────────────────────────────────────────────────────────
  const teacherNav = [
    {
      label: "Teacher Portal",
      links: [
        { href: "/dashboard/teacher", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/teacher/students", label: "My Students", icon: Users },
        { href: "/dashboard/teacher/attendance", label: "Attendance", icon: ClipboardList },
        { href: "/dashboard/teacher/marks", label: "Marks Entry", icon: BookOpen },
        { href: "/dashboard/teacher/homework", label: "Homework", icon: FileText },
        { href: "/dashboard/teacher/lesson-plans", label: "Lesson Plans", icon: BookMarked },
        { href: "/dashboard/teacher/announcements", label: "Announcements", icon: MessageSquare },
        { href: "/dashboard/teacher/remarks", label: "Student Remarks", icon: Award },
        { href: "/dashboard/teacher/documents", label: "Study Material", icon: FolderOpen },
        { href: "/dashboard/teacher/ptm", label: "PTM Slots", icon: Calendar },
        { href: "/dashboard/teacher/leave", label: "Leave Application", icon: CalendarClock },
      ],
    },
  ];

  const nav = isPrincipal ? principalNav : isAdmin ? adminNav : teacherNav;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const roleColors: Record<string, string> = {
    PRINCIPAL: "text-amber-600 bg-amber-50",
    ADMIN: "text-primary-600 bg-primary-50",
    TEACHER: "text-green-600 bg-green-50",
  };
  const roleIcons: Record<string, React.ReactNode> = {
    PRINCIPAL: <ShieldCheck size={12} />,
    ADMIN: <AlertCircle size={12} />,
    TEACHER: <GraduationCap size={12} />,
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <NextImage src="/logo.png" alt="SDM Academy" width={36} height={36} className="rounded-full flex-shrink-0" />
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">SDM Academy</div>
            <div className="text-xs text-gray-400">ERP Portal</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* User badge */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${roleColors[user.role] ?? "text-gray-500"}`}>
          {roleIcons[user.role]}
          {user.role}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {nav.map((section, si) => (
          <div key={si}>
            {si > 0 && <Divider />}
            <SectionLabel label={section.label} />
            {section.links.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                active={"exact" in link && link.exact ? active(link.href, true) : active(link.href)}
                onClick={onClose}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );
}
