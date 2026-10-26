import type React from 'react';
import type { BudgetLine } from '@/lib/budget/engine';
import { syncVendorQuoteToBudget, toBudgetCategory } from '@/lib/budget/vendorBudgetSync';
import { propagate, type PlanState } from '@/lib/plan/propagate';
import type { PlanTask, VendorNeedId } from '@/lib/plan/types';
import { currentPlan, pushVersion, type VersionStore } from '@/lib/plan/versions';
import type { Vendor, VendorSelection, VendorStatus } from '@/lib/vendors/types';
import { factorWeatherIntoPlan, type WeatherForecast } from '@/lib/weather/weatherForecast';

function createTaskAndBudgetHandlers(
  plan: PlanState,
  setVersionStore: React.Dispatch<React.SetStateAction<VersionStore>>,
) {
  const handleUpdateTaskStatus = (id: string, done: boolean) => {
    const updatedTasks = plan.tasks.map((t) => (t.id === id ? { ...t, done } : t));
    setVersionStore((s) => pushVersion(s, { ...plan, tasks: updatedTasks }, `Updated task ${id} status`));
  };

  const handleUpdateTask = (id: string, updates: Partial<PlanTask>) => {
    const res = propagate(plan, { kind: 'task', taskId: id, updates });
    setVersionStore((s) => pushVersion(s, res.plan, res.diff.join('; ')));
  };

  const handleUpdateBudgetLines = (budgetLines: readonly BudgetLine[], reason: string) => {
    setVersionStore((s) => {
      const cur = currentPlan(s);
      const totalSpend = budgetLines.reduce((sum, l) => sum + l.rateInr * (l.quantity ?? 1), 0);
      const contingency = Math.round(totalSpend * 0.1);
      const newBudget = Math.max(cur.intake.budgetInr, totalSpend + contingency);
      return pushVersion(
        s,
        {
          ...cur,
          budgetLines,
          intake: { ...cur.intake, budgetInr: newBudget },
        },
        reason,
      );
    });
  };

  return { handleUpdateTaskStatus, handleUpdateTask, handleUpdateBudgetLines };
}

function createNegotiationHandler(
  setVersionStore: React.Dispatch<React.SetStateAction<VersionStore>>,
) {
  return (targetOfferInr: number, vendorName: string, category: string) => {
    setVersionStore((store) => {
      const cur = currentPlan(store);
      const updatedLines = syncVendorQuoteToBudget(cur.budgetLines, {
        vendorName,
        category: toBudgetCategory(category),
        quoteInr: targetOfferInr,
      });
      const totalSpend = updatedLines.reduce((sum, l) => sum + l.rateInr * (l.quantity ?? 1), 0);
      const contingency = Math.round(totalSpend * 0.1);
      const newBudget = Math.max(cur.intake.budgetInr, totalSpend + contingency);
      return pushVersion(
        store,
        { ...cur, budgetLines: updatedLines, intake: { ...cur.intake, budgetInr: newBudget } },
        `✓ Locked Custom Vendor Quote into Budget Ledger: ${vendorName} (₹${targetOfferInr.toLocaleString('en-IN')})`,
      );
    });
  };
}

function createVendorBookingHandlers(
  vendorCategory: VendorNeedId,
  setVersionStore: React.Dispatch<React.SetStateAction<VersionStore>>,
  setVendorSelections: React.Dispatch<React.SetStateAction<VendorSelection[]>>,
) {
  const handleBookVendor = (vendor: Vendor, status: VendorStatus, quoteInr?: number) => {
    setVendorSelections((prev) => [
      ...prev.filter((v) => v.placeId !== vendor.placeId),
      { placeId: vendor.placeId, need: vendorCategory, status, quoteInr: quoteInr ?? 0 },
    ]);
    const quoteSuffix = quoteInr ? ` ₹${quoteInr.toLocaleString('en-IN')}` : '';
    setVersionStore((store) => {
      const cur = currentPlan(store);
      const updatedLines = quoteInr && quoteInr > 0
        ? syncVendorQuoteToBudget(cur.budgetLines, { vendorName: vendor.name, category: toBudgetCategory(vendorCategory), quoteInr })
        : cur.budgetLines;
      return pushVersion(store, { ...cur, budgetLines: updatedLines }, `Updated vendor ${vendor.name} (${status}${quoteSuffix})`);
    });
  };

  const handleApplyNegotiationStrategy = createNegotiationHandler(setVersionStore);
  return { handleBookVendor, handleApplyNegotiationStrategy };
}

/**
 * Creates dispatch handlers for task updates, budget reconciliations, vendor bookings, and weather factoring.
 */
export function createPlanActionHandlers(
  plan: PlanState,
  vendorCategory: VendorNeedId,
  setVersionStore: React.Dispatch<React.SetStateAction<VersionStore>>,
  setVendorSelections: React.Dispatch<React.SetStateAction<VendorSelection[]>>,
) {
  const handleFactorWeather = (forecast: WeatherForecast) => {
    setVersionStore((store) => {
      const cur = currentPlan(store);
      const factored = factorWeatherIntoPlan(cur, forecast);
      return pushVersion(store, factored, `Factored weather forecast: ${forecast.condition} (${forecast.rainProbabilityPct}% rain)`);
    });
  };

  return {
    ...createTaskAndBudgetHandlers(plan, setVersionStore),
    ...createVendorBookingHandlers(vendorCategory, setVersionStore, setVendorSelections),
    handleFactorWeather,
  };
}
