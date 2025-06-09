export type Source = 'local' | 'hubspot' | 'pipedrive';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  pronouns: string;
  createdAt: string;
  updatedAt: string;
  hubspotId?: string;
  pipedriveId?: string;
  sources: Source[];
}

export interface NewContact {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  pronouns: string;
  sources: Source[];
}

export interface ContactsResponse {
  contacts: Contact[];
} 