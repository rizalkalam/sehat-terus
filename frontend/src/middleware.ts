import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
// Peran yang belum punya halaman dashboard sendiri — sementara diarahkan ke Swagger UI backend
const SWAGGER_ONLY_ROLES = ["apoteker", "staf_logistik"];

function getPeran(userCookie: string | undefined): string | null {
  try {
    const user = JSON.parse(decodeURIComponent(userCookie || "{}"));
    return user?.peran ?? null;
  } catch {
    return null;
  }
}

function landingPathFor(peran: string | null): string {
  if (peran === "admin") return "/admin";
  if (peran && SWAGGER_ONLY_ROLES.includes(peran)) return `${API_BASE}/api/docs`;
  return "/";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAuthed = request.cookies.has("st_auth");
  const userCookie = request.cookies.get("st_user")?.value;
  const peran = isAuthed ? getPeran(userCookie) : null;
  const isAdmin = peran === "admin";
  const isSwaggerOnly = peran !== null && SWAGGER_ONLY_ROLES.includes(peran);

  // Unauthenticated → redirect to login, carry original destination
  if (!isPublic && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Already authenticated → don't show login/register again, kirim ke halaman sesuai peran
  if (isPublic && isAuthed) {
    const target = landingPathFor(peran);
    if (target.startsWith("http")) {
      return NextResponse.redirect(target);
    }
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.searchParams.delete("from");
    return NextResponse.redirect(url);
  }

  // Apoteker & staf_logistik belum punya halaman FE — semua route internal diarahkan ke Swagger UI
  if (isSwaggerOnly) {
    return NextResponse.redirect(`${API_BASE}/api/docs`);
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
