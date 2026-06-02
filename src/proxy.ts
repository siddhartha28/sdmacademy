import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/about", "/academics", "/facilities", "/admissions", "/faculty", "/notices", "/contact", "/login"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files and public paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.next();
  }

  // Protect /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const user = await getSessionFromRequest(req);
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Teachers can only access their own routes
    if (user.role === "TEACHER" && pathname.startsWith("/dashboard/admin")) {
      return NextResponse.redirect(new URL("/dashboard/teacher", req.url));
    }

    // Non-principals cannot access principal routes
    if (pathname.startsWith("/dashboard/principal") && user.role !== "PRINCIPAL") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Block principal from admin settings, marks entry, bulk import (view-only role)
    const principalBlockedPaths = [
      "/dashboard/admin/settings",
      "/dashboard/admin/bulk-import",
    ];
    if (user.role === "PRINCIPAL" && principalBlockedPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/dashboard/principal", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
