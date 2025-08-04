import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { RoundingMethod } from '../types/quotation';

// Data interface definition
interface QuotationData {
  quotationNo: string;
  creationDate: string;
  validUntil: string;
  companyName: string;
  departmentName?: string;
  personInCharge?: string;
  staffName: string;
  contractStartDate: string;
  contractEndDate: string;
  workContent: string;
  billingRate: number;
  contractType: string;
  specialNotes: string;
  contactInfo: string;
  roundingUnit: string;
  roundingMethod: RoundingMethod | string;
  settlementUnit: string;
  settlementMethod: RoundingMethod | string;
  hourlyCalculatedRates?: {
    normalOvertime: number;
    midnight: number;
    legalHoliday: number;
    nonLegalHoliday: number;
    over60Hours: number;
  } | null;
  // New fields for monthly contracts
  upperLimitHours?: number;
  lowerLimitHours?: number;
  monthlyCalculatedRates?: {
    overtimeUnitPrice: number;
    deductionUnitPrice: number;
    overtimeUnitPriceWithPremium?: number;
    monthlyMidnight?: number;
    monthlyLegalHoliday?: number;
    monthlyNonLegalHoliday?: number;
    monthlyOver60Hours?: number;
  } | null;
  monthlyCalculationFormula?: string;
  upperLimitHoursDiff?: number;
  lowerLimitHoursDiff?: number;
  showTotalPrice?: boolean;
  totalPrice?: number;
  monthlySettings?: {
    yearMonth: string;
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
  }[];
  overtimeRate?: number | string;
  midnightRate?: number | string;
  legalHolidayRate?: number | string;
  nonLegalHolidayRate?: number | string;
  over60HoursRate?: number | string;
  overtimePremiumRate?: number | string;
  overtimeUnitPriceCalculationMethod?: string;
  deductionUnitPriceCalculationMethod?: string;
  paymentInfo?: string;
}

