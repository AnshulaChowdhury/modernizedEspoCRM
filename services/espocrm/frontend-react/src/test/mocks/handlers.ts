import { http, HttpResponse } from 'msw';
import { metadataFixture, aclTableFixture, detailLayoutFixture, listLayoutFixture } from '../fixtures/metadata';
import { sampleAccounts, sampleContacts, sampleLeads, createListResponse } from '../fixtures/entities';

// Dynamic entity storage for CRUD operations
const entityStore: Record<string, Record<string, unknown>[]> = {
  Account: [...sampleAccounts] as unknown as Record<string, unknown>[],
  Contact: [...sampleContacts] as unknown as Record<string, unknown>[],
  Lead: [...sampleLeads] as unknown as Record<string, unknown>[],
};

export const handlers = [
  // Auth - successful login
  http.get('/api/v1/App/user', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        userName: 'admin',
        name: 'Admin User',
        type: 'admin',
        isAdmin: true,
      },
      acl: { table: aclTableFixture },
      preferences: {
        language: 'en_US',
        timeZone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: 'h:mm a',
      },
      settings: {
        recordsPerPage: 20,
        displayListViewRecordCount: true,
      },
    });
  }),

  // Auth - login POST
  http.post('/api/v1/App/user', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const username = body.username;

    if (username === 'admin') {
      return HttpResponse.json({
        user: {
          id: 'test-user-id',
          userName: 'admin',
          name: 'Admin User',
          type: 'admin',
          isAdmin: true,
        },
        token: 'test-auth-token',
      });
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Auth - logout
  http.post('/api/v1/App/action/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // Metadata
  http.get('/api/v1/Metadata', () => {
    return HttpResponse.json(metadataFixture);
  }),

  // I18n
  http.get('/api/v1/I18n', () => {
    return HttpResponse.json({
      'Account.fields.name': 'Name',
      'Account.fields.website': 'Website',
      'Account.fields.type': 'Type',
      'Account.fields.industry': 'Industry',
      'Contact.fields.name': 'Name',
      'Contact.fields.emailAddress': 'Email',
      'Contact.fields.phoneNumber': 'Phone',
      'Lead.fields.name': 'Name',
      'Lead.fields.status': 'Status',
      'Lead.fields.source': 'Source',
    });
  }),

  // Layout - Detail
  http.get('/api/v1/Layout/:entityType/detail', ({ params }) => {
    const entityType = params.entityType as string;
    const layout = detailLayoutFixture[entityType as keyof typeof detailLayoutFixture];

    if (layout) {
      return HttpResponse.json(layout);
    }
    return HttpResponse.json([], { status: 404 });
  }),

  // Layout - List
  http.get('/api/v1/Layout/:entityType/list', ({ params }) => {
    const entityType = params.entityType as string;
    const layout = listLayoutFixture[entityType as keyof typeof listLayoutFixture];

    if (layout) {
      return HttpResponse.json(layout);
    }
    return HttpResponse.json([], { status: 404 });
  }),

  // Entity List (GET)
  http.get('/api/v1/:entityType', ({ params, request }) => {
    const entityType = params.entityType as string;
    const url = new URL(request.url);
    const maxSize = parseInt(url.searchParams.get('maxSize') ?? '20', 10);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
    const textFilter = url.searchParams.get('textFilter') ?? '';

    let records = entityStore[entityType] ?? [];

    // Apply text filter
    if (textFilter) {
      const filterLower = textFilter.toLowerCase();
      records = records.filter((r) =>
        Object.values(r).some(
          (v) => typeof v === 'string' && v.toLowerCase().includes(filterLower)
        )
      );
    }

    const total = records.length;
    const paginatedList = records.slice(offset, offset + maxSize);

    return HttpResponse.json(createListResponse(paginatedList, total));
  }),

  // Entity Read (GET by ID)
  http.get('/api/v1/:entityType/:id', ({ params }) => {
    const entityType = params.entityType as string;
    const id = params.id as string;

    const records = entityStore[entityType] ?? [];
    const record = records.find((r) => r.id === id);

    if (record) {
      return HttpResponse.json(record);
    }

    return HttpResponse.json(
      { message: 'Record not found' },
      { status: 404 }
    );
  }),

  // Entity Create (POST)
  http.post('/api/v1/:entityType', async ({ params, request }) => {
    const entityType = params.entityType as string;
    const body = await request.json() as Record<string, unknown>;

    const newRecord = {
      id: `${entityType.toLowerCase()}-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    if (!entityStore[entityType]) {
      entityStore[entityType] = [];
    }
    entityStore[entityType].push(newRecord);

    return HttpResponse.json(newRecord, { status: 201 });
  }),

  // Entity Update (PUT)
  http.put('/api/v1/:entityType/:id', async ({ params, request }) => {
    const entityType = params.entityType as string;
    const id = params.id as string;
    const body = await request.json() as Record<string, unknown>;

    const records = entityStore[entityType] ?? [];
    const index = records.findIndex((r) => r.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { message: 'Record not found' },
        { status: 404 }
      );
    }

    const updatedRecord = {
      ...records[index],
      ...body,
      modifiedAt: new Date().toISOString(),
    };
    records[index] = updatedRecord;

    return HttpResponse.json(updatedRecord);
  }),

  // Entity Delete (DELETE)
  http.delete('/api/v1/:entityType/:id', ({ params }) => {
    const entityType = params.entityType as string;
    const id = params.id as string;

    const records = entityStore[entityType] ?? [];
    const index = records.findIndex((r) => r.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { message: 'Record not found' },
        { status: 404 }
      );
    }

    records.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),

  // Mass Delete
  http.post('/api/v1/:entityType/action/massDelete', async ({ params, request }) => {
    const entityType = params.entityType as string;
    const body = await request.json() as { ids: string[] };
    const { ids } = body;

    const records = entityStore[entityType] ?? [];
    entityStore[entityType] = records.filter((r) => !ids.includes(r.id as string));

    return HttpResponse.json({ count: ids.length });
  }),
];

// Helper to reset entity store between tests
export function resetEntityStore(): void {
  entityStore.Account = [...sampleAccounts] as unknown as Record<string, unknown>[];
  entityStore.Contact = [...sampleContacts] as unknown as Record<string, unknown>[];
  entityStore.Lead = [...sampleLeads] as unknown as Record<string, unknown>[];
}
