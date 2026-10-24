import { offsetToDate } from '../dates';
import type { PlanTask, TaskCategory } from '../plan/types';
import type { Schedule, ScheduledTask } from '../schedule/types';

const LANE_ORDER: readonly TaskCategory[] = [
  'planning', 'venue', 'permits', 'food', 'decor', 'media', 'entertainment', 'attire', 'invites', 'logistics', 'milestone',
];
const DEFAULTS = { dayWidth: 24, nodeHeight: 44, rowGap: 10, laneGap: 28, minNodeWidth: 120, padding: 24 };
const COLUMN_GAP = 8;
const MILESTONE_SIZE = 32;
const EPSILON = 1e-9;
const SHORT_RANGE_DAYS = 14;
const MEDIUM_RANGE_DAYS = 60;
const LONG_RANGE_DAYS = 200;
const MEDIUM_STEP = 7;
const LONG_STEP = 14;
const VERY_LONG_STEP = 30;

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

type Config = typeof DEFAULTS;

interface Placed {
  readonly task: ScheduledTask;
  readonly x: number;
  readonly w: number;
  readonly row: number;
}

/** Calendar tick spacing in days for a plan of this length. */
export function tickStepDays(totalDays: number): number {
  if (totalDays <= SHORT_RANGE_DAYS) return 1;
  if (totalDays <= MEDIUM_RANGE_DAYS) return MEDIUM_STEP;
  if (totalDays <= LONG_RANGE_DAYS) return LONG_STEP;
  return VERY_LONG_STEP;
}

function config(options: LayoutOptions): Config {
  return {
    dayWidth: options.dayWidth ?? DEFAULTS.dayWidth,
    nodeHeight: options.nodeHeight ?? DEFAULTS.nodeHeight,
    rowGap: options.rowGap ?? DEFAULTS.rowGap,
    laneGap: options.laneGap ?? DEFAULTS.laneGap,
    minNodeWidth: options.minNodeWidth ?? DEFAULTS.minNodeWidth,
    padding: options.padding ?? DEFAULTS.padding,
  };
}

function packRows(tasks: readonly ScheduledTask[], isMilestone: (t: ScheduledTask) => boolean, cfg: Config): { items: Placed[]; rows: number } {
  const rowEnds: number[] = [];
  const items: Placed[] = [];
  const sorted = [...tasks].sort((a, b) => a.earliestStart - b.earliestStart || a.id.localeCompare(b.id));
  for (const task of sorted) {
    const x = cfg.padding + task.earliestStart * cfg.dayWidth;
    const w = isMilestone(task) ? MILESTONE_SIZE : Math.max(cfg.minNodeWidth, task.expected * cfg.dayWidth);
    let row = rowEnds.findIndex((end) => x >= end + COLUMN_GAP);
    if (row === -1) row = rowEnds.length;
    rowEnds[row] = x + w;
    items.push({ task, x, w, row });
  }
  return { items, rows: Math.max(1, rowEnds.length) };
}

function toNode(p: Placed, lane: TaskCategory, laneY: number, buffer: number, cfg: Config, options: LayoutOptions): GraphNode {
  const milestone = lane === 'milestone';
  const start = options.startDate;
  return {
    id: p.task.id,
    name: p.task.name,
    lane,
    x: p.x,
    y: laneY + p.row * (cfg.nodeHeight + cfg.rowGap),
    w: p.w,
    h: milestone ? MILESTONE_SIZE : cfg.nodeHeight,
    milestone,
    critical: p.task.critical,
    floatDays: p.task.totalFloat + buffer,
    done: p.task.done === true,
    started: p.task.started === true || p.task.done === true,
    hasBackup: options.backedUpTaskIds?.has(p.task.id) ?? false,
    startDate: offsetToDate(start, p.task.earliestStart, 'floor'),
    endDate: offsetToDate(start, p.task.earliestFinish, 'ceil'),
    mustStartBy: offsetToDate(start, p.task.latestStart + buffer, 'floor'),
  };
}

function buildEdges(nodes: readonly GraphNode[], schedule: Schedule): GraphEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const taskById = new Map(schedule.tasks.map((t) => [t.id, t]));
  const edges: GraphEdge[] = [];
  for (const task of schedule.tasks) {
    const to = byId.get(task.id);
    for (const depId of task.dependsOn) {
      const from = byId.get(depId);
      const dep = taskById.get(depId);
      if (!from || !to || !dep) continue;
      const tight = Math.abs(dep.earliestFinish - task.earliestStart) <= EPSILON;
      edges.push({
        from: from.id,
        to: to.id,
        critical: dep.critical && task.critical && tight,
        x1: from.x + from.w,
        y1: from.y + from.h / 2,
        x2: to.x,
        y2: to.y + to.h / 2,
      });
    }
  }
  return edges;
}

function buildTicks(options: LayoutOptions, cfg: Config, totalDays: number): GraphTick[] {
  const step = tickStepDays(totalDays);
  const ticks: GraphTick[] = [];
  for (let offset = 0; offset <= totalDays; offset += step) {
    ticks.push({ x: cfg.padding + offset * cfg.dayWidth, offsetDays: offset, date: offsetToDate(options.startDate, offset, 'floor') });
  }
  return ticks;
}

/**
 * Lays the task network out as a date-aware canvas: x is calendar time, lanes are categories,
 * overlapping boxes stack into rows. Pure and deterministic; the UI only draws it.
 */
export function layoutEventGraph(schedule: Schedule, tasks: readonly PlanTask[], options: LayoutOptions): GraphLayout {
  const cfg = config(options);
  const category = new Map(tasks.map((t) => [t.id, t.category]));
  const laneOf = (t: ScheduledTask): TaskCategory => category.get(t.id) ?? 'planning';
  const buffer = options.availableDays - schedule.projectDuration;
  const nodes: GraphNode[] = [];
  const lanes: GraphLane[] = [];
  let cursorY = cfg.padding;
  for (const lane of LANE_ORDER) {
    const inLane = schedule.tasks.filter((t) => laneOf(t) === lane);
    if (inLane.length === 0) continue;
    const { items, rows } = packRows(inLane, () => lane === 'milestone', cfg);
    const height = rows * (cfg.nodeHeight + cfg.rowGap);
    lanes.push({ lane, y: cursorY, height });
    items.forEach((p) => nodes.push(toNode(p, lane, cursorY, buffer, cfg, options)));
    cursorY += height + cfg.laneGap;
  }
  const todayX = cfg.padding + (options.todayOffset ?? 0) * cfg.dayWidth;
  const eventX = cfg.padding + options.availableDays * cfg.dayWidth;
  const right = nodes.reduce((max, n) => Math.max(max, n.x + n.w), eventX);
  const total = Math.max(options.availableDays, schedule.projectDuration);
  return {
    nodes,
    edges: buildEdges(nodes, schedule),
    lanes,
    ticks: buildTicks(options, cfg, Math.ceil(total)),
    todayX,
    eventX,
    width: right + cfg.padding,
    height: cursorY - cfg.laneGap + cfg.padding,
  };
}
