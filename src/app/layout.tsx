import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Daily Work & Attendance Tracker | Pro AI",
  description: "Personal Daily Work Update & Attendance Management System with OpenAI structured outputs and MongoDB Atlas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-blue-600/30 selection:text-blue-200">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>WorkTracker AI Pro &bull; Next.js 15 &amp; MongoDB Atlas</span>
            <span>Structured Outputs &bull; Zod Validation &bull; Recharts</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
