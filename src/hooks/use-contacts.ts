import useSWR from 'swr';
import { ContactsResponse, Contact } from '@/types/contact';
import { authenticatedFetcher, getAuthHeaders } from '@/lib/fetch-utils';

export function useContacts() {
  const { data, error, isLoading, mutate } = useSWR<ContactsResponse>(
    '/api/contacts',
    (url) => authenticatedFetcher<ContactsResponse>(url),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const createContact = async (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'sources'>) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contact),
      });

      if (!response.ok) {
        throw new Error('Failed to create contact');
      }

      // Refresh the contacts list
      await mutate();

      return true;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  };

  const updateContact = async (contact: Contact) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contact),
      });

      if (!response.ok) {
        throw new Error('Failed to update contact');
      }

      // Refresh the contacts list
      await mutate();

      return true;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  };

  const deleteContact = async (email: string) => {
    try {
      const response = await fetch(`/api/contacts?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      // Refresh the contacts list
      await mutate();

      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  };

  return {
    contacts: data?.contacts ?? [],
    isLoading,
    isError: error,
    mutate,
    createContact,
    updateContact,
    deleteContact,
  };
} 