// Helper to fetch assets
const fetchAsset = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch asset: ${url}`);
  if (url.endsWith('.txt')) return response.text(); // Font is base64 text
  const blob = await response.blob(); // Images are blobs
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper functions
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || !amount) return '-';
  return `¥${amount.toLocaleString()}`;
};

export const generateQuotationPdf = async (data: QuotationData) => {
  try {
    const [logoBase64, sealBase64, fontBase64] = await Promise.all([
      fetchAsset('/ritsuan_logo.png'),
      fetchAsset('/inkan.png'),
      fetchAsset('/fonts/noto_font_base64.txt'),
    ]);

    const doc = new jsPDF();
    doc.addFileToVFS('NotoSansJP-normal.ttf', fontBase64 as string);
    doc.addFont('NotoSansJP-normal.ttf', 'NotoSansJP', 'normal');
    doc.setFont('NotoSansJP');

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;

    // 1. Header
    doc.addImage(logoBase64 as string, 'PNG', margin, 10, 30, 10);
    doc.setFontSize(22);
    doc.text('御見積書', pageW / 2, 20, { align: 'center' });

    // 2. Info Block
    doc.setFontSize(10);
    const infoTop = 40;
    doc.text(`見積番号: ${data.quotationNo}`, margin, infoTop);
    doc.text(`作成日: ${formatDate(data.creationDate)}`, margin, infoTop + 5);
    doc.text(`有効期限: ${formatDate(data.validUntil)}`, margin, infoTop + 10);

    // --- RIGHT BLOCK: ISSUER AND PAYMENT ---
    const issuerX = pageW - margin - 70;
    doc.setFontSize(9); // Font size change for issuer
    doc.text('【発行元】', issuerX, infoTop - 5);

    let rightBlockY = infoTop;
    const issuerLines = data.contactInfo.trim().split('\n');
    issuerLines.forEach((line) => {
        doc.text(line, issuerX, rightBlockY);
        rightBlockY += 5;
    });
    doc.addImage(sealBase64 as string, 'PNG', pageW - margin - 25, infoTop - 2, 20, 20);

    const paymentBoxStartY = rightBlockY + 3;

    if (data.paymentInfo && data.paymentInfo.trim()) {
      rightBlockY = paymentBoxStartY;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const textWidth = 68;
      const splitText = doc.splitTextToSize(data.paymentInfo, textWidth);
      const paymentBoxPadding = 3;
      const paymentTextHeight = (splitText.length * doc.getLineHeight() / doc.internal.scaleFactor) + (paymentBoxPadding * 2);
      doc.setDrawColor(220, 220, 220);
      doc.rect(issuerX - paymentBoxPadding, rightBlockY, textWidth + (paymentBoxPadding * 2), paymentTextHeight);
      doc.text(splitText, issuerX, rightBlockY + paymentBoxPadding + 2);
      rightBlockY += paymentTextHeight; 
    }
    
    // --- LEFT BLOCK: CLIENT INFO ---
    doc.setFontSize(10); // Reset font
    doc.setTextColor(0, 0, 0);

    let leftBlockY = paymentBoxStartY; // Align with payment box start
    doc.setFontSize(12);
    doc.text(`▪御社名： ${data.companyName}`, margin, leftBlockY);
    leftBlockY += 8;
    if (data.departmentName) {
      doc.text(`▪部署名： ${data.departmentName}`, margin, leftBlockY);
      leftBlockY += 8;
    }
    if (data.personInCharge) {
      doc.text(`▪ご担当者： ${data.personInCharge} 様`, margin, leftBlockY);
      leftBlockY += 8;
    }

    // 4. Greeting
    const greetingY = Math.max(leftBlockY, rightBlockY) + 12;
    doc.setFontSize(11);
    doc.text('下記の通り御見積申し上げます', pageW / 2, greetingY, { align: 'center' });

    // 5. Details Table
    let tableTop = greetingY + 10;
    doc.setFontSize(12);
    doc.text('【御見積詳細】', margin, tableTop);
    tableTop += 5;

    const tableHeader = [['項目', '内容']];
    const tableBody: (string | number)[][] = [
      ['スタッフ氏名', data.staffName],
      ['契約期間', `${formatDate(data.contractStartDate)} 〜 ${formatDate(data.contractEndDate)}`],
      ['業務内容', data.workContent],
    ];

    // Add 月時 specific fields
    if (data.contractType.startsWith('月時')) {
      if (data.showTotalPrice && data.contractStartDate && data.contractEndDate && data.billingRate > 0) {
        const startDate = new Date(data.contractStartDate);
        const endDate = new Date(data.contractEndDate);
        const monthCount = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
        if (monthCount > 0) {
          const totalPrice = monthCount * data.billingRate;
          tableBody.push(['期間合計金額', `${formatCurrency(totalPrice)} (${monthCount}ヶ月分)`]);
        }
      }
      tableBody.push(['月給単価', formatCurrency(data.billingRate)]);

      if (data.showTotalPrice && data.monthlySettings && data.monthlySettings.length > 0) {
        // Show monthly breakdown
        data.monthlySettings.forEach(setting => {
          if (setting.calculatedRates) {
            const overtimeValue = setting.calculatedRates?.overtimeUnitPrice && setting.calculatedRates.overtimeUnitPrice > 0 ? `超過: ${formatCurrency(setting.calculatedRates.overtimeUnitPriceWithPremium ?? setting.calculatedRates.overtimeUnitPrice)}` : '超過: -';
            const deductionValue = setting.calculatedRates?.deductionUnitPrice && setting.calculatedRates.deductionUnitPrice > 0 ? `控除: ${formatCurrency(setting.calculatedRates.deductionUnitPrice)}` : '控除: -';
            tableBody.push([`超過・控除 (${setting.yearMonth})`, `${overtimeValue} / ${deductionValue}`]);

            // Add settlement/base range to the table
            if (data.contractType === '月時（上限下限変動あり）' || data.contractType === '月時（上限変動あり、下限変動なし）' || data.contractType === '月時（上限変動なし、下限変動あり）') {
              tableBody.push([`精算時間 (${setting.yearMonth})`, `${setting.lowerLimitHours}h 〜 ${setting.upperLimitHours}h`]);
            } else if (data.contractType === '月時（上限変動なし、下限変動なし）') {
              tableBody.push([`基準時間 (${setting.yearMonth})`, `${setting.baseHours}h`]);
            }

            const premiumRatesTexts: string[] = [];
            if (data.midnightRate && setting.calculatedRates?.monthlyMidnight && setting.calculatedRates.monthlyMidnight > 0) premiumRatesTexts.push(`深夜(${data.midnightRate}): ${formatCurrency(setting.calculatedRates.monthlyMidnight)}`);
            if (data.legalHolidayRate && setting.calculatedRates?.monthlyLegalHoliday && setting.calculatedRates.monthlyLegalHoliday > 0) premiumRatesTexts.push(`法定休日(${data.legalHolidayRate}): ${formatCurrency(setting.calculatedRates.monthlyLegalHoliday)}`);
            if (data.nonLegalHolidayRate && setting.calculatedRates?.monthlyNonLegalHoliday && setting.calculatedRates.monthlyNonLegalHoliday > 0) premiumRatesTexts.push(`法定外休日(${data.nonLegalHolidayRate}): ${formatCurrency(setting.calculatedRates.monthlyNonLegalHoliday)}`);
            if (data.over60HoursRate && setting.calculatedRates?.monthlyOver60Hours && setting.calculatedRates.monthlyOver60Hours > 0) premiumRatesTexts.push(`60h超(${data.over60HoursRate}): ${formatCurrency(setting.calculatedRates.monthlyOver60Hours)}`);

            if (premiumRatesTexts.length > 0) {
              tableBody.push([`割増単価 (${setting.yearMonth})`, premiumRatesTexts.join(' / ')]);
            }
          }
        });
      } else {
        // Original logic for single calculation
        if (data.contractType === '月時（上限あり下限あり）' || data.contractType === '月時（上限下限変動あり）' || data.contractType === '月時（上限変動あり、下限変動なし）' || data.contractType === '月時（上限変動なし、下限変動あり）') {
          tableBody.push(['時間幅', `${data.lowerLimitHours || 0}h 〜 ${data.upperLimitHours || 0}h`]);
        } else if (data.contractType === '月時（上限あり下限なし）') {
          tableBody.push(['時間幅', `下限なし〜${data.upperLimitHours || 0}h`]);
        } else if (data.contractType === '月時（上限なし下限あり）') {
          tableBody.push(['時間幅', `${data.lowerLimitHours || 0}h〜上限なし`]);
        } else if (data.contractType === '月時（完全固定）') {
          tableBody.push(['時間幅', '完全固定']);
        }

        if (data.monthlyCalculatedRates) {
          if (data.monthlyCalculatedRates.overtimeUnitPrice > 0) {
            const overtimeDisplayValue = formatCurrency(data.monthlyCalculatedRates.overtimeUnitPriceWithPremium ?? data.monthlyCalculatedRates.overtimeUnitPrice);
            tableBody.push(['超過単価', overtimeDisplayValue]);
          }
          if (data.monthlyCalculatedRates.deductionUnitPrice > 0) {
            tableBody.push(['控除単価', formatCurrency(data.monthlyCalculatedRates.deductionUnitPrice)]);
          }
          if (data.midnightRate && data.monthlyCalculatedRates?.monthlyMidnight && data.monthlyCalculatedRates.monthlyMidnight > 0) {
            tableBody.push([`深夜手当 (${data.midnightRate})`, formatCurrency(data.monthlyCalculatedRates.monthlyMidnight)]);
          }
          if (data.legalHolidayRate && data.monthlyCalculatedRates?.monthlyLegalHoliday && data.monthlyCalculatedRates.monthlyLegalHoliday > 0) {
            tableBody.push([`法定休日出勤 (${data.legalHolidayRate})`, formatCurrency(data.monthlyCalculatedRates.monthlyLegalHoliday)]);
          }
          if (data.nonLegalHolidayRate && data.monthlyCalculatedRates?.monthlyNonLegalHoliday && data.monthlyCalculatedRates.monthlyNonLegalHoliday > 0) {
            tableBody.push([`法定外休日出勤 (${data.nonLegalHolidayRate})`, formatCurrency(data.monthlyCalculatedRates.monthlyNonLegalHoliday)]);
          }
          if (data.over60HoursRate && data.monthlyCalculatedRates?.monthlyOver60Hours && data.monthlyCalculatedRates.monthlyOver60Hours > 0) {
            tableBody.push([`60時間超過 (${data.over60HoursRate})`, formatCurrency(data.monthlyCalculatedRates.monthlyOver60Hours)]);
          }
        }
      }
    }
    // Add 時給 specific fields
    else if (data.contractType === "時給" && data.hourlyCalculatedRates) {
      tableBody.push(['ご請求単価', `${formatCurrency(data.billingRate)} / 時`]);
      if (data.overtimeRate && data.hourlyCalculatedRates.normalOvertime > 0) tableBody.push([`普通残業 (${data.overtimeRate})`, formatCurrency(data.hourlyCalculatedRates.normalOvertime)]);
      if (data.midnightRate && data.hourlyCalculatedRates.midnight > 0) tableBody.push([`深夜手当 (${data.midnightRate})`, formatCurrency(data.hourlyCalculatedRates.midnight)]);
      if (data.legalHolidayRate && data.hourlyCalculatedRates.legalHoliday > 0) tableBody.push([`法定休日出勤 (${data.legalHolidayRate})`, formatCurrency(data.hourlyCalculatedRates.legalHoliday)]);
      if (data.nonLegalHolidayRate && data.hourlyCalculatedRates.nonLegalHoliday > 0) tableBody.push([`法定外休日出勤 (${data.nonLegalHolidayRate})`, formatCurrency(data.hourlyCalculatedRates.nonLegalHoliday)]);
      if (data.over60HoursRate && data.hourlyCalculatedRates.over60Hours > 0) tableBody.push([`60時間超過 (${data.over60HoursRate})`, formatCurrency(data.hourlyCalculatedRates.over60Hours)]);
    }

    (doc as jsPDF & { lastAutoTable: { finalY: number } }).autoTable({
      startY: tableTop,
      head: tableHeader,
      body: tableBody,
      theme: 'grid',
      styles: {
        font: 'NotoSansJP',
        cellPadding: 2,
      },
      headStyles: {
        font: 'NotoSansJP',
        fontStyle: 'normal', // Set to normal to avoid bold font issues
        fillColor: [230, 230, 230],
        textColor: [50, 50, 50],
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto', halign: 'center' },
      }
    });

    const lastTableY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

    // 6. Special Notes
    let notesTop = lastTableY + 10;
    doc.setFontSize(11);
    doc.text('【特記事項】', margin, notesTop);
    notesTop += 5;

    const settlementTimeText = `精算時間は${data.settlementUnit}分${data.settlementMethod}。`;
    let settlementText = settlementTimeText;
    if (data.contractType !== '月時（完全固定）') {
      settlementText += `精算金額は${data.roundingUnit}円${data.roundingMethod}。`;
    }

    let combinedNotes = `${settlementText}`;

    if (data.showTotalPrice && data.monthlySettings && data.monthlySettings.length > 0) {
      data.monthlySettings.forEach(setting => {
        let formulaText = `\n\n▼ ${setting.yearMonth}の単価計算方法`;
        const br = data.billingRate.toLocaleString();

        if (setting.calculatedRates?.overtimeUnitPrice && setting.calculatedRates.overtimeUnitPrice > 0) {
          let divisorLabel = '';
          switch (data.overtimeUnitPriceCalculationMethod) {
            case '上限割': divisorLabel = `${setting.upperLimitHours}h`; break;
            case '下限割': divisorLabel = `${setting.lowerLimitHours}h`; break;
            case '中央割': divisorLabel = `${(setting.upperLimitHours + setting.lowerLimitHours) / 2}h`; break;
            // case '任意時間割': ...
          }
          let overtimeFormula = `
