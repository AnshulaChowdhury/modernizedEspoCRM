/**
 * BarcodeField Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BarcodeField } from '../special/BarcodeField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'barcode' };
  return {
    name: 'barcode',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Product',
    ...overrides,
  };
}

// Mock clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('BarcodeField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
  });

  describe('detail mode', () => {
    it('shows dash for null value', () => {
      render(<BarcodeField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for empty string', () => {
      render(<BarcodeField {...createFieldProps({ value: '' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays barcode value', () => {
      render(<BarcodeField {...createFieldProps({ value: 'ABC123456' })} />);
      expect(screen.getAllByText('ABC123456')).toHaveLength(2); // In visual and text
    });

    it('shows barcode type from field params', () => {
      const fieldDef: FieldDef = {
        type: 'barcode',
        params: { codeType: 'EAN13' },
      };
      render(<BarcodeField {...createFieldProps({ value: '1234567890123', fieldDef })} />);
      expect(screen.getByText('(EAN13)')).toBeInTheDocument();
    });

    it('shows default CODE128 type when not specified', () => {
      render(<BarcodeField {...createFieldProps({ value: 'TEST123' })} />);
      expect(screen.getByText('(CODE128)')).toBeInTheDocument();
    });

    it('has copy button', () => {
      render(<BarcodeField {...createFieldProps({ value: 'ABC123' })} />);
      expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument();
    });

    it('copies value to clipboard when copy button clicked', async () => {
      render(<BarcodeField {...createFieldProps({ value: 'ABC123' })} />);
      const copyButton = screen.getByTitle('Copy to clipboard');
      fireEvent.click(copyButton);
      expect(mockWriteText).toHaveBeenCalledWith('ABC123');
    });

    it('generates barcode bars for each character', () => {
      const { container } = render(<BarcodeField {...createFieldProps({ value: 'AB' })} />);
      // Should have bars for each character
      const bars = container.querySelectorAll('.bg-black');
      expect(bars.length).toBe(2);
    });
  });

  describe('list mode', () => {
    it('shows dash for null value', () => {
      render(<BarcodeField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays barcode value with icon', () => {
      render(<BarcodeField {...createFieldProps({ value: 'SKU-001', mode: 'list' })} />);
      expect(screen.getByText('SKU-001')).toBeInTheDocument();
    });

    it('applies font-mono class', () => {
      const { container } = render(<BarcodeField {...createFieldProps({ value: 'SKU-001', mode: 'list' })} />);
      expect(container.firstChild).toHaveClass('font-mono');
    });
  });

  describe('edit mode', () => {
    it('renders text input', () => {
      render(<BarcodeField {...createFieldProps({ value: '', mode: 'edit' })} />);
      expect(screen.getByPlaceholderText('Enter barcode...')).toBeInTheDocument();
    });

    it('populates input with existing value', () => {
      render(<BarcodeField {...createFieldProps({ value: 'ABC123', mode: 'edit' })} />);
      expect(screen.getByDisplayValue('ABC123')).toBeInTheDocument();
    });

    it('calls onChange with uppercase value', () => {
      const onChange = vi.fn();
      render(<BarcodeField {...createFieldProps({ value: '', mode: 'edit', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('Enter barcode...'), {
        target: { value: 'abc123' },
      });

      expect(onChange).toHaveBeenCalledWith('ABC123');
    });

    it('shows copy button when value exists', () => {
      render(<BarcodeField {...createFieldProps({ value: 'ABC123', mode: 'edit' })} />);
      expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument();
    });

    it('hides copy button when value is empty', () => {
      render(<BarcodeField {...createFieldProps({ value: '', mode: 'edit' })} />);
      expect(screen.queryByTitle('Copy to clipboard')).not.toBeInTheDocument();
    });

    it('disables input when disabled', () => {
      render(<BarcodeField {...createFieldProps({ value: '', mode: 'edit', disabled: true })} />);
      expect(screen.getByPlaceholderText('Enter barcode...')).toBeDisabled();
    });

    it('makes input readonly when readOnly', () => {
      render(<BarcodeField {...createFieldProps({ value: '', mode: 'edit', readOnly: true })} />);
      expect(screen.getByPlaceholderText('Enter barcode...')).toHaveAttribute('readonly');
    });
  });

  describe('search mode', () => {
    it('renders search input', () => {
      render(<BarcodeField {...createFieldProps({ value: '', mode: 'search' })} />);
      expect(screen.getByPlaceholderText('Search barcode...')).toBeInTheDocument();
    });

    it('calls onChange on search input', () => {
      const onChange = vi.fn();
      render(<BarcodeField {...createFieldProps({ value: '', mode: 'search', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('Search barcode...'), {
        target: { value: 'ABC' },
      });

      expect(onChange).toHaveBeenCalledWith('ABC');
    });

    it('does not convert search to uppercase', () => {
      const onChange = vi.fn();
      render(<BarcodeField {...createFieldProps({ value: '', mode: 'search', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('Search barcode...'), {
        target: { value: 'abc' },
      });

      expect(onChange).toHaveBeenCalledWith('abc');
    });
  });

  describe('className prop', () => {
    it('applies custom className in detail mode', () => {
      const { container } = render(
        <BarcodeField {...createFieldProps({ value: 'ABC123', className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom className in empty state', () => {
      const { container } = render(
        <BarcodeField {...createFieldProps({ value: null, className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
