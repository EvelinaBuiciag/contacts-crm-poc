import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Contact } from "@/types/contact"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface ContactsTableProps {
  contacts: Contact[]
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
}

export function ContactsTable({ contacts, onEdit, onDelete }: ContactsTableProps) {
  if (!contacts?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No contacts found. Add your first contact to get started.
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead className="w-[200px]">Email</TableHead>
              <TableHead className="w-[150px]">Phone</TableHead>
              <TableHead className="w-[200px]">Job Title</TableHead>
              <TableHead className="w-[100px]">Pronouns</TableHead>
              <TableHead className="w-[150px]">Sources</TableHead>
              <TableHead className="w-[150px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>
                  <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-800">
                    {contact.email}
                  </a>
                </TableCell>
                <TableCell>
                  <a href={`tel:${contact.phone}`} className="text-blue-600 hover:text-blue-800">
                    {contact.phone}
                  </a>
                </TableCell>
                <TableCell>{contact.jobTitle}</TableCell>
                <TableCell>{contact.pronouns}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {contact.sources.map((source) => (
                      <span
                        key={source}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          source === 'local'
                            ? 'bg-gray-100 text-gray-800'
                            : source === 'hubspot'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                    <AlertDialog>
                    <div className="flex justify-end space-x-2">
                      <Button
                        onClick={() => onEdit(contact)}
                        size="sm"
                        variant="outline"
                      >
                        Edit
                      </Button>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                        >
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                    </div>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                          This will permanently delete {contact.name}'s contact information and remove it from all connected CRMs.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                          onClick={() => onDelete(contact)}
                          className="bg-red-600 hover:bg-red-700"
                          >
                          Delete Contact
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      </div>
    </div>
  )
} 