"use client"

import { ContactsTable } from "./components/contacts-table"
import { useContacts } from "@/hooks/use-contacts"
import { useState } from "react"
import { ContactForm } from "./components/contact-form"
import { Contact } from "@/types/contact"
import { toast } from "sonner"
import { useContactSync } from "@/hooks/use-contact-sync"

type NewContact = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>

export default function ContactsPage() {
  const { contacts, isLoading: isLoadingLocal, isError: isErrorLocal, createContact, updateContact, deleteContact } = useContacts()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize contact sync
  useContactSync()

  const handleCreate = async (contact: NewContact) => {
    try {
      setIsSubmitting(true)
      await createContact(contact)
      toast.success('Contact created successfully')
    } catch (error) {
      console.error('Error creating contact:', error)
      toast.error('Failed to create contact')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (contact: Contact | NewContact) => {
    try {
      setIsSubmitting(true)
      if ('id' in contact) {
        await updateContact(contact as Contact)
      } else {
        await createContact(contact)
      }
      toast.success('Contact updated successfully')
    } catch (error) {
      console.error('Error updating contact:', error)
      toast.error('Failed to update contact')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (email: string) => {
    try {
      setIsSubmitting(true)
      await deleteContact(email)
      toast.success('Contact deleted successfully')
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingLocal) {
    return <div>Loading...</div>
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Manage your contacts</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage your contacts across all platforms. Your contacts are automatically synced with Hubspot and Pipedrive CRMs every 30 seconds.
        </p>
      </div>
      <div className="mb-4 flex justify-end">
        <ContactForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
      </div>
      <ContactsTable
        contacts={contacts}
        isLoading={isLoadingLocal}
        isError={isErrorLocal}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  )
} 