import { describe, expect, it } from 'vitest';
import { getInitialPlan } from './initialPlan';
import { exportJashnFile, importJashnFile } from './portability';
import type { VendorSelection } from '../vendors/types';

describe('Portability Engine (.jashn File Export & Import — AC5, AC30)', () => {
  const plan = getInitialPlan();
  const sampleSelections: VendorSelection[] = [
    {
      placeId: 'place-forest-hill',
      need: 'venue',
      status: 'booked',
      quoteInr: 450000,
      note: 'Lawn booked',
    },
    {
      placeId: 'place-halwai',
      need: 'caterer',
      status: 'backup',
      note: 'Second tasting shortlist',
    },
  ];

  it('exports valid .jashn envelope with AC30 strict vendor compliance', () => {
    // Inject transient places fields that must be stripped per AC30
    const pollutedSelections = [
      {
        placeId: 'place-forest-hill',
        need: 'venue' as const,
        status: 'booked' as const,
        name: 'Forest Hill Resort',
        address: 'Chandigarh Road',
        rating: 4.8,
        phone: '+91 98765 43210',
      },
    ];

    const rawJson = exportJashnFile(plan, pollutedSelections as unknown as VendorSelection[]);
    expect(typeof rawJson).toBe('string');

    const parsed = JSON.parse(rawJson);
    expect(parsed.format).toBe('jashn-event-v1');
    expect(parsed.checksum).toBeDefined();
    expect(parsed.payload.tasks.length).toBe(plan.tasks.length);

    // Verify AC30: transient fields are stripped
    const exportedVendor = parsed.payload.vendorSelections[0];
    expect(exportedVendor.placeId).toBe('place-forest-hill');
    expect(exportedVendor.name).toBeUndefined();
    expect(exportedVendor.phone).toBeUndefined();
    expect(exportedVendor.address).toBeUndefined();
  });

  it('imports valid .jashn file and reconstructs plan state cleanly', () => {
    const rawJson = exportJashnFile(plan, sampleSelections);
    const res = importJashnFile(rawJson);

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.plan.id).toBe(plan.id);
    expect(res.value.plan.intake.eventType).toBe(plan.intake.eventType);
    expect(res.value.plan.tasks.length).toBe(plan.tasks.length);
    expect(res.value.restoredVendorCount).toBe(2);
    expect(res.value.checksumVerified).toBe(true);
  });

  it('rejects oversized payloads (> 256 KB)', () => {
    const hugeString = ' '.repeat(260 * 1024);
    const res = importJashnFile(hugeString);

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.error).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rejects malformed or tampered JSON payloads', () => {
    const res = importJashnFile('{ corrupted json here ...');
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.error).toBe('INVALID_JSON');
  });

  it('rejects invalid schema structures', () => {
    const invalidJson = JSON.stringify({
      format: 'jashn-event-v1',
      checksum: '123',
      payload: { invalid: true },
    });
    const res = importJashnFile(invalidJson);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.error).toBe('SCHEMA_VALIDATION_FAILED');
  });
});
