/**
 * AttachmentMultipleField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttachmentMultipleField } from '../file/AttachmentMultipleField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'attachmentMultiple' };
  return {
    name: 'attachments',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Email',
    ...overrides,
  };
}

const mockAttachments = [
  { id: 'file-1', name: 'document.pdf', size: 1024000 },
  { id: 'file-2', name: 'image.png', size: 512000 },
  { id: 'file-3', name: 'spreadsheet.xlsx', size: 2048000 },
];

describe('AttachmentMultipleField', () => {
  describe('detail mode', () => {
    it('shows dash for empty array', () => {
      render(<AttachmentMultipleField {...createFieldProps({ value: [] })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for null value', () => {
      render(<AttachmentMultipleField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays all attachments', () => {
      render(<AttachmentMultipleField {...createFieldProps({ value: mockAttachments })} />);
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('image.png')).toBeInTheDocument();
      expect(screen.getByText('spreadsheet.xlsx')).toBeInTheDocument();
    });

    it('shows file sizes', () => {
      render(<AttachmentMultipleField {...createFieldProps({ value: mockAttachments })} />);
      expect(screen.getByText('1000.0 KB')).toBeInTheDocument();
      expect(screen.getByText('500.0 KB')).toBeInTheDocument();
      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });

    it('renders download links for each file', () => {
      render(<AttachmentMultipleField {...createFieldProps({ value: mockAttachments })} />);
      const links = screen.getAllByRole('link');
      // Each file has a name link and a download link
      expect(links.length).toBe(6); // 3 files × 2 links each
    });

    it('links to correct download URLs', () => {
      render(<AttachmentMultipleField {...createFieldProps({ value: mockAttachments })} />);
      const documentLink = screen.getByRole('link', { name: 'document.pdf' });
      expect(documentLink).toHaveAttribute('href', '/api/v1/Attachment/file/file-1');
    });

    it('opens links in new tab', () => {
      render(<AttachmentMultipleField {...createFieldProps({ value: mockAttachments })} />);
      const link = screen.getByRole('link', { name: 'document.pdf' });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('list mode', () => {
    it('shows dash for empty array', () => {
      render(<AttachmentMultipleField {...createFieldProps({ value: [], mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows file count for single file', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: [{ id: 'file-1', name: 'test.pdf' }],
            mode: 'list',
          })}
        />
      );
      expect(screen.getByText('1 file')).toBeInTheDocument();
    });

    it('shows file count for multiple files (plural)', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: mockAttachments,
            mode: 'list',
          })}
        />
      );
      expect(screen.getByText('3 files')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders add files button', () => {
      render(<AttachmentMultipleField {...createFieldProps({ value: [], mode: 'edit' })} />);
      expect(screen.getByText('Add Files')).toBeInTheDocument();
    });

    it('hides file input', () => {
      const { container } = render(
        <AttachmentMultipleField {...createFieldProps({ value: [], mode: 'edit' })} />
      );
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveClass('hidden');
    });

    it('allows multiple file selection', () => {
      const { container } = render(
        <AttachmentMultipleField {...createFieldProps({ value: [], mode: 'edit' })} />
      );
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('multiple');
    });

    it('displays existing attachments', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: mockAttachments,
            mode: 'edit',
          })}
        />
      );
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('image.png')).toBeInTheDocument();
    });

    it('shows file sizes in edit mode', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: mockAttachments,
            mode: 'edit',
          })}
        />
      );
      expect(screen.getByText('1000.0 KB')).toBeInTheDocument();
    });

    it('shows remove button for each file', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: mockAttachments,
            mode: 'edit',
          })}
        />
      );
      // Remove buttons don't have text, "Add Files" button does
      const removeButtons = screen.getAllByRole('button').filter(
        (btn) => !btn.textContent?.includes('Add Files')
      );
      expect(removeButtons.length).toBe(3);
    });

    it('calls onChange when file removed', () => {
      const onChange = vi.fn();
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: mockAttachments,
            mode: 'edit',
            onChange,
          })}
        />
      );

      // Find the first remove button (X icon button, not Add Files)
      const firstFileContainer = screen.getByText('document.pdf').parentElement;
      const removeButton = firstFileContainer?.querySelector('button');
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      expect(onChange).toHaveBeenCalledWith([
        { id: 'file-2', name: 'image.png', size: 512000 },
        { id: 'file-3', name: 'spreadsheet.xlsx', size: 2048000 },
      ]);
    });

    it('hides remove buttons when disabled', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: mockAttachments,
            mode: 'edit',
            disabled: true,
          })}
        />
      );
      // Only the Add Files button should exist (no remove buttons)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(1);
      expect(buttons[0]).toHaveTextContent('Add Files');
    });

    it('hides remove buttons when readOnly', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: mockAttachments,
            mode: 'edit',
            readOnly: true,
          })}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(1);
    });

    it('disables add button when disabled', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: [],
            mode: 'edit',
            disabled: true,
          })}
        />
      );
      expect(screen.getByText('Add Files').closest('button')).toBeDisabled();
    });

    it('disables add button when readOnly', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: [],
            mode: 'edit',
            readOnly: true,
          })}
        />
      );
      expect(screen.getByText('Add Files').closest('button')).toBeDisabled();
    });
  });

  describe('search mode', () => {
    it('shows dash (attachments not searchable)', () => {
      render(<AttachmentMultipleField {...createFieldProps({ value: [], mode: 'search' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('default rendering', () => {
    it('shows file count for unknown mode', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: mockAttachments,
            mode: undefined,
          })}
        />
      );
      expect(screen.getByText('3 file(s)')).toBeInTheDocument();
    });
  });

  describe('file size formatting', () => {
    it('formats bytes correctly', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: [{ id: '1', name: 'small.txt', size: 500 }],
          })}
        />
      );
      expect(screen.getByText('500.0 B')).toBeInTheDocument();
    });

    it('formats kilobytes correctly', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: [{ id: '1', name: 'medium.txt', size: 2048 }],
          })}
        />
      );
      expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    });

    it('formats megabytes correctly', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: [{ id: '1', name: 'large.zip', size: 5242880 }],
          })}
        />
      );
      expect(screen.getByText('5.0 MB')).toBeInTheDocument();
    });

    it('formats gigabytes correctly', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: [{ id: '1', name: 'huge.iso', size: 1073741824 }],
          })}
        />
      );
      expect(screen.getByText('1.0 GB')).toBeInTheDocument();
    });

    it('handles files without size', () => {
      render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: [{ id: '1', name: 'nosize.txt' }],
          })}
        />
      );
      expect(screen.getByText('nosize.txt')).toBeInTheDocument();
      // Should not crash and not show size
    });
  });

  describe('className prop', () => {
    it('applies custom className in detail mode', () => {
      const { container } = render(
        <AttachmentMultipleField
          {...createFieldProps({
            value: mockAttachments,
            className: 'custom-class',
          })}
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom className in empty state', () => {
      const { container } = render(
        <AttachmentMultipleField {...createFieldProps({ value: [], className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
