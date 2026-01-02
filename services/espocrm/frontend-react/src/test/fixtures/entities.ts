/**
 * Test fixtures for entity data
 */

export interface AccountFixture {
  id: string;
  name: string;
  website?: string;
  type?: string;
  industry?: string;
  billingAddressCity?: string;
  billingAddressCountry?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface ContactFixture {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  phoneNumber?: string;
  accountId?: string;
  accountName?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface LeadFixture {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  status: string;
  source?: string;
  createdAt: string;
  modifiedAt: string;
}

// Sample Account data
export const sampleAccounts: AccountFixture[] = [
  {
    id: 'acc-001',
    name: 'Acme Corporation',
    website: 'https://acme.com',
    type: 'Customer',
    industry: 'Technology',
    billingAddressCity: 'San Francisco',
    billingAddressCountry: 'USA',
    createdAt: '2024-01-15T10:30:00Z',
    modifiedAt: '2024-01-20T14:45:00Z',
  },
  {
    id: 'acc-002',
    name: 'TechStart Inc',
    website: 'https://techstart.io',
    type: 'Partner',
    industry: 'Software',
    billingAddressCity: 'New York',
    billingAddressCountry: 'USA',
    createdAt: '2024-02-01T09:00:00Z',
    modifiedAt: '2024-02-15T11:20:00Z',
  },
  {
    id: 'acc-003',
    name: 'Global Solutions Ltd',
    website: 'https://globalsolutions.co.uk',
    type: 'Reseller',
    industry: 'Consulting',
    billingAddressCity: 'London',
    billingAddressCountry: 'UK',
    createdAt: '2024-03-10T08:15:00Z',
    modifiedAt: '2024-03-10T08:15:00Z',
  },
];

// Sample Contact data
export const sampleContacts: ContactFixture[] = [
  {
    id: 'con-001',
    name: 'John Smith',
    firstName: 'John',
    lastName: 'Smith',
    emailAddress: 'john.smith@acme.com',
    phoneNumber: '+1-555-0101',
    accountId: 'acc-001',
    accountName: 'Acme Corporation',
    createdAt: '2024-01-16T11:00:00Z',
    modifiedAt: '2024-01-16T11:00:00Z',
  },
  {
    id: 'con-002',
    name: 'Jane Doe',
    firstName: 'Jane',
    lastName: 'Doe',
    emailAddress: 'jane.doe@techstart.io',
    phoneNumber: '+1-555-0102',
    accountId: 'acc-002',
    accountName: 'TechStart Inc',
    createdAt: '2024-02-05T14:30:00Z',
    modifiedAt: '2024-02-10T09:00:00Z',
  },
  {
    id: 'con-003',
    name: 'Bob Wilson',
    firstName: 'Bob',
    lastName: 'Wilson',
    emailAddress: 'bob@globalsolutions.co.uk',
    phoneNumber: '+44-20-7123-4567',
    accountId: 'acc-003',
    accountName: 'Global Solutions Ltd',
    createdAt: '2024-03-12T10:45:00Z',
    modifiedAt: '2024-03-12T10:45:00Z',
  },
];

// Sample Lead data
export const sampleLeads: LeadFixture[] = [
  {
    id: 'lead-001',
    name: 'Alice Brown',
    firstName: 'Alice',
    lastName: 'Brown',
    emailAddress: 'alice.brown@example.com',
    status: 'New',
    source: 'Web Site',
    createdAt: '2024-04-01T09:30:00Z',
    modifiedAt: '2024-04-01T09:30:00Z',
  },
  {
    id: 'lead-002',
    name: 'Charlie Green',
    firstName: 'Charlie',
    lastName: 'Green',
    emailAddress: 'charlie@startup.io',
    status: 'Assigned',
    source: 'Partner',
    createdAt: '2024-04-05T15:00:00Z',
    modifiedAt: '2024-04-06T10:00:00Z',
  },
];

// List response helper
export function createListResponse<T>(list: T[], total?: number) {
  return {
    total: total ?? list.length,
    list,
  };
}
