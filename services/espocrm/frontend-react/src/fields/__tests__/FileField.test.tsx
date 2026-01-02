/**
 * FileField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileField } from '../file/FileField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'file' };
  return {
    name: 'attachment',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Document',
    ...overrides,
  };
}

describe('FileField', () => {
  describe('detail mode', () => {
    it('shows dash for null value', () => {
      render(<FileField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays file name with link', () => {
      render(
        <FileField
          {...createFieldProps({
            value: { id: 'file-123', name: 'document.pdf' },
          })}
        />
      );
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      const link = screen.getByRole('link', { name: 'document.pdf' });
      expect(link).toHaveAttribute('href', '/api/v1/Attachment/file/file-123');
    });

    it('opens link in new tab', () => {
      render(
        <FileField
          {...createFieldProps({
            value: { id: 'file-123', name: 'document.pdf' },
          })}
        />
      );
      const link = screen.getByRole('link', { name: 'document.pdf' });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('displays file size when available', () => {
      render(
        <FileField
          {...createFieldProps({
            value: { id: 'file-123', name: 'document.pdf', size: 1024000 },
          })}
        />
      );
      expect(screen.getByText('(1000.0 KB)')).toBeInTheDocument();
    });

    it('shows download button', () => {
      const { container } = render(
        <FileField
          {...createFieldProps({
            value: { id: 'file-123', name: 'document.pdf' },
          })}
        />
      );
      // Should have a download link
      const downloadLinks = container.querySelectorAll('a');
      expect(downloadLinks.length).toBe(2); // View and download
    });

    it('handles string ID value', () => {
      render(<FileField {...createFieldProps({ value: 'file-123' })} />);
      expect(screen.getByText('File')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for null value', () => {
      render(<FileField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays compact file link', () => {
      render(
        <FileField
          {...createFieldProps({
            value: { id: 'file-123', name: 'report.docx' },
            mode: 'list',
          })}
        />
      );
      const link = screen.getByRole('link', { name: /report\.docx/ });
      expect(link).toHaveAttribute('href', '/api/v1/Attachment/file/file-123');
    });

    it('stops click propagation', () => {
      const parentHandler = vi.fn();
      render(
        <div onClick={parentHandler}>
          <FileField
            {...createFieldProps({
              value: { id: 'file-123', name: 'report.docx' },
              mode: 'list',
            })}
          />
        </div>
      );
      const link = screen.getByRole('link');
      fireEvent.click(link);
      expect(parentHandler).not.toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    it('renders upload button when no file', () => {
      render(<FileField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByText('Choose File')).toBeInTheDocument();
    });

    it('hides file input', () => {
      const { container } = render(<FileField {...createFieldProps({ value: null, mode: 'edit' })} />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveClass('hidden');
    });

    it('displays file info when file selected', () => {
      render(
        <FileField
          {...createFieldProps({
            value: { id: 'file-123', name: 'document.pdf', size: 512000 },
            mode: 'edit',
          })}
        />
      );
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('500.0 KB')).toBeInTheDocument();
    });

    it('shows remove button when file exists', () => {
      const { container } = render(
        <FileField
          {...createFieldProps({
            value: { id: 'file-123', name: 'document.pdf' },
            mode: 'edit',
          })}
        />
      );
      const removeButton = container.querySelector('button');
      expect(removeButton).toBeInTheDocument();
    });

    it('calls onChange with null when remove clicked', () => {
      const onChange = vi.fn();
      const { container } = render(
        <FileField
          {...createFieldProps({
            value: { id: 'file-123', name: 'document.pdf' },
            mode: 'edit',
            onChange,
          })}
        />
      );
      const removeButton = container.querySelector('button');
      if (removeButton) fireEvent.click(removeButton);
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('hides remove button when disabled', () => {
      render(
        <FileField
          {...createFieldProps({
            value: { id: 'file-123', name: 'document.pdf' },
            mode: 'edit',
            disabled: true,
          })}
        />
      );
      // Should not have a remove button (X)
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });

    it('hides remove button when readOnly', () => {
      render(
        <FileField
          {...createFieldProps({
            value: { id: 'file-123', name: 'document.pdf' },
            mode: 'edit',
            readOnly: true,
          })}
        />
      );
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });

    it('disables upload button when disabled', () => {
      render(<FileField {...createFieldProps({ value: null, mode: 'edit', disabled: true })} />);
      expect(screen.getByText('Choose File').closest('button')).toBeDisabled();
    });

    it('disables upload button when readOnly', () => {
      render(<FileField {...createFieldProps({ value: null, mode: 'edit', readOnly: true })} />);
      expect(screen.getByText('Choose File').closest('button')).toBeDisabled();
    });
  });

  describe('search mode', () => {
    it('shows dash (files not searchable)', () => {
      render(<FileField {...createFieldProps({ value: null, mode: 'search' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('file size formatting', () => {
    it('formats bytes correctly', () => {
      render(
        <FileField
          {...createFieldProps({
            value: { id: '1', name: 'small.txt', size: 500 },
          })}
        />
      );
      expect(screen.getByText('(500.0 B)')).toBeInTheDocument();
    });

    it('formats kilobytes correctly', () => {
      render(
        <FileField
          {...createFieldProps({
            value: { id: '1', name: 'medium.txt', size: 2048 },
          })}
        />
      );
      expect(screen.getByText('(2.0 KB)')).toBeInTheDocument();
    });

    it('formats megabytes correctly', () => {
      render(
        <FileField
          {...createFieldProps({
            value: { id: '1', name: 'large.zip', size: 5242880 },
          })}
        />
      );
      expect(screen.getByText('(5.0 MB)')).toBeInTheDocument();
    });

    it('formats gigabytes correctly', () => {
      render(
        <FileField
          {...createFieldProps({
            value: { id: '1', name: 'huge.iso', size: 1073741824 },
          })}
        />
      );
      expect(screen.getByText('(1.0 GB)')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className in detail mode', () => {
      const { container } = render(
        <FileField
          {...createFieldProps({
            value: { id: '1', name: 'test.pdf' },
            className: 'custom-class',
          })}
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom className in empty state', () => {
      const { container } = render(
        <FileField {...createFieldProps({ value: null, className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