超過：${br}円 ÷ ${divisorLabel}`;
          const days = setting.workingDaysPerMonth;
          const hours = setting.workingHoursPerDay;
          const upperDiff = setting.upperLimitHourDiff;
          if (
            data.contractType === '月時（上限下限変動あり）' ||
            data.contractType === '月時（上限変動あり、下限変動なし）' ||
            data.contractType === '月時（上限変動なし、下限変動あり）'
          ) {
            overtimeFormula += ` （${setting.variableCalculationType}:${days}日 × ${hours}h`;
            if (upperDiff && Number(upperDiff) > 0) {
              overtimeFormula += ` + ${upperDiff}h`;
            }
            overtimeFormula += '）';
          }
          if (data.overtimePremiumRate && Number(data.overtimePremiumRate) > 0) {
            overtimeFormula += ` × ${data.overtimePremiumRate}`;
          }
          formulaText += overtimeFormula;
        }

        if (setting.calculatedRates?.deductionUnitPrice && setting.calculatedRates.deductionUnitPrice > 0) {
          let divisorLabel = '';
          switch (data.deductionUnitPriceCalculationMethod) {
            case '上限割': divisorLabel = `${setting.upperLimitHours}h`; break;
            case '下限割': divisorLabel = `${setting.lowerLimitHours}h`; break;
            case '中央割': divisorLabel = `${(setting.upperLimitHours + setting.lowerLimitHours) / 2}h`; break;
            // case '任意時間割': ...
          }
          let deductionFormula = `
