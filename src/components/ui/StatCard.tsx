import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  color?: "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const colorMap = {
  primary: {
    icon: "bg-primary-100 text-primary-600",
    value: "text-primary-700",
  },
  success: {
    icon: "bg-emerald-100 text-emerald-600",
    value: "text-emerald-700",
  },
  warning: {
    icon: "bg-amber-100 text-amber-600",
    value: "text-amber-700",
  },
  danger: {
    icon: "bg-red-100 text-red-600",
    value: "text-red-700",
  },
  info: {
    icon: "bg-blue-100 text-blue-600",
    value: "text-blue-700",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "primary",
  className,
}: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm p-5", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={cn("text-2xl font-bold mt-1", colors.value)}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn("p-2.5 rounded-lg", colors.icon)}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
