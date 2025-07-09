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
}

export function calculateMonthlyRates(
  billingRate: number,
  contractType: string,
  upperLimitTime: number | null,
  lowerLimitTime: number | null,
  overtimeDiscountMethod: DiscountMethod | null,
  deductionDiscountMethod: DiscountMethod | null,
  fluctuationType: FluctuationType | null,
  workingDays: number | null,
  workingHoursPerDay: number | null,
  upperFluctuationRange: number | null,
  lowerFluctuationRange: number | null,
  monthlyMidnightRate: number | null,
  monthlyLegalHolidayRate: number | null,
  monthlyNonLegalHolidayRate: number | null,
  monthlyOver60HoursRate: number | null,
  arbitraryOvertimeRate: number | null,
  arbitraryOvertimeRateMultiplier: number | null,
  roundingUnit: number,
  roundingMethod: RoundingMethod
) {
  let calculatedOvertimeRate: number | null = null;
  let calculatedDeductionRate: number | null = null;
  let baseHours: number | null = null;
  let actualUpperLimitTime: number | null = upperLimitTime;
  let actualLowerLimitTime: number | null = lowerLimitTime;

  // Calculate base hours for fluctuating types
  if (fluctuationType && workingDays !== null && workingHoursPerDay !== null) {
    switch (fluctuationType) {
      case "所定労働日数 × 法定労働時間":
      case "所定労働日数 × 所定労働時間": // Assuming these are the same for now, need clarification if different
        baseHours = workingDays * workingHoursPerDay;
        break;
      case "出勤日数 × 法定労働時間":
      case "出勤日数 × 所定労働時間": // Assuming these are the same for now, need clarification if different
        baseHours = workingDays * workingHoursPerDay;
        break;
      default:
        baseHours = null;
    }

    if (baseHours !== null) {
      if (upperFluctuationRange !== null) {
        actualUpperLimitTime = baseHours + upperFluctuationRange;
      }
      if (lowerFluctuationRange !== null) {
        actualLowerLimitTime = baseHours - lowerFluctuationRange;
      }
    }
  }

  // Calculate overtime rate
  if (overtimeDiscountMethod) {
    switch (overtimeDiscountMethod) {
      case "上限時間":
        if (actualUpperLimitTime !== null) {
          calculatedOvertimeRate = billingRate / actualUpperLimitTime;
        }
        break;
      case "下限時間":
        // This case should ideally not happen for overtime, but included for completeness
        if (actualLowerLimitTime !== null) {
          calculatedOvertimeRate = billingRate / actualLowerLimitTime;
        }
        break;
      case "中央時間":
        if (actualUpperLimitTime !== null && actualLowerLimitTime !== null) {
          calculatedOvertimeRate = billingRate / ((actualUpperLimitTime + actualLowerLimitTime) / 2);
        } else if (actualUpperLimitTime !== null) {
          calculatedOvertimeRate = billingRate / actualUpperLimitTime;
        }
        break;
      case "任意の値":
        if (arbitraryOvertimeRate !== null) {
          calculatedOvertimeRate = arbitraryOvertimeRate;
        }
        break;
    }
    if (calculatedOvertimeRate !== null) {
      calculatedOvertimeRate = roundValue(calculatedOvertimeRate, roundingUnit, roundingMethod);
      if (arbitraryOvertimeRateMultiplier !== null) {
        calculatedOvertimeRate = calculatedOvertimeRate * arbitraryOvertimeRateMultiplier;
      }
    }
  }

  // Calculate deduction rate
  if (actualLowerLimitTime !== null && deductionDiscountMethod) {
    switch (deductionDiscountMethod) {
      case "上限時間":
        // This case should ideally not happen for deduction, but included for completeness
        calculatedDeductionRate = billingRate / (actualUpperLimitTime || actualLowerLimitTime);
        break;
      case "下限時間":
        calculatedDeductionRate = billingRate / actualLowerLimitTime;
        break;
      case "中央時間":
        if (actualUpperLimitTime !== null && actualLowerLimitTime !== null) {
          calculatedDeductionRate = billingRate / ((actualUpperLimitTime + actualLowerLimitTime) / 2);
        } else if (actualLowerLimitTime !== null) {
          calculatedDeductionRate = billingRate / actualLowerLimitTime;
        }
        break;
    }
    if (calculatedDeductionRate !== null) {
      calculatedDeductionRate = roundValue(calculatedDeductionRate, roundingUnit, roundingMethod);
    }
  }

  // Apply optional monthly override rates to calculatedOvertimeRate
  let monthlyMidnightRateApplied: number | null = null;
  let monthlyLegalHolidayRateApplied: number | null = null;
  let monthlyNonLegalHolidayRateApplied: number | null = null;
  let monthlyOver60HoursRateApplied: number | null = null;

  if (calculatedOvertimeRate !== null) {
    if (monthlyMidnightRate !== null) {
      monthlyMidnightRateApplied = roundValue(calculatedOvertimeRate * monthlyMidnightRate, roundingUnit, roundingMethod);
    }
    if (monthlyLegalHolidayRate !== null) {
      monthlyLegalHolidayRateApplied = roundValue(calculatedOvertimeRate * monthlyLegalHolidayRate, roundingUnit, roundingMethod);
    }
    if (monthlyNonLegalHolidayRate !== null) {
      monthlyNonLegalHolidayRateApplied = roundValue(calculatedOvertimeRate * monthlyNonLegalHolidayRate, roundingUnit, roundingMethod);
    }
    if (monthlyOver60HoursRate !== null) {
      monthlyOver60HoursRateApplied = roundValue(calculatedOvertimeRate * monthlyOver60HoursRate, roundingUnit, roundingMethod);
    }
  }


  return {
    overtimeRate: calculatedOvertimeRate,
    deductionRate: calculatedDeductionRate,
    baseHours,
    actualUpperLimitTime,
    actualLowerLimitTime,
    monthlyMidnightRateApplied,
    monthlyLegalHolidayRateApplied,
    monthlyNonLegalHolidayRateApplied,
    monthlyOver60HoursRateApplied,
  };
}

