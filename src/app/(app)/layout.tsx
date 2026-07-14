import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-[1600px] px-6 py-6 md:px-8 lg:px-8">
          <Topbar />
          <div className="flex flex-col gap-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
