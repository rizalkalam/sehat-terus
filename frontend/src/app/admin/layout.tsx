import type { ReactNode } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex w-full h-full overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
      </div>
    </AuthProvider>
  );
}
