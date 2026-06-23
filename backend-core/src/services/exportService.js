import ExcelJS from "exceljs";
import { decimalToNumber, roundMoney } from "./planningService.js";

// Shared palette — all workbooks pull colors from here so reports stay visually consistent.
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

// Centralized style dictionary used by every workbook builder via applyStyle()
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

// Apply a style object to every cell in a row, preserving any per-cell borders.
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

// PUBLIC — workbook for GET /api/finance/:contractId/plan/export.
// Single sheet: title + meta block, period table, total row, optional warnings.
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

  // Excel number-format string — positive | negative | zero(dash). Used for all money cells.
  const currencyFmt = `#,##0.00 "${currency}";(#,##0.00 "${currency}");"-"`;
  const pctFmt = "0.0%";

  // Title row
  ws.mergeCells(1, 1, 1, COL_COUNT);
  const titleCell = ws.getCell("A1");
  titleCell.value = contract.name || "Finance Plan";
  ws.getRow(1).height = 32;
  applyStyle(ws.getRow(1), style.mainHeader);

  const totalAmount = roundMoney(decimalToNumber(result.plan.totalAmount));

  // Metadata block (rows 2-6)
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

  // Spacer + section header
  ws.getRow(7).height = 8;
  ws.mergeCells(8, 1, 8, COL_COUNT);
  const sectionCell = ws.getCell("A8");
  sectionCell.value = "Payment Schedule";
  ws.getRow(8).height = 20;
  applyStyle(ws.getRow(8), style.mainHeader);

  // Column header row (frozen — see ySplit above)
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

  // Period rows — alternating fill, money + date formatting, alignment per column
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

  // Total row
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

  // Warning block — only rendered if the plan carries any warnings
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

  // Enable the column-header dropdown filter over the data range
  ws.autoFilter = {
    from: { row: 9, column: 1 },
    to: { row: dataStartRow + result.periods.length - 1, column: COL_COUNT },
  };

  return workbook;
};

// PUBLIC — workbook for GET /api/reports/planned-budget/export. One sheet per
// year-scoped budget (title, meta, period rows, year total).
export const createPlannedBudgetWorkbook = (report) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CPMS Reports Module";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Planned Budget", {
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    },
    headerFooter: {
      oddHeader: `&L&B${report.contract.name}&R&BPage &P of &N`,
      oddFooter: `&LPlanned Budget Report \u2014 ${report.year}&RConfidential`,
    },
    views: [{ state: "frozen", xSplit: 0, ySplit: 11 }],
  });

  ws.columns = [
    { key: "periodLabel", width: 22 },
    { key: "periodStart", width: 14 },
    { key: "periodEnd", width: 14 },
    { key: "plannedAmount", width: 22 },
    { key: "cumulativePlanned", width: 24 },
    { key: "percentageOfContract", width: 18 },
  ];

  const colCount = 6;
  const currency = report.contract.currency || "EGP";
  const currencyFmt = `#,##0.00 "${currency}";(#,##0.00 "${currency}");"-"`;
  const pctFmt = "0.00%";

  ws.mergeCells(1, 1, 1, colCount);
  ws.getCell("A1").value = `Planned Budget Report \u2014 ${report.year}`;
  ws.getRow(1).height = 32;
  applyStyle(ws.getRow(1), style.mainHeader);

  const meta = [
    ["Contract", report.contract.name],
    ["Contract Number", report.contract.contractNumber || "—"],
    ["Contract Period", `${report.contract.startDate || "—"} to ${report.contract.endDate || "—"}`],
    ["Plan Strategy", report.plan.strategy],
    ["Plan Status", report.plan.status],
    ["Contract Value", report.contract.contractValue],
    ["Selected Year Total", report.yearlyPlannedTotal],
    ["Periods in Year", report.periodCount],
  ];

  meta.forEach(([label, value], index) => {
    const rowNum = index + 2;
    const row = ws.getRow(rowNum);
    row.height = 18;

    const labelCell = row.getCell(1);
    labelCell.value = label;
    labelCell.font = style.metaLabel.font;
    labelCell.alignment = style.metaLabel.alignment;
    labelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.accentBg },
    };

    ws.mergeCells(rowNum, 2, rowNum, colCount);
    const valueCell = row.getCell(2);
    valueCell.value = value;
    valueCell.font = style.metaValue.font;
    valueCell.alignment = style.metaValue.alignment;

    if (label === "Contract Value" || label === "Selected Year Total") {
      valueCell.numFmt = currencyFmt;
      valueCell.font = { ...style.metaValue.font, bold: true };
    }
  });

  // Column header row (frozen)
  const headerRowNum = 11;
  const headerRow = ws.getRow(headerRowNum);
  headerRow.values = [
    "Period",
    "Start Date",
    "End Date",
    `Planned Amount (${currency})`,
    `Contract Cumulative (${currency})`,
    "% of Contract",
  ];
  headerRow.height = 30;
  applyStyle(headerRow, style.colHeader);

  // Period rows
  const dataStartRow = headerRowNum + 1;
  report.periods.forEach((period, index) => {
    const row = ws.getRow(dataStartRow + index);
    row.values = [
      period.periodLabel,
      period.periodStart ? new Date(period.periodStart) : null,
      period.periodEnd ? new Date(period.periodEnd) : null,
      period.plannedAmount,
      period.cumulativePlanned,
      period.percentageOfContract / 100,
    ];
    row.height = 18;

    applyStyle(row, index % 2 === 1 ? style.rowAlt : style.rowNormal);
    addThinBorder(row, colCount);

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

  // Year-total row
  const totalRow = ws.getRow(dataStartRow + report.periods.length);
  totalRow.values = [
    `YEAR ${report.year} TOTAL`,
    "",
    "",
    report.yearlyPlannedTotal,
    "",
    report.yearlyPercentageOfContract / 100,
  ];
  totalRow.height = 22;
  applyStyle(totalRow, style.totalRow);
  totalRow.getCell(4).numFmt = currencyFmt;
  totalRow.getCell(6).numFmt = pctFmt;
  totalRow.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
  totalRow.getCell(6).alignment = { horizontal: "center", vertical: "middle" };

  ws.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: {
      row: Math.max(headerRowNum, dataStartRow + report.periods.length - 1),
      column: colCount,
    },
  };

  return workbook;
};

