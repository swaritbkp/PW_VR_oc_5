/** Shared types for the event scheduling engine. All durations are in days. */

/** One task in the event plan with three-point (PERT) duration estimates. */
export interface TaskInput {
  readonly id: string;
  readonly name: string;
  readonly optimistic: number;
  readonly mostLikely: number;
  readonly pessimistic: number;
  readonly dependsOn: readonly string[];
  /** Task cannot start before this day offset from plan start (e.g. vendor availability). */
  readonly notBefore?: number;
  readonly started?: boolean;
  readonly done?: boolean;
}

/** A task after CPM/PERT analysis. */
export interface ScheduledTask extends TaskInput {
  readonly expected: number;
  readonly sigma: number;
  readonly earliestStart: number;
  readonly earliestFinish: number;
  readonly latestStart: number;
  readonly latestFinish: number;
  readonly totalFloat: number;
  readonly critical: boolean;
}

/** Result of analysing a whole task network. */
export interface Schedule {
  readonly tasks: readonly ScheduledTask[];
  readonly projectDuration: number;
  /** One longest chain of critical task ids, in execution order. */
  readonly criticalPath: readonly string[];
  /** Standard deviation of the project duration along the critical chain. */
  readonly sigma: number;
}

export type GraphErrorCode =
  | 'EMPTY'
  | 'DUPLICATE_ID'
  | 'MISSING_DEPENDENCY'
  | 'CYCLE'
  | 'INVALID_ESTIMATE'
  | 'UNKNOWN_TASK'
  | 'INVALID_CHANGE';

export interface GraphError {
  readonly code: GraphErrorCode;
  readonly message: string;
  readonly ids: readonly string[];
}

export type Result<T, E> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
