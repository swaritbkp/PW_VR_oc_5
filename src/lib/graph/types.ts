import type { TaskCategory } from '../plan/types';
import type { ScheduledTask } from '../schedule/types';

export interface GraphLane {
  readonly lane: TaskCategory;
  readonly y: number;
  readonly height: number;
}

export interface GraphTick {
  readonly x: number;
  readonly offsetDays: number;
  readonly date: string | null;
}

export interface LayoutOptions {
  /** Plan start date, YYYY-MM-DD. */
  readonly startDate: string;
  readonly availableDays: number;
  readonly todayOffset?: number;
  readonly dayWidth?: number;
  readonly nodeHeight?: number;
  readonly rowGap?: number;
  readonly laneGap?: number;
  readonly minNodeWidth?: number;
  readonly padding?: number;
  /** Task ids that have a backup vendor or plan. */
  readonly backedUpTaskIds?: ReadonlySet<string>;
}

export interface GraphNode {
  readonly id: string;
  readonly name: string;
  readonly lane: TaskCategory;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly milestone: boolean;
  readonly critical: boolean;
  readonly floatDays: number;
  readonly done: boolean;
  readonly started: boolean;
  readonly hasBackup: boolean;
  readonly startDate: string | null;
  readonly endDate: string | null;
  /** Latest date the task can start without moving the event, including spare buffer. */
  readonly mustStartBy: string | null;
}

export interface GraphEdge {
  readonly from: string;
  readonly to: string;
  readonly critical: boolean;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface GraphLayout {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly lanes: readonly GraphLane[];
  readonly ticks: readonly GraphTick[];
  readonly todayX: number;
  readonly eventX: number;
  readonly width: number;
  readonly height: number;
}

export interface Placed {
  readonly task: ScheduledTask;
  readonly x: number;
  readonly w: number;
  readonly row: number;
}
