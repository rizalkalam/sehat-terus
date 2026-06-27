import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sehat Terus - Radar Kesehatan Publik",
  description: "Public Health Radar & Epidemiological Early Warning System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <body className="font-sans antialiased h-full bg-[#cccccc] relative overflow-hidden">
        {/* Figma Ambient Gradients */}
        <div
          className="absolute inset-0 size-full pointer-events-none z-0"
          style={{ backgroundImage: "linear-gradient(147.132deg, rgb(173, 207, 209) 4.0075%, rgb(204, 204, 204) 39.536%)" }}
        />

        {/* Figma Ambient Blurry Ellipses */}
        <div className="absolute top-[33px] left-[65%] w-[644px] h-[642px] bg-teal-500/20 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-[676px] left-[20%] w-[829px] h-[643px] bg-[#639cab]/20 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="absolute top-[-300px] left-[10%] w-[629px] h-[601px] bg-teal-600/10 rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="relative z-10 h-full">{children}</div>
      </body>
    </html>
  );
}
