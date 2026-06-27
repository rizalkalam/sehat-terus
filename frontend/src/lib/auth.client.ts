import type { User } from "./auth";
import { STATIC_USERS, AUTH_COOKIE, USER_COOKIE } from "./auth";

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

// ── Validation ──────────────────────────────────────────────────────────────

export function validateCredentials(email: string, password: string): User | null {
  const found = STATIC_USERS.find(
    (u) => u.email === email && u.password === password
  );
  if (found) {
    return {
      email: found.email,
      name: found.name,
      displayName: found.displayName,
      avatarSrc: found.avatarSrc,
    };
  }

  try {
    const raw = sessionStorage.getItem("st_registered");
    if (raw) {
      const users: (User & { password: string })[] = JSON.parse(raw);
      const reg = users.find(
        (u) => u.email === email && u.password === password
      );
      if (reg) {
        return {
          email: reg.email,
          name: reg.name,
          displayName: reg.displayName,
          avatarSrc: reg.avatarSrc,
        };
      }
    }
  } catch {
    // sessionStorage unavailable — skip
  }

  return null;
}

// ── Registration ─────────────────────────────────────────────────────────────

export function registerUser(data: {
  email: string;
  password: string;
  name: string;
  displayName: string;
}): { ok: boolean; error?: string } {
  if (STATIC_USERS.some((u) => u.email === data.email)) {
    return { ok: false, error: "Email sudah terdaftar." };
  }

  try {
    const raw = sessionStorage.getItem("st_registered") ?? "[]";
    const users: (User & { password: string })[] = JSON.parse(raw);
    if (users.some((u) => u.email === data.email)) {
      return { ok: false, error: "Email sudah terdaftar." };
    }
    users.push({ ...data, avatarSrc: undefined });
    sessionStorage.setItem("st_registered", JSON.stringify(users));
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menyimpan data. Coba lagi." };
  }
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
