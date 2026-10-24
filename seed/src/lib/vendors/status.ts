import type { PlanTask, VendorNeedId } from '../plan/types';
import type { VendorSelection, VendorStatus } from './types';

const NEXT: Readonly<Record<VendorStatus, readonly VendorStatus[]>> = {
  shortlisted: ['contacted', 'backup', 'rejected'],
  contacted: ['quoted', 'backup', 'rejected'],
  quoted: ['booked', 'backup', 'rejected'],
  booked: ['rejected'],
  backup: ['contacted', 'quoted', 'booked', 'rejected'],
  rejected: ['shortlisted'],
};

/** Whether a vendor may move from one status to another. */
export function canTransition(from: VendorStatus, to: VendorStatus): boolean {
  return NEXT[from].includes(to);
}

/** Effect a vendor status has on the booking task: nothing, mark started, or mark done. */
export function bookingEffect(status: VendorStatus): 'none' | 'start' | 'complete' {
  if (status === 'booked') return 'complete';
  if (status === 'contacted' || status === 'quoted') return 'start';
  return 'none';
}

/** Applies a vendor status to the booking task for that need. Other tasks keep identity. */
export function applyVendorStatus(
  tasks: readonly PlanTask[],
  need: VendorNeedId,
  status: VendorStatus,
): readonly PlanTask[] {
  const effect = bookingEffect(status);
  if (effect === 'none') return tasks;
  return tasks.map((task) => {
    if (task.bookingFor !== need) return task;
    return effect === 'complete' ? { ...task, started: true, done: true } : { ...task, started: true };
  });
}

/** Needs that have at least one vendor held as a backup. */
export function backedUpNeeds(selections: readonly VendorSelection[]): ReadonlySet<VendorNeedId> {
  return new Set(selections.filter((s) => s.status === 'backup').map((s) => s.need));
}

/** Total of accepted quotes for booked vendors, in rupees. */
export function bookedSpendInr(selections: readonly VendorSelection[]): number {
  return selections
    .filter((s) => s.status === 'booked')
    .reduce((sum, s) => sum + (s.quoteInr ?? 0), 0);
}
