const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// fetch() only rejects on network failure — 4xx/5xx responses resolve normally,
// so every write call site needs this check or errors get silently swallowed.
async function sendJson(
  method: "POST" | "PUT",
  path: string,
  body: unknown
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
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

export function postJson(path: string, body: unknown) {
  return sendJson("POST", path, body);
}

export function putJson(path: string, body: unknown) {
  return sendJson("PUT", path, body);
}
