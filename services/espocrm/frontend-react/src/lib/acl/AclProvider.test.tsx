/**
 * AclProvider Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AclProvider } from './AclProvider';
import { useAcl } from './useAcl';
import { useAuthStore } from '@/features/auth/store';
import type { AclData } from './types';

// Mock the auth store
vi.mock('@/features/auth/store', () => ({
  useAuthStore: vi.fn(),
}));

// Test component that uses ACL context
function TestComponent({ testCase }: { testCase: string }) {
  const acl = useAcl();

  switch (testCase) {
    case 'checkScope':
      return (
        <div data-testid="result">
          {acl.checkScope('Account', 'read') ? 'can-read' : 'cannot-read'}
        </div>
      );
    case 'checkModel':
      return (
        <div data-testid="result">
          {acl.checkModel('Account', { id: '1', assignedUserId: 'user-1' }, 'edit')
            ? 'can-edit'
            : 'cannot-edit'}
        </div>
      );
    case 'checkField':
      return (
        <div data-testid="result">
          {acl.checkField('Account', 'name', 'edit') ? 'can-edit-field' : 'cannot-edit-field'}
        </div>
      );
    case 'checkScopeEnabled':
      return (
        <div data-testid="result">
          {acl.checkScopeEnabled('Account') ? 'enabled' : 'disabled'}
        </div>
      );
    case 'isLoading':
      return <div data-testid="result">{acl.isLoading ? 'loading' : 'ready'}</div>;
    default:
      return null;
  }
}

describe('AclProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('admin user', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'admin-1', isAdmin: true },
        acl: null,
        isAuthenticated: true,
      });
    });

    it('should allow all scope actions for admin', () => {
      render(
        <AclProvider>
          <TestComponent testCase="checkScope" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-read');
    });

    it('should allow all model actions for admin', () => {
      render(
        <AclProvider>
          <TestComponent testCase="checkModel" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-edit');
    });

    it('should allow all field actions for admin', () => {
      render(
        <AclProvider>
          <TestComponent testCase="checkField" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-edit-field');
    });

    it('should enable all scopes for admin', () => {
      render(
        <AclProvider>
          <TestComponent testCase="checkScopeEnabled" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('enabled');
    });
  });

  describe('regular user with boolean permissions', () => {
    beforeEach(() => {
      const aclData: AclData = {
        table: {
          Account: { read: true, create: true, edit: false, delete: false },
          Contact: { read: true, create: false, edit: true, delete: false },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: aclData,
        isAuthenticated: true,
      });
    });

    it('should allow permitted scope actions', () => {
      render(
        <AclProvider>
          <TestComponent testCase="checkScope" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-read');
    });

    it('should deny non-permitted scope actions', () => {
      // Create a test component that checks edit permission
      function TestEdit() {
        const acl = useAcl();
        return (
          <div data-testid="result">
            {acl.checkScope('Account', 'edit') ? 'can-edit' : 'cannot-edit'}
          </div>
        );
      }
      render(
        <AclProvider>
          <TestEdit />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('cannot-edit');
    });
  });

  describe('regular user with level-based permissions', () => {
    const baseAcl: AclData = {
      table: {
        Account: { read: 'all', edit: 'team', delete: 'own' },
      },
    };

    it('should allow "all" level permissions', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: baseAcl,
        isAuthenticated: true,
      });

      render(
        <AclProvider>
          <TestComponent testCase="checkScope" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-read');
    });

    it('should allow "team" level for scope check (any non-"no" level)', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: baseAcl,
        isAuthenticated: true,
      });

      function TestTeam() {
        const acl = useAcl();
        return (
          <div data-testid="result">
            {acl.checkScope('Account', 'edit') ? 'can-edit' : 'cannot-edit'}
          </div>
        );
      }
      render(
        <AclProvider>
          <TestTeam />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-edit');
    });

    it('should deny "no" level permissions', () => {
      const aclWithNo: AclData = {
        table: {
          Account: { read: 'no', edit: 'no' },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: aclWithNo,
        isAuthenticated: true,
      });

      render(
        <AclProvider>
          <TestComponent testCase="checkScope" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('cannot-read');
    });
  });

  describe('checkModel with level-based permissions', () => {
    it('should allow "all" level on any record', () => {
      const aclData: AclData = {
        table: {
          Account: { edit: 'all' },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: aclData,
        isAuthenticated: true,
      });

      render(
        <AclProvider>
          <TestComponent testCase="checkModel" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-edit');
    });

    it('should allow "team" level when user is on same team', () => {
      const aclData: AclData = {
        table: {
          Account: { edit: 'team' },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false, teamsIds: ['team-1', 'team-2'] },
        acl: aclData,
        isAuthenticated: true,
      });

      function TestTeamModel() {
        const acl = useAcl();
        const record = { id: '1', teamsIds: ['team-1', 'team-3'] }; // Overlaps on team-1
        return (
          <div data-testid="result">
            {acl.checkModel('Account', record, 'edit') ? 'can-edit' : 'cannot-edit'}
          </div>
        );
      }
      render(
        <AclProvider>
          <TestTeamModel />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-edit');
    });

    it('should deny "team" level when user is not on same team', () => {
      const aclData: AclData = {
        table: {
          Account: { edit: 'team' },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false, teamsIds: ['team-1', 'team-2'] },
        acl: aclData,
        isAuthenticated: true,
      });

      function TestTeamModel() {
        const acl = useAcl();
        const record = { id: '1', teamsIds: ['team-3', 'team-4'] }; // No overlap
        return (
          <div data-testid="result">
            {acl.checkModel('Account', record, 'edit') ? 'can-edit' : 'cannot-edit'}
          </div>
        );
      }
      render(
        <AclProvider>
          <TestTeamModel />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('cannot-edit');
    });

    it('should allow "own" level when user owns the record (assignedUserId)', () => {
      const aclData: AclData = {
        table: {
          Account: { edit: 'own' },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: aclData,
        isAuthenticated: true,
      });

      render(
        <AclProvider>
          <TestComponent testCase="checkModel" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-edit');
    });

    it('should allow "own" level when user created the record', () => {
      const aclData: AclData = {
        table: {
          Account: { edit: 'own' },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: aclData,
        isAuthenticated: true,
      });

      function TestOwnCreated() {
        const acl = useAcl();
        const record = { id: '1', createdById: 'user-1' };
        return (
          <div data-testid="result">
            {acl.checkModel('Account', record, 'edit') ? 'can-edit' : 'cannot-edit'}
          </div>
        );
      }
      render(
        <AclProvider>
          <TestOwnCreated />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-edit');
    });

    it('should deny "own" level when user does not own the record', () => {
      const aclData: AclData = {
        table: {
          Account: { edit: 'own' },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: aclData,
        isAuthenticated: true,
      });

      function TestNotOwn() {
        const acl = useAcl();
        const record = { id: '1', assignedUserId: 'user-2', createdById: 'user-2' };
        return (
          <div data-testid="result">
            {acl.checkModel('Account', record, 'edit') ? 'can-edit' : 'cannot-edit'}
          </div>
        );
      }
      render(
        <AclProvider>
          <TestNotOwn />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('cannot-edit');
    });
  });

  describe('checkField', () => {
    it('should allow field access when fieldTable says yes', () => {
      const aclData: AclData = {
        table: {
          Account: { read: true, edit: true },
        },
        fieldTable: {
          Account: {
            name: 'yes',
            website: 'read',
            privateNotes: 'no',
          },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: aclData,
        isAuthenticated: true,
      });

      render(
        <AclProvider>
          <TestComponent testCase="checkField" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-edit-field');
    });

    it('should deny field edit when fieldTable says read-only', () => {
      const aclData: AclData = {
        table: {
          Account: { read: true, edit: true },
        },
        fieldTable: {
          Account: {
            website: 'read',
          },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: aclData,
        isAuthenticated: true,
      });

      function TestFieldReadOnly() {
        const acl = useAcl();
        return (
          <div data-testid="result">
            {acl.checkField('Account', 'website', 'edit') ? 'can-edit' : 'cannot-edit'}
          </div>
        );
      }
      render(
        <AclProvider>
          <TestFieldReadOnly />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('cannot-edit');
    });

    it('should allow field read when fieldTable says read', () => {
      const aclData: AclData = {
        table: {
          Account: { read: true, edit: true },
        },
        fieldTable: {
          Account: {
            website: 'read',
          },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: aclData,
        isAuthenticated: true,
      });

      function TestFieldRead() {
        const acl = useAcl();
        return (
          <div data-testid="result">
            {acl.checkField('Account', 'website', 'read') ? 'can-read' : 'cannot-read'}
          </div>
        );
      }
      render(
        <AclProvider>
          <TestFieldRead />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-read');
    });

    it('should deny field access when fieldTable says no', () => {
      const aclData: AclData = {
        table: {
          Account: { read: true, edit: true },
        },
        fieldTable: {
          Account: {
            privateNotes: 'no',
          },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: aclData,
        isAuthenticated: true,
      });

      function TestFieldNo() {
        const acl = useAcl();
        return (
          <div data-testid="result">
            {acl.checkField('Account', 'privateNotes', 'read') ? 'can-read' : 'cannot-read'}
          </div>
        );
      }
      render(
        <AclProvider>
          <TestFieldNo />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('cannot-read');
    });

    it('should fall back to scope permission when no field ACL defined', () => {
      const aclData: AclData = {
        table: {
          Account: { read: true, edit: true },
        },
        // No fieldTable for Account
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: aclData,
        isAuthenticated: true,
      });

      function TestFieldDefault() {
        const acl = useAcl();
        return (
          <div data-testid="result">
            {acl.checkField('Account', 'anyField', 'edit') ? 'can-edit' : 'cannot-edit'}
          </div>
        );
      }
      render(
        <AclProvider>
          <TestFieldDefault />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('can-edit');
    });
  });

  describe('edge cases', () => {
    it('should deny access when no ACL table exists', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: {},
        isAuthenticated: true,
      });

      render(
        <AclProvider>
          <TestComponent testCase="checkScope" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('cannot-read');
    });

    it('should deny access when entity type not in ACL', () => {
      const aclData: AclData = {
        table: {
          Contact: { read: true },
        },
      };
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: false },
        acl: aclData,
        isAuthenticated: true,
      });

      render(
        <AclProvider>
          <TestComponent testCase="checkScope" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('cannot-read');
    });

    it('should show loading state when not authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        acl: null,
        isAuthenticated: false,
      });

      render(
        <AclProvider>
          <TestComponent testCase="isLoading" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('loading');
    });

    it('should show ready state when authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', isAdmin: true },
        acl: null,
        isAuthenticated: true,
      });

      render(
        <AclProvider>
          <TestComponent testCase="isLoading" />
        </AclProvider>
      );
      expect(screen.getByTestId('result')).toHaveTextContent('ready');
    });
  });
});