// Internal helper — every reports workbook starts with one of these sheets.
const createReportWorksheet = (workbook, name, title, columnCount, options = {}) =>
  workbook.addWorksheet(name, {
    pageSetup: {
      paperSize: 9,
      orientation: options.orientation || "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    },
    headerFooter: {
      oddHeader: `&L&B${title}&R&BPage &P of &N`,
      oddFooter: "&LCPMS Reports Module&RConfidential",
    },
    views: [{ state: "frozen", xSplit: 0, ySplit: options.freezeRow || 1 }],
    properties: { defaultRowHeight: 18 },
    pageMargins: undefined,
    columnCount,
  });

const addReportTitle = (ws, title, columnCount) => {
  ws.mergeCells(1, 1, 1, columnCount);
  ws.getCell(1, 1).value = title;
  ws.getRow(1).height = 32;
  applyStyle(ws.getRow(1), style.mainHeader);
};

const addMetadataRows = (ws, entries, columnCount, startRow = 2) => {
  entries.forEach(([label, value], index) => {
    const rowNum = startRow + index;
    const row = ws.getRow(rowNum);
    row.height = 18;
    const labelCell = row.getCell(1);
    labelCell.value = label;
    labelCell.font = style.metaLabel.font;
    labelCell.alignment = style.metaLabel.alignment;
    labelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.accentBg },
    };
    ws.mergeCells(rowNum, 2, rowNum, columnCount);
    const valueCell = row.getCell(2);
    valueCell.value = value;
    valueCell.font = style.metaValue.font;
    valueCell.alignment = style.metaValue.alignment;
  });
};

const formatDateCell = (cell) => {
  cell.numFmt = "yyyy-mm-dd";
  cell.alignment = { horizontal: "center", vertical: "middle" };
};

