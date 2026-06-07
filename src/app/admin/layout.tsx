import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, ListPlus, Boxes, ShoppingCart, LogOut, Search, Bell, BarChart3, Users, Sliders, Tag, Truck, Percent, FolderTree } from 'lucide-react';
import styles from './admin.module.css'; // We will replace the class usage with inline or global where needed, or update module.
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminSidebarNav from './AdminSidebarNav';
import { getCMSContent } from '@/app/actions';
import AdminToastNotifier from '@/components/AdminToastNotifier';

export const metadata = {
  title: 'Avenue Book Centre Admin Portal',
  robots: {
    index: false,
    follow: false,
  }
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/admin-login');
  }

  const role = (session.user as any).role;
  if (role !== 'ADMIN' && role !== 'STAFF') {
    redirect('/');
  }

  // Fetch whether to show storefront button from CMS Content
  const showStorefrontButton = (await getCMSContent("config_show_storefront_button")) !== "false";

  return (
    <div className={styles.adminContainer}>
      {/* Sidebar - OpenCart style */}
      <aside className={styles.adminSidebar}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', background: '#1e242a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Image src="/logo.png" alt="Avenue Book Centre" width={44} height={44} style={{ objectFit: 'contain', borderRadius: '6px', background: '#fff', padding: '3px' }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>Avenue Book Centre</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Operations Portal</div>
            </div>
          </div>

          {/* Pure CSS Sidebar Toggle for Mobile */}
          <input type="checkbox" id="admin-nav-toggle" className={styles.adminToggleCheckbox} />
          <label htmlFor="admin-nav-toggle" className={styles.adminToggleLabel} aria-label="Toggle admin navigation menu">
            ☰
          </label>
        </div>

        <div className={styles.adminSidebarNav}>
          <AdminSidebarNav />
        </div>

        {showStorefrontButton && (
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', color: '#a3a3a3', transition: 'color 0.2s' }}>
              <LogOut size={20} /> Exit to Storefront
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className={styles.adminMainContent}>
        
        {/* Top Navbar */}
        <header className={styles.adminHeader}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
               <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', width: '300px', maxWidth: '100%' }}>
                  <Search size={18} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
                  <input type="text" placeholder="Search operations..." style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.875rem' }} />
               </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: '1rem' }}>
               <div style={{ position: 'relative', cursor: 'pointer' }}>
                  <Bell size={20} color="var(--text-secondary)" />
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--danger)', width: '10px', height: '10px', borderRadius: '50%' }}></span>
               </div>
               <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                 A
               </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '2rem 1.5rem', flexGrow: 1 }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
      <AdminToastNotifier />
    </div>
  );
}
