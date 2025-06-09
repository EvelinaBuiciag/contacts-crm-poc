import { NextRequest, NextResponse } from 'next/server';
import { Contact } from '@/models/contact';
import { deleteContactFromCrms } from '@/lib/sync-service';
import { getAuthFromRequest } from '@/lib/server-auth';
import connectDB from '@/lib/mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Starting DELETE operation for ID:', params.id);
    await connectDB();
    console.log('Connected to database');
    
    const auth = getAuthFromRequest(request);
    if (!auth.customerId) {
      console.log('No customer ID found in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Auth validated, customer ID:', auth.customerId);

    // Find the contact to delete using ID
    const contact = await Contact.findOne({
      customerId: auth.customerId,
      id: params.id
    });

    if (!contact) {
      console.log('No contact found with ID:', params.id);
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    console.log('Found contact:', contact);

    // Delete from CRMs first
    try {
      console.log('Attempting to delete from CRMs');
      await deleteContactFromCrms(contact, auth);
      console.log('Successfully deleted from CRMs');
    } catch (error) {
      console.error('Failed to delete contact from CRMs:', error);
      // Continue with local deletion even if CRM deletion fails
    }

    // Delete from local database
    console.log('Attempting to delete from local database');
    await Contact.findByIdAndDelete(contact._id);
    console.log('Successfully deleted from local database');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE operation:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
} 