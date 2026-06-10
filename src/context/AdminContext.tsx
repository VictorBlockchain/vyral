'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';

interface AdminContextValue {
  isAdmin: boolean;
  role: string | null;
  permissions: string[];
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const response = await fetch(`/api/admin/check?walletAddress=${user.walletAddress}`);
        const data = await response.json();
        
        setIsAdmin(data.isAdmin);
        setRole(data.role);
        setPermissions(data.permissions || []);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  return (
    <AdminContext.Provider value={{ isAdmin, role, permissions, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
