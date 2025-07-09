import { MonthlyUoLdContract, PremiumRates, RoundingMethod, UnitPriceCalculationMethod } from '../types/quotation';

export type DiscountMethod = "上限時間" | "下限時間" | "中央時間" | "任意の値";
export type FluctuationType = "所定労働日数 × 法定労働時間" | "出勤日数 × 所定労働時間" | "所定労働日数 × 所定労働時間" | "出勤日数 × 法定労働時間";

export function roundValue(value: number, unit: number, method: RoundingMethod): number {
  if (unit <= 0) return value; // Avoid division by zero or non-positive units

  const inverseUnit = 1 / unit;
  switch (method) {
    case "切り捨て":
      return Math.floor(value * inverseUnit) / inverseUnit;
    case "切り上げ":
      return Math.ceil(value * inverseUnit) / inverseUnit;
    case "四捨五入":
      return Math.round(value * inverseUnit) / inverseUnit;
    default:
      return value;
  }
}

// Assuming settlementValue uses the same rounding logic for now
export function settleValue(value: number, unit: number, method: RoundingMethod): number {
  return roundValue(value, unit, method);
}

export function calculateHourlyRates(
  billingRate: number,
  overtimeRate: number,
  midnightRate: number,
  legalHolidayRate: number,
  nonLegalHolidayRate: number,
  over60HoursRate: number,
  roundingUnit: number,
  roundingMethod: RoundingMethod
) {
  const normalOvertime = roundValue(billingRate * overtimeRate, roundingUnit, roundingMethod);
  const midnight = roundValue(billingRate * midnightRate, roundingUnit, roundingMethod);
  const legalHoliday = roundValue(billingRate * legalHolidayRate, roundingUnit, roundingMethod);
  const nonLegalHoliday = roundValue(billingRate * nonLegalHolidayRate, roundingUnit, roundingMethod);
  const over60Hours = roundValue(billingRate * over60HoursRate, roundingUnit, roundingMethod);

  return {
    normalOvertime,
    midnight,
    legalHoliday,
    nonLegalHoliday,
    over60Hours,
  };
};

export const calculateMonthlyRates = (
  billingRate: number,
  upperLimitHours: number,
  lowerLimitHours: number,
  overtimeUnitPriceCalculationMethod: string,
  customOvertimeUnitPriceHours: number,
  deductionUnitPriceCalculationMethod: string,
  customDeductionUnitPriceHours: number,
  overtimePremiumRate: number,
  roundingUnit: number,
  roundingMethod: RoundingMethod
): MonthlyCalculatedRates => {
  let overtimeUnitPrice = 0;
  let deductionUnitPrice = 0;
  let overtimeUnitPriceWithPremium = undefined;

  // Calculate overtimeUnitPrice
  switch (overtimeUnitPriceCalculationMethod) {
    case '上限割':
      overtimeUnitPrice = billingRate / upperLimitHours;
      break;
    case '下限割':
      overtimeUnitPrice = billingRate / lowerLimitHours;
      break;
    case '中央割':
      overtimeUnitPrice = billingRate / ((upperLimitHours + lowerLimitHours) / 2);
      break;
    case '任意時間割':
      overtimeUnitPrice = billingRate / customOvertimeUnitPriceHours;
      break;
    default:
      break;
  }

  // Apply rounding to overtimeUnitPrice
  overtimeUnitPrice = roundValue(overtimeUnitPrice, roundingUnit, roundingMethod);

  // Apply premium rate if available
  if (overtimePremiumRate > 0) {
    overtimeUnitPriceWithPremium = roundValue(overtimeUnitPrice * overtimePremiumRate, roundingUnit, roundingMethod);
  }

  // Calculate deductionUnitPrice
  switch (deductionUnitPriceCalculationMethod) {
    case '上限割':
      deductionUnitPrice = billingRate / upperLimitHours;
      break;
    case '下限割':
      deductionUnitPrice = billingRate / lowerLimitHours;
      break;
    case '中央割':
      deductionUnitPrice = billingRate / ((upperLimitHours + lowerLimitHours) / 2);
      break;
    case '任意時間割':
      deductionUnitPrice = billingRate / customDeductionUnitPriceHours;
      break;
    default:
      break;
  }

  // Apply rounding to deductionUnitPrice
  deductionUnitPrice = roundValue(deductionUnitPrice, roundingUnit, roundingMethod);

  return {
    overtimeUnitPrice,
    deductionUnitPrice,
    overtimeUnitPriceWithPremium,
  };
};


