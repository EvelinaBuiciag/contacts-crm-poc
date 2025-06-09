import { Contact, NewContact } from '@/types/contact';

export async function createContact(contact: NewContact): Promise<Contact> {
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

  return response.json();
}

export async function updateContact(contact: Contact): Promise<Contact> {
  const response = await fetch(`/api/contacts/${contact.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contact),
  });

  if (!response.ok) {
    throw new Error('Failed to update contact');
  }

  return response.json();
}

export async function deleteContact(contactId: string): Promise<void> {
  const response = await fetch(`/api/contacts/${contactId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete contact');
  }
}

export async function getContacts(): Promise<Contact[]> {
  const response = await fetch('/api/contacts');

  if (!response.ok) {
    throw new Error('Failed to fetch contacts');
  }

  const data = await response.json();
  return data.contacts;
} 