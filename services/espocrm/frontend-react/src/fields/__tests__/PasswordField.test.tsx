/**
 * PasswordField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordField } from '../text/PasswordField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'password', maxLength: 100 };
  return {
    name: 'password',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'User',
    ...overrides,
  };
}

describe('PasswordField', () => {
  describe('detail mode', () => {
    it('shows dash for empty value', () => {
      render(<PasswordField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for empty string', () => {
      render(<PasswordField {...createFieldProps({ value: '' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays masked value', () => {
      render(<PasswordField {...createFieldProps({ value: 'password123' })} />);
      expect(screen.getByText('•••••••••••')).toBeInTheDocument();
    });

    it('limits masked characters to 12', () => {
      render(<PasswordField {...createFieldProps({ value: 'averylongpasswordthatexceeds12characters' })} />);
      expect(screen.getByText('••••••••••••')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for empty value', () => {
      render(<PasswordField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays masked value', () => {
      render(<PasswordField {...createFieldProps({ value: 'secret', mode: 'list' })} />);
      expect(screen.getByText('••••••')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders password input', () => {
      render(<PasswordField {...createFieldProps({ value: '', mode: 'edit' })} />);
      // Password inputs don't have role="textbox", use querySelector
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('displays current value', () => {
      render(<PasswordField {...createFieldProps({ value: 'mypassword', mode: 'edit' })} />);
      const input = document.querySelector('input');
      expect(input).toHaveValue('mypassword');
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      render(<PasswordField {...createFieldProps({ value: '', mode: 'edit', onChange })} />);

      const input = document.querySelector('input');
      fireEvent.change(input!, { target: { value: 'newpassword' } });
      expect(onChange).toHaveBeenCalledWith('newpassword');
    });

    it('toggles password visibility', () => {
      render(<PasswordField {...createFieldProps({ value: 'secret', mode: 'edit' })} />);

      const input = document.querySelector('input');
      expect(input).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      expect(input).toHaveAttribute('type', 'text');

      fireEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('disables input when disabled', () => {
      render(<PasswordField {...createFieldProps({ value: '', mode: 'edit', disabled: true })} />);
      const input = document.querySelector('input');
      expect(input).toBeDisabled();
    });

    it('makes input readonly when readOnly', () => {
      render(<PasswordField {...createFieldProps({ value: '', mode: 'edit', readOnly: true })} />);
      const input = document.querySelector('input');
      expect(input).toHaveAttribute('readonly');
    });

    it('sets autocomplete to new-password', () => {
      render(<PasswordField {...createFieldProps({ value: '', mode: 'edit' })} />);
      const input = document.querySelector('input');
      expect(input).toHaveAttribute('autocomplete', 'new-password');
    });

    it('respects maxLength from fieldDef', () => {
      render(
        <PasswordField
          {...createFieldProps({ value: '', mode: 'edit', fieldDef: { type: 'password', maxLength: 20 } })}
        />
      );
      const input = document.querySelector('input');
      expect(input).toHaveAttribute('maxlength', '20');
    });
  });

  describe('search mode', () => {
    it('shows dash in search mode', () => {
      render(<PasswordField {...createFieldProps({ value: '', mode: 'search' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies className in detail mode', () => {
      const { container } = render(
        <PasswordField {...createFieldProps({ value: 'test', className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies className in edit mode', () => {
      const { container } = render(
        <PasswordField {...createFieldProps({ value: '', mode: 'edit', className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
