import { requireAuth } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import OfflineSyncManager from '@/components/pwa/OfflineSyncManager';
import InstallPrompt from '@/components/pwa/InstallPrompt';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth(['teacher']);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <Navbar user={session} />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar role="teacher" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 overflow-y-auto w-full">
          {children}
        </main>
      </div>
      <MobileBottomNav role="teacher" />
      <OfflineSyncManager />
      <InstallPrompt />
    </div>
  );
}
