/**
 * Test data factories
 * Generate mock entities with customizable properties
 */

let idCounter = 1;

function generateId(prefix: string): string {
  return `${prefix}-${String(idCounter++).padStart(3, '0')}`;
}

function now(): string {
  return new Date().toISOString();
}

// Account factory
export interface AccountOverrides {
  id?: string;
  name?: string;
  website?: string;
  type?: string;
  industry?: string;
  description?: string;
  billingAddressCity?: string;
  billingAddressCountry?: string;
  annualRevenue?: number;
  annualRevenueCurrency?: string;
  employeeCount?: number;
  isActive?: boolean;
  createdAt?: string;
  modifiedAt?: string;
}

export function createAccount(overrides: AccountOverrides = {}) {
  const timestamp = now();
  return {
    id: overrides.id ?? generateId('acc'),
    name: overrides.name ?? 'Test Account',
    website: overrides.website ?? 'https://example.com',
    type: overrides.type ?? 'Customer',
    industry: overrides.industry ?? 'Technology',
    description: overrides.description ?? '',
    billingAddressCity: overrides.billingAddressCity ?? 'San Francisco',
    billingAddressCountry: overrides.billingAddressCountry ?? 'USA',
    annualRevenue: overrides.annualRevenue ?? 1000000,
    annualRevenueCurrency: overrides.annualRevenueCurrency ?? 'USD',
    employeeCount: overrides.employeeCount ?? 50,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? timestamp,
    modifiedAt: overrides.modifiedAt ?? timestamp,
  };
}

// Contact factory
export interface ContactOverrides {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  phoneNumber?: string;
  title?: string;
  description?: string;
  doNotCall?: boolean;
  accountId?: string;
  accountName?: string;
  createdAt?: string;
  modifiedAt?: string;
}

export function createContact(overrides: ContactOverrides = {}) {
  const firstName = overrides.firstName ?? 'John';
  const lastName = overrides.lastName ?? 'Doe';
  const timestamp = now();

  return {
    id: overrides.id ?? generateId('con'),
    name: overrides.name ?? `${firstName} ${lastName}`,
    firstName,
    lastName,
    emailAddress: overrides.emailAddress ?? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phoneNumber: overrides.phoneNumber ?? '+1-555-0100',
    title: overrides.title ?? 'Manager',
    description: overrides.description ?? '',
    doNotCall: overrides.doNotCall ?? false,
    accountId: overrides.accountId ?? null,
    accountName: overrides.accountName ?? null,
    createdAt: overrides.createdAt ?? timestamp,
    modifiedAt: overrides.modifiedAt ?? timestamp,
  };
}

// Lead factory
export interface LeadOverrides {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  phoneNumber?: string;
  status?: string;
  source?: string;
  industry?: string;
  description?: string;
  createdAt?: string;
  modifiedAt?: string;
}

export function createLead(overrides: LeadOverrides = {}) {
  const firstName = overrides.firstName ?? 'Lead';
  const lastName = overrides.lastName ?? 'User';
  const timestamp = now();

  return {
    id: overrides.id ?? generateId('lead'),
    name: overrides.name ?? `${firstName} ${lastName}`,
    firstName,
    lastName,
    emailAddress: overrides.emailAddress ?? `${firstName.toLowerCase()}@example.com`,
    phoneNumber: overrides.phoneNumber ?? '+1-555-0200',
    status: overrides.status ?? 'New',
    source: overrides.source ?? 'Web Site',
    industry: overrides.industry ?? '',
    description: overrides.description ?? '',
    createdAt: overrides.createdAt ?? timestamp,
    modifiedAt: overrides.modifiedAt ?? timestamp,
  };
}

// Opportunity factory
export interface OpportunityOverrides {
  id?: string;
  name?: string;
  amount?: number;
  amountCurrency?: string;
  stage?: string;
  probability?: number;
  closeDate?: string;
  description?: string;
  accountId?: string;
  accountName?: string;
  createdAt?: string;
  modifiedAt?: string;
}

export function createOpportunity(overrides: OpportunityOverrides = {}) {
  const timestamp = now();

  return {
    id: overrides.id ?? generateId('opp'),
    name: overrides.name ?? 'New Opportunity',
    amount: overrides.amount ?? 50000,
    amountCurrency: overrides.amountCurrency ?? 'USD',
    stage: overrides.stage ?? 'Prospecting',
    probability: overrides.probability ?? 10,
    closeDate: overrides.closeDate ?? '2024-12-31',
    description: overrides.description ?? '',
    accountId: overrides.accountId ?? null,
    accountName: overrides.accountName ?? null,
    createdAt: overrides.createdAt ?? timestamp,
    modifiedAt: overrides.modifiedAt ?? timestamp,
  };
}

// User factory
export interface UserOverrides {
  id?: string;
  userName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  type?: string;
  isAdmin?: boolean;
  isActive?: boolean;
}

export function createUser(overrides: UserOverrides = {}) {
  const firstName = overrides.firstName ?? 'Test';
  const lastName = overrides.lastName ?? 'User';

  return {
    id: overrides.id ?? generateId('user'),
    userName: overrides.userName ?? `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    name: overrides.name ?? `${firstName} ${lastName}`,
    firstName,
    lastName,
    emailAddress: overrides.emailAddress ?? `${firstName.toLowerCase()}@example.com`,
    type: overrides.type ?? 'regular',
    isAdmin: overrides.isAdmin ?? false,
    isActive: overrides.isActive ?? true,
  };
}

// List generation helpers
export function createAccountList(count: number, baseOverrides: AccountOverrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    createAccount({ ...baseOverrides, name: `Account ${i + 1}` })
  );
}

export function createContactList(count: number, baseOverrides: ContactOverrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    createContact({
      ...baseOverrides,
      firstName: `Contact`,
      lastName: `${i + 1}`,
    })
  );
}

export function createLeadList(count: number, baseOverrides: LeadOverrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    createLead({
      ...baseOverrides,
      firstName: `Lead`,
      lastName: `${i + 1}`,
    })
  );
}

// Reset counter (for test isolation)
export function resetIdCounter(): void {
  idCounter = 1;
}
