"use client";

import { useState, useMemo, useEffect } from "react";
import { calculateHourlyRates, calculateMonthlyRates } from "../utils/calculations";
import { generateQuotationPdf } from "../utils/generateQuotationPdf";
import { ContractType, RoundingMethod } from "../types/quotation";

export default function Home() {
  const [quotationNo, setQuotationNo] = useState("");
  const [creationDate, setCreationDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [personInCharge, setPersonInCharge] = useState("");
  const [staffName, setStaffName] = useState("");
  const [workContent, setWorkContent] = useState("");
  const [contractType, setContractType] = useState("");
  const [billingRate, setBillingRate] = useState<string>("");
  const [upperLimitHours, setUpperLimitHours] = useState<number | string>("");
  const [lowerLimitHours, setLowerLimitHours] = useState<number | string>("");
  const [overtimeUnitPriceCalculationMethod, setOvertimeUnitPriceCalculationMethod] = useState<string>("");
  const [customOvertimeUnitPriceHours, setCustomOvertimeUnitPriceHours] = useState<number | string>("");
  const [deductionUnitPriceCalculationMethod, setDeductionUnitPriceCalculationMethod] = useState<string>("");
  const [customDeductionUnitPriceHours, setCustomDeductionUnitPriceHours] = useState<number | string>("");
  const [overtimePremiumRate, setOvertimePremiumRate] = useState<number | string>("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [contactInfo, setContactInfo] = useState(
    `株式会社リツアンSTC\nエンジニアリング事業部\n担当者名：鈴木 祥\nメール：s.suzuki@ritsuan.com`
  );
  const [paymentInfo, setPaymentInfo] = useState(
    `【お支払い先のご案内】\n島田掛川信金 連雀支店 普通1138835\n静岡銀行 掛川支店 普通0830924\n三菱UFJ銀行 浜松支店 普通0358885`
  );
  const [overtimeRate, setOvertimeRate] = useState<number | string>(1.25);
  const [midnightRate, setMidnightRate] = useState<number | string>(0.25);
  const [legalHolidayRate, setLegalHolidayRate] = useState<number | string>(1.35);
  const [nonLegalHolidayRate, setNonLegalHolidayRate] = useState<number | string>(1.25);
  const [over60HoursRate, setOver60HoursRate] = useState<number | string>(1.50);
  const [roundingUnit, setRoundingUnit] = useState<number | string>("");
  const [roundingMethod, setRoundingMethod] = useState<RoundingMethod | string>("");
  const [settlementUnit, setSettlementUnit] = useState<number | string>("");
  const [settlementMethod, setSettlementMethod] = useState<RoundingMethod | string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [workingDaysPerMonth, setWorkingDaysPerMonth] = useState<number | string>("");
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState<number | string>("");
  const [upperLimitHourDiff, setUpperLimitHourDiff] = useState<number | string>("");
  const [lowerLimitHourDiff, setLowerLimitHourDiff] = useState<number | string>("");
  const [variableCalculationType, setVariableCalculationType] = useState("");
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTotalPrice, setShowTotalPrice] = useState(false);

  interface MonthlySetting {
    yearMonth: string; // "2025-07"
    workingDaysPerMonth: number | string;
    workingHoursPerDay: number | string;
    upperLimitHourDiff: number | string;
    lowerLimitHourDiff: number | string;
    variableCalculationType: string;
    baseHours: number;
    upperLimitHours: number;
    lowerLimitHours: number;
    calculatedRates?: {
      overtimeUnitPrice: number;
      deductionUnitPrice: number;
      overtimeUnitPriceWithPremium?: number;
      monthlyMidnight?: number;
      monthlyLegalHoliday?: number;
      monthlyNonLegalHoliday?: number;
      monthlyOver60Hours?: number;
    } | null;
  }

  const [monthlySettings, setMonthlySettings] = useState<MonthlySetting[]>([]);

  useEffect(() => {
    if (!showTotalPrice || !contractType.includes('変動')) return;

    const newSettings = monthlySettings.map(setting => {
      const days = parseFloat(String(setting.workingDaysPerMonth)) || 0;
      const hours = parseFloat(String(setting.workingHoursPerDay)) || 0;
      const baseHours = days * hours;

      let upperLimitHours = 0;
      let lowerLimitHours = 0;

      const upperDiff = parseFloat(String(setting.upperLimitHourDiff)) || 0;
      const lowerDiff = parseFloat(String(setting.lowerLimitHourDiff)) || 0;

      if (contractType === '月時（上限下限変動あり）') {
        upperLimitHours = baseHours + upperDiff;
        lowerLimitHours = baseHours - lowerDiff;
      } else if (contractType === '月時（上限変動あり、下限変動なし）') {
        upperLimitHours = baseHours + upperDiff;
        lowerLimitHours = baseHours;
      } else if (contractType === '月時（上限変動なし、下限変動あり）') {
        upperLimitHours = baseHours;
        lowerLimitHours = baseHours - lowerDiff;
      } else if (contractType === '月時（上限変動なし、下限変動なし）') {
        upperLimitHours = baseHours;
        lowerLimitHours = baseHours;
      }
      
      const br = parseFloat(billingRate) || 0;
      const ru = parseInt(String(roundingUnit)) || 0;
      const rm = typeof roundingMethod === 'string' && roundingMethod ? roundingMethod as RoundingMethod : "切り捨て";
      const oprm = parseFloat(String(overtimePremiumRate)) || 0;
      
      const calculatedRates = (br > 0 && ru > 0 && rm) ? calculateMonthlyRates(
        br,
        upperLimitHours,
        lowerLimitHours,
        overtimeUnitPriceCalculationMethod,
        parseFloat(String(customOvertimeUnitPriceHours)) || 0,
        deductionUnitPriceCalculationMethod,
        parseFloat(String(customDeductionUnitPriceHours)) || 0,
        oprm,
        ru,
        rm,
        parseFloat(String(midnightRate)) || 0,
        parseFloat(String(legalHolidayRate)) || 0,
        parseFloat(String(nonLegalHolidayRate)) || 0,
        parseFloat(String(over60HoursRate)) || 0,
      ) : null;

      return { ...setting, baseHours, upperLimitHours, lowerLimitHours, calculatedRates };
    });

    // Avoid infinite loops by checking if a deep comparison is necessary
    if (JSON.stringify(newSettings) !== JSON.stringify(monthlySettings)) {
      setMonthlySettings(newSettings);
    }
  }, [
    monthlySettings,
    contractType,
    showTotalPrice,
    billingRate,
    roundingUnit,
    roundingMethod,
    overtimePremiumRate,
    overtimeUnitPriceCalculationMethod,
    customOvertimeUnitPriceHours,
    deductionUnitPriceCalculationMethod,
    customDeductionUnitPriceHours,
    midnightRate,
    legalHolidayRate,
    nonLegalHolidayRate,
    over60HoursRate
  ]);

  const handleMonthlySettingChange = (index: number, field: keyof MonthlySetting, value: string | number) => {
    const newSettings = [...monthlySettings];
    newSettings[index] = { ...newSettings[index], [field]: value };
    setMonthlySettings(newSettings);
  };

  useEffect(() => {
    const isVariableMonthly = contractType.includes('変動');
    if (!showTotalPrice || !isVariableMonthly || !contractStartDate || !contractEndDate) {
      setMonthlySettings([]);
      return;
    }

    const start = new Date(contractStartDate);
    const end = new Date(contractEndDate);
    const newSettings: MonthlySetting[] = [];

    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      const yearMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      // Find existing setting or create a new one
      const existing = monthlySettings.find(s => s.yearMonth === yearMonth);
      newSettings.push(
        existing || {
          yearMonth,
          workingDaysPerMonth: "",
          workingHoursPerDay: "",
          upperLimitHourDiff: "",
          lowerLimitHourDiff: "",
          variableCalculationType: "",
          baseHours: 0,
          upperLimitHours: 0,
          lowerLimitHours: 0,
          calculatedRates: null,
        }
      );
      current.setMonth(current.getMonth() + 1);
    }
    setMonthlySettings(newSettings);

  }, [contractStartDate, contractEndDate, showTotalPrice, contractType]);

  const contractTypeDescriptions: { [key: string]: string } = {
    "時給": `実際に働いた時間（実働時間）に対して、1時間あたりいくらという金額で請求する契約です。

■特徴
• 例）「1時間あたり ¥3,000」で、160時間働けば「¥480,000」の請求になります。
• 残業や深夜勤務がある場合、所定の割増率（1.25倍など）を加えて計算します。
• 請求対象の時間は、15分単位や30分単位など「精算単位」で丸め処理を行います。

■計算に必要な項目
・ご請求単価
・割増率設定（普通残業, 深夜手当, 法定休日出勤, 法定外休日出勤, 60時間超過）
・丸め・精算設定（金額丸め単位, 丸め方法, 時間精算単位, 精算丸め）`,
    "月時（上限あり下限あり）": `月の稼働時間に対して上限と下限の時間を設定する、最も標準的な月給契約です。

■特徴
• 設定された時間を下回った場合は控除単価で減額され、上回った場合は超過単価で追加請求されます。
• 例）140h〜180hで契約した場合、140h未満は控除、180h超は超過の対象となります。
• 超過・控除単価の計算方法は「上限で割る」「下限で割る」などから選択できます。

■計算に必要な項目
・月給単価
・上限時間 / 下限時間
・超過単価の算出基準（任意時間割の場合は任意時間も）
・控除単価の算出基準（任意時間割の場合は任意時間も）
・割増係数（超過単価のみ）
・割増率設定
・丸め・精算設定`,
    "月時（上限あり下限なし）": `「この時間までは定額。それ以上は追加で請求」という、上限時間だけを設定する契約です。

■特徴
• 設定した上限時間を超えた分だけ、追加で請求が可能です。
• 下限時間がないため、稼働時間が少なくても減額（控除）は発生しません。

■計算に必要な項目
・月給単価
・上限時間
・超過単価の算出基準（任意時間割の場合は任意時間も）
・割増係数（超過単価のみ）
・割増率設定
・丸め・精算設定`,
    "月時（上限なし下限あり）": `月の稼働時間に対して下限時間のみを設定する契約です。

■特徴
• 設定した下限時間を下回った場合のみ、減額（控除）が発生します。
• 上限時間がないため、どれだけ長時間稼働しても超過分の追加請求は発生しません。
• エンジニアの負荷管理に注意が必要な契約です。

■計算に必要な項目
・月給単価
・下限時間
・控除単価の算出基準（任意時間割の場合は任意時間も）
・割増率設定
・丸め・精算設定`,
    "月時（完全固定）": `稼働時間に関係なく、毎月一定額を請求する契約です。

■特徴
• 実際に何時間働いても、金額は変わりません。
• 超過・控除・割増などの概念もありません。
• 単純で明快な契約ですが、稼働の変動リスクはエンジニア側が負うことになります。

■計算に必要な項目
・月給単価
・時間精算単位 / 精算丸め`,
    "月時（上限下限変動あり）": `毎月の出勤日数などに応じて、上下限時間そのものが変動する契約です。

■特徴
• 例）出勤20日, 所定8h, 変動幅±20hなら、時間幅は140h〜180h（160h±20h）となります。
• 超過・控除単価も毎月異なる可能性があります。

■計算に必要な項目
・月給単価
・変動設定（労働日数/月, 労働時間/日）
・上限時間(差分) / 下限時間(差分)
・計算タイプ（特記事項用）
・超過・控除単価の算出基準
・割増係数（超過単価のみ）
・割増率設定
・丸め・精算設定`,
    "月時（上限変動あり、下限変動なし）": `上限時間は出勤日数などで変わるが、下限は固定（基準時間）の契約です。

■特徴
• 例）出勤日数×7.5h＋20hなどで上限時間を設定します。
• 超過単価の計算が月ごとに異なりますが、控除単価は常に一定の時間で計算します。

■計算に必要な項目
・月給単価
・変動設定（労働日数/月, 労働時間/日）
・上限時間(差分)
・計算タイプ（特記事項用）
・超過・控除単価の算出基準
・割増係数（超過単価のみ）
・割増率設定
・丸め・精算設定`,
    "月時（上限変動なし、下限変動あり）": `下限時間は出勤日数などで変わるが、上限は固定（基準時間）の契約です。

■特徴
• 例）出勤日数×8h−20hなどで下限時間を算出します。
• 控除単価が月ごとに変わり、超過単価は常に一定の時間を元に計算します。

■計算に必要な項目
・月給単価
・変動設定（労働日数/月, 労働時間/日）
・下限時間(差分)
・計算タイプ（特記事項用）
・超過・控除単価の算出基準
・割増係数（超過単価のみ）
・割増率設定
・丸め・精算設定`,
    "月時（上限変動なし、下限変動なし）": `上限・下限ともに出勤日数などで変動する契約です。

■特徴
• 時間幅は「出勤日数 × 労働時間」に基づき、毎月変動します。
• 上下限の固定値がなく、毎月都度確認が必要な柔軟契約です。

■計算に必要な項目
・月給単価
・変動設定（労働日数/月, 労働時間/日）
・計算タイプ（特記事項用）
・超過・控除単価の算出基準
・割増係数（超過単価のみ）
・割増率設定
・丸め・精算設定`,
  };

  const handleBillingRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === '' || /^[0-9]+$/.test(rawValue)) {
      setBillingRate(rawValue);
    }
  };

  const formatNumberWithCommas = (value: string) => {
    if (!value) return '';
    const numberValue = parseInt(value, 10);
    return isNaN(numberValue) ? '' : numberValue.toLocaleString();
  };

  const variableCalculationTypeOptions = [
    "所定労働日数 × 法定労働時間",
    "出勤日数 × 所定労働時間",
    "所定労働日数 × 所定労働時間",
    "出勤日数 × 法定労働時間",
  ];
  const roundingUnitOptions = [1, 10, 50, 100, 1000];
  const roundingMethods: RoundingMethod[] = ["切り捨て", "切り上げ", "四捨五入"];
  const settlementUnitOptions = [1, 3, 5, 10, 15, 30, 45, 60];

  const baseHours = useMemo(() => {
    const days = typeof workingDaysPerMonth === 'number' ? workingDaysPerMonth : parseFloat(String(workingDaysPerMonth)) || 0;
    const hours = typeof workingHoursPerDay === 'number' ? workingHoursPerDay : parseFloat(String(workingHoursPerDay)) || 0;
    if (!days || !hours) return 0;
    return days * hours;
  }, [workingDaysPerMonth, workingHoursPerDay]);

  useEffect(() => {
    if (contractType === '月時（上限下限変動あり）') {
      const upperDiff = typeof upperLimitHourDiff === 'number' ? upperLimitHourDiff : parseFloat(String(upperLimitHourDiff)) || 0;
      const lowerDiff = typeof lowerLimitHourDiff === 'number' ? lowerLimitHourDiff : parseFloat(String(lowerLimitHourDiff)) || 0;
      
      if (baseHours > 0) {
        setUpperLimitHours(baseHours + upperDiff);
        setLowerLimitHours(baseHours - lowerDiff);
      } else {
        setUpperLimitHours("");
        setLowerLimitHours("");
      }
    } else if (contractType === '月時（上限変動あり、下限変動なし）') {
      const upperDiff = typeof upperLimitHourDiff === 'number' ? upperLimitHourDiff : parseFloat(String(upperLimitHourDiff)) || 0;
      if (baseHours > 0) {
        setUpperLimitHours(baseHours + upperDiff);
        setLowerLimitHours(baseHours); // 下限は基準時間
      } else {
        setUpperLimitHours("");
        setLowerLimitHours("");
      }
    } else if (contractType === '月時（上限変動なし、下限変動あり）') {
      const lowerDiff = typeof lowerLimitHourDiff === 'number' ? lowerLimitHourDiff : parseFloat(String(lowerLimitHourDiff)) || 0;
      if (baseHours > 0) {
        setUpperLimitHours(baseHours); // 上限は基準時間
        setLowerLimitHours(baseHours - lowerDiff);
      } else {
        setUpperLimitHours("");
        setLowerLimitHours("");
      }
    } else if (contractType === '月時（上限変動なし、下限変動なし）') {
      if (baseHours > 0) {
        setUpperLimitHours(baseHours);
        setLowerLimitHours(baseHours);
      } else {
        setUpperLimitHours("");
        setLowerLimitHours("");
      }
    } else if (contractType === '月時（上限変動なし、下限変動なし）') {
      if (baseHours > 0) {
        setUpperLimitHours(baseHours);
        setLowerLimitHours(baseHours);
      } else {
        setUpperLimitHours("");
        setLowerLimitHours("");
      }
    }
  }, [baseHours, upperLimitHourDiff, lowerLimitHourDiff, contractType]);

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    setCreationDate(todayStr);

    setQuotationNo(`RSTC-ES-${yyyy}${mm}-${String(Date.now()).slice(-3)}`);

    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
    setValidUntil(nextMonthStr);

    const firstDayOfMonth = `${yyyy}-${mm}-01`;
    setContractStartDate(firstDayOfMonth);

    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 2);
    const endOfMonth = new Date(threeMonthsLater.getFullYear(), threeMonthsLater.getMonth() + 1, 0);
    const contractEndDateStr = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
    setContractEndDate(contractEndDateStr);

  }, []);

  useEffect(() => {
    if (contractType.startsWith('月時')) {
      // Reset premium rates for monthly contracts
      setOvertimeRate("");
      setMidnightRate("");
      setLegalHolidayRate("");
      setNonLegalHolidayRate("");
      setOver60HoursRate("");
      // Reset monthly contract specific fields
      setUpperLimitHours("");
      setLowerLimitHours("");
      setOvertimeUnitPriceCalculationMethod("");
      setCustomOvertimeUnitPriceHours("");
      setDeductionUnitPriceCalculationMethod("");
      setCustomDeductionUnitPriceHours("");
      setOvertimePremiumRate("");
    } else if (contractType === '時給') {
      // Set default premium rates for hourly contracts
      setOvertimeRate(1.25);
      setMidnightRate(0.25);
      setLegalHolidayRate(1.35);
      setNonLegalHolidayRate(1.25);
      setOver60HoursRate(1.50);
      // Reset monthly contract specific fields
      setUpperLimitHours("");
      setLowerLimitHours("");
      setOvertimeUnitPriceCalculationMethod("");
      setCustomOvertimeUnitPriceHours("");
      setDeductionUnitPriceCalculationMethod("");
      setCustomDeductionUnitPriceHours("");
      setOvertimePremiumRate("");
    } else { // contractType === '' (選択してください)
      // Reset all relevant fields to blank
      setBillingRate(""); // Or "" if you want it visually blank
      setOvertimeRate("");
      setMidnightRate("");
      setLegalHolidayRate("");
      setNonLegalHolidayRate("");
      setOver60HoursRate("");
      setUpperLimitHours("");
      setLowerLimitHours("");
      setOvertimeUnitPriceCalculationMethod("");
      setCustomOvertimeUnitPriceHours("");
      setDeductionUnitPriceCalculationMethod("");
      setCustomDeductionUnitPriceHours("");
      setOvertimePremiumRate("");
    }
  }, [contractType]);

  const hourlyCalculatedRates = useMemo(() => {
    const rate = typeof billingRate === 'number' ? billingRate : parseFloat(billingRate) || 0;
    const ru = typeof roundingUnit === 'number' ? roundingUnit : parseInt(String(roundingUnit)) || 0;
    const rm = typeof roundingMethod === 'string' && roundingMethod ? roundingMethod as RoundingMethod : "切り捨て";

    return calculateHourlyRates(
      rate,
      parseFloat(String(overtimeRate)) || 0,
      parseFloat(String(midnightRate)) || 0,
      parseFloat(String(legalHolidayRate)) || 0,
      parseFloat(String(nonLegalHolidayRate)) || 0,
      parseFloat(String(over60HoursRate)) || 0,
      ru,
      rm
    );
  }, [billingRate, overtimeRate, midnightRate, legalHolidayRate, nonLegalHolidayRate, over60HoursRate, roundingUnit, roundingMethod]);

  const monthlyCalculatedRates = useMemo(() => {
    if (contractType.startsWith('月時') && contractType !== '月時（完全固定）') {
      const br = typeof billingRate === 'number' ? billingRate : parseFloat(billingRate) || 0;
      const ulh = typeof upperLimitHours === 'number' ? upperLimitHours : parseFloat(String(upperLimitHours)) || 0;
      const llh = typeof lowerLimitHours === 'number' ? lowerLimitHours : parseFloat(String(lowerLimitHours)) || 0;
      const oprm = typeof overtimePremiumRate === 'number' ? overtimePremiumRate : parseFloat(overtimePremiumRate) || 0;
      const couh = typeof customOvertimeUnitPriceHours === 'number' ? customOvertimeUnitPriceHours : parseFloat(customOvertimeUnitPriceHours) || 0;
      const cduh = typeof customDeductionUnitPriceHours === 'number' ? customDeductionUnitPriceHours : parseFloat(customDeductionUnitPriceHours) || 0;
      const ru = typeof roundingUnit === 'number' ? roundingUnit : parseInt(String(roundingUnit)) || 0;
      const rm = typeof roundingMethod === 'string' && roundingMethod ? roundingMethod as RoundingMethod : "切り捨て";

      const needsUpper = contractType === '月時（上限あり下限あり）' || contractType === '月時（上限あり下限なし）' || contractType === '月時（上限下限変動あり）';
      const needsLower = contractType === '月時（上限あり下限あり）' || contractType === '月時（上限なし下限あり）' || contractType === '月時（上限下限変動あり）';

      // For variable contracts, we might have 0 hours initially, so we allow the calculation to proceed.
      const hoursAreValid = (contractType === '月時（上限下限変動あり）') || ((!needsUpper || ulh > 0) && (!needsLower || llh > 0));

      if (br > 0 && ru > 0 && rm && hoursAreValid) {
        return calculateMonthlyRates(
          br,
          ulh,
          llh,
          overtimeUnitPriceCalculationMethod,
          couh,
          deductionUnitPriceCalculationMethod,
          cduh,
          oprm,
          ru,
          rm,
          // New parameters
          typeof midnightRate === 'number' ? midnightRate : parseFloat(String(midnightRate)) || 0,
          typeof legalHolidayRate === 'number' ? legalHolidayRate : parseFloat(String(legalHolidayRate)) || 0,
          typeof nonLegalHolidayRate === 'number' ? nonLegalHolidayRate : parseFloat(String(nonLegalHolidayRate)) || 0,
          typeof over60HoursRate === 'number' ? over60HoursRate : parseFloat(String(over60HoursRate)) || 0,
        );
      }
    }
    return null;
  }, [
    contractType,
    billingRate,
    upperLimitHours,
    lowerLimitHours,
    overtimeUnitPriceCalculationMethod,
    customOvertimeUnitPriceHours,
    deductionUnitPriceCalculationMethod,
    customDeductionUnitPriceHours,
    overtimePremiumRate,
    roundingUnit,
    roundingMethod,
    midnightRate,
    legalHolidayRate,
    nonLegalHolidayRate,
    over60HoursRate,
  ]);

  const monthlyCalculationFormula = useMemo(() => {
    const monthlyTypesWithOptions = [
      '月時（上限あり下限あり）',
      '月時（上限あり下限なし）',
      '月時（上限なし下限あり）',
      '月時（上限下限変動あり）',
      '月時（上限変動あり、下限変動なし）',
      '月時（上限変動なし、下限変動あり）',
      '月時（上限変動なし、下限変動なし）'
    ];
    const variableTypes = ['月時（上限下限変動あり）', '月時（上限変動あり、下限変動なし）', '月時（上限変動なし、下限変動あり）', '月時（上限変動なし、下限変動なし）'];

    if (monthlyTypesWithOptions.includes(contractType) && monthlyCalculatedRates && (monthlyCalculatedRates.overtimeUnitPrice > 0 || monthlyCalculatedRates.deductionUnitPrice > 0)) {
      let formulaText = '▼ 単価計算方法\n';
      const br = billingRate.toLocaleString();
      const isVariable = variableTypes.includes(contractType);
      const formulaLines: string[] = [];

      // Overtime formula
      if (monthlyCalculatedRates.overtimeUnitPrice > 0) {
        let divisorLabel = '';
        switch (overtimeUnitPriceCalculationMethod) {
          case '上限割': divisorLabel = `${upperLimitHours}h`; break;
          case '下限割': divisorLabel = `${lowerLimitHours}h`; break;
          case '中央割': divisorLabel = `${(parseFloat(String(upperLimitHours)) + parseFloat(String(lowerLimitHours))) / 2}h`; break;
          case '任意時間割': divisorLabel = `${customOvertimeUnitPriceHours}h`; break;
        }
        let overtimeFormula = `超過：${br}円 ÷ ${divisorLabel}`;
        if (isVariable) {
          const days = String(workingDaysPerMonth) || '0';
          const hours = String(workingHoursPerDay) || '0';
          const upperDiff = parseFloat(String(upperLimitHourDiff)) || 0;
          overtimeFormula += ` （${variableCalculationType}:${days}日 × ${hours}h`;
          if (upperDiff > 0) overtimeFormula += ` + ${upperDiff}h`;
          overtimeFormula += '）';
        }
        if (overtimePremiumRate && parseFloat(String(overtimePremiumRate)) > 0) {
          overtimeFormula += ` × ${overtimePremiumRate}`;
        }
        formulaLines.push(overtimeFormula);
      }

      // Deduction formula
      if (monthlyCalculatedRates.deductionUnitPrice > 0) {
        let divisorLabel = '';
        switch (deductionUnitPriceCalculationMethod) {
          case '上限割': divisorLabel = `${upperLimitHours}h`; break;
          case '下限割': divisorLabel = `${lowerLimitHours}h`; break;
          case '中央割': divisorLabel = `${(parseFloat(String(upperLimitHours)) + parseFloat(String(lowerLimitHours))) / 2}h`; break;
          case '任意時間割': divisorLabel = `${customDeductionUnitPriceHours}h`; break;
        }
        let deductionFormula = `控除：${br}円 ÷ ${divisorLabel}`;
        if (isVariable) {
          const days = String(workingDaysPerMonth) || '0';
          const hours = String(workingHoursPerDay) || '0';
          const lowerDiff = parseFloat(String(lowerLimitHourDiff)) || 0;
          deductionFormula += ` （${variableCalculationType}:${days}日 × ${hours}h`;
          if (lowerDiff > 0) deductionFormula += ` - ${lowerDiff}h`;
          deductionFormula += '）';
        }
        formulaLines.push(deductionFormula);
      }

      return `${formulaText}${formulaLines.join('\n')}`.trim();
    }
    return '';
  }, [
    contractType,
    billingRate,
    upperLimitHours,
    lowerLimitHours,
    overtimeUnitPriceCalculationMethod,
    customOvertimeUnitPriceHours,
    deductionUnitPriceCalculationMethod,
    customDeductionUnitPriceHours,
    overtimePremiumRate,
    monthlyCalculatedRates,
    variableCalculationType, // Add dependency
    workingDaysPerMonth, // Add dependency
    workingHoursPerDay, // Add dependency
    upperLimitHourDiff, // Add dependency
    lowerLimitHourDiff, // Add dependency
  ]);

  const handleGeneratePdf = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsGeneratingPdf(true);
    try {
      await generateQuotationPdf({
        quotationNo, creationDate, validUntil, companyName, departmentName, personInCharge, staffName, contractStartDate, contractEndDate, workContent,
        billingRate: parseFloat(billingRate) || 0,
        hourlyCalculatedRates,
        // New fields for monthly contracts
        upperLimitHours: typeof upperLimitHours === 'number' ? upperLimitHours : parseFloat(String(upperLimitHours)) || 0,
        lowerLimitHours: typeof lowerLimitHours === 'number' ? lowerLimitHours : parseFloat(String(lowerLimitHours)) || 0,
        monthlyCalculatedRates,
        monthlyCalculationFormula,
        specialNotes,
        roundingUnit: roundingUnit.toString(),
        roundingMethod: roundingMethod as RoundingMethod,
        settlementUnit: settlementUnit.toString(),
        settlementMethod: settlementMethod as RoundingMethod,
        contactInfo,
        contractType: contractType as ContractType,
        upperLimitHoursDiff: typeof upperLimitHourDiff === 'number' ? upperLimitHourDiff : parseFloat(String(upperLimitHourDiff)) || undefined,
        lowerLimitHoursDiff: typeof lowerLimitHourDiff === 'number' ? lowerLimitHourDiff : parseFloat(String(lowerLimitHourDiff)) || undefined,
        showTotalPrice,
        monthlySettings,
        overtimeRate,
        midnightRate,
        legalHolidayRate,
        nonLegalHolidayRate,
        over60HoursRate,
        overtimePremiumRate,
        paymentInfo,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePremiumRateChange = (setter: React.Dispatch<React.SetStateAction<string | number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const handlePremiumRateBlur = (setter: React.Dispatch<React.SetStateAction<string | number>>) => (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setter(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-2xl font-bold text-center">御見積書</h1>
          <div 
            className="relative ml-2 cursor-pointer"
            onClick={() => setShowHelpModal(true)}
          >
            <div className="h-6 w-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">?</span>
            </div>
          </div>
        </div>

        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-4xl w-full">
              <div className="flex justify-between items-start">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">見積書作成ツール 操作ガイド</h2>
                <button onClick={() => setShowHelpModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold -mt-2 -mr-2 p-2">&times;</button>
              </div>
              <div className="text-sm sm:text-base space-y-6 max-h-[80vh] overflow-y-auto pr-4 -mr-4">

                {/* --- 1. 入力内容について --- */}
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                  <h3 className="font-bold text-lg mb-3 text-blue-800">【１】入力内容について</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800">■ 基本情報・顧客情報</h4>
                      <p className="text-xs text-gray-600 pl-2">見積書の宛名や日付など、基本的な情報を入力します。ページを開いた時点で、一部は自動入力されています。</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">■ スタッフ・契約情報</h4>
                      <p className="text-xs text-gray-600 pl-2 mb-2">ここが一番大事なエリアです。<strong className="text-red-600">「契約種別」</strong>を選ぶと、その契約に必要な入力欄が自動で表示されます。</p>
                      <div className="text-xs p-3 bg-white rounded border border-gray-200">
                        <p className="font-semibold mb-1">契約種別ごとの詳しい説明：</p>
                        
                        <details className="mb-2 p-2 rounded bg-gray-50">
                          <summary className="font-semibold cursor-pointer">A. 時給</summary>
                          <div className="mt-2 pl-4 border-l-2 border-gray-300">
                            <p className="mb-1">働いた時間分だけ請求する、一番シンプルな契約です。</p>
                            <ul className="list-disc list-inside">
                              <li><span className="font-semibold">ご請求単価:</span> 1時間あたりの単価を入力します。</li>
                              <li><span className="font-semibold">割増率設定:</span> 深夜や休日に働いた場合の割増単価を計算するために使います。</li>
                            </ul>
                          </div>
                        </details>

                        <details className="p-2 rounded bg-gray-50">
                          <summary className="font-semibold cursor-pointer">B. 月給（各パターン）</summary>
                          <div className="mt-2 pl-4 border-l-2 border-gray-300 space-y-3">
                            <div>
                              <p className="font-semibold">月時（上限あり下限あり）</p>
                              <p className="text-xs text-gray-600">「140h〜180h」のように、時間の幅を決める最も標準的な契約。時間を超えたら「超過」、足りなければ「控除」が発生します。<br/>→<strong className="text-blue-600">超過・控除・割増係数・割増率</strong>の全てが設定可能です。</p>
                            </div>
                            <div>
                              <p className="font-semibold">月時（上限あり下限なし）</p>
                              <p className="text-xs text-gray-600">「180hまで」のように上限だけを決める契約。時間を超えたら「超過」が発生しますが、稼働が少なくても控除（減額）はありません。<br/>→<strong className="text-blue-600">超過・割増係数・割増率</strong>が設定可能です。</p>
                            </div>
                            <div>
                              <p className="font-semibold">月時（上限なし下限あり）</p>
                              <p className="text-xs text-gray-600">「140hから」のように下限だけを決める契約。稼働が少ないと控除が発生しますが、いくら働いても超過にはなりません。<br/>→<strong className="text-blue-600">控除単価</strong>のみ設定可能です。超過の概念がないため、割増係数や割増率の設定はありません。</p>
                            </div>
                            <div>
                              <p className="font-semibold">月時（完全固定）</p>
                              <p className="text-xs text-gray-600">稼働時間に関わらず、毎月決まった額を請求する契約。<br/>→ 超過・控除の概念がないため、関連する入力項目は全て表示されません。</p>
                            </div>
                             <div>
                              <p className="font-semibold">月時（変動系）</p>
                              <p className="text-xs text-gray-600">毎月の「労働日数/月」と「労働時間/日」で自動計算された上限・下限時間をもとに、超過単価や控除単価が計算されます。<br/>→ 例えば「上限下限変動あり」なら、変動後の上限・下限時間を使って「上限割」や「下限割」の計算が行われる、という仕組みです。</p>
                            </div>
                            <div className="!mt-4 pt-3 border-t border-gray-300">
                              <p className="font-semibold text-gray-700">【月給契約の補足】</p>
                              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 mt-1">
                                <li><strong>算出基準:</strong> 超過・控除単価を「月給 ÷ 何時間で計算するか」を決めるルールです。「任意時間割」を選ぶと、専用の入力欄が表示されます。</li>
                                <li><strong>割増係数:</strong> 超過単価が設定される契約で、計算された単価をさらに割り増ししたい場合に使います。(例: 1.25倍)</li>
                                <li><strong>割増率設定:</strong> 超過とは別に、深夜労働や休日出勤の単価も設定できます。これらの単価は、設定された「超過単価」を元に計算されます。</li>
                              </ul>
                            </div>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- 2. PDF出力内容について --- */}
                <div className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg">
                  <h3 className="font-bold text-lg mb-3 text-purple-800">【２】PDF出力内容について</h3>
                  <p className="text-xs text-gray-600 mb-3">フォームで入力・計算された内容は、PDFの以下の場所に反映されます。</p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800">■ 宛名・基本情報</h4>
                      <table className="w-full text-xs border-collapse">
                        <thead><tr className="bg-gray-200"><th className="border p-2 text-left">PDF記載項目</th><th className="border p-2 text-left">フォームの対応項目</th></tr></thead>
                        <tbody>
                          <tr className="bg-white"><td className="border p-2">見積書No.</td><td className="border p-2">見積書No. (自動)</td></tr>
                          <tr className="bg-gray-50"><td className="border p-2">作成日</td><td className="border p-2">作成日 (<strong className="text-red-600">必須</strong>)</td></tr>
                          <tr className="bg-white"><td className="border p-2">会社名</td><td className="border p-2">企業名 (<strong className="text-red-600">必須</strong>)</td></tr>
                          <tr className="bg-gray-50"><td className="border p-2">部署名, 担当者氏名</td><td className="border p-2">部署名 (任意), 担当者氏名 (任意)</td></tr>
                          <tr className="bg-white"><td className="border p-2">発行元情報, お支払い先</td><td className="border p-2">発行元・振込先 (任意)</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">■ 見積もり内容</h4>
                      <table className="w-full text-xs border-collapse">
                        <thead><tr className="bg-gray-200"><th className="border p-2 text-left">PDF記載項目</th><th className="border p-2 text-left">フォームの対応項目</th></tr></thead>
                        <tbody>
                          <tr className="bg-white"><td className="border p-2">件名</td><td className="border p-2">業務内容 (<strong className="text-red-600">必須</strong>)</td></tr>
                          <tr className="bg-gray-50"><td className="border p-2">スタッフ氏名</td><td className="border p-2">スタッフ氏名 (<strong className="text-red-600">必須</strong>)</td></tr>
                          <tr className="bg-white"><td className="border p-2">契約期間</td><td className="border p-2">契約開始日 (<strong className="text-red-600">必須</strong>) 〜 契約終了日 (<strong className="text-red-600">必須</strong>)</td></tr>
                          <tr className="bg-gray-50"><td className="border p-2">有効期限</td><td className="border p-2">有効期限 (<strong className="text-red-600">必須</strong>)</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">■ 見積明細（中央のテーブル）</h4>
                      <table className="w-full text-xs border-collapse">
                         <thead><tr className="bg-gray-200"><th className="border p-2 text-left">PDF記載項目</th><th className="border p-2 text-left">フォームの対応項目 / 計算結果</th></tr></thead>
                        <tbody>
                          <tr className="bg-white"><td className="border p-2">ご請求単価 or 月給単価</td><td className="border p-2">ご請求単価 (<strong className="text-red-600">必須</strong>)</td></tr>
                          <tr className="bg-gray-50"><td className="border p-2">超過単価, 控除単価</td><td className="border p-2">「計算結果」に表示された単価が反映されます。</td></tr>
                          <tr className="bg-white"><td className="border p-2">深夜・休日・60h超単価</td><td className="border p-2">「計算結果」に表示された単価が反映されます。<br/><span className="text-gray-500">※割増率設定で入力した場合に表示</span></td></tr>
                        </tbody>
                      </table>
                    </div>
                     <div>
                      <h4 className="font-semibold text-gray-800">■ 特記事項</h4>
                      <p className="text-xs text-gray-600 pl-2 mb-1">ここには、手入力した内容と、システムが自動で追加する情報が<strong className="text-red-600">合体</strong>して表示されます。</p>
                      <div className="text-xs p-3 bg-white rounded border border-gray-200">
                        <p className="font-semibold mb-1">【自動で追加される情報】</p>
                        <ul className="list-disc list-inside pl-2">
                          <li><span className="font-semibold">単価の計算式:</span> 月給契約のとき、どのルールで単価を計算したかの式が自動で入ります。（例: `超過：500,000円 ÷ 180.0h`）</li>
                          <li><span className="font-semibold">丸め・精算ルール:</span> 設定した丸め単位や方法が文章で入ります。（例: `・金額は10円単位で切り捨てます。`）</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              <div className="text-right mt-6">
                <button onClick={() => setShowHelpModal(false)} className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleGeneratePdf} className="space-y-6">
          
          {/* Basic Info Section */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label htmlFor="quotationNo" className="block text-sm font-medium text-gray-700">見積書No. <span className="ml-1 text-red-500 font-bold text-lg">*</span></label><input type="text" id="quotationNo" value={quotationNo} onChange={e => setQuotationNo(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" readOnly required /></div>
              <div><label htmlFor="creationDate" className="block text-sm font-medium text-gray-700">作成日 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label><input type="date" id="creationDate" value={creationDate} onChange={e => setCreationDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
              <div><label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">有効期限 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label><input type="date" id="validUntil" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
            </div>
          </div>

          {/* Client Info Section */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">顧客情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div><label htmlFor="companyName" className="block text-sm font-medium text-gray-700 h-6 flex items-center">企業名 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label><input type="text" id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
              <div><label htmlFor="departmentName" className="block text-sm font-medium text-gray-700 h-6 flex items-center">部署名</label><input type="text" id="departmentName" value={departmentName} onChange={e => setDepartmentName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" /></div>
              <div className="md:col-span-2"><label htmlFor="personInCharge" className="block text-sm font-medium text-gray-700">担当者氏名</label><input type="text" id="personInCharge" value={personInCharge} onChange={e => setPersonInCharge(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" /></div>
            </div>
          </div>

          {/* Staff & Contract Details Section */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">スタッフ・契約情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2"><label htmlFor="staffName" className="block text-sm font-medium text-gray-700">スタッフ氏名 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label><input type="text" id="staffName" value={staffName} onChange={e => setStaffName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
              <div className="md:col-span-2"><label htmlFor="workContent" className="block text-sm font-medium text-gray-700">業務内容 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label><textarea id="workContent" value={workContent} onChange={e => setWorkContent(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" rows={3} required /></div>
              {/* New Contract Type Selection */}
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <label htmlFor="contractType" className="block text-sm font-medium text-gray-700">契約種別 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                  <div 
                    className="relative ml-2"
                    onMouseEnter={() => setShowInfoTooltip(true)}
                    onMouseLeave={() => setShowInfoTooltip(false)}
                  >
                    <div className="h-5 w-5 bg-gray-900 text-white rounded-full flex items-center justify-center cursor-pointer">
                      <span className="text-sm font-bold">?</span>
                    </div>
                    {showInfoTooltip && contractType && (
                      <div className="absolute bottom-full mb-2 w-72 bg-gray-900 text-white text-sm rounded py-2 px-3 z-10 whitespace-pre-wrap shadow-lg">
                        <h4 className="font-bold text-sm mb-1">{contractType}</h4>
                        <p>{contractTypeDescriptions[contractType]}</p>
                      </div>
                    )}
                  </div>
                  <span className="ml-2 text-xs text-gray-500">契約種別を選択後、アイコンにカーソルを合わせると詳細を確認できます。</span>
                </div>
                <select id="contractType" value={contractType} onChange={e => setContractType(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required>
                  <option value="">選択してください</option>
                  <option value="時給">時給</option>
                  <option value="月時（上限あり下限あり）">月時（上限あり下限あり）</option>
                  <option value="月時（上限あり下限なし）">月時（上限あり下限なし）</option>
                  <option value="月時（上限なし下限あり）">月時（上限なし下限あり）</option>
                  <option value="月時（完全固定）">月時（完全固定）</option>
                  <option value="月時（上限下限変動あり）">月時（上限下限変動あり）</option>
                  <option value="月時（上限変動あり、下限変動なし）">月時（上限変動あり、下限変動なし）</option>
                  <option value="月時（上限変動なし、下限変動あり）">月時（上限変動なし、下限変動あり）</option>
                  <option value="月時（上限変動なし、下限変動なし）">月時（上限変動なし、下限変動なし）</option>
                </select>
              </div>
              <div className="md:col-span-2"><label htmlFor="billingRate" className="block text-sm font-medium text-gray-700">
                {contractType === '時給' ? 'ご請求単価 (/時)' : contractType.startsWith('月時') ? '月給単価' : '単価'} <span className="ml-1 text-red-500 font-bold text-lg">*</span>
              </label><input type="text" id="billingRate" value={formatNumberWithCommas(billingRate)} onChange={handleBillingRateChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
              {contractType.startsWith('月時') && (
                <div className="md:col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    id="showTotalPrice"
                    checked={showTotalPrice}
                    onChange={(e) => setShowTotalPrice(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="showTotalPrice" className="ml-2 block text-sm text-gray-900">
                    期間合計金額をPDFへ出力する
                  </label>
                </div>
              )}

              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div><label htmlFor="contractStartDate" className="block text-sm font-medium text-gray-700">契約開始日 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label><input type="date" id="contractStartDate" value={contractStartDate} onChange={e => setContractStartDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
                <div><label htmlFor="contractEndDate" className="block text-sm font-medium text-gray-700">契約終了日 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label><input type="date" id="contractEndDate" value={contractEndDate} onChange={e => setContractEndDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
              </div>

              {/* Monthly Variable Settings UI */}
              {showTotalPrice && contractType.includes('変動') && monthlySettings.map((setting, index) => (
                <div key={setting.yearMonth} className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-blue-50">
                  <h3 className="text-lg font-semibold mb-2 md:col-span-2">変動設定 ({setting.yearMonth})</h3>
                  <div>
                    <label htmlFor={`workingDaysPerMonth-${index}`} className="block text-sm font-medium text-gray-700">労働日数/月 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                    <input type="number" id={`workingDaysPerMonth-${index}`} value={setting.workingDaysPerMonth} onChange={e => handleMonthlySettingChange(index, 'workingDaysPerMonth', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                  </div>
                  <div>
                    <label htmlFor={`workingHoursPerDay-${index}`} className="block text-sm font-medium text-gray-700">労働時間/日 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                    <input type="number" id={`workingHoursPerDay-${index}`} value={setting.workingHoursPerDay} onChange={e => handleMonthlySettingChange(index, 'workingHoursPerDay', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">基準時間: <span className="font-bold text-lg">{setting.baseHours > 0 ? `${setting.baseHours}h` : '---'}</span></p>
                  </div>
                  {(contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動なし、下限変動あり）') && (
                    <div>
                      <label htmlFor={`lowerLimitHourDiff-${index}`} className="block text-sm font-medium text-gray-700">下限時間 (差分) <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                      <input type="number" id={`lowerLimitHourDiff-${index}`} value={setting.lowerLimitHourDiff} onChange={e => handleMonthlySettingChange(index, 'lowerLimitHourDiff', e.target.value)} placeholder="例: 20" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                  )}
                  {(contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）') && (
                  <div>
                    <label htmlFor={`upperLimitHourDiff-${index}`} className="block text-sm font-medium text-gray-700">上限時間 (差分) <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                    <input type="number" id={`upperLimitHourDiff-${index}`} value={setting.upperLimitHourDiff} onChange={e => handleMonthlySettingChange(index, 'upperLimitHourDiff', e.target.value)} placeholder="例: 20" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                  </div>
                  )}
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">計算後の時間幅: <span className="font-bold text-lg">{setting.lowerLimitHours || '---'}h 〜 {setting.upperLimitHours || '---'}h</span></p>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor={`variableCalculationType-${index}`} className="block text-sm font-medium text-gray-700">計算タイプ (特記事項用) <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                    <select id={`variableCalculationType-${index}`} value={setting.variableCalculationType} onChange={e => handleMonthlySettingChange(index, 'variableCalculationType', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required>
                      <option value="">選択してください</option>
                      {variableCalculationTypeOptions.map((o, i) => <option key={i} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              ))}

              {(contractType.includes('変動')) && !showTotalPrice && (
                <>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-blue-50">
                    <h3 className="text-lg font-semibold mb-2 md:col-span-2">変動設定</h3>
                    <div>
                      <label htmlFor="workingDaysPerMonth" className="block text-sm font-medium text-gray-700">労働日数/月 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                      <input type="number" id="workingDaysPerMonth" value={workingDaysPerMonth} onChange={e => setWorkingDaysPerMonth(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                    <div>
                      <label htmlFor="workingHoursPerDay" className="block text-sm font-medium text-gray-700">労働時間/日 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                      <input type="number" id="workingHoursPerDay" value={workingHoursPerDay} onChange={e => setWorkingHoursPerDay(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700">基準時間: <span className="font-bold text-lg">{baseHours > 0 ? `${baseHours}h` : '---'}</span></p>
                    </div>
                    {(contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動なし、下限変動あり）') && (
                      <div>
                        <label htmlFor="lowerLimitHourDiff" className="block text-sm font-medium text-gray-700">下限時間 (差分) <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                        <input type="number" id="lowerLimitHourDiff" value={lowerLimitHourDiff} onChange={e => setLowerLimitHourDiff(e.target.value)} placeholder="例: 20" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                      </div>
                    )}
                    {(contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）') && (
                    <div>
                      <label htmlFor="upperLimitHourDiff" className="block text-sm font-medium text-gray-700">上限時間 (差分) <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                      <input type="number" id="upperLimitHourDiff" value={upperLimitHourDiff} onChange={e => setUpperLimitHourDiff(e.target.value)} placeholder="例: 20" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                    )}
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700">計算後の時間幅: <span className="font-bold text-lg">{lowerLimitHours || '---'}h 〜 {upperLimitHours || '---'}h</span></p>
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="variableCalculationType" className="block text-sm font-medium text-gray-700">計算タイプ (特記事項用) <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                      <select id="variableCalculationType" value={variableCalculationType} onChange={e => setVariableCalculationType(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required>
                        <option value="">選択してください</option>
                        {variableCalculationTypeOptions.map((o, i) => <option key={i} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* --- Upper Limit Fields --- */}
              {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限あり下限なし）') && (
                <>
                  <div>
                    <label htmlFor="upperLimitHours" className="block text-sm font-medium text-gray-700">上限時間 (h) <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                    <input type="number" id="upperLimitHours" value={upperLimitHours} onChange={e => setUpperLimitHours(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                  </div>
                </>
              )}

              {/* --- Lower Limit Fields --- */}
              {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限なし下限あり）') && (
                <>
                  <div>
                    <label htmlFor="lowerLimitHours" className="block text-sm font-medium text-gray-700">下限時間 (h) <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                    <input type="number" id="lowerLimitHours" value={lowerLimitHours} onChange={e => setLowerLimitHours(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                  </div>
                </>
              )}

              {/* --- Overtime Fields --- */}
              {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限あり下限なし）' || contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）' || contractType === '月時（上限変動なし、下限変動あり）' || contractType === '月時（上限変動なし、下限変動なし）') && (
                <>
                  <div className="md:col-span-2">
                    <label htmlFor="overtimeUnitPriceCalculationMethod" className="block text-sm font-medium text-gray-700">超過単価の算出基準 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                    <select id="overtimeUnitPriceCalculationMethod" value={overtimeUnitPriceCalculationMethod} onChange={e => setOvertimeUnitPriceCalculationMethod(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required>
                      <option value="">選択してください</option>
                      <option value="上限割">上限割</option>
                      {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限下限変動あり）') && <option value="下限割">下限割</option>}
                      {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限下限変動あり）') && <option value="中央割">中央割</option>}
                      <option value="任意時間割">任意時間割</option>
                    </select>
                  </div>
                  {overtimeUnitPriceCalculationMethod === '任意時間割' && (
                    <div className="md:col-span-2">
                      <label htmlFor="customOvertimeUnitPriceHours" className="block text-sm font-medium text-gray-700">任意時間 (h) <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                      <input type="number" id="customOvertimeUnitPriceHours" value={customOvertimeUnitPriceHours} onChange={e => setCustomOvertimeUnitPriceHours(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label htmlFor="overtimePremiumRate" className="block text-sm font-medium text-gray-700">割増係数 (超過単価のみ)</label>
                    <input type="number" id="overtimePremiumRate" step="0.01" value={overtimePremiumRate} onChange={e => setOvertimePremiumRate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" placeholder="例: 1.25" />
                  </div>
                </>
              )}

              {/* --- Deduction Fields --- */}
              {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限なし下限あり）' || contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）' || contractType === '月時（上限変動なし、下限変動あり）' || contractType === '月時（上限変動なし、下限変動なし）') && (
                <>
                  <div className="md:col-span-2">
                    <label htmlFor="deductionUnitPriceCalculationMethod" className="block text-sm font-medium text-gray-700">控除単価の算出基準 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                    <select id="deductionUnitPriceCalculationMethod" value={deductionUnitPriceCalculationMethod} onChange={e => setDeductionUnitPriceCalculationMethod(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required>
                      <option value="">選択してください</option>
                      {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限下限変動あり）') && <option value="上限割">上限割</option>}
                      <option value="下限割">下限割</option>
                      {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限下限変動あり）') && <option value="中央割">中央割</option>}
                      <option value="任意時間割">任意時間割</option>
                    </select>
                  </div>
                  {deductionUnitPriceCalculationMethod === '任意時間割' && (
                    <div className="md:col-span-2">
                      <label htmlFor="customDeductionUnitPriceHours" className="block text-sm font-medium text-gray-700">任意時間 (h) <span className="ml-1 text-red-500 font-bold text-lg">*</span></label>
                      <input type="number" id="customDeductionUnitPriceHours" value={customDeductionUnitPriceHours} onChange={e => setCustomDeductionUnitPriceHours(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold">割増率設定</h2>
              {(contractType === '月時（上限なし下限あり）' || contractType === '月時（完全固定）') && (
                <span className="ml-4 text-sm text-gray-600">
                  超過単価がないため、割増計算は行われません。
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contractType === '時給' && (
                <div><label htmlFor="overtimeRate" className="block text-sm font-medium text-gray-700">普通残業 (x1.25)</label><input type="number" id="overtimeRate" step="0.01" value={overtimeRate} onChange={handlePremiumRateChange(setOvertimeRate)} onBlur={handlePremiumRateBlur(setOvertimeRate)} placeholder="例: 1.25" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" /></div>
              )}
              
              {/* Show for hourly and monthly-with-upper-limit contracts */}
              {(contractType === '時給' || contractType === '月時（上限あり下限あり）' || contractType === '月時（上限あり下限なし）' || contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）' || contractType === '月時（上限変動なし、下限変動あり）' || contractType === '月時（上限変動なし、下限変動なし）') && (
                  <>
                      <div><label htmlFor="midnightRate" className="block text-sm font-medium text-gray-700">深夜手当 (x0.25)</label><input type="number" id="midnightRate" step="0.01" value={midnightRate} onChange={handlePremiumRateChange(setMidnightRate)} onBlur={handlePremiumRateBlur(setMidnightRate)} placeholder="例: 0.25" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" /></div>
                      <div><label htmlFor="legalHolidayRate" className="block text-sm font-medium text-gray-700">法定休日出勤 (x1.35)</label><input type="number" id="legalHolidayRate" step="0.01" value={legalHolidayRate} onChange={handlePremiumRateChange(setLegalHolidayRate)} onBlur={handlePremiumRateBlur(setLegalHolidayRate)} placeholder="例: 1.35" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" /></div>
                      <div><label htmlFor="nonLegalHolidayRate" className="block text-sm font-medium text-gray-700">法定外休日出勤 (x1.25)</label><input type="number" id="nonLegalHolidayRate" step="0.01" value={nonLegalHolidayRate} onChange={handlePremiumRateChange(setNonLegalHolidayRate)} onBlur={handlePremiumRateBlur(setNonLegalHolidayRate)} placeholder="例: 1.25" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" /></div>
                      <div><label htmlFor="over60HoursRate" className="block text-sm font-medium text-gray-700">60時間超過 (x1.50)</label><input type="number" id="over60HoursRate" step="0.01" value={over60HoursRate} onChange={handlePremiumRateChange(setOver60HoursRate)} onBlur={handlePremiumRateBlur(setOver60HoursRate)} placeholder="例: 1.50" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" /></div>
                  </>
              )}
            </div>
          </div>
          
          {/* Rounding & Settlement Section */}
          <div className="p-4 border rounded-lg bg-gray-50">
             <h2 className="text-xl font-semibold mb-4">丸め・精算設定</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contractType !== '月時（完全固定）' && (
                  <>
                    <div><label htmlFor="roundingUnit" className="block text-sm font-medium text-gray-700">金額丸め単位 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label><select id="roundingUnit" value={roundingUnit} onChange={e => setRoundingUnit(e.target.value === '' ? '' : parseInt(e.target.value))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required><option value="">選択してください</option>{roundingUnitOptions.map(o => <option key={o} value={o}>{o}円</option>)}</select></div>
                    <div><label htmlFor="roundingMethod" className="block text-sm font-medium text-gray-700">丸め方法 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label><select id="roundingMethod" value={roundingMethod} onChange={e => setRoundingMethod(e.target.value as RoundingMethod)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required><option value="">選択してください</option>{roundingMethods.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                  </>
                )}
                <div><label htmlFor="settlementUnit" className="block text-sm font-medium text-gray-700">時間精算単位 <span className="ml-1 text-red-500 font-bold text-lg">*</span></label><select id="settlementUnit" value={settlementUnit} onChange={e => setSettlementUnit(e.target.value === '' ? '' : parseInt(e.target.value))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required><option value="">選択してください</option>{settlementUnitOptions.map(o => <option key={o} value={o}>{o}分</option>)}</select></div>
                <div><label htmlFor="settlementMethod" className="block text-sm font-medium text-gray-700">精算丸め <span className="ml-1 text-red-500 font-bold text-lg">*</span></label><select id="settlementMethod" value={settlementMethod} onChange={e => setSettlementMethod(e.target.value as RoundingMethod)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required><option value="">選択してください</option>{roundingMethods.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
             </div>
          </div>

          {/* Calculation Results Section */}
          { ((contractType === '時給' && hourlyCalculatedRates) || (contractType.startsWith('月時') && monthlyCalculatedRates)) ? (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h2 className="text-xl font-semibold mb-4">計算結果</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {contractType === '時給' && hourlyCalculatedRates && (
                  <>
                    <div><p className="font-medium text-gray-600">普通残業単価:</p><p className="font-semibold text-lg">{hourlyCalculatedRates.normalOvertime > 0 ? `${hourlyCalculatedRates.normalOvertime.toLocaleString()}円` : '-'}</p></div>
                    <div><p className="font-medium text-gray-600">深夜手当単価:</p><p className="font-semibold text-lg">{hourlyCalculatedRates.midnight > 0 ? `${hourlyCalculatedRates.midnight.toLocaleString()}円` : '-'}</p></div>
                    <div><p className="font-medium text-gray-600">法定休日出勤単価:</p><p className="font-semibold text-lg">{hourlyCalculatedRates.legalHoliday > 0 ? `${hourlyCalculatedRates.legalHoliday.toLocaleString()}円` : '-'}</p></div>
                    <div><p className="font-medium text-gray-600">法定外休日出勤単価:</p><p className="font-semibold text-lg">{hourlyCalculatedRates.nonLegalHoliday > 0 ? `${hourlyCalculatedRates.nonLegalHoliday.toLocaleString()}円` : '-'}</p></div>
                    <div><p className="font-medium text-gray-600">60時間超過単価:</p><p className="font-semibold text-lg">{hourlyCalculatedRates.over60Hours > 0 ? `${hourlyCalculatedRates.over60Hours.toLocaleString()}円` : '-'}</p></div>
                  </>
                )}
                {contractType.startsWith('月時') && monthlyCalculatedRates && !(showTotalPrice && contractType.includes('変動')) && (
                  <>
                    {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限あり下限なし）' || contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）' || contractType === '月時（上限変動なし、下限変動あり）' || contractType === '月時（上限変動なし、下限変動なし）') &&
                      <div><p className="font-medium text-gray-600">超過単価:</p><p className="font-semibold text-lg">{monthlyCalculatedRates.overtimeUnitPriceWithPremium ? `${monthlyCalculatedRates.overtimeUnitPriceWithPremium.toLocaleString()}円 (${monthlyCalculatedRates.overtimeUnitPrice.toLocaleString()}円)` : monthlyCalculatedRates.overtimeUnitPrice > 0 ? `${monthlyCalculatedRates.overtimeUnitPrice.toLocaleString()}円` : '-'}</p></div>
                    }
                    {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限なし下限あり）' || contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）' || contractType === '月時（上限変動なし、下限変動あり）' || contractType === '月時（上限変動なし、下限変動なし）') &&
                      <div><p className="font-medium text-gray-600">控除単価:</p><p className="font-semibold text-lg">{monthlyCalculatedRates.deductionUnitPrice > 0 ? `${monthlyCalculatedRates.deductionUnitPrice.toLocaleString()}円` : '-'}</p></div>
                    }
                    {monthlyCalculatedRates.monthlyMidnight && (
                      <div><p className="font-medium text-gray-600">深夜手当単価:</p><p className="font-semibold text-lg">{monthlyCalculatedRates.monthlyMidnight > 0 ? `${monthlyCalculatedRates.monthlyMidnight.toLocaleString()}円` : '-'}</p></div>
                    )}
                    {monthlyCalculatedRates.monthlyLegalHoliday && (
                      <div><p className="font-medium text-gray-600">法定休日出勤単価:</p><p className="font-semibold text-lg">{monthlyCalculatedRates.monthlyLegalHoliday > 0 ? `${monthlyCalculatedRates.monthlyLegalHoliday.toLocaleString()}円` : '-'}</p></div>
                    )}
                    {monthlyCalculatedRates.monthlyNonLegalHoliday && (
                      <div><p className="font-medium text-gray-600">法定外休日出勤単価:</p><p className="font-semibold text-lg">{monthlyCalculatedRates.monthlyNonLegalHoliday > 0 ? `${monthlyCalculatedRates.monthlyNonLegalHoliday.toLocaleString()}円` : '-'}</p></div>
                    )}
                    {monthlyCalculatedRates.monthlyOver60Hours && (
                      <div><p className="font-medium text-gray-600">60時間超過単価:</p><p className="font-semibold text-lg">{monthlyCalculatedRates.monthlyOver60Hours > 0 ? `${monthlyCalculatedRates.monthlyOver60Hours.toLocaleString()}円` : '-'}</p></div>
                    )}
                  </>
                )}
                {contractType.startsWith('月時') && showTotalPrice && contractType.includes('変動') && monthlySettings.map((setting, index) => (
                  <div key={index} className="col-span-2 md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <p className="font-semibold text-gray-700 col-span-full">▼ {setting.yearMonth}の計算結果</p>
                    {setting.calculatedRates?.overtimeUnitPrice && setting.calculatedRates.overtimeUnitPrice > 0 && 
                      <div><p className="font-medium text-gray-600">超過単価:</p><p className="font-semibold text-lg">{setting.calculatedRates.overtimeUnitPriceWithPremium ? `${setting.calculatedRates.overtimeUnitPriceWithPremium.toLocaleString()}円 (${setting.calculatedRates.overtimeUnitPrice.toLocaleString()}円)` : setting.calculatedRates.overtimeUnitPrice > 0 ? `${setting.calculatedRates.overtimeUnitPrice.toLocaleString()}円` : '-'}</p></div>
                    }
                    {setting.calculatedRates?.deductionUnitPrice && setting.calculatedRates.deductionUnitPrice > 0 && 
                      <div><p className="font-medium text-gray-600">控除単価:</p><p className="font-semibold text-lg">{setting.calculatedRates.deductionUnitPrice > 0 ? `${setting.calculatedRates.deductionUnitPrice.toLocaleString()}円` : '-'}</p></div>
                    }
                    {setting.calculatedRates?.monthlyMidnight && setting.calculatedRates.monthlyMidnight > 0 &&
                      <div><p className="font-medium text-gray-600">深夜手当単価:</p><p className="font-semibold text-lg">{`${setting.calculatedRates.monthlyMidnight.toLocaleString()}円`}</p></div>
                    }
                    {setting.calculatedRates?.monthlyLegalHoliday && setting.calculatedRates.monthlyLegalHoliday > 0 &&
                      <div><p className="font-medium text-gray-600">法定休日出勤単価:</p><p className="font-semibold text-lg">{`${setting.calculatedRates.monthlyLegalHoliday.toLocaleString()}円`}</p></div>
                    }
                    {setting.calculatedRates?.monthlyNonLegalHoliday && setting.calculatedRates.monthlyNonLegalHoliday > 0 &&
                      <div><p className="font-medium text-gray-600">法定外休日出勤単価:</p><p className="font-semibold text-lg">{`${setting.calculatedRates.monthlyNonLegalHoliday.toLocaleString()}円`}</p></div>
                    }
                    {setting.calculatedRates?.monthlyOver60Hours && setting.calculatedRates.monthlyOver60Hours > 0 &&
                      <div><p className="font-medium text-gray-600">60時間超過単価:</p><p className="font-semibold text-lg">{`${setting.calculatedRates.monthlyOver60Hours.toLocaleString()}円`}</p></div>
                    }
                  </div>
                ))}
              </div>
            </div>
          ) : null }

          {/* Special Notes Section */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">特記事項</h2>
            <textarea value={specialNotes} onChange={e => setSpecialNotes(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" rows={4} />
          </div>

          {/* Issuer Info Section */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">発行元・振込先</h2>
            <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">発行元情報</label>
            <textarea id="contactInfo" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" rows={4} />
            <label htmlFor="paymentInfo" className="block text-sm font-medium text-gray-700 mt-4">お支払い先のご案内</label>
            <textarea id="paymentInfo" value={paymentInfo} onChange={e => setPaymentInfo(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-600 leading-relaxed" rows={5} />
          </div>

          {/* Generate Button */}
          <div className="md:col-span-3">
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-bold text-lg disabled:bg-blue-400"
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? '生成中...' : '見積書を生成'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}