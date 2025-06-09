import useSWR from 'swr';
import { Contact } from '@/types/contact';
import { getContacts } from '@/lib/api';

export function useContacts() {
  const { data, error, isLoading, mutate } = useSWR<Contact[]>('/api/contacts', getContacts);

  const createContact = async (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'sources'>) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
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

  const deleteContact = async (id: string) => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
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
    contacts: data ?? [],
    isLoading,
    isError: error,
    mutate,
    createContact,
    updateContact,
    deleteContact,
  };
} 