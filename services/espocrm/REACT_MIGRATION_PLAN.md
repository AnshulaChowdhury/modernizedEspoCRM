# EspoCRM React Frontend Rebuild Plan

## Overview

Complete rewrite of EspoCRM's Backbone/Bullbone frontend (871+ JS files, 84+ view types, 40+ field types) to React + TypeScript + Vite.

**Stack:** React 18 + TypeScript + Vite + TanStack Query + shadcn/ui + Tailwind CSS

---

## Coding Standards & Practices

### TypeScript Rules

```typescript
// tsconfig.json strict settings
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,           // NO `any` type allowed
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Forbidden Patterns:**
```typescript
// NEVER do this
let data: any;                        // Use `unknown` and narrow
function foo(x: any) {}               // Define proper types
const result = response as any;       // Use type guards
// @ts-ignore                         // Fix the type error instead
// @ts-expect-error                   // Only with documented reason
```

**Required Patterns:**
```typescript
// Use `unknown` for dynamic data, then narrow
function processApiResponse(data: unknown): User {
  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }
  return data;
}

// Type guards for runtime checks
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

// Zod for API response validation
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});
type User = z.infer<typeof UserSchema>;
```

### ESLint Configuration

```javascript
// eslint.config.js
export default [
  {
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // React
      'react/prop-types': 'off',  // Using TypeScript
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // General
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
    }
  }
];
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `RecordDetail.tsx` |
| Hooks | camelCase, `use` prefix | `useMetadata.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `EntityDefs`, `FieldParams` |
| Constants | SCREAMING_SNAKE | `MAX_PAGE_SIZE` |
| Files - components | PascalCase | `VarcharField.tsx` |
| Files - utilities | camelCase | `apiClient.ts` |
| Directories | kebab-case | `dynamic-logic/` |

### Component Patterns

```typescript
// Props interface always defined
interface RecordDetailProps {
  readonly entityType: string;
  readonly recordId: string;
  readonly mode?: 'detail' | 'edit';
  readonly onSave?: (record: EntityRecord) => void;
}

// Destructure props with defaults
export function RecordDetail({
  entityType,
  recordId,
  mode = 'detail',
  onSave,
}: RecordDetailProps): React.ReactElement {
  // Hooks at top
  const { data, isLoading } = useEntity(entityType, recordId);

  // Early returns for loading/error states
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <ErrorMessage message="Record not found" />;
  }

  // Render
  return (
    <div className="record-detail">
      {/* ... */}
    </div>
  );
}
```

### Hook Patterns

```typescript
// Always define return type
interface UseEntityResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useEntity<T extends EntityRecord>(
  entityType: string,
  id: string
): UseEntityResult<T> {
  // Implementation
}
```

### State Management

```typescript
// Zustand store with typed state
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Typed implementation
    }),
    { name: 'auth-storage' }
  )
);

// TanStack Query with explicit types
const { data } = useQuery<User, ApiError>({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});
```

### Error Handling

```typescript
// Custom error types
class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Result type for operations that can fail
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Error boundaries for components
<ErrorBoundary fallback={<ErrorFallback />}>
  <RecordDetail entityType={entityType} recordId={id} />
</ErrorBoundary>
```

### File Organization

```typescript
// Each feature folder structure
features/
  entities/
    components/
      RecordDetail.tsx        // Component
      RecordDetail.test.tsx   // Tests colocated
    hooks/
      useEntity.ts
      useEntityList.ts
    types.ts                  // Feature-specific types
    index.ts                  // Public exports only

// Barrel exports - explicit, no re-exporting everything
// index.ts
export { RecordDetail } from './components/RecordDetail';
export { RecordList } from './components/RecordList';
export { useEntity } from './hooks/useEntity';
export type { EntityRecord } from './types';
```

### Testing Standards

```typescript
// Test file naming: *.test.tsx or *.test.ts
// Colocate with source files

