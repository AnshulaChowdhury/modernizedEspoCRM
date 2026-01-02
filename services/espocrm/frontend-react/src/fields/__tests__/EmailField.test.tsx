import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { EmailField } from '../special/EmailField';
import { renderField, testValues } from './testUtils';

describe('EmailField', () => {
  describe('detail mode', () => {
    it('displays email as mailto link', () => {
      renderField(EmailField, {
        value: testValues.sampleEmail,
        mode: 'detail',
      });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', `mailto:${testValues.sampleEmail}`);
      expect(link).toHaveTextContent(testValues.sampleEmail);
    });

    it('displays em-dash for empty value', () => {
      renderField(EmailField, {
        value: '',
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(EmailField, {
        value: null,
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('handles EspoCRM email array format', () => {
      const emailArray = [
        { emailAddress: 'primary@example.com', primary: true },
        { emailAddress: 'secondary@example.com', primary: false },
      ];
      renderField(EmailField, {
        value: emailArray,
        mode: 'detail',
      });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'mailto:primary@example.com');
    });

    it('uses first email when no primary is set', () => {
      const emailArray = [
        { emailAddress: 'first@example.com', primary: false },
        { emailAddress: 'second@example.com', primary: false },
      ];
      renderField(EmailField, {
        value: emailArray,
        mode: 'detail',
      });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'mailto:first@example.com');
    });
  });

  describe('list mode', () => {
    it('displays email as compact link', () => {
      renderField(EmailField, {
        value: testValues.sampleEmail,
        mode: 'list',
      });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', `mailto:${testValues.sampleEmail}`);
      expect(link).toHaveClass('text-sm');
    });

    it('displays em-dash for empty value', () => {
      renderField(EmailField, {
        value: '',
        mode: 'list',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders an email input', () => {
      renderField(EmailField, {
        name: 'email',
        value: testValues.sampleEmail,
        mode: 'edit',
      });
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveValue(testValues.sampleEmail);
    });

    it('shows placeholder', () => {
      renderField(EmailField, {
        name: 'email',
        value: '',
        mode: 'edit',
      });
      const input = screen.getByPlaceholderText('email@example.com');
      expect(input).toBeInTheDocument();
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      renderField(EmailField, {
        name: 'email',
        value: '',
        mode: 'edit',
        onChange,
      });

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new@email.com' } });

      expect(onChange).toHaveBeenCalledWith('new@email.com');
    });

    it('can be disabled', () => {
      renderField(EmailField, {
        name: 'email',
        value: testValues.sampleEmail,
        mode: 'edit',
        disabled: true,
      });

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('can be read-only', () => {
      renderField(EmailField, {
        name: 'email',
        value: testValues.sampleEmail,
        mode: 'edit',
        readOnly: true,
      });

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readOnly');
    });
  });

  describe('search mode', () => {
    it('renders a text search input', () => {
      renderField(EmailField, {
        name: 'email',
        value: '',
        mode: 'search',
      });

      const input = screen.getByPlaceholderText('Search email...');
      expect(input).toBeInTheDocument();
    });

    it('calls onChange when search value changes', () => {
      const onChange = vi.fn();
      renderField(EmailField, {
        name: 'email',
        value: '',
        mode: 'search',
        onChange,
      });

      const input = screen.getByPlaceholderText('Search email...');
      fireEvent.change(input, { target: { value: '@gmail.com' } });

      expect(onChange).toHaveBeenCalledWith('@gmail.com');
    });
  });
});
