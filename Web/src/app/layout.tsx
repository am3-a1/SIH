import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "MoSJE Real-Time Monitoring & Inspection Platform",
  description: "Ministry of Social Justice & Empowerment Statutory Inspection & Monitoring Subsystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 font-sans min-h-screen flex">
        {/* Persistent Sidebar */}
        <Sidebar />

        {/* Main Content Area with Header */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/70">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
