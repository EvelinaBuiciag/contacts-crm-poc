"use client"

import { ContactsTable } from "./components/contacts-table"
import { useContacts } from "@/hooks/use-contacts"
import { useState } from "react"
import { ContactForm } from "./components/contact-form"
import { Contact, NewContact } from "@/types/contact"
import { toast } from "sonner"
import { useContactSync } from "@/hooks/use-contact-sync"
import { getAuthHeaders } from '@/lib/fetch-utils'

export default function ContactsPage() {
  const { contacts, isLoading: isLoadingLocal, isError: isErrorLocal, createContact, updateContact, deleteContact, mutate } = useContacts()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  // Initialize contact sync
  useContactSync()

  const handleCreate = async (newContact: NewContact) => {
    try {
      await createContact(newContact)
      setIsFormOpen(false)
      toast.success('Contact created successfully')
    } catch (error) {
      console.error('Error creating contact:', error)
      toast.error('Failed to create contact')
    }
  }

  const handleUpdate = async (updatedContact: Contact) => {
    try {
      await updateContact(updatedContact)
      setSelectedContact(null)
      toast.success('Contact updated successfully')
    } catch (error) {
      console.error('Error updating contact:', error)
      toast.error('Failed to update contact')
    }
  }

  const handleDelete = async (contact: Contact) => {
    try {
      await deleteContact(contact.id)
      toast.success('Contact deleted successfully')
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
    }
  }

  if (isLoadingLocal) {
    return <div className="flex items-center justify-center min-h-screen">Loading contacts...</div>
  }

  if (isErrorLocal) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">Error loading contacts</div>
  }

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Manage your contacts</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage your contacts across all platforms. Your contacts are automatically synced with Hubspot and Pipedrive CRMs every 30 seconds.
        </p>
        <button 
          onClick={async () => {
            try {
              const response = await fetch('/api/sync', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...getAuthHeaders()
                }
              });
              if (response.ok) {
                toast.success('Sync completed successfully');
              } else {
                toast.error('Sync failed');
              }
              mutate(); // Refresh the contacts list
            } catch (error: unknown) {
              toast.error('Sync failed: ' + String(error));
            }
          }} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sync Now
        </button>
      </div>
      <div className="mb-8">
        {selectedContact ? (
          <ContactForm
            contact={selectedContact}
            onSubmit={(data: NewContact) => handleUpdate({ ...selectedContact, ...data })}
            onCancel={() => setSelectedContact(null)}
            isOpen={true}
            onOpenChange={(open) => {
              if (!open) setSelectedContact(null)
            }}
          />
        ) : (
          <ContactForm
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            key={isFormOpen ? 'form-open' : 'form-closed'}
          />
        )}
      </div>
      <ContactsTable
        contacts={contacts || []}
        onEdit={setSelectedContact}
        onDelete={handleDelete}
      />
    </div>
  )
} 