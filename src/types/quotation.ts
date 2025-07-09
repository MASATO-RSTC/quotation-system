/**
 * 契約種別
 */
export type ContractType =
  | 'hourly'
  | 'monthly_upper_lower'
  | 'monthly_upper_only'
  | 'monthly_lower_only'
  | 'monthly_fixed'
  | 'monthly_variable_upper_lower'
  | 'monthly_variable_upper_only'
  | 'monthly_variable_lower_only'
  | 'monthly_variable_fixed';

/**
 * 丸め方法
 */
export type RoundingMethod = '切り捨て' | '切り上げ' | '四捨五入';

/**
 * 単価の算出方法
 */
export type UnitPriceCalculationMethod = 'upper' | 'lower' | 'middle' | 'custom';

/**
 * 月給契約（上限あり・下限あり）のデータ構造
 */
export interface MonthlyUoLdContract {
  contractType: 'monthly_upper_lower';
  startDate: string;
  endDate: string;
  billingAmount: number;
  upperLimitHours: number;
  lowerLimitHours: number;
  overtimeUnitPriceCalculationMethod: UnitPriceCalculationMethod;
  customOvertimeUnitPriceHours?: number;
  deductionUnitPriceCalculationMethod: UnitPriceCalculationMethod;
  customDeductionUnitPriceHours?: number;
  overtimePremiumRate?: number;
  roundingUnit: 1 | 10 | 100 | 1000;
  roundingMethod: RoundingMethod;
  settlementUnit: 15 | 30 | 60;
  settlementRoundingMethod: 'floor' | 'ceil' | 'round';
}

/**
 * 深夜手当などの割増項目
 */
export interface PremiumRates {
  midnight?: number;
  holiday?: number;
  statutoryHoliday?: number;
  over60hours?: number;
}

// 全ての契約種別を統合する型 (今後拡張)
export type Quotation = MonthlyUoLdContract; // | HourlyContract | ...
