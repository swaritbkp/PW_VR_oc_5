import type { TaskInput } from '../schedule/types';

export type EventType = 'wedding' | 'birthday' | 'community';

/** Intake fields a task or budget line is sensitive to. A change marks only nodes that list its driver. */
export type Driver = 'guests' | 'budget' | 'date' | 'city';

export type TaskCategory =
  | 'planning'
  | 'venue'
  | 'permits'
  | 'food'
  | 'decor'
  | 'media'
  | 'entertainment'
  | 'attire'
  | 'invites'
  | 'logistics'
  | 'milestone';

/** Things a person can search for and contact near the event. */
export type VendorNeedId =
  | 'venue'
  | 'caterer'
  | 'decorator'
  | 'photographer'
  | 'music'
  | 'makeup'
  | 'tent_house'
  | 'sound_lights'
  | 'invitations'
  | 'cake'
  | 'entertainer'
  | 'return_gifts'
  | 'transport'
  | 'stay'
  | 'florist'
  | 'power_backup';

/** A schedulable task enriched with the planning context the app needs. */
export interface PlanTask extends TaskInput {
  readonly category: TaskCategory;
  readonly drivers: readonly Driver[];
  readonly why: string;
  /** Vendor need this task relates to (search and contact happen here). */
  readonly vendorNeed?: VendorNeedId;
  /** Set on the booking step. Completing it means the vendor is booked. */
  readonly bookingFor?: VendorNeedId;
  readonly optional?: boolean;
}
