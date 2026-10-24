import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { AuditPanel, type AuditMetadata } from './AuditPanel';

describe('AuditPanel Component (AC15)', () => {
  const metadata: AuditMetadata = {
    agentVersion: '0.1.0',
    model: 'gemini-2.5-pro',
    promptVersions: {
      core: '1.0.0',
      extras: '1.0.0',
    },
    guardrailsPassed: true,
    schemaValidated: true,
  };

  it('AC15 renders complete GenAI audit trail', () => {
    render(<AuditPanel metadata={metadata} />);

    expect(screen.getByText(/GenAI Provenance & Audit/i)).toBeInTheDocument();
    expect(screen.getByText('gemini-2.5-pro')).toBeInTheDocument();
    expect(screen.getByText('PASSED (0 leaks)')).toBeInTheDocument();
    expect(screen.getByText('STRICT PASS')).toBeInTheDocument();
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(<AuditPanel metadata={metadata} />);

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
