import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

function getPeran(userCookie: string | undefined): string | null {
  try {
    const user = JSON.parse(decodeURIComponent(userCookie || "{}"));
    return user?.peran ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAuthed = request.cookies.has("st_auth");
  const userCookie = request.cookies.get("st_user")?.value;
  const isAdmin = isAuthed && getPeran(userCookie) === "admin";

  // Unauthenticated → redirect to login, carry original destination
  if (!isPublic && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Already authenticated → don't show login/register again
  if (isPublic && isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = isAdmin ? "/admin" : "/";
    url.searchParams.delete("from");
    return NextResponse.redirect(url);
  }

  // Admin dibatasi cuma ke /admin/* — semua halaman MIS diblokir, dialihkan ke /admin
  if (isAdmin && !pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // Non-admin dilarang ke /admin/*
  if (!isAdmin && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
