/**
 * ForeignField Tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ForeignField } from '../relation/ForeignField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = {
    type: 'foreign',
    link: 'account',
    entity: 'Account',
  };
  return {
    name: 'accountIndustry',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Contact',
    ...overrides,
  };
}

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ForeignField', () => {
  describe('detail mode', () => {
    it('shows dash for null value', () => {
      renderWithRouter(<ForeignField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for empty string', () => {
      renderWithRouter(<ForeignField {...createFieldProps({ value: '' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays value as link when linked record exists', () => {
      renderWithRouter(
        <ForeignField
          {...createFieldProps({
            value: 'Technology',
            record: { accountId: 'acc-123' },
          })}
        />
      );
      const link = screen.getByRole('link', { name: /Technology/ });
      expect(link).toHaveAttribute('href', '/Account/view/acc-123');
    });

    it('displays value as plain text when no linked record', () => {
      renderWithRouter(
        <ForeignField
          {...createFieldProps({
            value: 'Technology',
            record: {},
          })}
        />
      );
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('shows external link icon in detail mode', () => {
      const { container } = renderWithRouter(
        <ForeignField
          {...createFieldProps({
            value: 'Technology',
            record: { accountId: 'acc-123' },
          })}
        />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('displays numeric value', () => {
      renderWithRouter(<ForeignField {...createFieldProps({ value: 12345 })} />);
      expect(screen.getByText('12345')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for null value', () => {
      renderWithRouter(<ForeignField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays value as link when linked record exists', () => {
      renderWithRouter(
        <ForeignField
          {...createFieldProps({
            value: 'Finance',
            mode: 'list',
            record: { accountId: 'acc-456' },
          })}
        />
      );
      const link = screen.getByRole('link', { name: 'Finance' });
      expect(link).toHaveAttribute('href', '/Account/view/acc-456');
    });

    it('does not show external link icon in list mode', () => {
      const { container } = renderWithRouter(
        <ForeignField
          {...createFieldProps({
            value: 'Finance',
            mode: 'list',
            record: { accountId: 'acc-456' },
          })}
        />
      );
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('displays plain text when no link name', () => {
      const fieldDef: FieldDef = {
        type: 'foreign',
        entity: 'Account',
      };
      renderWithRouter(
        <ForeignField
          {...createFieldProps({
            value: 'Value',
            mode: 'list',
            fieldDef,
          })}
        />
      );
      expect(screen.getByText('Value')).toBeInTheDocument();
    });
  });

  describe('without linked entity', () => {
    it('displays plain text when entity is not defined', () => {
      const fieldDef: FieldDef = {
        type: 'foreign',
        link: 'account',
      };
      renderWithRouter(
        <ForeignField
          {...createFieldProps({
            value: 'Text Value',
            fieldDef,
            record: { accountId: 'acc-123' },
          })}
        />
      );
      expect(screen.getByText('Text Value')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className to link', () => {
      const { container } = renderWithRouter(
        <ForeignField
          {...createFieldProps({
            value: 'Technology',
            record: { accountId: 'acc-123' },
            className: 'custom-class',
          })}
        />
      );
      const link = container.querySelector('a');
      expect(link).toHaveClass('custom-class');
    });

    it('applies custom className to empty state', () => {
      const { container } = renderWithRouter(
        <ForeignField {...createFieldProps({ value: null, className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom className to plain text', () => {
      const { container } = renderWithRouter(
        <ForeignField {...createFieldProps({ value: 'Text', className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