// PUBLIC — workbook for GET /api/reports/contracts/export. Title, filter meta,
// per-currency totals summary, then full contract table.
export const createAllContractsWorkbook = (report) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CPMS Reports Module";
  workbook.created = new Date();

  const columnCount = 10;
  const totalsStartRow = 6;

  // Table header row position depends on how many currency totals we render
  const tableHeaderRow =
    totalsStartRow + Math.max(report.totalsByCurrency.length, 1) + 2;
  const ws = createReportWorksheet(
    workbook,
    "All Contracts",
    "All Contracts Report",
    columnCount,
    { freezeRow: tableHeaderRow },
  );

  ws.columns = [
    { width: 17 },
    { width: 28 },
    { width: 17 },
    { width: 16 },
    { width: 18 },
    { width: 30 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
  ];

  addReportTitle(ws, "All Contracts Report", columnCount);
  addMetadataRows(
    ws,
    [
      ["Year", report.filters.year ?? "All years"],
      ["Status", report.filters.status ?? "All statuses"],
      ["Contract Count", report.contractCount],
    ],
    columnCount,
  );

  // Per-currency totals block
  const totalsHeader = ws.getRow(totalsStartRow);
  totalsHeader.values = ["Currency", "Contract Count", "Total Contract Value"];
  applyStyle(totalsHeader, style.colHeader);

  if (report.totalsByCurrency.length === 0) {
    const row = ws.getRow(totalsStartRow + 1);
    row.values = ["No contracts", 0, 0];
    applyStyle(row, style.rowNormal);
    addThinBorder(row, 3);
  } else {
    report.totalsByCurrency.forEach((total, index) => {
      const row = ws.getRow(totalsStartRow + 1 + index);
      row.values = [total.currency, total.contractCount, total.totalValue];
      applyStyle(row, index % 2 ? style.rowAlt : style.rowNormal);
      addThinBorder(row, 3);
      row.getCell(3).numFmt = '#,##0.00';
    });
  }

  // Main contracts table
  const header = ws.getRow(tableHeaderRow);
  header.values = [
    "Contract Number",
    "Contract Name",
    "Value",
    "Currency",
    "Status",
    "Parties",
    "Start Date",
    "End Date",
    "Duration (Days)",
    "Reporting Period",
  ];
  header.height = 30;
  applyStyle(header, style.colHeader);

  const dataStartRow = tableHeaderRow + 1;
  report.contracts.forEach((contract, index) => {
    const row = ws.getRow(dataStartRow + index);
    row.values = [
      contract.contractNumber || "",
      contract.name,
      contract.contractValue,
      contract.currency,
      contract.status,
      // Parties rendered as "Name (Role); Name (Role)" — wrapped in cell
      contract.parties
        .map((party) =>
          party.role ? `${party.name || "Unnamed"} (${party.role})` : party.name,
        )
        .filter(Boolean)
        .join("; "),
      contract.startDate ? new Date(`${contract.startDate}T00:00:00.000Z`) : null,
      contract.endDate ? new Date(`${contract.endDate}T00:00:00.000Z`) : null,
      contract.durationDays,
      contract.reportingPeriod || "",
    ];
    applyStyle(row, index % 2 ? style.rowAlt : style.rowNormal);
    addThinBorder(row, columnCount);
    row.getCell(3).numFmt = "#,##0.00";
    formatDateCell(row.getCell(7));
    formatDateCell(row.getCell(8));
    row.getCell(6).alignment = { vertical: "middle", wrapText: true };
  });

  ws.autoFilter = {
    from: { row: tableHeaderRow, column: 1 },
    to: {
      row: Math.max(tableHeaderRow, dataStartRow + report.contracts.length - 1),
      column: columnCount,
    },
  };

  return workbook;
};

