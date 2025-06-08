import { getIntegrationClient } from './integration-app-client';
import type { Contact } from '@/types/contact';
import { Contact as ContactModel } from '@/models/contact';
import type { AuthCustomer } from './auth';
import crypto from 'crypto';

type IntegrationAppClient = Awaited<ReturnType<typeof getIntegrationClient>>;

export async function syncContact(
  integrationClient: IntegrationAppClient,
  contact: {
    name: string;
    email: string;
    phone: string;
    jobTitle?: string;
    pronouns?: string;
  },
  existingContact?: any
) {
  console.log('Starting contact sync for:', contact.email);
  const updates: any = {};
  let sources = existingContact?.sources || ['local'];

  // Try Hubspot sync
  try {
    console.log('Checking Hubspot integration for:', contact.email);
    // If contact doesn't exist in Hubspot yet
    if (!existingContact?.hubspotId) {
      // Create new contact in Hubspot
      console.log('Creating new Hubspot contact');
      const hubspotResponse = await integrationClient
        .connection('hubspot')
        .action('create-contact')
        .run({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.jobTitle,
          pronouns: contact.pronouns
        });

      console.log('Hubspot create response:', JSON.stringify(hubspotResponse?.output, null, 2));
      if (hubspotResponse?.output?.id) {
        updates.hubspotId = hubspotResponse.output.id;
        if (!sources.includes('hubspot')) {
          sources = [...sources, 'hubspot'];
        }
      }
    } else {
      // Update existing Hubspot contact
      console.log('Updating existing Hubspot contact');
      await integrationClient
        .connection('hubspot')
        .action('update-contact')
        .run({
          id: existingContact.hubspotId,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.jobTitle,
          pronouns: contact.pronouns
        });
    }
  } catch (error) {
    console.error('Failed to sync contact with Hubspot:', error);
    if (error && typeof error === 'object') {
      console.error('Error details:', {
        message: 'message' in error ? error.message : 'Unknown error',
        stack: 'stack' in error ? error.stack : undefined,
        response: 'response' in error && error.response && typeof error.response === 'object' ? error.response : undefined
      });
    }
  }

  // Try Pipedrive sync
  try {
    console.log('Checking Pipedrive integration for:', contact.email);
    // If contact doesn't exist in Pipedrive yet
    if (!existingContact?.pipedriveId) {
      // Create new contact in Pipedrive
      console.log('Creating new Pipedrive contact');
      const pipedriveResponse = await integrationClient
        .connection('pipedrive')
        .action('create-contact')
        .run({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.jobTitle,
          pronouns: contact.pronouns
        });

      console.log('Pipedrive create response:', JSON.stringify(pipedriveResponse?.output, null, 2));
      if (pipedriveResponse?.output?.id) {
        updates.pipedriveId = pipedriveResponse.output.id;
        if (!sources.includes('pipedrive')) {
          sources = [...sources, 'pipedrive'];
        }
      }
    } else {
      // Update existing Pipedrive contact
      console.log('Updating existing Pipedrive contact');
      await integrationClient
        .connection('pipedrive')
        .action('update-contact')
        .run({
          id: existingContact.pipedriveId,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.jobTitle,
          pronouns: contact.pronouns
        });
    }
  } catch (error) {
    console.error('Failed to sync contact with Pipedrive:', error);
    if (error && typeof error === 'object') {
      console.error('Error details:', {
        message: 'message' in error ? error.message : 'Unknown error',
        stack: 'stack' in error ? error.stack : undefined,
        response: 'response' in error && error.response && typeof error.response === 'object' ? error.response : undefined
      });
    }
  }

  if (Object.keys(updates).length > 0) {
    updates.sources = sources;
  }

  console.log('Sync complete. Updates:', updates);
  return updates;
}

