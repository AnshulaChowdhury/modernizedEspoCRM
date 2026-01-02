import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { UrlField } from '../text/UrlField';
import { renderField, testValues } from './testUtils';

describe('UrlField', () => {
  describe('detail mode', () => {
    it('displays URL as clickable link', () => {
      renderField(UrlField, {
        value: testValues.sampleUrl,
        mode: 'detail',
      });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', testValues.sampleUrl);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('adds https:// to URLs without protocol', () => {
      renderField(UrlField, {
        value: 'example.com',
        mode: 'detail',
      });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('preserves http:// protocol', () => {
      renderField(UrlField, {
        value: 'http://example.com',
        mode: 'detail',
      });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'http://example.com');
    });

    it('displays em-dash for empty value', () => {
      renderField(UrlField, {
        value: '',
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(UrlField, {
        value: null,
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays hostname from URL', () => {
      renderField(UrlField, {
        value: 'https://www.example.com/path/to/page',
        mode: 'detail',
      });
      expect(screen.getByText(/www\.example\.com/)).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('displays URL as link', () => {
      renderField(UrlField, {
        value: testValues.sampleUrl,
        mode: 'list',
      });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', testValues.sampleUrl);
    });

    it('displays em-dash for empty value', () => {
      renderField(UrlField, {
        value: '',
        mode: 'list',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders a URL input', () => {
      renderField(UrlField, {
        name: 'website',
        value: testValues.sampleUrl,
        mode: 'edit',
      });
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
      expect(input).toHaveValue(testValues.sampleUrl);
    });

    it('shows placeholder', () => {
      renderField(UrlField, {
        name: 'website',
        value: '',
        mode: 'edit',
      });
      expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
    });

    it('shows link icon when URL has value', () => {
      renderField(UrlField, {
        name: 'website',
        value: testValues.sampleUrl,
        mode: 'edit',
      });
      // Should have an external link next to input
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('does not show link icon when empty', () => {
      renderField(UrlField, {
        name: 'website',
        value: '',
        mode: 'edit',
      });
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      renderField(UrlField, {
        name: 'website',
        value: '',
        mode: 'edit',
        onChange,
      });

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'https://new-site.com' } });

      expect(onChange).toHaveBeenCalledWith('https://new-site.com');
    });

    it('can be disabled', () => {
      renderField(UrlField, {
        name: 'website',
        value: testValues.sampleUrl,
        mode: 'edit',
        disabled: true,
      });

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('can be read-only', () => {
      renderField(UrlField, {
        name: 'website',
        value: testValues.sampleUrl,
        mode: 'edit',
        readOnly: true,
      });

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readOnly');
    });
  });

  describe('search mode', () => {
    it('renders a text search input', () => {
      renderField(UrlField, {
        name: 'website',
        value: '',
        mode: 'search',
      });

      expect(screen.getByPlaceholderText('Search URL...')).toBeInTheDocument();
    });

    it('calls onChange when search value changes', () => {
      const onChange = vi.fn();
      renderField(UrlField, {
        name: 'website',
        value: '',
        mode: 'search',
        onChange,
      });

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'example' } });

      expect(onChange).toHaveBeenCalledWith('example');
    });
  });
});
