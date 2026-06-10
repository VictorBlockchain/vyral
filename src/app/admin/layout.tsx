import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div style={{ display: 'flex' }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: '30px', minHeight: '100vh', background: '#f9f9f9' }}>
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