export async function syncAllContacts(auth: AuthCustomer) {
  try {
    console.log('Starting syncAllContacts for customer:', auth.customerId);
    const integrationClient = await getIntegrationClient(auth);
    console.log('Integration client initialized');
    
    // Fetch contacts from Hubspot
    try {
      console.log('Attempting to fetch contacts from Hubspot...');
      const hubspotResponse = await integrationClient
        .connection('hubspot')
        .action('list-contacts')
        .run();

      console.log('Raw Hubspot response:', JSON.stringify(hubspotResponse, null, 2));
      const hubspotContacts = hubspotResponse?.output?.records || [];
      console.log('Hubspot contacts found:', hubspotContacts.length);

      // Process each Hubspot contact
      for (const hubspotContact of hubspotContacts) {
        console.log('Processing Hubspot contact:', {
          id: hubspotContact.id,
          email: hubspotContact.fields?.primaryEmail,
          name: hubspotContact.name
        });
        
        const existingContact = await ContactModel.findOne({
          customerId: auth.customerId,
          email: { $regex: new RegExp(`^${hubspotContact.fields?.primaryEmail}$`, 'i') }
        });

        if (existingContact) {
          console.log('Found existing contact for Hubspot contact:', {
            id: existingContact.id,
            email: existingContact.email,
            sources: existingContact.sources
          });
          // Update existing contact with Hubspot data
          const sources = new Set([...existingContact.sources, 'hubspot', 'local']);
          await ContactModel.findByIdAndUpdate(existingContact._id, {
            hubspotId: hubspotContact.id,
            sources: Array.from(sources),
            // Always update fields from Hubspot to keep in sync
            name: hubspotContact.name,
            phone: hubspotContact.fields?.primaryPhone || existingContact.phone,
            jobTitle: hubspotContact.fields?.jobTitle || existingContact.jobTitle,
            pronouns: hubspotContact.fields?.pronouns || existingContact.pronouns
          });
          console.log('Updated existing contact with Hubspot info');

          // If contact isn't in Pipedrive, sync it
          if (!existingContact.pipedriveId) {
            console.log('Syncing contact to Pipedrive...');
            await syncContact(
              integrationClient,
              {
                name: hubspotContact.name,
                email: hubspotContact.fields?.primaryEmail || '',
                phone: hubspotContact.fields?.primaryPhone || '(No phone)',
                jobTitle: hubspotContact.fields?.jobTitle || '',
                pronouns: hubspotContact.fields?.pronouns || ''
              },
              existingContact
            );
          }
        } else {
          console.log('Creating new contact from Hubspot data');
          // Create new contact from Hubspot
          const newContact = await ContactModel.create({
            id: crypto.randomUUID(),
            customerId: auth.customerId,
            name: hubspotContact.name,
            email: hubspotContact.fields?.primaryEmail || '',
            phone: hubspotContact.fields?.primaryPhone || '(No phone)',
            jobTitle: hubspotContact.fields?.jobTitle || '',
            pronouns: hubspotContact.fields?.pronouns || '',
            hubspotId: hubspotContact.id,
            sources: ['hubspot', 'local']
          });

          // Sync new contact to Pipedrive
          console.log('Syncing new contact to Pipedrive...');
          await syncContact(
            integrationClient,
            {
              name: hubspotContact.name,
              email: hubspotContact.fields?.primaryEmail || '',
              phone: hubspotContact.fields?.primaryPhone || '(No phone)',
              jobTitle: hubspotContact.fields?.jobTitle || '',
              pronouns: hubspotContact.fields?.pronouns || ''
            },
            newContact
          );
        }
      }
    } catch (error) {
      console.error('Failed to sync Hubspot contacts. Full error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown error',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        response: error && typeof error === 'object' && 'response' in error ? error.response : undefined
      });
    }

    // Fetch contacts from Pipedrive
    try {
      console.log('Attempting to fetch contacts from Pipedrive...');
      const pipedriveResponse = await integrationClient
        .connection('pipedrive')
        .action('list-contacts')
        .run();

      console.log('Raw Pipedrive response:', JSON.stringify(pipedriveResponse, null, 2));
      const pipedriveContacts = pipedriveResponse?.output?.records || [];
      console.log('Pipedrive contacts found:', pipedriveContacts.length);

      // Process each Pipedrive contact
      for (const pipedriveContact of pipedriveContacts) {
        console.log('Processing Pipedrive contact:', {
          id: pipedriveContact.id,
          email: pipedriveContact.fields?.primaryEmail,
          name: pipedriveContact.name
        });
        
        const existingContact = await ContactModel.findOne({
          customerId: auth.customerId,
          email: { $regex: new RegExp(`^${pipedriveContact.fields?.primaryEmail}$`, 'i') }
        });

        if (existingContact) {
          console.log('Found existing contact for Pipedrive contact:', {
            id: existingContact.id,
            email: existingContact.email,
            sources: existingContact.sources
          });
          // Update existing contact with Pipedrive data
          const sources = new Set([...existingContact.sources, 'pipedrive', 'local']);
          await ContactModel.findByIdAndUpdate(existingContact._id, {
            pipedriveId: pipedriveContact.id,
            sources: Array.from(sources),
            // Always update fields from Pipedrive to keep in sync
            name: pipedriveContact.name,
            phone: pipedriveContact.fields?.primaryPhone || existingContact.phone,
            jobTitle: pipedriveContact.fields?.jobTitle || existingContact.jobTitle,
            pronouns: pipedriveContact.fields?.pronouns || existingContact.pronouns
          });
          console.log('Updated existing contact with Pipedrive info');

          // If contact isn't in Hubspot, sync it
          if (!existingContact.hubspotId) {
            console.log('Syncing contact to Hubspot...');
            await syncContact(
              integrationClient,
              {
                name: pipedriveContact.name,
                email: pipedriveContact.fields?.primaryEmail || '',
                phone: pipedriveContact.fields?.primaryPhone || '(No phone)',
                jobTitle: pipedriveContact.fields?.jobTitle || '',
                pronouns: pipedriveContact.fields?.pronouns || ''
              },
              existingContact
            );
          }
        } else {
          console.log('Creating new contact from Pipedrive data');
          // Create new contact from Pipedrive
          const newContact = await ContactModel.create({
            id: crypto.randomUUID(),
            customerId: auth.customerId,
            name: pipedriveContact.name,
            email: pipedriveContact.fields?.primaryEmail || '',
            phone: pipedriveContact.fields?.primaryPhone || '(No phone)',
            jobTitle: pipedriveContact.fields?.jobTitle || '',
            pronouns: pipedriveContact.fields?.pronouns || '',
            pipedriveId: pipedriveContact.id,
            sources: ['pipedrive', 'local']
          });

          // Sync new contact to Hubspot
          console.log('Syncing new contact to Hubspot...');
          await syncContact(
            integrationClient,
            {
              name: pipedriveContact.name,
              email: pipedriveContact.fields?.primaryEmail || '',
              phone: pipedriveContact.fields?.primaryPhone || '(No phone)',
              jobTitle: pipedriveContact.fields?.jobTitle || '',
              pronouns: pipedriveContact.fields?.pronouns || ''
            },
            newContact
          );
        }
      }
    } catch (error) {
      console.error('Failed to sync Pipedrive contacts. Full error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown error',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        response: error && typeof error === 'object' && 'response' in error ? error.response : undefined
      });
    }

    // Sync local contacts to CRMs
    console.log('Syncing local contacts to CRMs...');
    const localContacts = await ContactModel.find({
      customerId: auth.customerId,
      sources: 'local'
    });

    for (const contact of localContacts) {
      console.log('Syncing local contact:', contact);
      const updates = await syncContact(
        integrationClient,
        {
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.jobTitle || '',
          pronouns: contact.pronouns || ''
        },
        contact
      );
      if (Object.keys(updates).length > 0) {
        await ContactModel.findByIdAndUpdate(contact._id, updates);
      }
    }
  } catch (error) {
    console.error('Error in syncAllContacts:', error);
    throw error;
  }
}

export async function deleteContactFromCrms(
  contact: {
    hubspotId?: string;
    pipedriveId?: string;
    sources?: string[];
  },
  auth: AuthCustomer
) {
  try {
    const integrationClient = await getIntegrationClient(auth);

    // Delete from Hubspot if contact exists there
    if (contact.sources?.includes('hubspot') && contact.hubspotId) {
      try {
        await integrationClient
          .connection('hubspot')
          .action('delete-contact')
          .run({
            id: contact.hubspotId
          });
      } catch (error) {
        console.error('Failed to delete contact from Hubspot:', error);
      }
    }

    // Delete from Pipedrive if contact exists there
    if (contact.sources?.includes('pipedrive') && contact.pipedriveId) {
      try {
        await integrationClient
          .connection('pipedrive')
          .action('delete-contact')
          .run({
            id: contact.pipedriveId
          });
      } catch (error) {
        console.error('Failed to delete contact from Pipedrive:', error);
      }
    }
  } catch (error) {
    console.error('Failed to delete contact from CRMs:', error);
  }
} 