import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardIndex() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "TEACHER") redirect("/dashboard/teacher/attendance");
  if (user.role === "PRINCIPAL") redirect("/dashboard/principal");
  redirect("/dashboard/admin/students");
}
