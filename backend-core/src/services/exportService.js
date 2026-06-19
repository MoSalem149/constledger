import ExcelJS from "exceljs";
import { decimalToNumber, roundMoney } from "./planningService.js";

const COLORS = {
  headerBg: "1F3864",
  headerFg: "FFFFFF",
  subHeaderBg: "2E75B6",
  subHeaderFg: "FFFFFF",
  accentBg: "D6E4F0",
  rowAlt: "F2F7FB",
  totalBg: "E2EFDA",
  totalFg: "1E5631",
  warningBg: "FFF2CC",
  warningFg: "7B5800",
  labelFg: "44546A",
  border: "B8CCE4",
};

const FONT_NAME = "Arial";

const style = {
  mainHeader: {
    font: { name: FONT_NAME, bold: true, size: 14, color: { argb: COLORS.headerFg } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } },
    alignment: { horizontal: "left", vertical: "middle" },
  },
  metaLabel: {
    font: { name: FONT_NAME, bold: true, size: 10, color: { argb: COLORS.labelFg } },
    alignment: { horizontal: "left", vertical: "middle" },
  },
  metaValue: {
    font: { name: FONT_NAME, size: 10 },
    alignment: { horizontal: "left", vertical: "middle" },
  },
  colHeader: {
    font: { name: FONT_NAME, bold: true, size: 10, color: { argb: COLORS.subHeaderFg } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.subHeaderBg } },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
    border: {
      bottom: { style: "medium", color: { argb: COLORS.headerBg } },
    },
  },
  rowNormal: {
    font: { name: FONT_NAME, size: 10 },
    alignment: { vertical: "middle" },
  },
  rowAlt: {
    font: { name: FONT_NAME, size: 10 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.rowAlt } },
    alignment: { vertical: "middle" },
  },
  totalRow: {
    font: { name: FONT_NAME, bold: true, size: 10, color: { argb: COLORS.totalFg } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.totalBg } },
    alignment: { vertical: "middle" },
    border: {
      top: { style: "medium", color: { argb: COLORS.totalFg } },
      bottom: { style: "double", color: { argb: COLORS.totalFg } },
    },
  },
  warningHeader: {
    font: { name: FONT_NAME, bold: true, size: 10, color: { argb: COLORS.warningFg } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.warningBg } },
    alignment: { horizontal: "left", vertical: "middle" },
  },
  warningRow: {
    font: { name: FONT_NAME, size: 10, color: { argb: COLORS.warningFg } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.warningBg } },
    alignment: { vertical: "middle", wrapText: true },
  },
};

const applyStyle = (row, styleDef) => {
  row.eachCell({ includeEmpty: true }, (cell) => {
    if (styleDef.font) cell.font = styleDef.font;
    if (styleDef.fill) cell.fill = styleDef.fill;
    if (styleDef.alignment) cell.alignment = styleDef.alignment;
    if (styleDef.border) {
      cell.border = {
        ...cell.border,
        ...styleDef.border,
      };
    }
  });
};

const addThinBorder = (row, colCount) => {
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.border = {
      ...cell.border,
      left: c === 1 ? { style: "thin", color: { argb: COLORS.border } } : undefined,
      right: { style: "thin", color: { argb: COLORS.border } },
      bottom: { style: "thin", color: { argb: COLORS.border } },
    };
  }
};

