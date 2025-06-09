import { useState, useEffect } from "react"
import { Contact, Source } from "@/types/contact"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil } from "lucide-react"
import { faker } from "@faker-js/faker"

export interface NewContact {
  name: string
  email: string
  phone: string
  jobTitle: string
  pronouns: string
  sources: Source[]
}

interface ContactFormProps {
  contact?: Contact
  onSubmit: (contact: NewContact) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactForm({ 
  contact, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  isOpen,
  onOpenChange
}: ContactFormProps) {
  const [formData, setFormData] = useState<NewContact>({
    name: contact?.name ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    jobTitle: contact?.jobTitle ?? '',
    pronouns: contact?.pronouns ?? '',
    sources: contact?.sources ?? ['local']
  })

  // Update form data when contact changes
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        jobTitle: contact.jobTitle,
        pronouns: contact.pronouns,
        sources: contact.sources
      })
    }
  }, [contact])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    onOpenChange(false)
  }

  const handleFill = () => {
    const pronouns = ['he/him', 'she/her', 'they/them']
    setFormData({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      jobTitle: faker.person.jobTitle(),
      pronouns: faker.helpers.arrayElement(pronouns),
      sources: ['local']
    })
  }

  const handleClear = () => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
        pronouns: '',
      sources: ['local']
      })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant={contact ? "ghost" : "default"} size={contact ? "icon" : "default"}>
          {contact ? (
            <Pencil className="h-4 w-4" />
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              placeholder="Job Title"
              value={formData.jobTitle}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pronouns">Pronouns</Label>
            <Input
              id="pronouns"
              name="pronouns"
              placeholder="Pronouns"
              value={formData.pronouns}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleFill}>
              Fill with Fake Data
            </Button>
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : contact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 