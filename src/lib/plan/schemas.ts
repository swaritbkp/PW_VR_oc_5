import { z } from 'zod';
import { stripControlChars } from '../format';

const MAX_STYLE_LENGTH = 300;
const MAX_CITY_LENGTH = 60;
const MAX_NON_NEGOTIABLE_LEN = 80;
const MAX_NON_NEGOTIABLES_COUNT = 5;
const MAX_TASKS_DAYS = 365;

const cleanString = (max: number) =>
  z.string().transform(stripControlChars).pipe(z.string().min(1).max(max));

export const EventTypeEnum = z.enum(['wedding', 'birthday', 'community']);
export const LanguageEnum = z.enum(['en', 'hi', 'pa']);
export type Language = z.infer<typeof LanguageEnum>;
export const DriverEnum = z.enum(['guests', 'budget', 'date', 'city']);
export const TaskCategoryEnum = z.enum([
  'planning',
  'venue',
  'permits',
  'food',
  'decor',
  'media',
  'entertainment',
  'attire',
  'invites',
  'logistics',
  'milestone',
]);

export const VendorNeedEnum = z.enum([
  'venue',
  'caterer',
  'decorator',
  'photographer',
  'music',
  'makeup',
  'tent_house',
  'sound_lights',
  'invitations',
  'cake',
  'entertainer',
  'return_gifts',
  'transport',
  'stay',
  'florist',
  'power_backup',
]);

export const VendorStatusEnum = z.enum([
  'shortlisted',
  'contacted',
  'quoted',
  'booked',
  'backup',
  'rejected',
]);

/** Zod schema validating user intake sheet inputs per AC5. */
export const IntakeSchema = z.object({
  eventType: EventTypeEnum,
  templateId: z.string().optional(),
  city: cleanString(MAX_CITY_LENGTH),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .refine(
      (d) => {
        const today = new Date().toISOString().split('T')[0];
        return d > today;
      },
      { message: 'Date must be in the future (not past or today)' },
    ),
  guests: z.number().int().min(1).max(100_000),
  budgetInr: z.number().min(1_000).max(1_000_000_000),
  style: z.string().transform(stripControlChars).pipe(z.string().max(MAX_STYLE_LENGTH)).optional(),
  nonNegotiables: z
    .array(
      z.string().transform(stripControlChars).pipe(z.string().min(1).max(MAX_NON_NEGOTIABLE_LEN)),
    )
    .max(MAX_NON_NEGOTIABLES_COUNT)
    .default([]),
  language: LanguageEnum.default('en'),
});

export type IntakeInput = z.infer<typeof IntakeSchema>;

/** Zod schema validating individual budget items. */
export const BudgetLineSchema = z.object({
  id: z.string().min(1),
  category: TaskCategoryEnum,
  name: cleanString(100),
  unit: z.enum(['fixed', 'per_head']),
  rateInr: z.number().min(0),
  quantity: z.number().min(1).optional(),
  drivers: z.array(DriverEnum),
  locked: z.boolean().optional(),
  notes: z.string().max(MAX_STYLE_LENGTH).optional(),
});

/** Zod schema validating schedulable tasks in the graph. */
export const PlanTaskSchema = z
  .object({
    id: z.string().min(1),
    name: cleanString(100),
    optimistic: z.number().min(0).max(MAX_TASKS_DAYS),
    mostLikely: z.number().min(0).max(MAX_TASKS_DAYS),
    pessimistic: z.number().min(0).max(MAX_TASKS_DAYS),
    dependsOn: z.array(z.string()),
    category: TaskCategoryEnum,
    drivers: z.array(DriverEnum),
    why: z.string().max(MAX_STYLE_LENGTH),
    vendorNeed: VendorNeedEnum.optional(),
    bookingFor: VendorNeedEnum.optional(),
    optional: z.boolean().optional(),
    done: z.boolean().optional(),
    started: z.boolean().optional(),
  })
  .refine((t) => t.optimistic <= t.mostLikely && t.mostLikely <= t.pessimistic, {
    message: 'Duration estimates must satisfy optimistic <= mostLikely <= pessimistic',
  });

/**
 * Zod schema strictly restricting persisted vendor data per AC30.
 * Strips and ignores transient Google Places fields (ratings, address, phone, name).
 */
export const VendorSelectionSchema = z
  .object({
    placeId: z.string().min(1),
    need: VendorNeedEnum,
    status: VendorStatusEnum,
    quoteInr: z.number().min(0).optional(),
    note: z.string().max(MAX_STYLE_LENGTH).optional(),
  })
  .strip();

/** Schema for full plan state persisted in localStorage. */
export const StoredPlanSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().min(1),
  intake: IntakeSchema,
  tasks: z.array(PlanTaskSchema),
  budgetLines: z.array(BudgetLineSchema),
  vendorSelections: z.array(VendorSelectionSchema),
  updatedAt: z.string(),
});

export type StoredPlan = z.infer<typeof StoredPlanSchema>;
