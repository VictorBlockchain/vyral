'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { BackgroundBlobs } from './BackgroundBlobs';
import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Toast, useToast, ToastType } from './Toast';

type PageId = 'home' | 'dashboard' | 'wallet' | 'profile' | 'about' | 'terms' | 'uikit' | 'design' | 'contact';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  // Map pathname to page ID for navigation state
  const getCurrentPageId = (): PageId => {
    const path = pathname.replace('/', '') || 'home';
    return path as PageId;
  };

  const currentPage = getCurrentPageId();

  // Expose toast function to window for child components to access
  useEffect(() => {
    (window as any).showToast = showToast;
  }, [showToast]);

  // Listen for openAddFundsModal event from child components
  useEffect(() => {
    const handleOpenModal = () => setIsAddFundsModalOpen(true);

    window.addEventListener('openAddFundsModal', handleOpenModal);

    return () => {
      window.removeEventListener('openAddFundsModal', handleOpenModal);
    };
  }, []);

  const handlePageChange = (pageId: string) => {
    // For standard routing, navigation is handled by Link components
    // This is kept for compatibility with existing components
  };

  return (
    <>
      <BackgroundBlobs />

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <Header currentPage={currentPage} onPageChange={handlePageChange} />

      <main className="container">{children}</main>

      <Footer />

      <MobileNav currentPage={currentPage} onPageChange={handlePageChange} />

      {/* Add Funds Modal */}
      <Modal
        isOpen={isAddFundsModalOpen}
        onClose={() => setIsAddFundsModalOpen(false)}
        title="Add Funds"
      >
        <div className="form-group">
          <label className="label">Amount (USD)</label>
          <input type="number" className="input" placeholder="10.00" />
        </div>
        <div className="form-group">
          <label className="label">Payment Method</label>
          <div className="select-wrapper">
            <select className="select">
              <option>Credit Card</option>
            </select>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setIsAddFundsModalOpen(false);
            showToast('Payment Processing...', 'info');
          }}
        >
          Confirm Payment
        </button>
      </Modal>
    </>
  );
}
