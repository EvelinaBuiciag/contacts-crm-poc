import useSWR from 'swr';
import { useIntegrationApp } from '@integration-app/react';

interface CrmContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  createdAt: string;
  updatedAt: string;
  source: 'hubspot' | 'pipedrive';
  // Additional fields
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  stage?: string | null;
  companyName?: string | null;
  companyId?: string | null;
  ownerId?: string | null;
  lastActivityTime?: string | null;
  addresses?: Array<{
    value: string;
    primary: boolean;
    type?: string;
  }> | null;
  emails?: Array<{
    value: string;
    primary?: boolean;
    type?: string;
  }> | null;
  phones?: Array<{
    value: string;
    primary?: boolean;
    type?: string;
  }> | null;
}

interface CrmContactsResponse {
  contacts: CrmContact[];
  error?: string;
}

export function useCrmContacts() {
  const integrationApp = useIntegrationApp();

  const fetchCrmContacts = async (): Promise<CrmContactsResponse> => {
    try {
      const [hubspotResponse, pipedriveResponse] = await Promise.allSettled([
        integrationApp
          .connection('hubspot')
          .action('list-contacts')
          .run('{}'),
        integrationApp
          .connection('pipedrive')
          .action('list-contacts')
          .run('{}')
      ]);

      const contacts: CrmContact[] = [];

      // Process Hubspot contacts
      if (hubspotResponse.status === 'fulfilled') {
        const hubspotContacts = hubspotResponse.value.output.records || [];
        contacts.push(
          ...hubspotContacts.map((contact: any) => ({
            id: contact.id,
            name: contact.fields?.fullName || contact.fields?.firstName + ' ' + contact.fields?.lastName || 'Unknown',
            email: contact.fields?.primaryEmail || null,
            phone: contact.fields?.primaryPhone || null,
            jobTitle: contact.fields?.jobTitle || null,
            createdAt: contact.createdTime || new Date().toISOString(),
            updatedAt: contact.updatedTime || new Date().toISOString(),
            source: 'hubspot' as const,
            primaryEmail: contact.fields?.primaryEmail || null,
            primaryPhone: contact.fields?.primaryPhone || null,
            companyName: contact.fields?.companyName || null,
            ownerId: contact.fields?.ownerId || null,
            lastActivityTime: contact.fields?.lastActivityTime || null
          }))
        );
      }

      // Process Pipedrive contacts
      if (pipedriveResponse.status === 'fulfilled') {
        const pipedriveContacts = pipedriveResponse.value.output.records || [];
        contacts.push(
          ...pipedriveContacts.map((contact: any) => ({
            id: contact.id,
            name: contact.fields?.fullName || contact.name || 'Unknown',
            email: contact.fields?.primaryEmail || contact.fields?.emails?.[0]?.value || null,
            phone: contact.fields?.primaryPhone || contact.fields?.phones?.[0]?.value || null,
            jobTitle: contact.fields?.jobTitle || null,
            createdAt: contact.fields?.createdTime || contact.createdTime || new Date().toISOString(),
            updatedAt: contact.fields?.updatedTime || contact.updatedTime || new Date().toISOString(),
            source: 'pipedrive' as const,
            // Additional Pipedrive-specific fields
            primaryEmail: contact.fields?.primaryEmail || null,
            primaryPhone: contact.fields?.primaryPhone || null,
            emails: contact.fields?.emails?.map((email: any) => ({
              value: email.value,
              primary: false // Pipedrive doesn't provide primary flag in the response
            })) || null,
            phones: contact.fields?.phones?.map((phone: any) => ({
              value: phone.value,
              primary: false // Pipedrive doesn't provide primary flag in the response
            })) || null
          }))
        );
      }

      return { contacts };
    } catch (error) {
      console.error('Error fetching CRM contacts:', error);
      return {
        contacts: [],
        error: 'Failed to fetch contacts from CRMs'
      };
    }
  };

  const { data, error, isLoading, mutate } = useSWR<CrmContactsResponse>(
    'crm-contacts',
    fetchCrmContacts,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    contacts: data?.contacts || [],
    isLoading,
    isError: error || data?.error,
    refresh: mutate
  };
} 