// Internal — shared "Payment Schedule" sheet used by both the standalone
// payment schedule workbook AND the project summary workbook.
const addPaymentScheduleSheet = (
  workbook,
  report,
  sheetName = "Payment Schedule",
) => {
  const columnCount = 8;
  const currency = report.contract.currency || report.schedule.currency || "EGP";
  const currencyFmt = `#,##0.00 "${currency}";(#,##0.00 "${currency}");"-"`;
  const headerRowNum = 9;
  const ws = createReportWorksheet(
    workbook,
    sheetName,
    `${report.contract.name} - Payment Schedule`,
    columnCount,
    { freezeRow: headerRowNum },
  );

  ws.columns = [
    { width: 10 },
    { width: 22 },
    { width: 14 },
    { width: 14 },
    { width: 20 },
    { width: 21 },
    { width: 15 },
    { width: 38 },
  ];
  addReportTitle(ws, "Payment Schedule Report", columnCount);
  addMetadataRows(
    ws,
    [
      ["Contract", report.contract.name],
      ["Contract Number", report.contract.contractNumber || "—"],
      ["Strategy", report.plan.strategy],
      ["Plan Status", report.plan.status],
      ["Currency", currency],
      ["Total Amount", report.schedule.totalAmount],
    ],
    columnCount,
  );
  ws.getCell(7, 2).numFmt = currencyFmt;

  const header = ws.getRow(headerRowNum);
  header.values = [
    "Payment #",
    "Period",
    "Period Start",
    "Due Date",
    `Amount (${currency})`,
    `Cumulative (${currency})`,
    "% of Total",
    "Description",
  ];
  header.height = 30;
  applyStyle(header, style.colHeader);

  const dataStartRow = headerRowNum + 1;
  report.schedule.payments.forEach((payment, index) => {
    const row = ws.getRow(dataStartRow + index);
    row.values = [
      payment.paymentNumber,
      payment.periodLabel,
      payment.periodStart ? new Date(payment.periodStart) : null,
      payment.dueDate ? new Date(payment.dueDate) : null,
      payment.amount,
      payment.cumulativePayment,
      payment.pctOfTotal,
      payment.description,
    ];
    applyStyle(row, index % 2 ? style.rowAlt : style.rowNormal);
    addThinBorder(row, columnCount);
    formatDateCell(row.getCell(3));
    formatDateCell(row.getCell(4));
    row.getCell(5).numFmt = currencyFmt;
    row.getCell(6).numFmt = currencyFmt;
    row.getCell(7).numFmt = "0.00%";
    row.getCell(8).alignment = { vertical: "middle", wrapText: true };
  });

  // Total row
  const totalRow = ws.getRow(dataStartRow + report.schedule.payments.length);
  totalRow.values = [
    "TOTAL",
    "",
    "",
    "",
    report.schedule.totalAmount,
    report.schedule.totalAmount,
    report.schedule.totalAmount > 0 ? 1 : 0,
    "",
  ];
  applyStyle(totalRow, style.totalRow);
  totalRow.getCell(5).numFmt = currencyFmt;
  totalRow.getCell(6).numFmt = currencyFmt;
  totalRow.getCell(7).numFmt = "0.00%";

  ws.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: {
      row: Math.max(
        headerRowNum,
        dataStartRow + report.schedule.payments.length - 1,
      ),
      column: columnCount,
    },
  };
  return ws;
};

// PUBLIC — workbook for GET /api/reports/payment-schedule/export
export const createPaymentScheduleWorkbook = (report) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CPMS Reports Module";
  workbook.created = new Date();
  addPaymentScheduleSheet(workbook, report);
  return workbook;
};

// Internal — "Plan Periods" sheet used inside the project summary workbook
const addPlanPeriodsSheet = (workbook, report) => {
  const columnCount = 6;
  const currency = report.contract.currency || "EGP";
  const currencyFmt = `#,##0.00 "${currency}";(#,##0.00 "${currency}");"-"`;
  const headerRowNum = 7;
  const ws = createReportWorksheet(
    workbook,
    "Plan Periods",
    `${report.contract.name} - Plan Periods`,
    columnCount,
    { freezeRow: headerRowNum },
  );
  ws.columns = [
    { width: 22 },
    { width: 14 },
    { width: 14 },
    { width: 21 },
    { width: 23 },
    { width: 15 },
  ];
  addReportTitle(ws, "Finance Plan Periods", columnCount);
  addMetadataRows(
    ws,
    [
      ["Contract", report.contract.name],
      ["Strategy", report.plan.strategy],
      ["Plan Status", report.plan.status],
      ["Total Amount", report.plan.totalAmount],
    ],
    columnCount,
  );
  ws.getCell(5, 2).numFmt = currencyFmt;

  const header = ws.getRow(headerRowNum);
  header.values = [
    "Period",
    "Start Date",
    "End Date",
    `Planned Amount (${currency})`,
    `Cumulative (${currency})`,
    "% of Contract",
  ];
  applyStyle(header, style.colHeader);
  header.height = 30;

  const dataStartRow = headerRowNum + 1;
  report.periods.forEach((period, index) => {
    const row = ws.getRow(dataStartRow + index);
    row.values = [
      period.periodLabel,
      period.periodStart ? new Date(period.periodStart) : null,
      period.periodEnd ? new Date(period.periodEnd) : null,
      period.plannedAmount,
      period.cumulativePlanned,
      report.contract.contractValue > 0
        ? period.plannedAmount / report.contract.contractValue
        : 0,
    ];
    applyStyle(row, index % 2 ? style.rowAlt : style.rowNormal);
    addThinBorder(row, columnCount);
    formatDateCell(row.getCell(2));
    formatDateCell(row.getCell(3));
    row.getCell(4).numFmt = currencyFmt;
    row.getCell(5).numFmt = currencyFmt;
    row.getCell(6).numFmt = "0.00%";
  });

  const totalRow = ws.getRow(dataStartRow + report.periods.length);
  totalRow.values = [
    "TOTAL",
    "",
    "",
    report.plan.totalAmount,
    report.plan.totalAmount,
    report.plan.totalAmount > 0 ? 1 : 0,
  ];
  applyStyle(totalRow, style.totalRow);
  totalRow.getCell(4).numFmt = currencyFmt;
  totalRow.getCell(5).numFmt = currencyFmt;
  totalRow.getCell(6).numFmt = "0.00%";
  ws.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: {
      row: Math.max(headerRowNum, dataStartRow + report.periods.length - 1),
      column: columnCount,
    },
  };
  return ws;
};

