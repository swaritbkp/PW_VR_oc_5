import { describe, expect, it } from 'vitest';
import {
  BudgetLineSchema,
  IntakeSchema,
  PlanTaskSchema,
  StoredPlanSchema,
  VendorSelectionSchema,
} from './schemas';

describe('plan schemas', () => {
  it('AC5 validates intake inputs and strips control characters', () => {
    const valid = IntakeSchema.safeParse({
      eventType: 'wedding',
      city: 'Chandigarh\u0000',
      date: '2026-12-14',
      guests: 300,
      budgetInr: 2500000,
      style: 'Traditional\u0007 punjabi decor',
      nonNegotiables: ['Pure vegetarian\u0000', 'Live dhol'],
      language: 'en',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.city).toBe('Chandigarh');
      expect(valid.data.style).toBe('Traditional punjabi decor');
      expect(valid.data.nonNegotiables[0]).toBe('Pure vegetarian');
    }
  });

  it('AC4 rejects past dates and non-positive guest/budget numbers', () => {
    const past = IntakeSchema.safeParse({
      eventType: 'birthday',
      city: 'Ludhiana',
      date: '2020-01-01',
      guests: 50,
      budgetInr: 50000,
    });
    expect(past.success).toBe(false);

    const invalidGuests = IntakeSchema.safeParse({
      eventType: 'birthday',
      city: 'Ludhiana',
      date: '2026-12-31',
      guests: 0,
      budgetInr: 50000,
    });
    expect(invalidGuests.success).toBe(false);
  });

  it('validates task estimate ordering (optimistic <= mostLikely <= pessimistic)', () => {
    const validTask = PlanTaskSchema.safeParse({
      id: 'T01',
      name: 'Book Venue',
      optimistic: 3,
      mostLikely: 5,
      pessimistic: 10,
      dependsOn: [],
      category: 'venue',
      drivers: ['budget'],
      why: 'Venue is required',
    });
    expect(validTask.success).toBe(true);

    const invalidTask = PlanTaskSchema.safeParse({
      id: 'T01',
      name: 'Book Venue',
      optimistic: 12,
      mostLikely: 5,
      pessimistic: 2,
      dependsOn: [],
      category: 'venue',
      drivers: ['budget'],
      why: 'Invalid order',
    });
    expect(invalidTask.success).toBe(false);
  });

  it('AC30 strips transient Google Places details from VendorSelection', () => {
    const rawPlacesPayload = {
      placeId: 'ChIJ123456789',
      need: 'venue',
      status: 'booked',
      quoteInr: 250000,
      note: 'Advance 50% paid',
      name: 'The Grand Resort',
      rating: 4.8,
      address: 'Sector 17, Chandigarh',
      phone: '+91 98765 43210',
    };

    const parsed = VendorSelectionSchema.parse(rawPlacesPayload);
    expect(parsed).toEqual({
      placeId: 'ChIJ123456789',
      need: 'venue',
      status: 'booked',
      quoteInr: 250000,
      note: 'Advance 50% paid',
    });
    expect((parsed as Record<string, unknown>).name).toBeUndefined();
    expect((parsed as Record<string, unknown>).rating).toBeUndefined();
  });

  it('validates budget lines with BudgetLineSchema', () => {
    const validLine = BudgetLineSchema.safeParse({
      id: 'B01',
      category: 'catering',
      name: 'Dinner buffet',
      unit: 'per_head',
      rateInr: 1200,
      drivers: ['guests', 'budget'],
    });
    expect(validLine.success).toBe(false); // 'catering' is not in TaskCategoryEnum, 'food' is

    const validLineFood = BudgetLineSchema.safeParse({
      id: 'B01',
      category: 'food',
      name: 'Dinner buffet',
      unit: 'per_head',
      rateInr: 1200,
      drivers: ['guests', 'budget'],
    });
    expect(validLineFood.success).toBe(true);
  });

  it('validates a complete StoredPlanSchema structure', () => {
    const plan = StoredPlanSchema.safeParse({
      id: 'plan_01',
      version: 1,
      intake: {
        eventType: 'wedding',
        city: 'Mohali',
        date: '2026-12-31',
        guests: 200,
        budgetInr: 1500000,
        nonNegotiables: [],
        language: 'en',
      },
      tasks: [
        {
          id: 'T01',
          name: 'Kickoff',
          optimistic: 1,
          mostLikely: 2,
          pessimistic: 3,
          dependsOn: [],
          category: 'planning',
          drivers: ['date'],
          why: 'Start',
        },
      ],
      budgetLines: [
        {
          id: 'B01',
          category: 'planning',
          name: 'Consultant',
          unit: 'fixed',
          rateInr: 25000,
          drivers: ['budget'],
        },
      ],
      vendorSelections: [
        {
          placeId: 'ChIJxyz',
          need: 'venue',
          status: 'shortlisted',
        },
      ],
      updatedAt: new Date().toISOString(),
    });
    expect(plan.success).toBe(true);
  });
});
