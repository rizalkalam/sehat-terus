import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sehat Terus - Sistem Pemantauan Kesehatan Publik",
  description: "Public Health Radar & Epidemiological Early Warning System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark bg-zinc-950 text-white">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased h-screen overflow-hidden flex flex-col bg-zinc-950 text-zinc-100`}
      >
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-zinc-900/30">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