/**
 * 月給契約の単価（超過・控除）を計算するロジックのコア部分
 * @param billingAmount 月額請求単価
 * @param method 算出方法
 * @param upperLimitHours 上限時間
 * @param lowerLimitHours 下限時間
 * @param customHours 任意時間
 * @returns 計算された単価
 */
function calculateUnitPrice(
  billingAmount: number,
  method: UnitPriceCalculationMethod,
  upperLimitHours: number,
  lowerLimitHours: number,
  customHours?: number
): number {
  switch (method) {
    case 'upper':
      if (upperLimitHours <= 0) return 0;
      return billingAmount / upperLimitHours;
    case 'lower':
      if (lowerLimitHours <= 0) return 0;
      return billingAmount / lowerLimitHours;
    case 'middle':
      const averageHours = (upperLimitHours + lowerLimitHours) / 2;
      if (averageHours <= 0) return 0;
      return billingAmount / averageHours;
    case 'custom':
      if (customHours && customHours > 0) {
        return billingAmount / customHours;
      }
      return 0;
    default:
      return 0;
  }
}

/**
 * 月給契約（上限あり・下限あり）の各種単価を計算する
 * @param contractData 契約データ
 * @param premiumRates 各種割増率
 * @returns 計算された各種単価
 */
export function calculateMonthlyUoLdRates(
  contractData: MonthlyUoLdContract,
  premiumRates?: PremiumRates
) {
  const {
    billingAmount,
    upperLimitHours,
    lowerLimitHours,
    overtimeUnitPriceCalculationMethod,
    customOvertimeUnitPriceHours,
    deductionUnitPriceCalculationMethod,
    customDeductionUnitPriceHours,
    overtimePremiumRate,
    roundingUnit,
    roundingMethod,
  } = contractData;

  // 超過単価の計算
  const baseOvertimeUnitPrice = calculateUnitPrice(
    billingAmount,
    overtimeUnitPriceCalculationMethod,
    upperLimitHours,
    lowerLimitHours,
    customOvertimeUnitPriceHours
  );

  // 超過単価への割増係数適用
  const overtimeUnitPriceWithPremium = overtimePremiumRate
    ? baseOvertimeUnitPrice * overtimePremiumRate
    : baseOvertimeUnitPrice;

  const roundedOvertimeUnitPrice = roundValue(
    overtimeUnitPriceWithPremium,
    roundingUnit,
    roundingMethod
  );

  // 控除単価の計算
  const baseDeductionUnitPrice = calculateUnitPrice(
    billingAmount,
    deductionUnitPriceCalculationMethod,
    upperLimitHours,
    lowerLimitHours,
    customDeductionUnitPriceHours
  );

  const roundedDeductionUnitPrice = roundValue(
    baseDeductionUnitPrice,
    roundingUnit,
    roundingMethod
  );

  // その他割増単価の計算
  const calculatedPremiumRates: { [key: string]: number } = {};
  if (premiumRates) {
    for (const key in premiumRates) {
      const rateKey = key as keyof PremiumRates;
      const rate = premiumRates[rateKey];
      if (rate && rate > 0) {
        // 仕様通り、計算後の「超過単価」を基準にする
        calculatedPremiumRates[rateKey] = roundValue(
          roundedOvertimeUnitPrice * rate,
          roundingUnit,
          roundingMethod
        );
      }
    }
  }

  return {
    overtimeUnitPrice: roundedOvertimeUnitPrice,
    deductionUnitPrice: roundedDeductionUnitPrice,
    ...calculatedPremiumRates,
  };
}
