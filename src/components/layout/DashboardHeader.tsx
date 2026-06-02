"use client";

import { Menu, Bell } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

interface DashboardHeaderProps {
  user: SessionUser;
  title?: string;
  onMenuClick: () => void;
}

export default function DashboardHeader({ user, title, onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu size={20} />
        </button>
        {title && <h1 className="text-base font-semibold text-gray-900">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold">
            {getInitials(user.name)}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-900 leading-tight">{user.name}</div>
            <div className="text-xs text-gray-400 leading-tight">{user.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
