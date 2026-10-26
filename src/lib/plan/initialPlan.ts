import { buildTemplateTasks, getTemplate } from '../templates/catalog';
import type { PlanState } from './propagate';

/**
 * Returns the default baseline plan state seeded with the Phulkari courtyard wedding template.
 *
 * @returns Baseline PlanState ready for living planning
 */
export function getInitialPlan(): PlanState {
  const tmpl = getTemplate('wedding-phulkari-courtyard')!;
  const tasks = buildTemplateTasks(tmpl);
  return {
    id: 'plan_phulkari_01',
    intake: {
      eventType: 'wedding',
      city: 'Chandigarh',
      date: '2027-02-14',
      guests: 250,
      budgetInr: 2500000,
      nonNegotiables: ['Phulkari backdrop', 'Halwai catering'],
      language: 'en',
    },
    tasks,
    budgetLines: [
      {
        id: 'b1',
        category: 'venue',
        name: 'Courtyard Hall',
        unit: 'fixed',
        rateInr: 600000,
        drivers: ['budget'],
      },
      {
        id: 'b2',
        category: 'food',
        name: 'Langar & Feast',
        unit: 'per_head',
        rateInr: 1200,
        quantity: 250,
        drivers: ['guests'],
      },
    ],
    targetDays: 111,
  };
}
