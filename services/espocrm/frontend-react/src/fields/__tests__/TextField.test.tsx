import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { TextField } from '../text/TextField';
import { renderField } from './testUtils';

describe('TextField', () => {
  describe('detail mode', () => {
    it('displays the value with preserved whitespace', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      renderField(TextField, {
        value: multilineText,
        mode: 'detail',
      });
      // Query by the specific class that wraps the content
      const element = document.querySelector('.whitespace-pre-wrap');
      expect(element).toBeInTheDocument();
      expect(element).toHaveTextContent('Line 1');
      expect(element).toHaveTextContent('Line 2');
      expect(element).toHaveTextContent('Line 3');
    });

    it('displays em-dash for empty value', () => {
      renderField(TextField, {
        value: '',
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(TextField, {
        value: null,
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('displays truncated text for long values', () => {
      const longText = 'A'.repeat(150);
      renderField(TextField, {
        value: longText,
        mode: 'list',
      });
      expect(screen.getByText('A'.repeat(100) + '...')).toBeInTheDocument();
    });

    it('displays full text for short values', () => {
      const shortText = 'Short text';
      renderField(TextField, {
        value: shortText,
        mode: 'list',
      });
      expect(screen.getByText(shortText)).toBeInTheDocument();
    });

    it('displays em-dash for empty value', () => {
      renderField(TextField, {
        value: '',
        mode: 'list',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders a textarea', () => {
      renderField(TextField, {
        name: 'description',
        value: 'Test content',
        mode: 'edit',
      });
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveValue('Test content');
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      renderField(TextField, {
        name: 'description',
        value: '',
        mode: 'edit',
        onChange,
      });

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New text' } });

      expect(onChange).toHaveBeenCalledWith('New text');
    });

    it('respects rows configuration', () => {
      renderField(TextField, {
        name: 'description',
        value: '',
        mode: 'edit',
        fieldDef: {
          type: 'text',
          params: { rows: 8 },
        },
      });

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '8');
    });

    it('uses default 4 rows when not specified', () => {
      renderField(TextField, {
        name: 'description',
        value: '',
        mode: 'edit',
      });

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('can be disabled', () => {
      renderField(TextField, {
        name: 'description',
        value: 'Test',
        mode: 'edit',
        disabled: true,
      });

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('can be read-only', () => {
      renderField(TextField, {
        name: 'description',
        value: 'Test',
        mode: 'edit',
        readOnly: true,
      });

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('readOnly');
    });
  });

  describe('search mode', () => {
    it('renders a search input', () => {
      renderField(TextField, {
        name: 'description',
        value: '',
        mode: 'search',
      });

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search...');
    });

    it('calls onChange when search value changes', () => {
      const onChange = vi.fn();
      renderField(TextField, {
        name: 'description',
        value: '',
        mode: 'search',
        onChange,
      });

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'search term' } });

      expect(onChange).toHaveBeenCalledWith('search term');
    });
  });
});
