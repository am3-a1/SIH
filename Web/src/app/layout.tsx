import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/context/ThemeContext";

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans min-h-screen flex transition-colors duration-200">
        <ThemeProvider>
          {/* Persistent Sidebar */}
          <Sidebar />

          {/* Main Content Area with Header */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/70 dark:bg-slate-950/70">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
