"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, BookOpen,
  DollarSign, Bell, Image, Settings, LogOut, UserCheck,
  BarChart3, X, FileText, Calendar, MessageSquare,
  FolderOpen, BookMarked, CalendarClock, Award,
} from "lucide-react";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

interface SidebarProps {
  user: SessionUser;
  onClose?: () => void;
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active: boolean;
  onClick?: () => void;
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
      <Icon size={18} />
      {label}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-2 pt-1 pb-0.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
  );
}

function Divider() {
  return <div className="my-1.5 border-t border-gray-100" />;
}

export default function DashboardSidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN" || user.role === "PRINCIPAL";
  const isPrincipal = user.role === "PRINCIPAL";
  const isTeacher = user.role === "TEACHER";

  const active = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const adminLinks = [
    { href: "/dashboard/admin/students", label: "Students", icon: Users },
    { href: "/dashboard/admin/teachers", label: "Teachers", icon: UserCheck },
    { href: "/dashboard/admin/assignments", label: "Teacher Assignments", icon: Award },
    { href: "/dashboard/admin/attendance", label: "Attendance", icon: ClipboardList },
    { href: "/dashboard/admin/fees", label: "Fee Management", icon: DollarSign },
    { href: "/dashboard/admin/notices", label: "Notices", icon: Bell },
    { href: "/dashboard/admin/gallery", label: "Gallery & Media", icon: Image },
    { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  ];

  const principalOnlyLinks = [
    { href: "/dashboard/admin/marks", label: "Marks & Results", icon: BookOpen },
    { href: "/dashboard/admin/leave", label: "Leave Approvals", icon: CalendarClock },
  ];

  const principalLinks = [
    { href: "/dashboard/principal", label: "Analytics", icon: BarChart3 },
  ];

  const teacherLinks = [
    { href: "/dashboard/teacher", label: "Dashboard", icon: LayoutDashboard },
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
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
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

      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
        <div className="text-xs text-primary-600 font-medium">{user.role}</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {isPrincipal && (
          <>
            <SectionLabel label="Analytics" />
            {principalLinks.map((link) => (
              <NavItem key={link.href} {...link} active={active(link.href, true)} onClick={onClose} />
            ))}
            <Divider />
            <SectionLabel label="Management" />
          </>
        )}

        {isAdmin && adminLinks.map((link) => (
          <NavItem key={link.href} {...link} active={active(link.href)} onClick={onClose} />
        ))}

        {isPrincipal && (
          <>
            <Divider />
            <SectionLabel label="Academics" />
            {principalOnlyLinks.map((link) => (
              <NavItem key={link.href} {...link} active={active(link.href)} onClick={onClose} />
            ))}
          </>
        )}

        {isTeacher && (
          <>
            <SectionLabel label="Teacher Portal" />
            {teacherLinks.map((link) => (
              <NavItem
                key={link.href}
                {...link}
                active={link.href === "/dashboard/teacher" ? active(link.href, true) : active(link.href)}
                onClick={onClose}
              />
            ))}
          </>
        )}
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
