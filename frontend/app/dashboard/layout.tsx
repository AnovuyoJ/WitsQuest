"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AdminSidebar from "@/components/AdminSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/dashboard/admin");

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? "bg-[#0b1220] text-white" : "bg-[#f5f7fb] text-slate-900"
      }`}
    >
      <div className="flex min-h-screen">
        {isAdminArea ? (
          <AdminSidebar
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((current) => !current)}
          />
        ) : (
          <Sidebar />
        )}

        <div
          className={`campus-background min-w-0 flex-1 transition-colors duration-200 ${
            darkMode ? "campus-background-dark text-white" : "text-slate-900"
          }`}
        >
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
