import type { EventType, PlanTask } from '../plan/types';
import { EVENT_DAY_ID, SKELETONS, makeTasks } from './skeletons';
import type { TaskSpec } from './skeletons';

const ROUNDING = 10;

export interface Range {
  readonly min: number;
  readonly typical: number;
  readonly max: number;
}

/** A contemporary starting point a user can pick and then edit. */
export interface EventTemplate {
  readonly id: string;
  readonly eventType: EventType;
  readonly title: string;
  readonly tagline: string;
  readonly style: readonly string[];
  readonly guests: Range;
  readonly budgetInr: Range;
  readonly outdoor: boolean;
  /** Calendar months (1-12) when this style works best. */
  readonly bestMonths: readonly number[];
  readonly accent: string;
  readonly art: { readonly id: string; readonly alt: string };
  /** Disruption scenario ids this template should have a Plan B for. */
  readonly backups: readonly string[];
  readonly addTasks?: readonly PlanTask[];
  readonly removeTaskIds?: readonly string[];
  readonly durationScale?: Readonly<Record<string, number>>;
}

const range = (min: number, typical: number, max: number): Range => ({ min, typical, max });
const art = (id: string, alt: string): EventTemplate['art'] => ({ id, alt });
const add = (specs: readonly TaskSpec[]): PlanTask[] => makeTasks(specs);

const WEDDINGS: readonly EventTemplate[] = [
  {
    id: 'wedding-phulkari-courtyard',
    eventType: 'wedding',
    title: 'Phulkari courtyard wedding',
    tagline: 'Marigold, phulkari and a live dhol',
    style: ['punjabi', 'traditional', 'marigold', 'phulkari'],
    guests: range(150, 300, 450),
    budgetInr: range(1_500_000, 2_500_000, 4_000_000),
    outdoor: true,
    bestMonths: [10, 11, 12, 1, 2, 3],
    accent: '#B45309',
    art: art('wedding-phulkari-courtyard', 'Illustration of a courtyard wedding with marigold garlands and phulkari fabric.'),
    backups: ['rain_outdoor', 'power_cut', 'caterer_no_show', 'venue_cancels'],
    addTasks: add([
      ['W21', 'Plan phulkari and marigold decor mockups', 3, 5, 10, 'W07', 'decor'],
      ['W22', 'Arrange tent and weather cover', 3, 7, 14, 'W04', 'logistics', { vendorNeed: 'tent_house', bookingFor: 'tent_house' }],
      ['W23', 'Arrange generator and power backup', 2, 5, 10, 'W04', 'logistics', { vendorNeed: 'power_backup', bookingFor: 'power_backup' }],
    ]),
  },
  {
    id: 'wedding-intimate-morning',
    eventType: 'wedding',
    title: 'Intimate morning ceremony and brunch',
    tagline: 'A small, unhurried ceremony followed by brunch',
    style: ['intimate', 'minimal', 'brunch', 'family'],
    guests: range(50, 90, 130),
    budgetInr: range(600_000, 1_000_000, 1_500_000),
    outdoor: false,
    bestMonths: [10, 11, 12, 1, 2, 3, 4],
    accent: '#0F766E',
    art: art('wedding-intimate-morning', 'Illustration of a sunlit banquet table set for a small brunch.'),
    backups: ['venue_cancels', 'caterer_no_show', 'photographer_unavailable'],
    removeTaskIds: ['W11'],
    durationScale: { W03: 0.6, W05: 0.7, W09: 0.6 },
  },
  {
    id: 'wedding-boho-garden',
    eventType: 'wedding',
    title: 'Boho garden wedding',
    tagline: 'Dried flowers, lanterns and a lawn at golden hour',
    style: ['boho', 'garden', 'floral', 'outdoor'],
    guests: range(80, 150, 220),
    budgetInr: range(900_000, 1_600_000, 2_600_000),
    outdoor: true,
    bestMonths: [10, 11, 12, 1, 2, 3],
    accent: '#7C3AED',
    art: art('wedding-boho-garden', 'Illustration of a garden lawn with lanterns and dried-flower arches.'),
    backups: ['rain_outdoor', 'power_cut', 'decorator_delay'],
    addTasks: add([
      ['W22', 'Arrange tent and weather cover', 3, 7, 14, 'W04', 'logistics', { vendorNeed: 'tent_house', bookingFor: 'tent_house' }],
      ['W24', 'Book florist', 3, 7, 14, 'W04', 'decor', { vendorNeed: 'florist', bookingFor: 'florist' }],
      ['W25', 'Plan rain-day layout', 1, 2, 4, 'W07', 'planning'],
    ]),
  },
  {
    id: 'wedding-retro-sangeet',
    eventType: 'wedding',
    title: 'Retro Bollywood sangeet night',
    tagline: 'Choreographed family performances and a vintage dance floor',
    style: ['sangeet', 'retro', 'dance', 'music'],
    guests: range(100, 200, 350),
    budgetInr: range(800_000, 1_500_000, 2_800_000),
    outdoor: false,
    bestMonths: [10, 11, 12, 1, 2, 3, 4],
    accent: '#BE123C',
    art: art('wedding-retro-sangeet', 'Illustration of a stage with retro lights and a dance floor.'),
    backups: ['power_cut', 'music_cancel', 'venue_cancels'],
    addTasks: add([
      ['W26', 'Choreography and rehearsals', 7, 14, 30, 'W02', 'entertainment'],
      ['W27', 'Book stage, sound and lights', 3, 7, 14, 'W04', 'entertainment', { vendorNeed: 'sound_lights', bookingFor: 'sound_lights' }],
    ]),
  },
];

