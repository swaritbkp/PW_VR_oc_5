import type { Driver, EventType, PlanTask, TaskCategory, VendorNeedId } from '../plan/types';

interface Extra {
  readonly vendorNeed?: VendorNeedId;
  readonly bookingFor?: VendorNeedId;
  readonly optional?: boolean;
  readonly drivers?: readonly Driver[];
  readonly why?: string;
}

/** Compact task spec: id, name, optimistic, most likely, pessimistic days, comma-separated deps, category, extras. */
export type TaskSpec = readonly [
  id: string,
  name: string,
  optimistic: number,
  mostLikely: number,
  pessimistic: number,
  deps: string,
  category: TaskCategory,
  extra?: Extra,
];

const CATEGORY_DRIVERS: Readonly<Record<TaskCategory, readonly Driver[]>> = {
  planning: ['budget', 'guests'],
  venue: ['guests', 'budget', 'city'],
  permits: ['city', 'date'],
  food: ['guests', 'budget'],
  decor: ['budget', 'city'],
  media: ['budget', 'city'],
  entertainment: ['budget', 'city'],
  attire: ['budget'],
  invites: ['guests'],
  logistics: ['guests', 'city'],
  milestone: ['date'],
};

const CATEGORY_WHY: Readonly<Record<TaskCategory, string>> = {
  planning: 'Decisions here unlock bookings and keep the plan inside the budget.',
  venue: 'The venue fixes the date, the guest limit and where everything else happens.',
  permits: 'Permissions can take weeks and can move the whole plan.',
  food: 'Catering is the largest cost and scales with the guest count.',
  decor: 'Decor and rentals need lead time and depend on the venue.',
  media: 'Good photo and video teams book out early in peak season.',
  entertainment: 'Music and activities set the mood and need confirmed slots.',
  attire: 'Outfits and styling take the longest to finish and fit.',
  invites: 'Guests need notice, and the replies give the final headcount.',
  logistics: 'Travel, stay and supplies are easy to forget and hard to fix late.',
  milestone: 'The fixed date every other task works back from.',
};

/** Expands compact specs into full tasks with default drivers and rationale per category. */
export function makeTasks(specs: readonly TaskSpec[]): PlanTask[] {
  return specs.map(([id, name, optimistic, mostLikely, pessimistic, deps, category, extra]) => ({
    id,
    name,
    optimistic,
    mostLikely,
    pessimistic,
    dependsOn: deps === '' ? [] : deps.split(','),
    category,
    drivers: extra?.drivers ?? CATEGORY_DRIVERS[category],
    why: extra?.why ?? CATEGORY_WHY[category],
    ...(extra?.vendorNeed ? { vendorNeed: extra.vendorNeed } : {}),
    ...(extra?.bookingFor ? { bookingFor: extra.bookingFor } : {}),
    ...(extra?.optional ? { optional: true } : {}),
  }));
}

/** Id of the zero-duration event-day milestone for each event type. */
export const EVENT_DAY_ID: Readonly<Record<EventType, string>> = {
  wedding: 'W16',
  birthday: 'B11',
  community: 'C11',
};

// prettier-ignore
const WEDDING: readonly TaskSpec[] = [
  ['W01', 'Set budget and draft guest list', 1, 3, 7, '', 'planning'],
  ['W02', 'Choose date and ceremony format', 2, 5, 14, 'W01', 'planning'],
  ['W03', 'Shortlist and visit venues', 7, 14, 30, 'W02', 'venue', { vendorNeed: 'venue' }],
  ['W04', 'Book venue', 1, 3, 10, 'W03', 'venue', { vendorNeed: 'venue', bookingFor: 'venue' }],
  ['W05', 'Book caterer', 3, 7, 21, 'W04', 'food', { vendorNeed: 'caterer', bookingFor: 'caterer' }],
  ['W06', 'Book photo and video', 3, 7, 21, 'W04', 'media', { vendorNeed: 'photographer', bookingFor: 'photographer' }],
  ['W07', 'Book decorator', 3, 7, 21, 'W04', 'decor', { vendorNeed: 'decorator', bookingFor: 'decorator' }],
  ['W08', 'Book music', 2, 5, 14, 'W04', 'entertainment', { vendorNeed: 'music', bookingFor: 'music' }],
  ['W09', 'Design and print invitations', 7, 10, 21, 'W02', 'invites', { vendorNeed: 'invitations' }],
  ['W10', 'Send invitations', 1, 3, 7, 'W09', 'invites'],
  ['W11', 'Arrange stay and transport', 5, 10, 21, 'W04', 'logistics', { vendorNeed: 'stay', bookingFor: 'stay', optional: true }],
  ['W12', 'Attire, jewellery and makeup', 14, 30, 60, 'W02', 'attire', { vendorNeed: 'makeup', bookingFor: 'makeup' }],
  ['W13', 'Menu tasting and finalise', 1, 3, 7, 'W05', 'food'],
  ['W14', 'Collect RSVPs and final headcount', 7, 14, 21, 'W10', 'invites'],
  ['W15', 'Final confirmations and run sheet', 2, 4, 8, 'W05,W06,W07,W08,W13,W14', 'planning'],
  ['W16', 'Event day', 0, 0, 0, 'W15,W12', 'milestone'],
];

