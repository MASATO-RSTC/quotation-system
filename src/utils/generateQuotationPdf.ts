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

    // Issuer Info on the right
    const issuerX = pageW - margin - 70;
    doc.text('【発行元】', issuerX, infoTop - 5);
    const issuerLines = data.contactInfo.split('\n');
    issuerLines.forEach((line, index) => {
        doc.text(line, issuerX, infoTop + (index * 5));
    });
    doc.addImage(sealBase64 as string, 'PNG', pageW - margin - 25, infoTop + 5, 20, 20);

    // 3. Client Info
    const clientTop = infoTop + 25;
    doc.setFontSize(12);
    doc.text(`▪御社名： ${data.companyName} 御中`, margin, clientTop + 10);
    let nextLine = clientTop + 18;
    if (data.departmentName) {
      doc.text(`▪部署名： ${data.departmentName}`, margin, nextLine);
      nextLine += 8;
    }
    if (data.personInCharge) {
      doc.text(`▪ご担当者様： ${data.personInCharge} 様`, margin, nextLine);
      nextLine += 8;
    }

    // 4. Greeting
    doc.setFontSize(11);
    doc.text('下記の通り御見積申し上げます', pageW / 2, nextLine + 5, { align: 'center' });

    // 5. Details Table
    let tableTop = nextLine + 15;
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
      tableBody.push(['月給単価', formatCurrency(data.billingRate)]);
      
      // 時間幅
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
        // 超過単価
        const hasOvertime = data.contractType === '月時（上限あり下限あり）' || data.contractType === '月時（上限あり下限なし）' || data.contractType === '月時（上限下限変動あり）' || data.contractType === '月時（上限変動あり、下限変動なし）' || data.contractType === '月時（上限変動なし、下限変動あり）';
        if (hasOvertime && data.monthlyCalculatedRates.overtimeUnitPrice > 0) {
            let overtimeDisplayValue;
            if (data.contractType === '月時（上限下限変動あり）') {
                if (data.monthlyCalculatedRates.overtimeUnitPriceWithPremium !== undefined && data.monthlyCalculatedRates.overtimeUnitPriceWithPremium > 0) {
                    overtimeDisplayValue = formatCurrency(data.monthlyCalculatedRates.overtimeUnitPriceWithPremium);
                } else {
                    overtimeDisplayValue = formatCurrency(data.monthlyCalculatedRates.overtimeUnitPrice);
                }
            } else {
                overtimeDisplayValue = formatCurrency(data.monthlyCalculatedRates.overtimeUnitPrice);
                if (data.monthlyCalculatedRates.overtimeUnitPriceWithPremium !== undefined && data.monthlyCalculatedRates.overtimeUnitPriceWithPremium > 0) {
                    overtimeDisplayValue = `${formatCurrency(data.monthlyCalculatedRates.overtimeUnitPriceWithPremium)} (${formatCurrency(data.monthlyCalculatedRates.overtimeUnitPrice)})`;
                }
            }
            tableBody.push(['超過単価', overtimeDisplayValue]);
        }
        
        // 控除単価
        const hasDeduction = data.contractType === '月時（上限あり下限あり）' || data.contractType === '月時（上限なし下限あり）' || data.contractType === '月時（上限下限変動あり）' || data.contractType === '月時（上限変動あり、下限変動なし）' || data.contractType === '月時（上限変動なし、下限変動あり）';
        if (hasDeduction && data.monthlyCalculatedRates.deductionUnitPrice > 0) {
            tableBody.push(['控除単価', formatCurrency(data.monthlyCalculatedRates.deductionUnitPrice)]);
        }

        if (data.monthlyCalculatedRates.monthlyMidnight) {
          tableBody.push(['深夜手当', formatCurrency(data.monthlyCalculatedRates.monthlyMidnight)]);
        }
        if (data.monthlyCalculatedRates.monthlyLegalHoliday) {
          tableBody.push(['法定休日出勤', formatCurrency(data.monthlyCalculatedRates.monthlyLegalHoliday)]);
        }
        if (data.monthlyCalculatedRates.monthlyNonLegalHoliday) {
          tableBody.push(['法定外休日出勤', formatCurrency(data.monthlyCalculatedRates.monthlyNonLegalHoliday)]);
        }
        if (data.monthlyCalculatedRates.monthlyOver60Hours) {
          tableBody.push(['60時間超過', formatCurrency(data.monthlyCalculatedRates.monthlyOver60Hours)]);
        }
      }
    }
    // Add 時給 specific fields
    else if (data.contractType === "時給" && data.hourlyCalculatedRates) {
      tableBody.push(['ご請求単価', `${formatCurrency(data.billingRate)} / 時`]);
      tableBody.push(['普通残業', formatCurrency(data.hourlyCalculatedRates.normalOvertime)]);
      tableBody.push(['深夜手当（0.25）', formatCurrency(data.hourlyCalculatedRates.midnight)]);
      tableBody.push(['法定休日出勤', formatCurrency(data.hourlyCalculatedRates.legalHoliday)]);
      tableBody.push(['法定外休日出勤', formatCurrency(data.hourlyCalculatedRates.nonLegalHoliday)]);
      tableBody.push(['60時間超過', formatCurrency(data.hourlyCalculatedRates.over60Hours)]);
    }

    (doc as any).autoTable({
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

    const lastTableY = (doc as any).lastAutoTable.finalY;

    // 6. Special Notes
    let notesTop = lastTableY + 10;
    doc.setFontSize(12);
    doc.text('【特記事項】', margin, notesTop);
    notesTop += 5;

    const settlementTimeText = `精算時間は${data.settlementUnit}分${data.settlementMethod}。`;
    let settlementText = settlementTimeText;
    if (data.contractType !== '月時（完全固定）') {
      settlementText += `精算金額は${data.roundingUnit}円${data.roundingMethod}。`;
    }

    let combinedNotes = `${settlementText}`;
    if (data.monthlyCalculationFormula) {
      let formulaText = data.monthlyCalculationFormula;
      let diffText = '';
      if (data.upperLimitHoursDiff !== undefined && data.upperLimitHoursDiff !== null) {
        diffText += ` 上限+${data.upperLimitHoursDiff}h`;
      }
      if (data.lowerLimitHoursDiff !== undefined && data.lowerLimitHoursDiff !== null) {
        diffText += ` 下限-${Math.abs(data.lowerLimitHoursDiff)}h`;
      }
      if (diffText) {
        formulaText = formulaText.replace(/（([^）]*)）/, `（$1${diffText}）`);
      }
      combinedNotes += `\n\n${formulaText}`;
    }
    if (data.specialNotes) {
      combinedNotes += `\n\n${data.specialNotes}`;
    }
    combinedNotes = combinedNotes.trim();
    
    doc.setFontSize(10);
    const boxPadding = 4;
    const textWidth = pageW - (margin * 2) - (boxPadding * 2);
    const textLines = doc.splitTextToSize(combinedNotes, textWidth);
    const textHeight = (textLines.length * doc.getLineHeight()) / doc.internal.scaleFactor;
    const boxHeight = textHeight + (boxPadding * 2);

    doc.setDrawColor(180, 180, 180); // Set border color to gray
    doc.rect(margin, notesTop, pageW - (margin * 2), boxHeight);
    doc.text(textLines, margin + boxPadding, notesTop + boxPadding + 2);

    doc.save('御見積書.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('PDFの生成に失敗しました。コンソールを確認してください。');
  }
};