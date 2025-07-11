"use client";

import { useState, useMemo, useEffect } from "react";
import { calculateHourlyRates, calculateMonthlyRates } from "../utils/calculations";
import { generateQuotationPdf } from "../utils/generateQuotationPdf";
import { ContractType, MonthlyCalculatedRates, RoundingMethod } from "../types/quotation";

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
  const [billingRate, setBillingRate] = useState<number | string>(0);
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
      setBillingRate(0); // Or "" if you want it visually blank
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
    workingDaysPerMonth, // Add dependency
    workingHoursPerDay, // Add dependency
  ]);

  const monthlyCalculationFormula = useMemo(() => {
    const monthlyTypesWithOptions = ['月時（上限あり下限あり）', '月時（上限あり下限なし）', '月時（上限なし下限あり）', '月時（上限下限変動あり）'];
    const variableTypes = ['月時（上限下限変動あり）', '月時（上限変動あり、下限変動なし）', '月時（上限変動なし、下限変動あり）', '月時（上限変動なし、下限変動なし）'];

    if (monthlyTypesWithOptions.includes(contractType) && monthlyCalculatedRates && (monthlyCalculatedRates.overtimeUnitPrice > 0 || monthlyCalculatedRates.deductionUnitPrice > 0)) {
      let formulaText = '▼ 単価計算方法';
      if (variableTypes.includes(contractType) && variableCalculationType) {
        const days = String(workingDaysPerMonth) || '0';
        const hours = String(workingHoursPerDay) || '0';
        const parts = variableCalculationType.split(' × ');
        if (parts.length === 2) {
          const formattedCalcType = `${parts[0]}:${days}日 × ${parts[1]}:${hours}h`;
          formulaText += `（${formattedCalcType}）`;
        } else {
          formulaText += `（${variableCalculationType}）`; // Fallback
        }
      }
      formulaText += '\n';

      const br = billingRate.toLocaleString(); // Formatted billing rate

      // 超過計算式
      if ((contractType === '月時（上限あり下限あり）' || contractType === '月時（上限あり下限なし）' || contractType === '月時（上限下限変動あり）') && overtimeUnitPriceCalculationMethod) {
        let overtimeFormula = `超過：${br}円 ÷ `;
        let divisorValue = 0;
        let divisorLabel = '';

        switch (overtimeUnitPriceCalculationMethod) {
          case '上限割':
            divisorValue = parseFloat(String(upperLimitHours)) || 0;
            divisorLabel = `${divisorValue}h`;
            break;
          case '下限割':
            divisorValue = parseFloat(String(lowerLimitHours)) || 0;
            divisorLabel = `${divisorValue}h`;
            break;
          case '中央割':
            divisorValue = (parseFloat(String(upperLimitHours)) + parseFloat(String(lowerLimitHours))) / 2 || 0;
            divisorLabel = `${divisorValue}h`;
            break;
          case '任意時間割':
            divisorValue = parseFloat(String(customOvertimeUnitPriceHours)) || 0;
            divisorLabel = `${divisorValue}h`;
            break;
        }
        overtimeFormula += `${divisorLabel}`;
        if (overtimePremiumRate && parseFloat(String(overtimePremiumRate)) > 0) {
          overtimeFormula += ` × ${overtimePremiumRate}`;
        }
        formulaText += overtimeFormula + "\n";
      }

      // 控除計算式
      if ((contractType === '月時（上限あり下限あり）' || contractType === '月時（上限なし下限あり）' || contractType === '月時（上限下限変動あり）') && deductionUnitPriceCalculationMethod) {
        let deductionFormula = `控除：${br}円 ÷ `;
        let divisorValue = 0;
        let divisorLabel = '';

        switch (deductionUnitPriceCalculationMethod) {
          case '上限割':
            divisorValue = parseFloat(String(upperLimitHours)) || 0;
            divisorLabel = `${divisorValue}h`;
            break;
          case '下限割':
            divisorValue = parseFloat(String(lowerLimitHours)) || 0;
            divisorLabel = `${divisorValue}h`;
            break;
          case '中央割':
            divisorValue = (parseFloat(String(upperLimitHours)) + parseFloat(String(lowerLimitHours))) / 2 || 0;
            divisorLabel = `${divisorValue}h`;
            break;
          case '任意時間割':
            divisorValue = parseFloat(String(customDeductionUnitPriceHours)) || 0;
            divisorLabel = `${divisorValue}h`;
            break;
        }
        deductionFormula += `${divisorLabel}`;
        formulaText += deductionFormula + "\n";
      }

      return formulaText.trim();
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
  ]);

  const handleGeneratePdf = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsGeneratingPdf(true);
    try {
      await generateQuotationPdf({
        quotationNo, creationDate, validUntil, companyName, departmentName, personInCharge, staffName, contractStartDate, contractEndDate, workContent,
        billingRate: typeof billingRate === 'number' ? billingRate : 0,
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
        <h1 className="text-2xl font-bold mb-6 text-center">御見積書</h1>
        <form onSubmit={handleGeneratePdf} className="space-y-6">
          
          {/* Basic Info Section */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label htmlFor="quotationNo" className="block text-sm font-medium text-gray-700">見積書No. <span className="text-red-500">*</span></label><input type="text" id="quotationNo" value={quotationNo} onChange={e => setQuotationNo(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" readOnly required /></div>
              <div><label htmlFor="creationDate" className="block text-sm font-medium text-gray-700">作成日 <span className="text-red-500">*</span></label><input type="date" id="creationDate" value={creationDate} onChange={e => setCreationDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
              <div><label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">有効期限 <span className="text-red-500">*</span></label><input type="date" id="validUntil" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
            </div>
          </div>

          {/* Client Info Section */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">顧客情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label htmlFor="companyName" className="block text-sm font-medium text-gray-700">企業名 <span className="text-red-500">*</span></label><input type="text" id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
              <div><label htmlFor="departmentName" className="block text-sm font-medium text-gray-700">部署名</label><input type="text" id="departmentName" value={departmentName} onChange={e => setDepartmentName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" /></div>
              <div className="md:col-span-2"><label htmlFor="personInCharge" className="block text-sm font-medium text-gray-700">担当者氏名</label><input type="text" id="personInCharge" value={personInCharge} onChange={e => setPersonInCharge(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" /></div>
            </div>
          </div>

          {/* Staff & Contract Details Section */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">スタッフ・契約情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label htmlFor="staffName" className="block text-sm font-medium text-gray-700">スタッフ氏名 <span className="text-red-500">*</span></label><input type="text" id="staffName" value={staffName} onChange={e => setStaffName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
              <div><label htmlFor="billingRate" className="block text-sm font-medium text-gray-700">
                {contractType === '時給' ? 'ご請求単価 (/時)' : contractType.startsWith('月時') ? '月給単価' : '単価'} <span className="text-red-500">*</span>
              </label><input type="number" id="billingRate" value={billingRate} onChange={e => setBillingRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
              <div className="md:col-span-2"><label htmlFor="workContent" className="block text-sm font-medium text-gray-700">業務内容 <span className="text-red-500">*</span></label><textarea id="workContent" value={workContent} onChange={e => setWorkContent(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" rows={3} required /></div>
              {/* New Contract Type Selection */}
              <div className="md:col-span-2">
                <label htmlFor="contractType" className="block text-sm font-medium text-gray-700">契約種別 <span className="text-red-500">*</span></label>
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
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div><label htmlFor="contractStartDate" className="block text-sm font-medium text-gray-700">契約開始日 <span className="text-red-500">*</span></label><input type="date" id="contractStartDate" value={contractStartDate} onChange={e => setContractStartDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
                <div><label htmlFor="contractEndDate" className="block text-sm font-medium text-gray-700">契約終了日 <span className="text-red-500">*</span></label><input type="date" id="contractEndDate" value={contractEndDate} onChange={e => setContractEndDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required /></div>
              </div>

              {(contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）' || contractType === '月時（上限変動なし、下限変動あり）' || contractType === '月時（上限変動なし、下限変動なし）') && (
                <>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-blue-50">
                    <h3 className="text-lg font-semibold mb-2 md:col-span-2">変動設定</h3>
                    <div>
                      <label htmlFor="workingDaysPerMonth" className="block text-sm font-medium text-gray-700">労働日数/月 <span className="text-red-500">*</span></label>
                      <input type="number" id="workingDaysPerMonth" value={workingDaysPerMonth} onChange={e => setWorkingDaysPerMonth(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                    <div>
                      <label htmlFor="workingHoursPerDay" className="block text-sm font-medium text-gray-700">労働時間/日 <span className="text-red-500">*</span></label>
                      <input type="number" id="workingHoursPerDay" value={workingHoursPerDay} onChange={e => setWorkingHoursPerDay(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700">基準時間: <span className="font-bold text-lg">{baseHours > 0 ? `${baseHours}h` : '---'}</span></p>
                    </div>
                    {(contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動なし、下限変動あり）') && (
                      <div>
                        <label htmlFor="lowerLimitHourDiff" className="block text-sm font-medium text-gray-700">下限時間 (差分) <span className="text-red-500">*</span></label>
                        <input type="number" id="lowerLimitHourDiff" value={lowerLimitHourDiff} onChange={e => setLowerLimitHourDiff(e.target.value)} placeholder="例: 20" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                      </div>
                    )}
                    {(contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）') && (
                    <div>
                      <label htmlFor="upperLimitHourDiff" className="block text-sm font-medium text-gray-700">上限時間 (差分) <span className="text-red-500">*</span></label>
                      <input type="number" id="upperLimitHourDiff" value={upperLimitHourDiff} onChange={e => setUpperLimitHourDiff(e.target.value)} placeholder="例: 20" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                    )}
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700">計算後の時間幅: <span className="font-bold text-lg">{lowerLimitHours || '---'}h 〜 {upperLimitHours || '---'}h</span></p>
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="variableCalculationType" className="block text-sm font-medium text-gray-700">計算タイプ (特記事項用) <span className="text-red-500">*</span></label>
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
                    <label htmlFor="upperLimitHours" className="block text-sm font-medium text-gray-700">上限時間 (h) <span className="text-red-500">*</span></label>
                    <input type="number" id="upperLimitHours" value={upperLimitHours} onChange={e => setUpperLimitHours(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                  </div>
                </>
              )}

              {/* --- Lower Limit Fields --- */}
              {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限なし下限あり）') && (
                <>
                  <div>
                    <label htmlFor="lowerLimitHours" className="block text-sm font-medium text-gray-700">下限時間 (h) <span className="text-red-500">*</span></label>
                    <input type="number" id="lowerLimitHours" value={lowerLimitHours} onChange={e => setLowerLimitHours(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                  </div>
                </>
              )}

              {/* --- Overtime Fields --- */}
              {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限あり下限なし）' || contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）' || contractType === '月時（上限変動なし、下限変動あり）') && (
                <>
                  <div className="md:col-span-2">
                    <label htmlFor="overtimeUnitPriceCalculationMethod" className="block text-sm font-medium text-gray-700">超過単価の算出基準 <span className="text-red-500">*</span></label>
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
                      <label htmlFor="customOvertimeUnitPriceHours" className="block text-sm font-medium text-gray-700">任意時間 (h) <span className="text-red-500">*</span></label>
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
              {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限なし下限あり）' || contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）' || contractType === '月時（上限変動なし、下限変動あり）') && (
                <>
                  <div className="md:col-span-2">
                    <label htmlFor="deductionUnitPriceCalculationMethod" className="block text-sm font-medium text-gray-700">控除単価の算出基準 <span className="text-red-500">*</span></label>
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
                      <label htmlFor="customDeductionUnitPriceHours" className="block text-sm font-medium text-gray-700">任意時間 (h) <span className="text-red-500">*</span></label>
                      <input type="number" id="customDeductionUnitPriceHours" value={customDeductionUnitPriceHours} onChange={e => setCustomDeductionUnitPriceHours(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">割増率設定</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contractType === '時給' && (
                <div><label htmlFor="overtimeRate" className="block text-sm font-medium text-gray-700">普通残業 (x1.25)</label><input type="number" id="overtimeRate" step="0.01" value={overtimeRate} onChange={handlePremiumRateChange(setOvertimeRate)} onBlur={handlePremiumRateBlur(setOvertimeRate)} placeholder="例: 1.25" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" /></div>
              )}
              
              {/* Show for hourly and monthly-with-upper-limit contracts */}
              {(contractType === '時給' || contractType === '月時（上限あり下限あり）' || contractType === '月時（上限あり下限なし）' || contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）' || contractType === '月時（上限変動なし、下限変動あり）') && (
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
                    <div><label htmlFor="roundingUnit" className="block text-sm font-medium text-gray-700">金額丸め単位 <span className="text-red-500">*</span></label><select id="roundingUnit" value={roundingUnit} onChange={e => setRoundingUnit(e.target.value === '' ? '' : parseInt(e.target.value))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required><option value="">選択してください</option>{roundingUnitOptions.map(o => <option key={o} value={o}>{o}円</option>)}</select></div>
                    <div><label htmlFor="roundingMethod" className="block text-sm font-medium text-gray-700">丸め方法 <span className="text-red-500">*</span></label><select id="roundingMethod" value={roundingMethod} onChange={e => setRoundingMethod(e.target.value as RoundingMethod)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required><option value="">選択してください</option>{roundingMethods.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                  </>
                )}
                <div><label htmlFor="settlementUnit" className="block text-sm font-medium text-gray-700">時間精算単位 <span className="text-red-500">*</span></label><select id="settlementUnit" value={settlementUnit} onChange={e => setSettlementUnit(e.target.value === '' ? '' : parseInt(e.target.value))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required><option value="">選択してください</option>{settlementUnitOptions.map(o => <option key={o} value={o}>{o}分</option>)}</select></div>
                <div><label htmlFor="settlementMethod" className="block text-sm font-medium text-gray-700">精算丸め <span className="text-red-500">*</span></label><select id="settlementMethod" value={settlementMethod} onChange={e => setSettlementMethod(e.target.value as RoundingMethod)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required><option value="">選択してください</option>{roundingMethods.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
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
                {contractType.startsWith('月時') && monthlyCalculatedRates && (
                  <>
                    {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限あり下限なし）' || contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）' || contractType === '月時（上限変動なし、下限変動あり）') &&
                      <div><p className="font-medium text-gray-600">超過単価:</p><p className="font-semibold text-lg">{monthlyCalculatedRates.overtimeUnitPriceWithPremium ? `${monthlyCalculatedRates.overtimeUnitPriceWithPremium.toLocaleString()}円 (${monthlyCalculatedRates.overtimeUnitPrice.toLocaleString()}円)` : monthlyCalculatedRates.overtimeUnitPrice > 0 ? `${monthlyCalculatedRates.overtimeUnitPrice.toLocaleString()}円` : '-'}</p></div>
                    }
                    {(contractType === '月時（上限あり下限あり）' || contractType === '月時（上限なし下限あり）' || contractType === '月時（上限下限変動あり）' || contractType === '月時（上限変動あり、下限変動なし）' || contractType === '月時（上限変動なし、下限変動あり）') &&
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
            <h2 className="text-xl font-semibold mb-4">発行元</h2>
            <textarea value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" rows={4} />
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