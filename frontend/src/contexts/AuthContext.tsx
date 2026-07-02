"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/auth";
import { getUserFromCookie, clearAuthCookies, setAuthCookies, getMe, logoutFromApi } from "@/lib/auth.client";

interface AuthContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Optimistic paint from the readable cookie set at login time.
    setUser(getUserFromCookie());

    // Authoritative refresh — validates the session JWT server-side and
    // picks up any profile changes, unlike the client-readable cookie.
    getMe().then((result) => {
      if (result.ok) {
        setUser(result.user);
      } else {
        clearAuthCookies();
        setUser(null);
      }
    });
  }, []);

  const login = (u: User) => {
    setAuthCookies(u);
    setUser(u);
  };

  const logout = async () => {
    await logoutFromApi();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
