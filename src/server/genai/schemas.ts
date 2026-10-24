import { z } from 'zod';
import { DriverEnum, TaskCategoryEnum, VendorNeedEnum } from '../../lib/plan/schemas';

const MAX_TASK_NAME = 100;
const MAX_WHY_LEN = 300;
const MAX_DAYS = 365;
const MAX_BUDGET_LINE_NAME = 100;
const MAX_NOTES_LEN = 300;

export const CoreTaskOutputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(MAX_TASK_NAME),
  optimistic: z.number().min(0).max(MAX_DAYS),
  mostLikely: z.number().min(0).max(MAX_DAYS),
  pessimistic: z.number().min(0).max(MAX_DAYS),
  dependsOn: z.array(z.string()),
  category: TaskCategoryEnum,
  drivers: z.array(DriverEnum),
  why: z.string().max(MAX_WHY_LEN),
  vendorNeed: VendorNeedEnum.optional(),
  bookingFor: VendorNeedEnum.optional(),
  optional: z.boolean().optional(),
});

export const CoreBudgetLineOutputSchema = z.object({
  id: z.string().min(1),
  category: TaskCategoryEnum,
  name: z.string().min(1).max(MAX_BUDGET_LINE_NAME),
  unit: z.enum(['fixed', 'per_head']),
  rateInr: z.number().min(0),
  quantity: z.number().min(1).optional(),
  drivers: z.array(DriverEnum),
  locked: z.boolean().optional(),
  notes: z.string().max(MAX_NOTES_LEN),
});

export const PlannerCoreOutputSchema = z.object({
  tasks: z.array(CoreTaskOutputSchema).min(10).max(50),
  budgetLines: z.array(CoreBudgetLineOutputSchema).min(5).max(40),
});

export type PlannerCoreOutput = z.infer<typeof PlannerCoreOutputSchema>;

export const VendorQuestionItemSchema = z.object({
  need: z.string(),
  questions: z.array(z.string()),
});

export const PlannerExtrasOutputSchema = z.object({
  ideas: z.array(z.string()).default([]),
  vendorQuestions: z.array(VendorQuestionItemSchema).default([]),
  assumptions: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});

export type PlannerExtrasOutput = z.infer<typeof PlannerExtrasOutputSchema>;
