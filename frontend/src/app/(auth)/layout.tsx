import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto flex items-center justify-center p-6">
      {children}
    </div>
  );
}
