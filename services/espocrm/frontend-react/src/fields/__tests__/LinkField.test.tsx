import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LinkField } from '../relation/LinkField';
import type { FieldProps } from '../types';

// Mock useModal hook
const mockSelectRecord = vi.fn();
const mockQuickCreate = vi.fn();

vi.mock('@/components/modals', () => ({
  useModal: () => ({
    selectRecord: mockSelectRecord,
    quickCreate: mockQuickCreate,
  }),
}));

// Helper to render LinkField with required providers
function renderLinkField(props: Partial<FieldProps> = {}) {
  const defaultProps: FieldProps = {
    name: 'account',
    value: null,
    fieldDef: { type: 'link', entity: 'Account' },
    mode: 'detail',
    entityType: 'Contact',
    record: {},
    onChange: undefined,
    disabled: false,
    readOnly: false,
    className: '',
    ...props,
  };

  return render(
    <MemoryRouter>
      <LinkField {...defaultProps} />
    </MemoryRouter>
  );
}

describe('LinkField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detail mode', () => {
    it('displays em-dash when no link', () => {
      renderLinkField({
        value: null,
        mode: 'detail',
        record: {},
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays link name as clickable link', () => {
      renderLinkField({
        mode: 'detail',
        record: {
          accountId: 'acc-001',
          accountName: 'Acme Corp',
        },
      });

      const link = screen.getByRole('link', { name: /Acme Corp/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/Account/view/acc-001');
    });

    it('uses value object when record fields not present', () => {
      renderLinkField({
        value: { id: 'acc-002', name: 'TechStart' },
        mode: 'detail',
        record: {},
      });

      const link = screen.getByRole('link', { name: /TechStart/i });
      expect(link).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('displays em-dash when no link', () => {
      renderLinkField({
        value: null,
        mode: 'list',
        record: {},
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays compact link', () => {
      renderLinkField({
        mode: 'list',
        record: {
          accountId: 'acc-001',
          accountName: 'Acme Corp',
        },
      });

      const link = screen.getByRole('link', { name: 'Acme Corp' });
      expect(link).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    describe('when no value selected', () => {
      it('renders select button', () => {
        renderLinkField({
          mode: 'edit',
          record: {},
        });

        expect(screen.getByText(/Select Account/i)).toBeInTheDocument();
      });

      it('renders quick create button', () => {
        renderLinkField({
          mode: 'edit',
          record: {},
        });

        expect(screen.getByTitle(/Create new Account/i)).toBeInTheDocument();
      });

      it('calls selectRecord when select button clicked', async () => {
        mockSelectRecord.mockResolvedValue({ id: 'acc-new', name: 'New Account' });
        const onChange = vi.fn();

        renderLinkField({
          mode: 'edit',
          record: {},
          onChange,
        });

        const selectButton = screen.getByText(/Select Account/i);
        fireEvent.click(selectButton);

        expect(mockSelectRecord).toHaveBeenCalledWith({
          entityType: 'Account',
          multiple: false,
        });
      });

      it('calls quickCreate when plus button clicked', () => {
        const onChange = vi.fn();

        renderLinkField({
          mode: 'edit',
          record: {},
          onChange,
        });

        const createButton = screen.getByTitle(/Create new Account/i);
        fireEvent.click(createButton);

        expect(mockQuickCreate).toHaveBeenCalledWith({
          entityType: 'Account',
        });
      });

      it('disables buttons when disabled', () => {
        renderLinkField({
          mode: 'edit',
          record: {},
          disabled: true,
        });

        const selectButton = screen.getByText(/Select Account/i).closest('button');
        expect(selectButton).toBeDisabled();
        // Quick create button should not be rendered when disabled
        expect(screen.queryByTitle(/Create new Account/i)).not.toBeInTheDocument();
      });

      it('disables buttons when readOnly', () => {
        renderLinkField({
          mode: 'edit',
          record: {},
          readOnly: true,
        });

        const selectButton = screen.getByText(/Select Account/i).closest('button');
        expect(selectButton).toBeDisabled();
        expect(screen.queryByTitle(/Create new Account/i)).not.toBeInTheDocument();
      });
    });

    describe('when value is selected', () => {
      it('displays selected value as link', () => {
        renderLinkField({
          mode: 'edit',
          record: {
            accountId: 'acc-001',
            accountName: 'Acme Corp',
          },
        });

        const link = screen.getByRole('link', { name: 'Acme Corp' });
        expect(link).toBeInTheDocument();
      });

      it('shows change and clear buttons', () => {
        renderLinkField({
          mode: 'edit',
          record: {
            accountId: 'acc-001',
            accountName: 'Acme Corp',
          },
        });

        expect(screen.getByTitle('Change')).toBeInTheDocument();
        expect(screen.getByTitle('Clear')).toBeInTheDocument();
      });

      it('calls onChange with null when clear clicked', () => {
        const onChange = vi.fn();

        renderLinkField({
          mode: 'edit',
          record: {
            accountId: 'acc-001',
            accountName: 'Acme Corp',
          },
          onChange,
        });

        const clearButton = screen.getByTitle('Clear');
        fireEvent.click(clearButton);

        expect(onChange).toHaveBeenCalledWith({ id: null, name: null });
      });

      it('hides change/clear buttons when disabled', () => {
        renderLinkField({
          mode: 'edit',
          record: {
            accountId: 'acc-001',
            accountName: 'Acme Corp',
          },
          disabled: true,
        });

        expect(screen.queryByTitle('Change')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Clear')).not.toBeInTheDocument();
      });
    });
  });

  describe('search mode', () => {
    it('renders a text input', () => {
      renderLinkField({
        name: 'account',
        mode: 'search',
        record: {},
      });

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search Account...');
    });

    it('calls onChange when text changes', () => {
      const onChange = vi.fn();

      renderLinkField({
        name: 'account',
        mode: 'search',
        record: {},
        onChange,
      });

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Acme' } });

      expect(onChange).toHaveBeenCalledWith('Acme');
    });
  });

  describe('entity type handling', () => {
    it('uses entity from fieldDef', () => {
      renderLinkField({
        mode: 'detail',
        fieldDef: { type: 'link', entity: 'Contact' },
        record: {
          accountId: 'con-001',
          accountName: 'John Doe',
        },
      });

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/Contact/view/con-001');
    });
  });
});
