const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// fetch() only rejects on network failure — 4xx/5xx responses resolve normally,
// so every POST call site needs this check or errors get silently swallowed.
export async function postJson(path: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || `Gagal (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Tidak dapat terhubung ke server." };
  }
}
