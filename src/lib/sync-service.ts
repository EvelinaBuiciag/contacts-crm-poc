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

  // Ensure email is provided and valid
  if (!contact.email) {
    console.error('No email provided for contact sync');
    return updates;
  }

  // Try Hubspot sync
  try {
    console.log('Checking Hubspot integration for:', contact.email);
    // If contact doesn't exist in Hubspot yet
    if (!existingContact?.hubspotId) {
      // Check if contact already exists in Hubspot to prevent duplicates
      const hubspotCheck = await integrationClient
        .connection('hubspot')
        .action('list-contacts')
        .run({
          filter: { email: contact.email }
        });
      const existingHubspotContact = hubspotCheck?.output?.records?.find(
        (c: any) => c.fields?.primaryEmail?.toLowerCase() === contact.email.toLowerCase()
      );
      if (existingHubspotContact) {
        console.log('Contact already exists in Hubspot, updating ID');
        updates.hubspotId = existingHubspotContact.id;
        if (!sources.includes('hubspot')) {
          sources = [...sources, 'hubspot'];
        }
      } else {
        // Create new contact in Hubspot
        console.log('Creating new Hubspot contact');
        const hubspotResponse = await integrationClient
          .connection('hubspot')
          .action('create-contact')
          .run({
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            jobTitle: contact.jobTitle || '',
            pronouns: contact.pronouns || ''
          });

        console.log('Hubspot create response:', JSON.stringify(hubspotResponse?.output, null, 2));
        if (hubspotResponse?.output?.id) {
          updates.hubspotId = hubspotResponse.output.id;
          if (!sources.includes('hubspot')) {
            sources = [...sources, 'hubspot'];
          }
        } else {
          console.error('Failed to create contact in Hubspot, no ID returned');
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
          jobTitle: contact.jobTitle || '',
          pronouns: contact.pronouns || ''
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
      // Check if contact already exists in Pipedrive to prevent duplicates
      const pipedriveCheck = await integrationClient
        .connection('pipedrive')
        .action('list-contacts')
        .run({
          filter: { email: contact.email }
        });
      const existingPipedriveContact = pipedriveCheck?.output?.records?.find(
        (c: any) => c.fields?.primaryEmail?.toLowerCase() === contact.email.toLowerCase()
      );
      if (existingPipedriveContact) {
        console.log('Contact already exists in Pipedrive, updating ID');
        updates.pipedriveId = existingPipedriveContact.id;
        if (!sources.includes('pipedrive')) {
          sources = [...sources, 'pipedrive'];
        }
      } else {
        // Create new contact in Pipedrive
        console.log('Creating new Pipedrive contact');
        const pipedriveResponse = await integrationClient
          .connection('pipedrive')
          .action('create-contact')
          .run({
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            jobTitle: contact.jobTitle || '',
            pronouns: contact.pronouns || ''
          });

        console.log('Pipedrive create response:', JSON.stringify(pipedriveResponse?.output, null, 2));
        if (pipedriveResponse?.output?.id) {
          updates.pipedriveId = pipedriveResponse.output.id;
          if (!sources.includes('pipedrive')) {
            sources = [...sources, 'pipedrive'];
          }
        } else {
          console.error('Failed to create contact in Pipedrive, no ID returned');
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
          jobTitle: contact.jobTitle || '',
          pronouns: contact.pronouns || ''
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

  updates.sources = sources;
  return updates;
}

export async function syncAllContacts(auth: AuthCustomer) {
  try {
    console.log('Starting contact sync for customer:', auth.customerId);
    const integrationClient = await getIntegrationClient(auth);
    console.log('Integration client initialized');

    // Fetch local contacts to track existing records
    const localContacts = await ContactModel.find({ customerId: auth.customerId });
    const localEmails = new Set(localContacts.filter(c => !c.deleted).map(c => c.email.toLowerCase()));
    const deletedEmails = new Set(localContacts.filter(c => c.deleted).map(c => c.email.toLowerCase()));

    // Fetch contacts from Hubspot
    try {
      console.log('Attempting to fetch contacts from Hubspot...');
      const hubspotResponse = await integrationClient
        .connection('hubspot')
        .action('list-contacts')
        .run('{}'); // Ensure we fetch all contacts without filters

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
        
        const email = hubspotContact.fields?.primaryEmail || '';
        if (!email) {
          console.log('Skipping Hubspot contact with no email:', hubspotContact.id);
          continue;
        }

        const existingContact = await ContactModel.findOne({
          customerId: auth.customerId,
          email: { $regex: new RegExp(`^${email}$`, 'i') },
          deleted: { $ne: true }
        });

        if (existingContact) {
          console.log('Found existing contact for Hubspot contact:', {
            id: existingContact.id,
            email: existingContact.email,
            sources: existingContact.sources
          });
          // Always update Hubspot ID if different
          if (existingContact.hubspotId !== hubspotContact.id) {
            console.log('Updating Hubspot ID for existing contact');
            const sources = new Set([...existingContact.sources, 'hubspot', 'local']);
            await ContactModel.findByIdAndUpdate(existingContact._id, {
              hubspotId: hubspotContact.id,
              sources: Array.from(sources)
            });
          }
          // Update existing contact with Hubspot data only if Hubspot's update is newer
          const hubspotUpdatedAt = new Date(hubspotContact.updatedTime || hubspotContact.updatedAt || 0);
          const localUpdatedAt = new Date(existingContact.updatedAt || 0);
          if (hubspotUpdatedAt > localUpdatedAt) {
            console.log('Hubspot data is newer, updating local contact');
            const sources = new Set([...existingContact.sources, 'hubspot', 'local']);
            await ContactModel.findByIdAndUpdate(existingContact._id, {
              hubspotId: hubspotContact.id,
              sources: Array.from(sources),
              name: hubspotContact.name,
              phone: hubspotContact.fields?.primaryPhone || existingContact.phone,
              jobTitle: hubspotContact.fields?.jobTitle || existingContact.jobTitle,
              pronouns: hubspotContact.fields?.pronouns || existingContact.pronouns,
              updatedAt: hubspotUpdatedAt
            });
            console.log('Updated existing contact with Hubspot info');
          }

          // If contact isn't in Pipedrive, sync it
          if (!existingContact.pipedriveId) {
            console.log('Syncing contact to Pipedrive...');
            await syncContact(
              integrationClient,
              {
                name: hubspotContact.name,
                email: email,
                phone: hubspotContact.fields?.primaryPhone || '(No phone)',
                jobTitle: hubspotContact.fields?.jobTitle || '',
                pronouns: hubspotContact.fields?.pronouns || ''
              },
              existingContact
            );
          }
        } else {
          // Only create if not deleted locally (prevent ghost contacts)
          if (deletedEmails.has(email.toLowerCase())) {
            console.log('Contact was deleted locally, skipping creation:', email);
            continue;
          }
          console.log('Creating new contact from Hubspot data');
          // Create new contact from Hubspot
          const newContact = await ContactModel.create({
            id: crypto.randomUUID(),
            customerId: auth.customerId,
            name: hubspotContact.name,
            email: email,
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
              email: email,
              phone: hubspotContact.fields?.primaryPhone || '(No phone)',
              jobTitle: hubspotContact.fields?.jobTitle || '',
              pronouns: hubspotContact.fields?.pronouns || ''
            },
            newContact
          );
        }
      }

      // Check for deleted contacts in Hubspot
      const hubspotContactIds = hubspotContacts.map((contact: any) => contact.id);
      const localContactsWithHubspot = await ContactModel.find({
        customerId: auth.customerId,
        hubspotId: { $exists: true, $ne: null }
      });
      for (const localContact of localContactsWithHubspot) {
        if (!hubspotContactIds.includes(localContact.hubspotId || '')) {
          console.log('Contact deleted from Hubspot, removing Hubspot reference locally:', localContact.email);
          const sources = localContact.sources.filter(source => source !== 'hubspot');
          await ContactModel.findByIdAndUpdate(localContact._id, {
            hubspotId: null,
            sources: sources.length > 0 ? sources : ['local']
          });
          console.log('Removed Hubspot reference for contact:', localContact.email);
          // Do not delete local contact to preserve data in other systems
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
        .run('{}'); // Ensure we fetch all contacts without filters

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
        
        const email = pipedriveContact.fields?.primaryEmail || '';
        if (!email) {
          console.log('Skipping Pipedrive contact with no email:', pipedriveContact.id);
          continue;
        }

        const existingContact = await ContactModel.findOne({
          customerId: auth.customerId,
          email: { $regex: new RegExp(`^${email}$`, 'i') },
          deleted: { $ne: true }
        });

        if (existingContact) {
          console.log('Found existing contact for Pipedrive contact:', {
            id: existingContact.id,
            email: existingContact.email,
            sources: existingContact.sources
          });
          // Always update Pipedrive ID if different
          if (existingContact.pipedriveId !== pipedriveContact.id) {
            console.log('Updating Pipedrive ID for existing contact');
            const sources = new Set([...existingContact.sources, 'pipedrive', 'local']);
            await ContactModel.findByIdAndUpdate(existingContact._id, {
              pipedriveId: pipedriveContact.id,
              sources: Array.from(sources)
            });
          }
          // Update existing contact with Pipedrive data only if Pipedrive's update is newer
          const pipedriveUpdatedAt = new Date(pipedriveContact.updatedTime || pipedriveContact.updatedAt || 0);
          const localUpdatedAt = new Date(existingContact.updatedAt || 0);
          if (pipedriveUpdatedAt > localUpdatedAt) {
            console.log('Pipedrive data is newer, updating local contact');
            const sources = new Set([...existingContact.sources, 'pipedrive', 'local']);
            await ContactModel.findByIdAndUpdate(existingContact._id, {
              pipedriveId: pipedriveContact.id,
              sources: Array.from(sources),
              name: pipedriveContact.name,
              phone: pipedriveContact.fields?.primaryPhone || existingContact.phone,
              jobTitle: pipedriveContact.fields?.jobTitle || existingContact.jobTitle,
              pronouns: pipedriveContact.fields?.pronouns || existingContact.pronouns,
              updatedAt: pipedriveUpdatedAt
            });
            console.log('Updated existing contact with Pipedrive info');
          }

          // If contact isn't in Hubspot, sync it
          if (!existingContact.hubspotId) {
            console.log('Syncing contact to Hubspot...');
            await syncContact(
              integrationClient,
              {
                name: pipedriveContact.name,
                email: email,
                phone: pipedriveContact.fields?.primaryPhone || '(No phone)',
                jobTitle: pipedriveContact.fields?.jobTitle || '',
                pronouns: pipedriveContact.fields?.pronouns || ''
              },
              existingContact
            );
          }
        } else {
          // Only create if not deleted locally (prevent ghost contacts)
          if (deletedEmails.has(email.toLowerCase())) {
            console.log('Contact was deleted locally, skipping creation:', email);
            continue;
          }
          console.log('Creating new contact from Pipedrive data');
          // Create new contact from Pipedrive
          const newContact = await ContactModel.create({
            id: crypto.randomUUID(),
            customerId: auth.customerId,
            name: pipedriveContact.name,
            email: email,
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
              email: email,
              phone: pipedriveContact.fields?.primaryPhone || '(No phone)',
              jobTitle: pipedriveContact.fields?.jobTitle || '',
              pronouns: pipedriveContact.fields?.pronouns || ''
            },
            newContact
          );
        }
      }

      // Check for deleted contacts in Pipedrive
      const pipedriveContactIds = pipedriveContacts.map((contact: any) => contact.id);
      const localContactsWithPipedrive = await ContactModel.find({
        customerId: auth.customerId,
        pipedriveId: { $exists: true, $ne: null }
      });
      for (const localContact of localContactsWithPipedrive) {
        if (!pipedriveContactIds.includes(localContact.pipedriveId || '')) {
          console.log('Contact deleted from Pipedrive, removing Pipedrive reference locally:', localContact.email);
          const sources = localContact.sources.filter(source => source !== 'pipedrive');
          await ContactModel.findByIdAndUpdate(localContact._id, {
            pipedriveId: null,
            sources: sources.length > 0 ? sources : ['local']
          });
          console.log('Removed Pipedrive reference for contact:', localContact.email);
          // Do not delete local contact to preserve data in other systems
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
    const updatedLocalContacts = await ContactModel.find({
      customerId: auth.customerId,
      sources: { $in: ['local'] }
    });

    for (const localContact of updatedLocalContacts) {
      console.log('Syncing local contact to CRMs:', localContact.email);
      const updates = await syncContact(
        integrationClient,
        {
          name: localContact.name,
          email: localContact.email,
          phone: localContact.phone,
          jobTitle: localContact.jobTitle || '',
          pronouns: localContact.pronouns || ''
        },
        localContact
      );
      if (Object.keys(updates).length > 0) {
        await ContactModel.findByIdAndUpdate(localContact._id, updates);
        console.log('Updated local contact with CRM IDs:', localContact.email);
      }
    }

    console.log('Contact sync completed for customer:', auth.customerId);
  } catch (error) {
    console.error('Failed to sync contacts:', error);
    if (error && typeof error === 'object') {
      console.error('Error details:', {
        message: 'message' in error ? error.message : 'Unknown error',
        stack: 'stack' in error ? error.stack : undefined,
        response: 'response' in error && error.response && typeof error.response === 'object' ? error.response : undefined
      });
    }
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
        const response = await integrationClient
          .connection('hubspot')
          .action('delete-contact')
          .run({
            id: contact.hubspotId
          });
        console.log('Successfully deleted contact from Hubspot:', contact.hubspotId, 'Response:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Failed to delete contact from Hubspot:', error);
        if (error && typeof error === 'object') {
          console.error('Error details:', {
            message: 'message' in error ? error.message : 'Unknown error',
            stack: 'stack' in error ? error.stack : undefined,
            response: 'response' in error && error.response && typeof error.response === 'object' ? error.response : undefined
          });
        }
      }
    }

    // Delete from Pipedrive if contact exists there
    if (contact.sources?.includes('pipedrive') && contact.pipedriveId) {
      try {
        const response = await integrationClient
          .connection('pipedrive')
          .action('delete-contact')
          .run({
            id: contact.pipedriveId
          });
        console.log('Successfully deleted contact from Pipedrive:', contact.pipedriveId, 'Response:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Failed to delete contact from Pipedrive:', error);
        if (error && typeof error === 'object') {
          console.error('Error details:', {
            message: 'message' in error ? error.message : 'Unknown error',
            stack: 'stack' in error ? error.stack : undefined,
            response: 'response' in error && error.response && typeof error.response === 'object' ? error.response : undefined
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to delete contact from CRMs:', error);
    if (error && typeof error === 'object') {
      console.error('Error details:', {
        message: 'message' in error ? error.message : 'Unknown error',
        stack: 'stack' in error ? error.stack : undefined,
        response: 'response' in error && error.response && typeof error.response === 'object' ? error.response : undefined
      });
    }
  }
} 