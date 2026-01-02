/**
 * ColorPickerField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPickerField } from '../special/ColorPickerField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'colorpicker' };
  return {
    name: 'color',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Category',
    ...overrides,
  };
}

describe('ColorPickerField', () => {
  describe('detail mode', () => {
    it('shows dash for null value', () => {
      render(<ColorPickerField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for empty string', () => {
      render(<ColorPickerField {...createFieldProps({ value: '' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays color swatch', () => {
      const { container } = render(<ColorPickerField {...createFieldProps({ value: '#ff0000' })} />);
      const swatch = container.querySelector('div[style*="background-color"]');
      expect(swatch).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('displays hex value text', () => {
      render(<ColorPickerField {...createFieldProps({ value: '#3b82f6' })} />);
      expect(screen.getByText('#3b82f6')).toBeInTheDocument();
    });

    it('displays swatch with correct dimensions', () => {
      const { container } = render(<ColorPickerField {...createFieldProps({ value: '#ff0000' })} />);
      const swatch = container.querySelector('.w-6.h-6');
      expect(swatch).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for null value', () => {
      render(<ColorPickerField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays small color swatch', () => {
      const { container } = render(<ColorPickerField {...createFieldProps({ value: '#22c55e', mode: 'list' })} />);
      const swatch = container.querySelector('.w-5.h-5');
      expect(swatch).toBeInTheDocument();
      expect(swatch).toHaveStyle({ backgroundColor: '#22c55e' });
    });

    it('shows color value in title attribute', () => {
      const { container } = render(<ColorPickerField {...createFieldProps({ value: '#22c55e', mode: 'list' })} />);
      const swatch = container.querySelector('[title="#22c55e"]');
      expect(swatch).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders color preview button', () => {
      render(<ColorPickerField {...createFieldProps({ value: '#ff0000', mode: 'edit' })} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders hex input field', () => {
      render(<ColorPickerField {...createFieldProps({ value: '', mode: 'edit' })} />);
      expect(screen.getByPlaceholderText('#000000')).toBeInTheDocument();
    });

    it('renders native color picker', () => {
      const { container } = render(<ColorPickerField {...createFieldProps({ value: '#ff0000', mode: 'edit' })} />);
      const colorInput = container.querySelector('input[type="color"]');
      expect(colorInput).toBeInTheDocument();
    });

    it('populates input with existing value', () => {
      render(<ColorPickerField {...createFieldProps({ value: '#3b82f6', mode: 'edit' })} />);
      const inputs = screen.getAllByDisplayValue('#3b82f6');
      expect(inputs.length).toBe(2); // Both hex input and native color picker
    });

    it('calls onChange when hex input changes', () => {
      const onChange = vi.fn();
      render(<ColorPickerField {...createFieldProps({ value: '', mode: 'edit', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('#000000'), {
        target: { value: '#ff0000' },
      });

      expect(onChange).toHaveBeenCalledWith('#ff0000');
    });

    it('calls onChange when native color picker changes', () => {
      const onChange = vi.fn();
      const { container } = render(<ColorPickerField {...createFieldProps({ value: '#000000', mode: 'edit', onChange })} />);

      const colorInput = container.querySelector('input[type="color"]') as HTMLInputElement;
      fireEvent.change(colorInput, { target: { value: '#0000ff' } });

      expect(onChange).toHaveBeenCalledWith('#0000ff');
    });

    it('shows palette when color button clicked', () => {
      render(<ColorPickerField {...createFieldProps({ value: '', mode: 'edit' })} />);

      const colorButton = screen.getAllByRole('button')[0];
      fireEvent.click(colorButton);

      // Palette should appear with color options
      const paletteButtons = screen.getAllByRole('button');
      expect(paletteButtons.length).toBeGreaterThan(1); // More buttons for palette colors
    });

    it('selects color from palette', () => {
      const onChange = vi.fn();
      render(<ColorPickerField {...createFieldProps({ value: '', mode: 'edit', onChange })} />);

      // Open palette
      const colorButton = screen.getAllByRole('button')[0];
      fireEvent.click(colorButton);

      // Click a palette color (first red color)
      const redColorButton = screen.getByTitle('#ef4444');
      fireEvent.click(redColorButton);

      expect(onChange).toHaveBeenCalledWith('#ef4444');
    });

    it('closes palette after color selection', () => {
      const onChange = vi.fn();
      render(<ColorPickerField {...createFieldProps({ value: '', mode: 'edit', onChange })} />);

      // Open palette
      const colorButton = screen.getAllByRole('button')[0];
      fireEvent.click(colorButton);

      // Click a palette color
      const redColorButton = screen.getByTitle('#ef4444');
      fireEvent.click(redColorButton);

      // Palette should be closed (fewer buttons)
      expect(screen.queryByTitle('#0ea5e9')).not.toBeInTheDocument();
    });

    it('disables color button when disabled', () => {
      render(<ColorPickerField {...createFieldProps({ value: '', mode: 'edit', disabled: true })} />);
      const colorButton = screen.getAllByRole('button')[0];
      expect(colorButton).toBeDisabled();
    });

    it('disables native color picker when disabled', () => {
      const { container } = render(<ColorPickerField {...createFieldProps({ value: '', mode: 'edit', disabled: true })} />);
      const colorInput = container.querySelector('input[type="color"]');
      expect(colorInput).toBeDisabled();
    });

    it('does not open palette when disabled', () => {
      render(<ColorPickerField {...createFieldProps({ value: '', mode: 'edit', disabled: true })} />);

      const colorButton = screen.getAllByRole('button')[0];
      fireEvent.click(colorButton);

      // Palette colors should not appear
      expect(screen.queryByTitle('#ef4444')).not.toBeInTheDocument();
    });

    it('does not open palette when readOnly', () => {
      render(<ColorPickerField {...createFieldProps({ value: '', mode: 'edit', readOnly: true })} />);

      const colorButton = screen.getAllByRole('button')[0];
      fireEvent.click(colorButton);

      // Palette colors should not appear
      expect(screen.queryByTitle('#ef4444')).not.toBeInTheDocument();
    });

    it('limits input maxLength to 7 characters', () => {
      render(<ColorPickerField {...createFieldProps({ value: '', mode: 'edit' })} />);
      expect(screen.getByPlaceholderText('#000000')).toHaveAttribute('maxLength', '7');
    });
  });

  describe('search mode', () => {
    it('renders search input', () => {
      render(<ColorPickerField {...createFieldProps({ value: '', mode: 'search' })} />);
      expect(screen.getByPlaceholderText('#000000')).toBeInTheDocument();
    });

    it('calls onChange on search input', () => {
      const onChange = vi.fn();
      render(<ColorPickerField {...createFieldProps({ value: '', mode: 'search', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('#000000'), {
        target: { value: '#ff' },
      });

      expect(onChange).toHaveBeenCalledWith('#ff');
    });
  });

  describe('className prop', () => {
    it('applies custom className in detail mode', () => {
      const { container } = render(
        <ColorPickerField {...createFieldProps({ value: '#ff0000', className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom className in empty state', () => {
      const { container } = render(
        <ColorPickerField {...createFieldProps({ value: null, className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
