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

  it('toggles language between English, Hindi, and Punjabi updating nav labels and badges', () => {
    const handleOpen = vi.fn();
    render(<AppHeader title="Phulkari courtyard wedding" city="Chandigarh" onOpen={handleOpen} />);

    expect(screen.getByText('Living Graph')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Templates/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'हिन्दी' }));
    expect(screen.getByText('जीवंत ग्राफ़')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /टेम्पलेट्स/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /केओस मंकी/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ਪੰਜਾਬੀ' }));
    expect(screen.getByText('ਜੀਵੰਤ ਗ੍ਰਾਫ਼')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ਟੈਂਪਲੇਟਸ/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ਕਿਓਸ ਮੰਕੀ/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByText('Living Graph')).toBeInTheDocument();
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
