/**
 * Test fixtures for metadata and ACL
 */

export const metadataFixture = {
  entityDefs: {
    Account: {
      fields: {
        name: { type: 'varchar', required: true, maxLength: 150 },
        website: { type: 'url' },
        type: { type: 'enum', options: ['Customer', 'Partner', 'Reseller'] },
        industry: { type: 'enum', options: ['Technology', 'Software', 'Consulting', 'Finance'] },
        description: { type: 'text' },
        billingAddressCity: { type: 'varchar', maxLength: 100 },
        billingAddressCountry: { type: 'varchar', maxLength: 100 },
        annualRevenue: { type: 'currency' },
        employeeCount: { type: 'int', min: 0 },
        isActive: { type: 'bool', default: true },
        createdAt: { type: 'datetime', readOnly: true },
        modifiedAt: { type: 'datetime', readOnly: true },
      },
      links: {
        contacts: { type: 'hasMany', entity: 'Contact', foreign: 'account' },
        opportunities: { type: 'hasMany', entity: 'Opportunity', foreign: 'account' },
        assignedUser: { type: 'belongsTo', entity: 'User' },
      },
    },
    Contact: {
      fields: {
        name: { type: 'personName' },
        firstName: { type: 'varchar', maxLength: 100 },
        lastName: { type: 'varchar', required: true, maxLength: 100 },
        emailAddress: { type: 'email' },
        phoneNumber: { type: 'phone' },
        title: { type: 'varchar', maxLength: 100 },
        description: { type: 'text' },
        doNotCall: { type: 'bool', default: false },
        createdAt: { type: 'datetime', readOnly: true },
        modifiedAt: { type: 'datetime', readOnly: true },
      },
      links: {
        account: { type: 'belongsTo', entity: 'Account' },
        opportunities: { type: 'hasMany', entity: 'Opportunity' },
        assignedUser: { type: 'belongsTo', entity: 'User' },
      },
    },
    Lead: {
      fields: {
        name: { type: 'personName' },
        firstName: { type: 'varchar', maxLength: 100 },
        lastName: { type: 'varchar', required: true, maxLength: 100 },
        emailAddress: { type: 'email' },
        phoneNumber: { type: 'phone' },
        status: {
          type: 'enum',
          options: ['New', 'Assigned', 'In Process', 'Converted', 'Dead'],
          default: 'New',
        },
        source: {
          type: 'enum',
          options: ['Call', 'Email', 'Existing Customer', 'Partner', 'Web Site', 'Campaign'],
        },
        industry: { type: 'varchar', maxLength: 100 },
        description: { type: 'text' },
        createdAt: { type: 'datetime', readOnly: true },
        modifiedAt: { type: 'datetime', readOnly: true },
      },
      links: {
        assignedUser: { type: 'belongsTo', entity: 'User' },
        createdContact: { type: 'belongsTo', entity: 'Contact' },
        createdAccount: { type: 'belongsTo', entity: 'Account' },
      },
    },
    Opportunity: {
      fields: {
        name: { type: 'varchar', required: true, maxLength: 150 },
        amount: { type: 'currency' },
        stage: {
          type: 'enum',
          options: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
        },
        probability: { type: 'int', min: 0, max: 100 },
        closeDate: { type: 'date' },
        description: { type: 'text' },
        createdAt: { type: 'datetime', readOnly: true },
        modifiedAt: { type: 'datetime', readOnly: true },
      },
      links: {
        account: { type: 'belongsTo', entity: 'Account' },
        contacts: { type: 'hasMany', entity: 'Contact' },
        assignedUser: { type: 'belongsTo', entity: 'User' },
      },
    },
  },
  scopes: {
    Account: { entity: true, object: true, tab: true },
    Contact: { entity: true, object: true, tab: true },
    Lead: { entity: true, object: true, tab: true },
    Opportunity: { entity: true, object: true, tab: true },
    Email: { entity: true, object: true, tab: true },
    Meeting: { entity: true, object: true, tab: true },
    Call: { entity: true, object: true, tab: true },
    Task: { entity: true, object: true, tab: true },
    User: { entity: true, object: true },
  },
  fields: {
    varchar: { params: ['maxLength', 'pattern'] },
    text: { params: [] },
    int: { params: ['min', 'max'] },
    float: { params: ['min', 'max'] },
    bool: { params: [] },
    enum: { params: ['options'] },
    date: { params: [] },
    datetime: { params: [] },
    email: { params: [] },
    phone: { params: [] },
    url: { params: [] },
    currency: { params: [] },
    personName: { params: [] },
  },
};

// ACL fixtures
export const aclTableFixture = {
  Account: {
    read: 'yes',
    create: 'yes',
    edit: 'yes',
    delete: 'yes',
    stream: 'yes',
  },
  Contact: {
    read: 'yes',
    create: 'yes',
    edit: 'yes',
    delete: 'yes',
    stream: 'yes',
  },
  Lead: {
    read: 'yes',
    create: 'yes',
    edit: 'yes',
    delete: 'no',
    stream: 'yes',
  },
  Opportunity: {
    read: 'yes',
    create: 'yes',
    edit: 'own',
    delete: 'own',
    stream: 'yes',
  },
};

// Read-only user ACL
export const readOnlyAclFixture = {
  Account: { read: 'yes', create: 'no', edit: 'no', delete: 'no' },
  Contact: { read: 'yes', create: 'no', edit: 'no', delete: 'no' },
  Lead: { read: 'yes', create: 'no', edit: 'no', delete: 'no' },
};

// Layout fixtures
export const detailLayoutFixture = {
  Account: [
    {
      label: 'Overview',
      rows: [
        [{ name: 'name', fullWidth: true }],
        [{ name: 'website' }, { name: 'type' }],
        [{ name: 'industry' }, { name: 'employeeCount' }],
      ],
    },
    {
      label: 'Address',
      rows: [
        [{ name: 'billingAddressCity' }, { name: 'billingAddressCountry' }],
      ],
    },
  ],
};

export const listLayoutFixture = {
  Account: [
    { name: 'name', link: true },
    { name: 'website' },
    { name: 'type' },
    { name: 'industry' },
  ],
};
