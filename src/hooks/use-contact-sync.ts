import { useEffect, useCallback } from 'react';
import { getAuthHeaders } from '@/lib/fetch-utils';
import { toast } from 'sonner';

export function useContactSync() {
  const syncContacts = useCallback(async () => {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to sync contacts');
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
      toast.error('Failed to sync contacts with CRMs');
    }
  }, []);

  useEffect(() => {
    // Initial sync
    syncContacts();

    // Set up interval for automatic sync every 30 seconds
    const interval = setInterval(syncContacts, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [syncContacts]);

  return {
    syncContacts,
  };
} 