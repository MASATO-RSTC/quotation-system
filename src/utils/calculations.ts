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
  roundingMethod: RoundingMethod,
  // New parameters for premium rates
  midnightRate?: number,
  legalHolidayRate?: number,
  nonLegalHolidayRate?: number,
  over60HoursRate?: number,
): MonthlyCalculatedRates => {
  let rawOvertimeUnitPrice = 0;
  let rawDeductionUnitPrice = 0;

  // Calculate raw overtimeUnitPrice
  switch (overtimeUnitPriceCalculationMethod) {
    case '上限割':
      if (upperLimitHours > 0) rawOvertimeUnitPrice = billingRate / upperLimitHours;
      break;
    case '下限割':
      if (lowerLimitHours > 0) rawOvertimeUnitPrice = billingRate / lowerLimitHours;
      break;
    case '中央割':
      if (upperLimitHours > 0 && lowerLimitHours > 0) rawOvertimeUnitPrice = billingRate / ((upperLimitHours + lowerLimitHours) / 2);
      break;
    case '任意時間割':
      if (customOvertimeUnitPriceHours > 0) rawOvertimeUnitPrice = billingRate / customOvertimeUnitPriceHours;
      break;
    default:
      break;
  }

  // Calculate raw deductionUnitPrice
  if (lowerLimitHours > 0 && deductionUnitPriceCalculationMethod) {
    switch (deductionUnitPriceCalculationMethod) {
      case '上限割':
        if (upperLimitHours > 0) rawDeductionUnitPrice = billingRate / upperLimitHours;
        break;
      case '下限割':
        if (lowerLimitHours > 0) rawDeductionUnitPrice = billingRate / lowerLimitHours;
        break;
      case '中央割':
        if (upperLimitHours > 0 && lowerLimitHours > 0) rawDeductionUnitPrice = billingRate / ((upperLimitHours + lowerLimitHours) / 2);
        break;
      case '任意時間割':
        if (customDeductionUnitPriceHours > 0) rawDeductionUnitPrice = billingRate / customDeductionUnitPriceHours;
        break;
      default:
        break;
    }
  }

  // Round the final values
  const overtimeUnitPrice = roundValue(rawOvertimeUnitPrice, roundingUnit, roundingMethod);
  const deductionUnitPrice = roundValue(rawDeductionUnitPrice, roundingUnit, roundingMethod);

  let overtimeUnitPriceWithPremium = undefined;
  if (overtimePremiumRate > 0) {
    overtimeUnitPriceWithPremium = roundValue(rawOvertimeUnitPrice * overtimePremiumRate, roundingUnit, roundingMethod);
  }

  // Calculate monthly premium rates based on the raw overtime unit price
  const baseForPremium = rawOvertimeUnitPrice;

  let monthlyMidnight = undefined;
  let monthlyLegalHoliday = undefined;
  let monthlyNonLegalHoliday = undefined;
  let monthlyOver60Hours = undefined;

  if (midnightRate !== undefined && midnightRate > 0) {
    monthlyMidnight = roundValue(baseForPremium * midnightRate, roundingUnit, roundingMethod);
  }
  if (legalHolidayRate !== undefined && legalHolidayRate > 0) {
    monthlyLegalHoliday = roundValue(baseForPremium * legalHolidayRate, roundingUnit, roundingMethod);
  }
  if (nonLegalHolidayRate !== undefined && nonLegalHolidayRate > 0) {
    monthlyNonLegalHoliday = roundValue(baseForPremium * nonLegalHolidayRate, roundingUnit, roundingMethod);
  }
  if (over60HoursRate !== undefined && over60HoursRate > 0) {
    monthlyOver60Hours = roundValue(baseForPremium * over60HoursRate, roundingUnit, roundingMethod);
  }

  return {
    overtimeUnitPrice,
    deductionUnitPrice,
    overtimeUnitPriceWithPremium,
    monthlyMidnight,
    monthlyLegalHoliday,
    monthlyNonLegalHoliday,
    monthlyOver60Hours,
  };
};


