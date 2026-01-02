/**
 * WysiwygField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WysiwygField } from '../text/WysiwygField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'wysiwyg' };
  return {
    name: 'description',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Article',
    ...overrides,
  };
}

describe('WysiwygField', () => {
  describe('detail mode', () => {
    it('shows dash for null value', () => {
      render(<WysiwygField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for empty string', () => {
      render(<WysiwygField {...createFieldProps({ value: '' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders HTML content', () => {
      render(<WysiwygField {...createFieldProps({ value: '<p>Hello <strong>World</strong></p>' })} />);
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('World')).toBeInTheDocument();
    });

    it('applies prose styling class', () => {
      const { container } = render(
        <WysiwygField {...createFieldProps({ value: '<p>Content</p>' })} />
      );
      expect(container.firstChild).toHaveClass('prose');
    });

    it('renders nested HTML elements', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      render(<WysiwygField {...createFieldProps({ value: html })} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for null value', () => {
      render(<WysiwygField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for empty string', () => {
      render(<WysiwygField {...createFieldProps({ value: '', mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('strips HTML tags for display', () => {
      render(
        <WysiwygField {...createFieldProps({ value: '<p><strong>Bold</strong> text</p>', mode: 'list' })} />
      );
      expect(screen.getByText('Bold text')).toBeInTheDocument();
    });

    it('truncates long content to 100 characters', () => {
      const longText = '<p>' + 'A'.repeat(150) + '</p>';
      render(<WysiwygField {...createFieldProps({ value: longText, mode: 'list' })} />);
      const content = screen.getByText(/A{100}/);
      expect(content.textContent).toHaveLength(103); // 100 chars + "..."
    });

    it('does not truncate short content', () => {
      render(<WysiwygField {...createFieldProps({ value: '<p>Short text</p>', mode: 'list' })} />);
      expect(screen.getByText('Short text')).toBeInTheDocument();
    });

    it('shows dash when content is only HTML tags with no text', () => {
      render(<WysiwygField {...createFieldProps({ value: '<p><br/></p>', mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders textarea', () => {
      render(<WysiwygField {...createFieldProps({ value: '', mode: 'edit' })} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('populates textarea with existing value', () => {
      render(<WysiwygField {...createFieldProps({ value: '<p>Content</p>', mode: 'edit' })} />);
      expect(screen.getByDisplayValue('<p>Content</p>')).toBeInTheDocument();
    });

    it('shows placeholder', () => {
      render(<WysiwygField {...createFieldProps({ value: '', mode: 'edit' })} />);
      expect(screen.getByPlaceholderText(/Enter content/)).toBeInTheDocument();
    });

    it('shows HTML support hint', () => {
      render(<WysiwygField {...createFieldProps({ value: '', mode: 'edit' })} />);
      expect(screen.getByText('HTML formatting is supported')).toBeInTheDocument();
    });

    it('calls onChange on input', () => {
      const onChange = vi.fn();
      render(<WysiwygField {...createFieldProps({ value: '', mode: 'edit', onChange })} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: '<p>New content</p>' },
      });

      expect(onChange).toHaveBeenCalledWith('<p>New content</p>');
    });

    it('disables textarea when disabled', () => {
      render(<WysiwygField {...createFieldProps({ value: '', mode: 'edit', disabled: true })} />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('makes textarea readonly when readOnly', () => {
      render(<WysiwygField {...createFieldProps({ value: '', mode: 'edit', readOnly: true })} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('has minimum height', () => {
      render(<WysiwygField {...createFieldProps({ value: '', mode: 'edit' })} />);
      expect(screen.getByRole('textbox')).toHaveClass('min-h-[120px]');
    });

    it('has 8 rows by default', () => {
      render(<WysiwygField {...createFieldProps({ value: '', mode: 'edit' })} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8');
    });
  });

  describe('search mode', () => {
    it('renders search input', () => {
      render(<WysiwygField {...createFieldProps({ value: '', mode: 'search' })} />);
      expect(screen.getByPlaceholderText('Search content...')).toBeInTheDocument();
    });

    it('calls onChange on search input', () => {
      const onChange = vi.fn();
      render(<WysiwygField {...createFieldProps({ value: '', mode: 'search', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('Search content...'), {
        target: { value: 'keyword' },
      });

      expect(onChange).toHaveBeenCalledWith('keyword');
    });
  });

  describe('className prop', () => {
    it('applies custom className in detail mode', () => {
      const { container } = render(
        <WysiwygField {...createFieldProps({ value: '<p>Content</p>', className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom className in empty state', () => {
      const { container } = render(
        <WysiwygField {...createFieldProps({ value: null, className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
