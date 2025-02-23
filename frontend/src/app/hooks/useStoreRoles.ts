import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth';
import { storesApi } from '@/api';

export function useStoreRoles(storeId: string) {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user?.token) {
        return;
      }

      try {
        const data = await storesApi.getStoreRoles(user.token, storeId);
        setRoles(data.roles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch store roles');
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user, storeId]);

  const isAdmin = roles.includes('admin');
  const isStaff = roles.includes('staff');

  console.log('roles', roles);

  return {
    roles,
    isAdmin,
    isStaff,
    loading,
    error
  };
} 