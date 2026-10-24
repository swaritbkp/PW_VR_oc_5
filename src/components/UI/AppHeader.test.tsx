import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { AppHeader } from './AppHeader';

describe('AppHeader Component', () => {
  it('renders brand title, celebration details, and action triggers', () => {
    const handleOpen = vi.fn();
    render(<AppHeader title="Phulkari courtyard wedding" city="Chandigarh" onOpen={handleOpen} />);

    expect(screen.getByText('Jashn')).toBeInTheDocument();
    expect(screen.getByText(/Living Graph/i)).toBeInTheDocument();
    expect(screen.getByText('Chandigarh')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /What-If Sliders/i }));
    expect(handleOpen).toHaveBeenCalledWith('whatif');
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(
      <AppHeader title="Phulkari courtyard wedding" city="Chandigarh" onOpen={vi.fn()} />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
