"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, AlertTriangle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Trend",
      path: "/proyeksi-tren",
      icon: TrendingUp,
    },
    {
      name: "Early Warning",
      path: "/peringatan-dini",
      icon: AlertTriangle,
    },
  ];

  return (
    <aside className="w-[349px] h-screen bg-gradient-to-b from-white/25 to-[#3f9cab]/20 border-r border-white/20 backdrop-blur-md px-[43px] py-[68px] flex flex-col justify-between shrink-0 z-10 select-none">
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

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex gap-[18px] items-center px-[17px] py-[15px] rounded-[16px] w-full transition-all duration-300 font-josefin text-[20px] font-normal group border border-transparent",
                  isActive
                    ? "text-white shadow-lg"
                    : "text-teal-brand hover:bg-white/10 hover:text-teal-brand-hover"
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
                <Icon
                  className={cn(
                    "size-[24px] shrink-0 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-white" : "text-teal-brand group-hover:text-teal-brand-hover"
                  )}
                />
                <span className="leading-none">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button at the bottom */}
      <button 
        onClick={() => alert("Sistem ini bersifat publik dan read-only.")}
        className="flex gap-[23px] items-center p-[17px] rounded-[16px] w-full text-teal-brand hover:bg-white/10 hover:text-teal-brand-hover transition-all duration-300 text-[20px] font-josefin font-normal text-left cursor-pointer"
      >
        <LogOut className="size-[26px] shrink-0" />
        <span className="leading-none">Log Out</span>
      </button>
    </aside>
  );
}