// prettier-ignore
const BIRTHDAY: readonly TaskSpec[] = [
  ['B01', 'Set budget, guest list and theme', 0.5, 1, 3, '', 'planning'],
  ['B02', 'Pick venue', 1, 3, 10, 'B01', 'venue', { vendorNeed: 'venue' }],
  ['B03', 'Book venue', 0.5, 1, 3, 'B02', 'venue', { vendorNeed: 'venue', bookingFor: 'venue' }],
  ['B04', 'Order cake', 0.5, 1, 3, 'B01', 'food', { vendorNeed: 'cake', bookingFor: 'cake' }],
  ['B05', 'Book entertainer', 1, 3, 10, 'B03', 'entertainment', { vendorNeed: 'entertainer', bookingFor: 'entertainer' }],
  ['B06', 'Send invites', 0.5, 1, 2, 'B03', 'invites'],
  ['B07', 'Order decor and balloons', 1, 3, 7, 'B03', 'decor', { vendorNeed: 'decorator', bookingFor: 'decorator' }],
  ['B08', 'Order return gifts', 1, 3, 7, 'B01', 'logistics', { vendorNeed: 'return_gifts', bookingFor: 'return_gifts' }],
  ['B09', 'Confirm menu and caterer', 1, 2, 5, 'B03', 'food', { vendorNeed: 'caterer', bookingFor: 'caterer' }],
  ['B10', 'Collect RSVPs and final count', 2, 4, 7, 'B06', 'invites'],
  ['B11', 'Event day', 0, 0, 0, 'B04,B05,B07,B08,B09,B10', 'milestone'],
];

// prettier-ignore
const COMMUNITY: readonly TaskSpec[] = [
  ['C01', 'Committee approval and fund collection', 3, 7, 14, '', 'planning'],
  ['C02', 'Obtain permissions', 7, 14, 30, 'C01', 'permits'],
  ['C03', 'Plan layout and safety', 2, 5, 10, 'C01', 'planning', { vendorNeed: 'venue' }],
  ['C04', 'Book sound, stage and lighting', 3, 7, 14, 'C02,C03', 'entertainment', { vendorNeed: 'sound_lights', bookingFor: 'sound_lights' }],
  ['C05', 'Book food vendors', 3, 7, 14, 'C01', 'food', { vendorNeed: 'caterer', bookingFor: 'caterer' }],
  ['C06', 'Plan programme and performers', 5, 10, 21, 'C01', 'entertainment', { vendorNeed: 'music' }],
  ['C07', 'Create volunteer roster', 2, 5, 10, 'C01', 'logistics'],
  ['C08', 'Promote and invite residents', 2, 5, 10, 'C06', 'invites'],
  ['C09', 'Arrange decor and tents', 3, 7, 14, 'C03', 'decor', { vendorNeed: 'tent_house', bookingFor: 'tent_house' }],
  ['C10', 'Plan safety, cleanup and waste', 1, 3, 7, 'C03', 'logistics'],
  ['C11', 'Event day', 0, 0, 0, 'C04,C05,C07,C08,C09,C10', 'milestone'],
];

/** Base task networks that every template starts from. */
export const SKELETONS: Readonly<Record<EventType, readonly PlanTask[]>> = {
  wedding: makeTasks(WEDDING),
  birthday: makeTasks(BIRTHDAY),
  community: makeTasks(COMMUNITY),
};
