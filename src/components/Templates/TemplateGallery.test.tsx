import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { TemplateGallery } from './TemplateGallery';

describe('TemplateGallery Component (AC18)', () => {
  it('AC18 renders all 12 contemporary celebration templates', () => {
    const handleSelect = vi.fn();
    render(<TemplateGallery onSelectTemplate={handleSelect} />);

    expect(screen.getByText(/Curated Celebration Templates/i)).toBeInTheDocument();
    expect(screen.getByText(/Phulkari courtyard wedding/i)).toBeInTheDocument();
    expect(screen.getByText(/Gurpurab langar and kirtan evening/i)).toBeInTheDocument();
    expect(screen.getByText(/Dino explorer party/i)).toBeInTheDocument();
  });

  it('AC18 filters templates by event type and search keyword', () => {
    const handleSelect = vi.fn();
    render(<TemplateGallery onSelectTemplate={handleSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'birthday' }));
    expect(screen.queryByText(/Phulkari courtyard wedding/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Dino explorer party/i)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Filter by keyword/i);
    fireEvent.change(searchInput, { target: { value: 'dino' } });
    expect(screen.getByText(/Dino explorer party/i)).toBeInTheDocument();
  });

  it('AC18 triggers template selection callback', () => {
    const handleSelect = vi.fn();
    render(<TemplateGallery onSelectTemplate={handleSelect} />);

    const buttons = screen.getAllByRole('button', { name: /Choose Template/i });
    fireEvent.click(buttons[0]);
    expect(handleSelect).toHaveBeenCalled();
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(<TemplateGallery onSelectTemplate={vi.fn()} />);

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
