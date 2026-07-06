"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, AlertTriangle, Package, Settings, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFromCookie } from "@/lib/auth.client";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = getUserFromCookie();
    setIsAdmin(user?.peran === "admin");
  }, []);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      iconSize: "size-[30px]",
    },
    {
      name: "Trend",
      path: "/proyeksi-tren",
      icon: TrendingUp,
      iconSize: "size-[24px]",
    },
    {
      name: "Early Warning",
      path: "/peringatan-dini",
      icon: AlertTriangle,
      iconSize: "size-[25px]",
    },
    {
      name: "Logistic",
      path: "/logistik",
      icon: Package,
      iconSize: "size-[25px]",
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      iconSize: "size-[25px]",
    },
    ...(isAdmin
      ? [
          {
            name: "Admin Panel",
            path: "/admin",
            icon: ShieldCheck,
            iconSize: "size-[25px]",
          },
        ]
      : []),
  ];

  return (
    <aside className="relative w-[349px] h-screen bg-gradient-to-b from-white/25 to-[#3f9cab]/20 border-r border-white/20 backdrop-blur-md px-[43px] py-[68px] flex flex-col justify-between shrink-0 z-[1001] select-none">
      <div className="flex flex-col gap-[40px] items-start w-full">
        {/* Brand Logo */}
        <div className="text-[38px] leading-none text-teal-brand tracking-tight w-full font-josefin">
          <span className="font-bold">Sehat</span>
          <span className="font-light text-teal-brand/70">Terus</span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-[24px] items-start w-full">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            const content = (
              <>
                <Icon
                  className={cn(
                    item.iconSize,
                    "shrink-0 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-white" : "text-teal-brand group-hover:text-teal-brand-hover"
                  )}
                />
                <span className="leading-none">{item.name}</span>
              </>
            );

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex gap-[18px] items-center rounded-[16px] w-full transition-all duration-300 font-josefin text-[20px] font-normal group border border-transparent",
                  isActive
                    ? "px-[20px] py-[18px] text-white shadow-lg"
                    : "px-[17px] py-[15px] text-teal-brand hover:bg-white/10 hover:text-teal-brand-hover"
                )}
                style={
                  isActive
                    ? {
                        backgroundImage:
                          "linear-gradient(90deg, rgb(12, 129, 138) 0%, rgb(73, 153, 159) 27.943%, rgb(12, 129, 138) 63.703%, rgb(73, 153, 159) 93.817%)",
                      }
                    : undefined
                }
              >
                {content}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button at the bottom */}
      <button
        onClick={logout}
        className="flex gap-[23px] items-center p-[17px] rounded-[16px] w-full text-teal-brand hover:bg-white/10 hover:text-teal-brand-hover transition-all duration-300 text-[20px] font-josefin font-normal text-left cursor-pointer"
      >
        <LogOut className="size-[26px] shrink-0" />
        <span className="leading-none">Log Out</span>
      </button>
    </aside>
  );
}