控除：${br}円 ÷ ${divisorLabel}`;
          const days = setting.workingDaysPerMonth;
          const hours = setting.workingHoursPerDay;
          const lowerDiff = setting.lowerLimitHourDiff;
          if (
            data.contractType === '月時（上限下限変動あり）' ||
            data.contractType === '月時（上限変動あり、下限変動なし）' ||
            data.contractType === '月時（上限変動なし、下限変動あり）'
          ) {
            deductionFormula += ` （${setting.variableCalculationType}:${days}日 × ${hours}h`;
            if (lowerDiff && Number(lowerDiff) > 0) {
              deductionFormula += ` - ${lowerDiff}h`;
            }
            deductionFormula += '）';
          }
          formulaText += deductionFormula;
        }
        combinedNotes += formulaText;
      });
    } else if (data.monthlyCalculationFormula) {
      // Original formula logic
      const formulaLines = data.monthlyCalculationFormula.split('\n');
      const titleLine = formulaLines[0];
      const calculationLines = formulaLines.slice(1);

      combinedNotes += `\n\n${titleLine}`;
      if (calculationLines.length > 0) {
        combinedNotes += `\n${calculationLines.join('\n')}`;
      }
    }
    if (data.specialNotes) {
      combinedNotes += `\n\n${data.specialNotes}`;
    }
    combinedNotes = combinedNotes.trim();
    
doc.setFontSize(9);
    const notesBoxPadding = 4;
    const notesTextWidth = pageW - (margin * 2) - (notesBoxPadding * 2);
    const textLines = doc.splitTextToSize(combinedNotes, notesTextWidth);
    const textHeight = (textLines.length * doc.getLineHeight()) / doc.internal.scaleFactor;
    const boxHeight = textHeight + (notesBoxPadding * 2);

    doc.setDrawColor(180, 180, 180); // Set border color to gray
    doc.rect(margin, notesTop, pageW - (margin * 2), boxHeight);
    doc.text(textLines, margin + notesBoxPadding, notesTop + notesBoxPadding + 2);

    const sanitizeFilename = (name: string) => name.replace(/[/\\?%*:|"<>]/g, '_');
    const formattedContractStartDate = data.contractStartDate.replace(/-/g, '');
    const formattedContractEndDate = data.contractEndDate.replace(/-/g, '');
    const formattedCreationDate = data.creationDate.replace(/-/g, '');

    const filename = `【御見積書】${sanitizeFilename(data.companyName)}御中_${sanitizeFilename(data.staffName)}（${formattedContractStartDate}〜${formattedContractEndDate}）_${formattedCreationDate}.pdf`;

    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('PDFの生成に失敗しました。コンソールを確認してください。');
  }
};