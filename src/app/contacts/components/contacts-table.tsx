import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Contact, Source } from "@/types/contact"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Trash2, Phone, Mail } from "lucide-react"
import { ContactForm } from "./contact-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type NewContact = Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'sources'>

interface ContactsTableProps {
  contacts: Contact[]
  isLoading?: boolean
  isError?: Error | null
  onUpdate: (contact: Contact | NewContact) => Promise<void>
  onDelete: (email: string) => Promise<void>
  isSubmitting?: boolean
}

export function ContactsTable({
  contacts,
  isLoading = false,
  isError = null,
  onUpdate,
  onDelete,
  isSubmitting = false,
}: ContactsTableProps) {
  if (isError) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">
          Error loading contacts. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Sources</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-6 w-[150px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[200px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[120px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[100px]" />
                </TableCell>
              </TableRow>
            ))
          ) : contacts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No contacts found
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>
                  <TooltipProvider>
                    <div className="flex flex-col gap-1">
                      {contact.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${contact.email}`} className="hover:underline">
                            {contact.email}
                          </a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${contact.phone}`} className="hover:underline">
                            {contact.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </TooltipProvider>
                </TableCell>
                <TableCell>{contact.jobTitle}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {contact.sources.map((source: Source) => (
                      <Badge
                        key={source}
                        variant={source === 'local' ? 'default' : 'secondary'}
                      >
                        {source}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ContactForm
                      contact={contact}
                      onSubmit={onUpdate}
                      isSubmitting={isSubmitting}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {contact.name}? This will remove them from all connected CRMs as well.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(contact.email)}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 