export const createFinancePlanWorkbook = (contract, result) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CPMS Finance Module";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Finance Plan", {
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    },
    headerFooter: {
      oddHeader: `&L&B${contract.name || "Finance Plan"}&R&BPage &P of &N`,
      oddFooter: `&LGenerated: ${new Date().toLocaleDateString()}&RConfidential`,
    },
    views: [{ state: "frozen", xSplit: 0, ySplit: 9 }],
  });

  ws.columns = [
    { key: "periodLabel", width: 22 },
    { key: "periodStart", width: 14 },
    { key: "periodEnd", width: 14 },
    { key: "plannedAmount", width: 20 },
    { key: "cumulativePlanned", width: 20 },
    { key: "pctOfTotal", width: 14 },
  ];

  const COL_COUNT = 6;
  const currency = contract.currency || "EGP";
  const currencyFmt = `#,##0.00 "${currency}";(#,##0.00 "${currency}");"-"`;
  const pctFmt = "0.0%";

  ws.mergeCells(1, 1, 1, COL_COUNT);
  const titleCell = ws.getCell("A1");
  titleCell.value = contract.name || "Finance Plan";
  ws.getRow(1).height = 32;
  applyStyle(ws.getRow(1), style.mainHeader);

  const totalAmount = roundMoney(decimalToNumber(result.plan.totalAmount));
  const meta = [
    ["Reporting Period", contract.reporting_period || "—"],
    ["Strategy", result.plan.strategy],
    ["Generated At", result.plan.generatedAt?.toISOString().slice(0, 10) || "—"],
    ["Total Contract Value", totalAmount],
    ["Number of Periods", result.periods.length],
  ];

  meta.forEach(([label, value], index) => {
    const rowNum = index + 2;
    ws.getRow(rowNum).height = 18;

    const labelCell = ws.getRow(rowNum).getCell(1);
    labelCell.value = label;
    Object.assign(labelCell, {
      font: style.metaLabel.font,
      alignment: style.metaLabel.alignment,
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.accentBg } },
    });

    ws.mergeCells(rowNum, 2, rowNum, COL_COUNT);
    const valueCell = ws.getRow(rowNum).getCell(2);
    valueCell.value = value;
    Object.assign(valueCell, {
      font: style.metaValue.font,
      alignment: style.metaValue.alignment,
    });

    if (label === "Total Contract Value") {
      valueCell.numFmt = currencyFmt;
      valueCell.font = { ...style.metaValue.font, bold: true };
    }
  });

  ws.getRow(7).height = 8;
  ws.mergeCells(8, 1, 8, COL_COUNT);
  const sectionCell = ws.getCell("A8");
  sectionCell.value = "Payment Schedule";
  ws.getRow(8).height = 20;
  applyStyle(ws.getRow(8), style.mainHeader);

  const headerRow = ws.getRow(9);
  headerRow.values = [
    "Period",
    "Start Date",
    "End Date",
    `Planned Amount (${currency})`,
    `Cumulative (${currency})`,
    "% of Total",
  ];
  headerRow.height = 30;
  applyStyle(headerRow, style.colHeader);

  const dataStartRow = 10;
  result.periods.forEach((period, index) => {
    const rowNum = dataStartRow + index;
    const plannedAmt = roundMoney(decimalToNumber(period.plannedAmount));
    const cumulative = roundMoney(decimalToNumber(period.cumulativePlanned));
    const pct = totalAmount > 0 ? plannedAmt / totalAmount : 0;

    const row = ws.getRow(rowNum);
    row.values = [
      period.periodLabel,
      period.periodStart?.toISOString().slice(0, 10) || "",
      period.periodEnd?.toISOString().slice(0, 10) || "",
      plannedAmt,
      cumulative,
      pct,
    ];
    row.height = 18;

    const isAlt = index % 2 === 1;
    applyStyle(row, isAlt ? style.rowAlt : style.rowNormal);
    addThinBorder(row, COL_COUNT);

    row.getCell(2).numFmt = "yyyy-mm-dd";
    row.getCell(3).numFmt = "yyyy-mm-dd";
    row.getCell(4).numFmt = currencyFmt;
    row.getCell(5).numFmt = currencyFmt;
    row.getCell(6).numFmt = pctFmt;

    row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
    row.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
    row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
  });

  const totalRowNum = dataStartRow + result.periods.length;
  const totalRow = ws.getRow(totalRowNum);
  totalRow.values = ["TOTAL", "", "", totalAmount, totalAmount, "100.0%"];
  totalRow.height = 22;
  applyStyle(totalRow, style.totalRow);

  totalRow.getCell(4).numFmt = currencyFmt;
  totalRow.getCell(5).numFmt = currencyFmt;
  totalRow.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
  totalRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
  totalRow.getCell(6).alignment = { horizontal: "center", vertical: "middle" };

  if (result.plan.warnings?.length > 0) {
    const warnStartRow = totalRowNum + 2;
    ws.mergeCells(warnStartRow, 1, warnStartRow, COL_COUNT);
    const warnTitle = ws.getCell(warnStartRow, 1);
    warnTitle.value = "Warnings";
    ws.getRow(warnStartRow).height = 20;
    applyStyle(ws.getRow(warnStartRow), style.warningHeader);

    result.plan.warnings.forEach((warning, i) => {
      const wRow = ws.getRow(warnStartRow + 1 + i);
      wRow.getCell(1).value = warning.code;
      wRow.getCell(1).font = { ...style.warningRow.font, bold: true };
      ws.mergeCells(warnStartRow + 1 + i, 2, warnStartRow + 1 + i, COL_COUNT);
      wRow.getCell(2).value = warning.message;
      applyStyle(wRow, style.warningRow);
      wRow.height = 18;
    });
  }

  ws.autoFilter = {
    from: { row: 9, column: 1 },
    to: { row: dataStartRow + result.periods.length - 1, column: COL_COUNT },
  };

  return workbook;
};