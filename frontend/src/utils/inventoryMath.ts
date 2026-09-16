/**
 * RetailPulse Statistical Inventory Calculation Engine
 * Implements standard supply chain replenishment formulas:
 * SS = Z * sigma_demand * sqrt(LeadTime)
 * ROP = (DailyDemand * LeadTime) + SS
 */

export const Z_LOOKUP: Record<number, number> = {
  90: 1.282,
  95: 1.645,
  99: 2.326
};

export interface InventoryCalculationParams {
  currentStock: number;
  dailyDemand: number;
  demandStdDev: number;
  leadTimeDays: number;
  serviceLevel: number; // 90, 95, 99
  orderMultiplier?: number;
}

export interface InventoryCalculationResult {
  safetyStock: number;
  reorderPoint: number;
  coverageDays: number;
  suggestedOrder: number;
  status: 'Critical' | 'Warning' | 'Healthy';
  stockoutRiskPct: number;
}

export function calculateInventoryMetrics(params: InventoryCalculationParams): InventoryCalculationResult {
  const { currentStock, dailyDemand, demandStdDev, leadTimeDays, serviceLevel, orderMultiplier = 1.5 } = params;

  const z = Z_LOOKUP[serviceLevel] || 1.645;
  
  // SS = Z * sigma_demand * sqrt(LeadTime)
  const safetyStock = Math.max(1, Math.round(z * demandStdDev * Math.sqrt(Math.max(1, leadTimeDays))));

  // ROP = (DailyDemand * LeadTime) + SS
  const reorderPoint = Math.round((dailyDemand * leadTimeDays) + safetyStock);

  // Coverage Days
  const coverageDays = dailyDemand > 0 ? Number((currentStock / dailyDemand).toFixed(1)) : 999;

  // Status Evaluation
  let status: 'Critical' | 'Warning' | 'Healthy' = 'Healthy';
  let stockoutRiskPct = 2.5;

  if (currentStock < safetyStock) {
    status = 'Critical';
    stockoutRiskPct = Math.min(95, Number((((safetyStock - currentStock) / safetyStock) * 100).toFixed(1)) + 40);
  } else if (currentStock < reorderPoint) {
    status = 'Warning';
    stockoutRiskPct = Math.min(50, Number((((reorderPoint - currentStock) / (reorderPoint - safetyStock)) * 40).toFixed(1)) + 15);
  } else {
    status = 'Healthy';
    stockoutRiskPct = Math.max(1, Number(((safetyStock / currentStock) * 5).toFixed(1)));
  }

  // Suggested Order
  let suggestedOrder = 0;
  if (currentStock < reorderPoint) {
    suggestedOrder = Math.max(0, Math.round((reorderPoint * orderMultiplier) - currentStock));
  }

  return {
    safetyStock,
    reorderPoint,
    coverageDays,
    suggestedOrder,
    status,
    stockoutRiskPct
  };
}

export function calculateWhatIfDemandScenario(
  baseForecast: number[],
  demandGrowthPct: number, // e.g. +20%
  promotionLiftPct: number, // e.g. +15%
  seasonalityMultiplier: number // e.g. 1.1
): number[] {
  const combinedMultiplier = (1 + (demandGrowthPct / 100)) * (1 + (promotionLiftPct / 100)) * seasonalityMultiplier;
  return baseForecast.map(val => Number((val * combinedMultiplier).toFixed(2)));
}