const BIRTHDAYS: readonly EventTemplate[] = [
  {
    id: 'birthday-dino-explorer',
    eventType: 'birthday',
    title: 'Dino explorer party',
    tagline: 'Fossil digs, jungle decor and a roaring cake',
    style: ['dinosaur', 'kids', 'activity'],
    guests: range(20, 35, 50),
    budgetInr: range(25_000, 45_000, 80_000),
    outdoor: false,
    bestMonths: [1, 2, 3, 4, 9, 10, 11, 12],
    accent: '#15803D',
    art: art('birthday-dino-explorer', 'Illustration of friendly dinosaurs in a leafy jungle.'),
    backups: ['venue_cancels', 'entertainer_no_show'],
    addTasks: add([['B12', 'Plan fossil-dig sandbox activity', 1, 2, 5, 'B03', 'entertainment']]),
  },
  {
    id: 'birthday-space-adventure',
    eventType: 'birthday',
    title: 'Space adventure party',
    tagline: 'Glow-in-the-dark galaxy and astronaut missions',
    style: ['space', 'kids', 'glow'],
    guests: range(20, 30, 45),
    budgetInr: range(30_000, 50_000, 90_000),
    outdoor: false,
    bestMonths: [1, 2, 3, 4, 9, 10, 11, 12],
    accent: '#1D4ED8',
    art: art('birthday-space-adventure', 'Illustration of rockets, planets and stars on a dark blue sky.'),
    backups: ['venue_cancels', 'entertainer_no_show'],
    addTasks: add([['B12', 'Plan galaxy backdrop and glow decor', 1, 3, 7, 'B07', 'decor']]),
  },
  {
    id: 'birthday-pastel-pool',
    eventType: 'birthday',
    title: 'Pastel pool party',
    tagline: 'Soft colours, floats and a shaded splash zone',
    style: ['pool', 'pastel', 'summer'],
    guests: range(15, 30, 45),
    budgetInr: range(35_000, 60_000, 110_000),
    outdoor: true,
    bestMonths: [3, 4, 5, 6, 9, 10],
    accent: '#0E7490',
    art: art('birthday-pastel-pool', 'Illustration of a pastel pool with floats and an umbrella.'),
    backups: ['rain_outdoor', 'heat_wave', 'venue_cancels'],
    addTasks: add([
      ['B12', 'Check pool safety and lifeguard cover', 1, 2, 4, 'B03', 'logistics'],
      ['B13', 'Arrange shade and rain cover', 1, 3, 7, 'B03', 'logistics', { vendorNeed: 'tent_house', bookingFor: 'tent_house' }],
    ]),
  },
  {
    id: 'birthday-mini-chef',
    eventType: 'birthday',
    title: 'Mini chef cook-along',
    tagline: 'Kids cook their own pizzas and cupcakes',
    style: ['cooking', 'kids', 'hands-on'],
    guests: range(10, 20, 30),
    budgetInr: range(20_000, 35_000, 60_000),
    outdoor: false,
    bestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    accent: '#C2410C',
    art: art('birthday-mini-chef', 'Illustration of a kids kitchen table with aprons and dough.'),
    backups: ['venue_cancels', 'entertainer_no_show'],
    addTasks: add([['B12', 'Prepare ingredient kits and aprons', 1, 2, 4, 'B09', 'food']]),
  },
];

