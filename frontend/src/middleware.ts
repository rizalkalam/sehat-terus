import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAuthed = request.cookies.has("st_auth");
  const userCookie = request.cookies.get("st_user")?.value;

  // Unauthenticated → redirect to login
  if (!isPublic && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Already authenticated → don't show login again
  if (isPublic && isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("from");
    return NextResponse.redirect(url);
  }

  // Admin guard — /admin/* hanya untuk admin
  if (pathname.startsWith("/admin")) {
    try {
      const raw = userCookie || "{}";
      const decoded = decodeURIComponent(raw);
      const user = JSON.parse(decoded);
    if (user?.peran !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
}

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};