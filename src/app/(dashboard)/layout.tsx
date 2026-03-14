import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import TierBanner from "@/components/layout/TierBanner";
import SessionExpiredModal from "@/components/layout/SessionExpiredModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <TierBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <SessionExpiredModal />
    </div>
  );
}
