import { NextRequest, NextResponse } from 'next/server';
import { Contact } from '@/models/contact';
import { deleteContactFromCrms, syncAllContacts } from '@/lib/sync-service';
import { getAuthFromRequest } from '@/lib/server-auth';
import connectDB from '@/lib/mongodb';
import { getIntegrationClient } from '@/lib/integration-app-client';
import { syncContact } from '@/lib/sync-service';
import crypto from 'crypto';
import mongoose from 'mongoose';

// Set timeout for API routes
const TIMEOUT = 50000; // 50 seconds

// Helper function to handle timeouts
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

export async function GET(request: NextRequest) {
  try {
    console.log('Starting GET operation');
    const auth = getAuthFromRequest(request);
    if (!auth.customerId) {
      console.log('No customer ID found in auth');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('Auth validated, customer ID:', auth.customerId);

    // Connect to database with timeout
    console.log('Connecting to database...');
    await withTimeout(connectDB(), TIMEOUT);
    console.log('Connected to database. Connection state:', mongoose.connection.readyState);
    
    // Get contacts without syncing first
    console.log('Fetching all contacts...');
    const allContacts = await withTimeout(Contact.find(
      { customerId: auth.customerId },
      {
        id: 1,
        name: 1,
        email: 1,
        phone: 1,
        jobTitle: 1,
        pronouns: 1,
        sources: 1,
        hubspotId: 1,
        pipedriveId: 1,
        createdAt: 1,
        updatedAt: 1,
        _id: 0
      }
    ).sort({ createdAt: -1 }), TIMEOUT);
    
    // Try to sync in the background
    try {
      syncAllContacts(auth).catch(error => {
        console.error('Background sync failed:', error);
      });
    } catch (error) {
      console.error('Failed to start background sync:', error);
    }
    
    console.log('Found contacts:', allContacts.length);
    return NextResponse.json({ contacts: allContacts }, { status: 200 });
  } catch (error) {
    console.error('Error in GET operation:', error);
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json(
        { error: 'Request timeout', details: error.message },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting POST operation');
    const auth = getAuthFromRequest(request);
    if (!auth.customerId) {
      console.log('No customer ID found in auth');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('Auth validated, customer ID:', auth.customerId);

    const body = await request.json();
    const { name, email, phone, jobTitle, pronouns } = body;
    console.log('Received contact data:', { name, email, phone, jobTitle, pronouns });

    // Validate required fields
    if (!name || !email || !phone || !jobTitle || !pronouns) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected to database');

    // Check if contact already exists (by email)
    console.log('Checking for existing contact with email:', email);
    let contact = await Contact.findOne({
      customerId: auth.customerId,
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
    console.log('Existing contact found:', contact ? 'yes' : 'no');

    const integrationClient = await getIntegrationClient(auth);

    if (contact) {
      // Update existing contact
      console.log('Updating existing contact');
      const updates = {
        name,
        phone,
        jobTitle,
        pronouns,
        sources: [...new Set([...contact.sources, 'local'])]
      };

      // Sync with CRMs
      console.log('Syncing with CRMs...');
      const crmUpdates = await syncContact(
        integrationClient,
        { name, email, phone, jobTitle, pronouns },
        contact
      );
      console.log('CRM sync complete, updates:', crmUpdates);

      Object.assign(updates, crmUpdates);

      contact = await Contact.findByIdAndUpdate(
        contact._id,
        updates,
        { new: true }
      );
      console.log('Contact updated:', contact);
    } else {
    // Create new contact
      console.log('Creating new contact');
      contact = await Contact.create({
      id: crypto.randomUUID(),
      name,
      email,
      phone,
      jobTitle,
      pronouns,
      customerId: auth.customerId,
        sources: ['local']
    });
      console.log('New contact created:', contact);

      // Sync with CRMs
      console.log('Syncing with CRMs...');
      const updates = await syncContact(
        integrationClient,
        { name, email, phone, jobTitle, pronouns },
        contact
      );
      console.log('CRM sync complete, updates:', updates);

      if (Object.keys(updates).length > 0) {
        contact = await Contact.findByIdAndUpdate(
          contact._id,
          updates,
          { new: true }
        );
        console.log('Contact updated with CRM IDs:', contact);
      }
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error('Error in POST operation:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('Starting PUT operation');
    const auth = getAuthFromRequest(request);
    if (!auth.customerId) {
      console.log('No customer ID found in auth');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('Auth validated, customer ID:', auth.customerId);

    const body = await request.json();
    const { id, name, email, phone, jobTitle, pronouns } = body;
    console.log('Received update data:', { id, name, email, phone, jobTitle, pronouns });

    if (!id) {
      console.log('No contact ID provided');
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    console.log('Connected to database');

    // Find the contact first to get CRM IDs
    const existingContact = await Contact.findOne({ id, customerId: auth.customerId });
    if (!existingContact) {
      console.log('Contact not found:', id);
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Get integration client for CRM sync
    const integrationClient = await getIntegrationClient(auth);

    // Sync with CRMs first
    console.log('Syncing with CRMs...');
    const crmUpdates = await syncContact(
      integrationClient,
      { name, email, phone, jobTitle, pronouns },
      existingContact
    );
    console.log('CRM sync complete, updates:', crmUpdates);

    // Update contact with both local changes and any CRM updates
    const updates = {
      name,
      email,
      phone,
      jobTitle,
      pronouns,
      ...crmUpdates
    };

    // Update the contact
    const updatedContact = await Contact.findOneAndUpdate(
      { id, customerId: auth.customerId },
      updates,
      { new: true }
    );
    console.log('Contact updated:', updatedContact);

    return NextResponse.json({ contact: updatedContact }, { status: 200 });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('Starting DELETE operation');
    await connectDB();
    console.log('Connected to database');
    
    const auth = getAuthFromRequest(request);
    if (!auth.customerId) {
      console.log('No customer ID found in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Auth validated, customer ID:', auth.customerId);

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      console.log('No email provided in request');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    console.log('Searching for contact with email:', email);

    // Find the contact to delete using case-insensitive email match
    const contact = await Contact.findOne({
      customerId: auth.customerId,
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (!contact) {
      console.log('No contact found with email:', email);
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
  } catch (error: unknown) {
    console.error('Error in DELETE operation:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate contact found' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
} 