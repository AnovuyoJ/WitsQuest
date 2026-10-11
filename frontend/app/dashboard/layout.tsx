"use client";

import { useTheme } from "@/components/ThemeProvider";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AdminSidebar from "@/components/AdminSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import styles from "@/components/DashboardShell.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { darkMode, toggleDarkMode } = useTheme();
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/dashboard/admin");

  return (
    <div className={`${styles.shell} app-refresh`}>
      <div className={styles.frame}>
        {isAdminArea ? (
          <AdminSidebar
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        ) : (
          <Sidebar />
        )}

        <div className={styles.workspace}>
          <DashboardTopbar />
          <main className={`${styles.content} campus-background`}>{children}</main>
        </div>
      </div>
    </div>
  );
}