// PUBLIC — workbook for GET /api/reports/project/:id/summary/export.
// Three sheets: Summary & KPIs, Plan Periods, Payment Schedule.
export const createProjectSummaryWorkbook = (report) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CPMS Reports Module";
  workbook.created = new Date();

  const columnCount = 6;
  const currency = report.contract.currency || "EGP";
  const currencyFmt = `#,##0.00 "${currency}";(#,##0.00 "${currency}");"-"`;

  // Sheet 1 — Summary & KPIs
  const summary = createReportWorksheet(
    workbook,
    "Summary & KPIs",
    `${report.contract.name} - Project Summary`,
    columnCount,
    { orientation: "portrait", freezeRow: 1 },
  );
  summary.columns = [
    { width: 24 },
    { width: 24 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];
  addReportTitle(summary, "Project Summary Report", columnCount);
  addMetadataRows(
    summary,
    [
      ["Contract", report.contract.name],
      ["Contract Number", report.contract.contractNumber || "—"],
      ["Status", report.contract.status],
      ["Contract Period", `${report.contract.startDate || "—"} to ${report.contract.endDate || "—"}`],
      ["Contract Value", report.contract.contractValue],
      ["Currency", currency],
      ["Reporting Period", report.contract.reportingPeriod || "—"],
      ["Plan Strategy", report.plan.strategy],
      ["Plan Status", report.plan.status],
      ["Plan Generated At", report.plan.generatedAt || "—"],
      ["Peak Cash Requirement", report.kpis.peakCash],
      ["Burn Rate", report.kpis.burnRate],
      ["Payment Count", report.paymentSchedule.paymentCount],
    ],
    columnCount,
  );
  // Currency-format the money rows (Contract Value, Peak Cash, Burn Rate)
  summary.getCell(6, 2).numFmt = currencyFmt;
  summary.getCell(12, 2).numFmt = currencyFmt;
  summary.getCell(13, 2).numFmt = currencyFmt;

  // Optional warnings block at the bottom of the summary sheet
  if (report.plan.warnings.length > 0) {
    const warningHeaderRow = 16;
    summary.mergeCells(warningHeaderRow, 1, warningHeaderRow, columnCount);
    summary.getCell(warningHeaderRow, 1).value = "Plan Warnings";
    applyStyle(summary.getRow(warningHeaderRow), style.warningHeader);
    report.plan.warnings.forEach((warning, index) => {
      const row = summary.getRow(warningHeaderRow + 1 + index);
      row.getCell(1).value = warning.code;
      summary.mergeCells(
        warningHeaderRow + 1 + index,
        2,
        warningHeaderRow + 1 + index,
        columnCount,
      );
      row.getCell(2).value = warning.message;
      applyStyle(row, style.warningRow);
    });
  }

  // Sheets 2 & 3
  addPlanPeriodsSheet(workbook, report);
  addPaymentScheduleSheet(
    workbook,
    {
      contract: report.contract,
      plan: report.plan,
      schedule: report.paymentSchedule,
    },
  );
  return workbook;
};
