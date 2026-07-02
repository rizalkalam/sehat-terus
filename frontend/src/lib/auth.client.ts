import type { User } from "./auth";
import { AUTH_COOKIE, USER_COOKIE } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 hari (detik)

// ── API Auth ──────────────────────────────────────────────────────────────────

export async function loginWithApi(
  email: string,
  password: string
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // kirim & terima cookie lintas origin
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error || "Login gagal." };
    }

    // Backend sudah setel st_auth (HttpOnly) & st_user (readable).
    // Kembalikan user untuk keperluan redirect/state langsung.
    return {
      ok: true,
      user: {
        email: data.user.email,
        name: data.user.nama,
        displayName: data.user.nama,
      },
    };
  } catch {
    return { ok: false, error: "Tidak dapat terhubung ke server." };
  }
}

export async function getMe(): Promise<{ ok: true; user: User } | { ok: false }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return { ok: false };

    const data = await res.json();
    return {
      ok: true,
      user: {
        email: data.user.email,
        name: data.user.nama,
        displayName: data.user.nama,
      },
    };
  } catch {
    return { ok: false };
  }
}

export async function logoutFromApi(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // best-effort — lanjut hapus cookie lokal
  }
  clearAuthCookies();
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function setAuthCookies(user: User): void {
  const opts = `path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  document.cookie = `${AUTH_COOKIE}=1; ${opts}`;
  document.cookie = `${USER_COOKIE}=${encodeURIComponent(JSON.stringify(user))}; ${opts}`;
}

export function clearAuthCookies(): void {
  document.cookie = `${AUTH_COOKIE}=; max-age=0; path=/`;
  document.cookie = `${USER_COOKIE}=; max-age=0; path=/`;
}

export function getUserFromCookie(): User | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((r) => r.startsWith(`${USER_COOKIE}=`));
  if (!match) return null;
  try {
    const raw = match.split("=").slice(1).join("=");
    return JSON.parse(decodeURIComponent(raw)) as User;
  } catch {
    return null;
  }
}

export function registerUser(data: Record<string, string>): { ok: false; error: string } {
  console.log("Attempted registration for email:", data.email);
  return {
    ok: false,
    error: "Pendaftaran mandiri dinonaktifkan. Silakan hubungi Administrator untuk pembuatan akun.",
  };
}
