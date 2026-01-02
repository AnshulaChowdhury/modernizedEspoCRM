/**
 * MapField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapField } from '../special/MapField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'map' };
  return {
    name: 'location',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Account',
    ...overrides,
  };
}

describe('MapField', () => {
  describe('detail mode', () => {
    it('shows dash for null value', () => {
      render(<MapField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays coordinates from object value', () => {
      render(
        <MapField
          {...createFieldProps({
            value: { latitude: 40.7128, longitude: -74.006 },
          })}
        />
      );
      expect(screen.getByText('40.712800, -74.006000')).toBeInTheDocument();
    });

    it('displays coordinates from comma-separated string', () => {
      render(<MapField {...createFieldProps({ value: '51.5074, -0.1278' })} />);
      expect(screen.getByText('51.507400, -0.127800')).toBeInTheDocument();
    });

    it('parses coordinates from record fields', () => {
      render(
        <MapField
          {...createFieldProps({
            value: null,
            record: {
              locationLatitude: 48.8566,
              locationLongitude: 2.3522,
            },
          })}
        />
      );
      expect(screen.getByText('48.856600, 2.352200')).toBeInTheDocument();
    });

    it('links to Google Maps', () => {
      render(
        <MapField
          {...createFieldProps({
            value: { latitude: 40.7128, longitude: -74.006 },
          })}
        />
      );
      const link = screen.getByRole('link', { name: /40.712800/ });
      expect(link).toHaveAttribute('href', 'https://www.google.com/maps?q=40.7128,-74.006');
    });

    it('opens link in new tab', () => {
      render(
        <MapField
          {...createFieldProps({
            value: { latitude: 40.7128, longitude: -74.006 },
          })}
        />
      );
      const link = screen.getByRole('link', { name: /40.712800/ });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders map image', () => {
      render(
        <MapField
          {...createFieldProps({
            value: { latitude: 40.7128, longitude: -74.006 },
          })}
        />
      );
      const img = screen.getByAltText('Map location');
      expect(img).toHaveAttribute('src', expect.stringContaining('staticmap.openstreetmap.de'));
    });

    it('shows dash for invalid coordinates', () => {
      render(<MapField {...createFieldProps({ value: 'invalid' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash when latitude or longitude is NaN', () => {
      render(<MapField {...createFieldProps({ value: 'abc, def' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for null value', () => {
      render(<MapField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays compact coordinates', () => {
      render(
        <MapField
          {...createFieldProps({
            value: { latitude: 35.6762, longitude: 139.6503 },
            mode: 'list',
          })}
        />
      );
      expect(screen.getByText('35.676200, 139.650300')).toBeInTheDocument();
    });

    it('links to Google Maps in list mode', () => {
      render(
        <MapField
          {...createFieldProps({
            value: { latitude: 35.6762, longitude: 139.6503 },
            mode: 'list',
          })}
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://www.google.com/maps?q=35.6762,139.6503');
    });

    it('has font-mono class for coordinates', () => {
      const { container } = render(
        <MapField
          {...createFieldProps({
            value: { latitude: 35.6762, longitude: 139.6503 },
            mode: 'list',
          })}
        />
      );
      expect(container.querySelector('.font-mono')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders latitude input', () => {
      render(<MapField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByPlaceholderText('-90 to 90')).toBeInTheDocument();
    });

    it('renders longitude input', () => {
      render(<MapField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByPlaceholderText('-180 to 180')).toBeInTheDocument();
    });

    it('renders labels for inputs', () => {
      render(<MapField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByText('Latitude')).toBeInTheDocument();
      expect(screen.getByText('Longitude')).toBeInTheDocument();
    });

    it('populates inputs with existing values', () => {
      render(
        <MapField
          {...createFieldProps({
            value: { latitude: 40.7128, longitude: -74.006 },
            mode: 'edit',
          })}
        />
      );
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toHaveValue(40.7128);
      expect(inputs[1]).toHaveValue(-74.006);
    });

    it('calls onChange when latitude changes', () => {
      const onChange = vi.fn();
      render(
        <MapField
          {...createFieldProps({
            value: { latitude: 40.7128, longitude: -74.006 },
            mode: 'edit',
            onChange,
          })}
        />
      );

      const latInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.change(latInput, { target: { value: '41.0' } });

      expect(onChange).toHaveBeenCalledWith({
        latitude: 41,
        longitude: -74.006,
      });
    });

    it('calls onChange when longitude changes', () => {
      const onChange = vi.fn();
      render(
        <MapField
          {...createFieldProps({
            value: { latitude: 40.7128, longitude: -74.006 },
            mode: 'edit',
            onChange,
          })}
        />
      );

      const lngInput = screen.getAllByRole('spinbutton')[1];
      fireEvent.change(lngInput, { target: { value: '-73.0' } });

      expect(onChange).toHaveBeenCalledWith({
        latitude: 40.7128,
        longitude: -73,
      });
    });

    it('sets latitude to null when empty', () => {
      const onChange = vi.fn();
      render(
        <MapField
          {...createFieldProps({
            value: { latitude: 40.7128, longitude: -74.006 },
            mode: 'edit',
            onChange,
          })}
        />
      );

      const latInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.change(latInput, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith({
        latitude: null,
        longitude: -74.006,
      });
    });

    it('shows View on Map link when coordinates exist', () => {
      render(
        <MapField
          {...createFieldProps({
            value: { latitude: 40.7128, longitude: -74.006 },
            mode: 'edit',
          })}
        />
      );
      expect(screen.getByText('View on Map')).toBeInTheDocument();
    });

    it('hides View on Map link when no coordinates', () => {
      render(<MapField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.queryByText('View on Map')).not.toBeInTheDocument();
    });

    it('disables inputs when disabled', () => {
      render(<MapField {...createFieldProps({ value: null, mode: 'edit', disabled: true })} />);
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toBeDisabled();
      expect(inputs[1]).toBeDisabled();
    });

    it('makes inputs readonly when readOnly', () => {
      render(<MapField {...createFieldProps({ value: null, mode: 'edit', readOnly: true })} />);
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toHaveAttribute('readonly');
      expect(inputs[1]).toHaveAttribute('readonly');
    });

    it('enforces latitude min/max constraints', () => {
      render(<MapField {...createFieldProps({ value: null, mode: 'edit' })} />);
      const latInput = screen.getAllByRole('spinbutton')[0];
      expect(latInput).toHaveAttribute('min', '-90');
      expect(latInput).toHaveAttribute('max', '90');
    });

    it('enforces longitude min/max constraints', () => {
      render(<MapField {...createFieldProps({ value: null, mode: 'edit' })} />);
      const lngInput = screen.getAllByRole('spinbutton')[1];
      expect(lngInput).toHaveAttribute('min', '-180');
      expect(lngInput).toHaveAttribute('max', '180');
    });
  });

  describe('search mode', () => {
    it('renders search input', () => {
      render(<MapField {...createFieldProps({ value: null, mode: 'search' })} />);
      expect(screen.getByPlaceholderText('lat, lng')).toBeInTheDocument();
    });

    it('calls onChange on search input', () => {
      const onChange = vi.fn();
      render(<MapField {...createFieldProps({ value: null, mode: 'search', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('lat, lng'), {
        target: { value: '40.7, -74.0' },
      });

      expect(onChange).toHaveBeenCalledWith('40.7, -74.0');
    });
  });

  describe('className prop', () => {
    it('applies custom className in detail mode', () => {
      const { container } = render(
        <MapField
          {...createFieldProps({
            value: { latitude: 40.7128, longitude: -74.006 },
            className: 'custom-class',
          })}
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom className in empty state', () => {
      const { container } = render(
        <MapField {...createFieldProps({ value: null, className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