// Describe blocks match component/function name
describe('RecordDetail', () => {
  // Arrange-Act-Assert pattern
  it('displays record data when loaded', async () => {
    // Arrange
    const mockRecord = createMockRecord({ name: 'Test' });
    server.use(mockGetRecord(mockRecord));

    // Act
    render(<RecordDetail entityType="Account" recordId="123" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  // Test edge cases
  it('shows error state when record not found', async () => {});
  it('shows loading state while fetching', async () => {});
});
```

### Import Order

```typescript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. External libraries (alphabetical)
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. Internal aliases (alphabetical)
import { Button } from '@/components/ui/button';
import { useMetadata } from '@/hooks/useMetadata';
import type { EntityRecord } from '@/types';

// 4. Relative imports
import { RecordToolbar } from './RecordToolbar';
import type { RecordDetailProps } from './types';

// 5. Styles (if any)
import './RecordDetail.css';
```

### Comments & Documentation

```typescript
/**
 * Renders a record detail view with dynamic layout based on metadata.
 *
 * @example
 * <RecordDetail
 *   entityType="Account"
 *   recordId="abc123"
 *   mode="detail"
 * />
 */
export function RecordDetail(props: RecordDetailProps): React.ReactElement {
  // Implementation
}

// Inline comments only for non-obvious logic
// Calculate offset for pagination (0-indexed API, 1-indexed UI)
const offset = (page - 1) * pageSize;
```

### Performance Guidelines

- Use `React.memo` for expensive pure components
- Use `useMemo`/`useCallback` only when dependencies are stable
- Virtualize lists with 100+ items (`@tanstack/react-virtual`)
- Code-split routes with `React.lazy`
- Avoid inline object/array creation in JSX props

```typescript
// Bad - creates new object every render
<Component style={{ margin: 10 }} />

// Good - stable reference
const style = { margin: 10 };
<Component style={style} />

// Or with useMemo if dynamic
const style = useMemo(() => ({ margin: size * 2 }), [size]);
```

---

## Project Structure

```
espocrm-react/
├── src/
│   ├── app/                    # App init, routes, providers
│   ├── api/                    # API client (Axios wrapper)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # MainLayout, Navbar, Sidebar
│   │   └── common/             # Shared components
│   ├── features/
│   │   ├── auth/               # Login, auth store (Zustand)
│   │   ├── entities/           # CRUD pages & components
│   │   └── admin/              # Admin section
│   ├── fields/                 # 40+ field type components
│   │   ├── registry.ts         # Field type → component mapping
│   │   ├── FieldRenderer.tsx   # Dynamic field resolution
│   │   ├── text/               # varchar, text, wysiwyg, url
│   │   ├── number/             # int, float, currency
│   │   ├── date/               # date, datetime
│   │   ├── relation/           # link, linkMultiple, linkParent
│   │   ├── selection/          # enum, multiEnum, checklist
│   │   └── special/            # email, phone, address, attachment
│   ├── hooks/                  # useMetadata, useLayout, useAcl
│   ├── lib/
│   │   ├── metadata/           # MetadataContext, types
│   │   ├── acl/                # AclContext, permission checks
│   │   ├── layout/             # LayoutRenderer (JSON → React)
│   │   └── dynamic-logic/      # Conditional field visibility
│   ├── store/                  # TanStack Query client
│   └── types/                  # TypeScript definitions
```

---

## Core Architecture

### 1. API Client (`src/api/client.ts`)
- Axios wrapper with auth token injection
- Maps to EspoCRM REST API: `/api/v1/{EntityType}`
- CRUD: GET/POST/PUT/PATCH/DELETE
- Query params: `maxSize`, `offset`, `orderBy`, `order`, `where`

### 2. Metadata System (`src/lib/metadata/`)
- Fetch from `/api/v1/Metadata` on app init
- Provides: `getEntityDefs()`, `getFieldDefs()`, `getClientDefs()`
- Cached with TanStack Query (`staleTime: Infinity`)

### 3. Layout System (`src/lib/layout/`)
- Fetch layouts: `/api/v1/{EntityType}/layout/{type}`
- `LayoutRenderer` converts JSON panels/rows → React components
- Supports: detail, list, edit, search layouts

### 4. Field System (`src/fields/`)
- Registry pattern: `fieldRegistry['varchar'] = VarcharField`
- `FieldRenderer` resolves field type → component
- Modes: `detail`, `edit`, `list`, `search`
- Each field handles its own rendering per mode

### 5. ACL System (`src/lib/acl/`)
- `checkScope(entityType, action)` - Entity-level permissions
- `checkField(entityType, field, action)` - Field-level permissions
- `checkModel(entityType, record, action)` - Record-level (own/team)

### 6. Dynamic Logic (`src/lib/dynamic-logic/`)
- Process `clientDefs.dynamicLogic` conditions
- Field visibility, required, readOnly based on record values
- Panel visibility and styling

---

## Component Mapping

| Backbone View | React Component |
|---------------|-----------------|
| `views/list` | `EntityListPage` |
| `views/detail` | `EntityDetailPage` |
| `views/edit` | `EntityEditPage` |
| `views/record/list` | `RecordList` |
| `views/record/detail` | `RecordDetail` |
| `views/fields/base` | `BaseField` + type components |
| `views/modal` | Radix Dialog components |

---

## State Management

### TanStack Query Hooks
```typescript
useEntity(entityType, id)           // Single record
useEntityList(entityType, params)   // Collection with pagination
useCreateEntity(entityType)         // POST mutation
useUpdateEntity(entityType, id)     // PUT mutation
useDeleteEntity(entityType)         // DELETE mutation
useRelatedRecords(entityType, id, link)  // Related records
```

### Auth Store (Zustand)
- `user`, `token`, `acl`, `preferences`
- Persisted to localStorage
- `login()`, `logout()`, `initializeAuth()`

---

## Field Types to Implement (40+)

**Priority 1 (Core):**
- varchar, text, int, float, bool, enum, date, datetime, link, linkMultiple, email

**Priority 2 (Common):**
- multiEnum, currency, phone, address, url, wysiwyg, file, image

**Priority 3 (Advanced):**
- linkParent, attachmentMultiple, personName, checklist, colorpicker, map, barcode

---

## Migration Phases

### Phase 1: Foundation (4 weeks)
- [ ] Vite + TypeScript + Tailwind setup
- [ ] API client with auth
- [ ] Login/logout flow
- [ ] Main layout shell (Navbar, Sidebar)
- [ ] Metadata provider
- [ ] Routing matching EspoCRM URL patterns

### Phase 2: Entity Framework (4 weeks)
- [ ] RecordList component with pagination/sorting
- [ ] RecordDetail (read-only)
- [ ] LayoutRenderer for detail views
- [ ] 10 core field types
- [ ] ACL context integration

### Phase 3: Edit Capabilities (4 weeks)
- [ ] RecordEdit with react-hook-form
- [ ] RecordCreate
- [ ] Zod validation from metadata
- [ ] Inline editing
- [ ] All 40+ field types
- [ ] Dynamic logic integration

### Phase 4: Advanced Features (4 weeks)
- [ ] Relationship panels
- [ ] Side panels
- [ ] Activity stream
- [ ] Modal dialogs
- [ ] Mass actions
- [ ] Advanced search/filters

### Phase 5: Admin & Polish (4 weeks)
- [ ] Admin section (Entity Manager, Field Manager)
- [ ] Layout Manager
- [ ] Extension/module support
- [ ] Performance optimization
- [ ] 80%+ test coverage

### Phase 6: Parity & Transition (4 weeks)
- [ ] Feature parity audit
- [ ] Performance benchmarking
- [ ] Documentation
- [ ] Coexistence strategy (run both frontends)

---

## Key Files to Reference

| Purpose | EspoCRM File |
|---------|--------------|
| App init | `client/src/app.js` |
| Base field | `client/src/views/fields/base.js` |
| ACL logic | `client/src/acl-manager.js` |
| Layout manager | `client/src/layout-manager.js` |
| Metadata | `client/src/metadata.js` |
| Field types | `application/Espo/Resources/metadata/fields/*.json` |
| Layouts | `application/Espo/Resources/layouts/` |
| Entity defs | `application/Espo/Resources/metadata/entityDefs/` |

---

## Testing Strategy

- **Unit Tests (Vitest):** Field components, hooks, utilities
- **Integration Tests:** Record components with mocked API
- **E2E Tests (Playwright):** Full CRUD flows, auth, navigation

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Metadata complexity | Start with simple entities, iterate |
| Field type count | Implement incrementally, fallback to varchar |
| Dynamic logic edge cases | Port condition logic directly from source |
| Performance with large lists | Virtual scrolling, pagination |
| Custom module support | Design extension points early |

---

## Success Criteria

1. Feature parity with Backbone frontend
2. All 40+ field types working
3. ACL enforcement matching backend
4. Performance within 10% of original
5. Clean migration path for custom modules
6. Zero `any` types in codebase
7. 80%+ test coverage
