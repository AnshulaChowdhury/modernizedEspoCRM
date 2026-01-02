/**
 * ImageField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageField } from '../file/ImageField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'image' };
  return {
    name: 'photo',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Contact',
    ...overrides,
  };
}

describe('ImageField', () => {
  describe('detail mode', () => {
    it('shows dash for null value', () => {
      render(<ImageField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays image with medium size', () => {
      render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123', name: 'photo.jpg' },
          })}
        />
      );
      const img = screen.getByAltText('photo.jpg');
      expect(img).toHaveAttribute('src', '/api/v1/Attachment/file/img-123?size=medium');
    });

    it('handles string ID value', () => {
      render(<ImageField {...createFieldProps({ value: 'img-123' })} />);
      const img = screen.getByAltText('Image');
      expect(img).toHaveAttribute('src', '/api/v1/Attachment/file/img-123?size=medium');
    });

    it('opens lightbox on click', () => {
      render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123', name: 'photo.jpg' },
          })}
        />
      );

      const thumbnail = screen.getByAltText('photo.jpg');
      fireEvent.click(thumbnail);

      // Lightbox should show larger image
      const images = screen.getAllByAltText('photo.jpg');
      expect(images.length).toBe(2); // Thumbnail and lightbox image
    });

    it('closes lightbox on close button click', () => {
      render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123', name: 'photo.jpg' },
          })}
        />
      );

      // Open lightbox
      fireEvent.click(screen.getByAltText('photo.jpg'));
      expect(screen.getAllByAltText('photo.jpg').length).toBe(2);

      // Close lightbox
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      expect(screen.getAllByAltText('photo.jpg').length).toBe(1);
    });

    it('closes lightbox on background click', () => {
      const { container } = render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123', name: 'photo.jpg' },
          })}
        />
      );

      // Open lightbox
      fireEvent.click(screen.getByAltText('photo.jpg'));

      // Click backdrop
      const backdrop = container.querySelector('.fixed.inset-0');
      if (backdrop) fireEvent.click(backdrop);

      expect(screen.getAllByAltText('photo.jpg').length).toBe(1);
    });

    it('has zoom icon overlay on hover', () => {
      const { container } = render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123', name: 'photo.jpg' },
          })}
        />
      );
      // The zoom icon should exist in the overlay
      expect(container.querySelector('.group')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for null value', () => {
      render(<ImageField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays small thumbnail', () => {
      render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123', name: 'avatar.png' },
            mode: 'list',
          })}
        />
      );
      const img = screen.getByAltText('avatar.png');
      expect(img).toHaveAttribute('src', '/api/v1/Attachment/file/img-123?size=small');
      expect(img).toHaveClass('h-8', 'w-8');
    });
  });

  describe('edit mode', () => {
    it('renders upload button when no image', () => {
      render(<ImageField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByText('Upload Image')).toBeInTheDocument();
    });

    it('hides file input', () => {
      const { container } = render(<ImageField {...createFieldProps({ value: null, mode: 'edit' })} />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveClass('hidden');
    });

    it('accepts only images', () => {
      const { container } = render(<ImageField {...createFieldProps({ value: null, mode: 'edit' })} />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', 'image/*');
    });

    it('displays image preview when image exists', () => {
      render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123', name: 'photo.jpg' },
            mode: 'edit',
          })}
        />
      );
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
    });

    it('shows remove button when image exists', () => {
      render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123', name: 'photo.jpg' },
            mode: 'edit',
          })}
        />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls onChange with null when remove clicked', () => {
      const onChange = vi.fn();
      render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123', name: 'photo.jpg' },
            mode: 'edit',
            onChange,
          })}
        />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('hides remove button when disabled', () => {
      render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123', name: 'photo.jpg' },
            mode: 'edit',
            disabled: true,
          })}
        />
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('hides remove button when readOnly', () => {
      render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123', name: 'photo.jpg' },
            mode: 'edit',
            readOnly: true,
          })}
        />
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('disables upload button when disabled', () => {
      render(<ImageField {...createFieldProps({ value: null, mode: 'edit', disabled: true })} />);
      expect(screen.getByText('Upload Image').closest('button')).toBeDisabled();
    });

    it('has dashed border on upload area', () => {
      render(<ImageField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByText('Upload Image').closest('button')).toHaveClass('border-dashed');
    });
  });

  describe('search mode', () => {
    it('shows dash (images not searchable)', () => {
      render(<ImageField {...createFieldProps({ value: null, mode: 'search' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('default rendering', () => {
    it('shows dash for null in unknown mode', () => {
      render(<ImageField {...createFieldProps({ value: null, mode: undefined })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows small thumbnail for existing image in unknown mode', () => {
      const { container } = render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123' },
            mode: undefined,
          })}
        />
      );
      const img = container.querySelector('img');
      expect(img).toHaveAttribute('src', '/api/v1/Attachment/file/img-123?size=small');
    });
  });

  describe('className prop', () => {
    it('applies custom className in detail mode', () => {
      const { container } = render(
        <ImageField
          {...createFieldProps({
            value: { id: 'img-123', name: 'photo.jpg' },
            className: 'custom-class',
          })}
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom className in empty state', () => {
      const { container } = render(
        <ImageField {...createFieldProps({ value: null, className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