const COMMUNITIES: readonly EventTemplate[] = [
  {
    id: 'community-lohri-bonfire',
    eventType: 'community',
    title: 'Lohri bonfire and bhangra night',
    tagline: 'A society bonfire with gajak, rewri and a dhol',
    style: ['lohri', 'bonfire', 'bhangra', 'punjabi'],
    guests: range(80, 150, 300),
    budgetInr: range(30_000, 60_000, 150_000),
    outdoor: true,
    bestMonths: [1],
    accent: '#C2410C',
    art: art('community-lohri-bonfire', 'Illustration of neighbours around a bonfire at dusk.'),
    backups: ['rain_outdoor', 'power_cut', 'permit_denied', 'fog_travel'],
    addTasks: add([
      ['C12', 'Arrange bonfire safety and fire permission', 2, 5, 10, 'C02', 'permits'],
      ['C13', 'Arrange generator and power backup', 1, 3, 7, 'C03', 'logistics', { vendorNeed: 'power_backup', bookingFor: 'power_backup' }],
    ]),
  },
  {
    id: 'community-eco-diwali-mela',
    eventType: 'community',
    title: 'Eco Diwali mela',
    tagline: 'Handmade stalls, diyas and a zero-waste promise',
    style: ['diwali', 'eco', 'market', 'stalls'],
    guests: range(200, 400, 800),
    budgetInr: range(80_000, 200_000, 500_000),
    outdoor: true,
    bestMonths: [10, 11],
    accent: '#A16207',
    art: art('community-eco-diwali-mela', 'Illustration of lit diyas and handmade stalls in a courtyard.'),
    backups: ['rain_outdoor', 'power_cut', 'permit_denied', 'guest_surge'],
    addTasks: add([
      ['C12', 'Allocate stalls and register vendors', 3, 7, 14, 'C01', 'logistics'],
      ['C13', 'Plan waste segregation and green alternatives', 2, 4, 8, 'C03', 'logistics'],
    ]),
  },
  {
    id: 'community-gurpurab-langar',
    eventType: 'community',
    title: 'Gurpurab langar and kirtan evening',
    tagline: 'Shared langar and an evening of kirtan for the neighbourhood',
    style: ['gurpurab', 'langar', 'kirtan', 'seva'],
    guests: range(150, 300, 600),
    budgetInr: range(60_000, 120_000, 300_000),
    outdoor: false,
    bestMonths: [11],
    accent: '#1E40AF',
    art: art('community-gurpurab-langar', 'Illustration of a community hall with a shared langar line.'),
    backups: ['power_cut', 'permit_denied', 'guest_surge'],
    addTasks: add([
      ['C12', 'Organise langar seva rota and utensils', 2, 5, 10, 'C07', 'logistics'],
      ['C13', 'Coordinate kirtan with the gurdwara committee', 3, 7, 14, 'C01', 'planning'],
    ]),
  },
  {
    id: 'community-holi-organic',
    eventType: 'community',
    title: 'Holi with organic colours',
    tagline: 'Skin-safe colours, music and shaded water points',
    style: ['holi', 'colours', 'music', 'organic'],
    guests: range(100, 200, 400),
    budgetInr: range(40_000, 90_000, 200_000),
    outdoor: true,
    bestMonths: [3],
    accent: '#BE185D',
    art: art('community-holi-organic', 'Illustration of a courtyard with soft coloured powder in the air.'),
    backups: ['rain_outdoor', 'power_cut', 'guest_surge'],
    addTasks: add([
      ['C12', 'Source organic colours and plan water use', 2, 5, 10, 'C03', 'logistics'],
      ['C13', 'Arrange first aid and shade', 1, 2, 4, 'C10', 'logistics'],
    ]),
  },
];

/** Every contemporary starter template. */
export const TEMPLATES: readonly EventTemplate[] = [...WEDDINGS, ...BIRTHDAYS, ...COMMUNITIES];

/** Templates for one event type, in display order. */
export function templatesFor(eventType: EventType): readonly EventTemplate[] {
  return TEMPLATES.filter((t) => t.eventType === eventType);
}

/** Finds a template by id. */
export function getTemplate(id: string): EventTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

function scale(task: PlanTask, factor: number | undefined): PlanTask {
  if (factor === undefined) return task;
  const apply = (v: number): number => Math.round(v * factor * ROUNDING) / ROUNDING;
  return {
    ...task,
    optimistic: apply(task.optimistic),
    mostLikely: apply(task.mostLikely),
    pessimistic: apply(task.pessimistic),
  };
}

function linkSinksToEventDay(tasks: readonly PlanTask[], eventDayId: string): PlanTask[] {
  const referenced = new Set(tasks.flatMap((t) => t.dependsOn));
  const sinks = tasks.filter((t) => t.id !== eventDayId && !referenced.has(t.id)).map((t) => t.id);
  return tasks.map((t) =>
    t.id === eventDayId ? { ...t, dependsOn: [...new Set([...t.dependsOn, ...sinks])] } : t,
  );
}

/** Builds the full task network for a template: skeleton, removals, additions, scaling, one event-day sink. */
export function buildTemplateTasks(template: EventTemplate): PlanTask[] {
  const removed = new Set(template.removeTaskIds ?? []);
  const base = SKELETONS[template.eventType].filter((t) => !removed.has(t.id));
  const merged = [...base, ...(template.addTasks ?? [])]
    .map((t) => scale(t, template.durationScale?.[t.id]))
    .map((t) => ({ ...t, dependsOn: t.dependsOn.filter((d) => !removed.has(d)) }));
  return linkSinksToEventDay(merged, EVENT_DAY_ID[template.eventType]);
}
