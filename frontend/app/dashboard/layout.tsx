import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}