import {
  createAllContractsWorkbook,
  createPaymentScheduleWorkbook,
  createPlannedBudgetWorkbook,
  createProjectSummaryWorkbook,
} from "../services/exportService.js";
import {
  getAllContractsReport,
  getPaymentScheduleReport,
  getPlannedBudgetReport,
  getProjectSummaryReport,
  ReportError,
} from "../services/reportingService.js";

// reportingService throws typed ReportError instances carrying their own HTTP
// status code; this helper forwards them to the client uniformly.
const sendReportError = (res, err) => {
  if (!(err instanceof ReportError)) return false;

  res.status(err.statusCode).json({
    code: err.code,
    message: err.message,
  });
  return true;
};

// Common XLSX response — sets content-type and attachment headers and writes the workbook.
const sendWorkbook = async (res, workbook, filename) => {
  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  return res.send(buffer);
};

// GET /api/reports/contracts — filters ?year & ?status
export const allContractsReport = async (req, res, next) => {
  try {
    const report = await getAllContractsReport(req.query.year, req.query.status);
    return res.json(report);
  } catch (err) {
    if (sendReportError(res, err)) return;
    next(err);
  }
};

// GET /api/reports/contracts/export
export const exportAllContractsReport = async (req, res, next) => {
  try {
    const report = await getAllContractsReport(req.query.year, req.query.status);
    const year = report.filters.year ?? "all";
    const status = report.filters.status ?? "all";
    return sendWorkbook(
      res,
      createAllContractsWorkbook(report),
      `all-contracts-${year}-${status}.xlsx`,
    );
  } catch (err) {
    if (sendReportError(res, err)) return;
    next(err);
  }
};

// GET /api/reports/planned-budget — requires ?contractId & ?year
export const plannedBudgetReport = async (req, res, next) => {
  try {
    const report = await getPlannedBudgetReport(
      req.query.contractId,
      req.query.year,
    );
    return res.json(report);
  } catch (err) {
    if (sendReportError(res, err)) return;
    next(err);
  }
};

// GET /api/reports/planned-budget/export
export const exportPlannedBudgetReport = async (req, res, next) => {
  try {
    const report = await getPlannedBudgetReport(
      req.query.contractId,
      req.query.year,
    );
    const workbook = createPlannedBudgetWorkbook(report);
    return sendWorkbook(
      res,
      workbook,
      `planned-budget-${report.contract.id}-${report.year}.xlsx`,
    );
  } catch (err) {
    if (sendReportError(res, err)) return;
    next(err);
  }
};

// GET /api/reports/payment-schedule — requires ?contractId
export const paymentScheduleReport = async (req, res, next) => {
  try {
    const report = await getPaymentScheduleReport(req.query.contractId);
    return res.json(report);
  } catch (err) {
    if (sendReportError(res, err)) return;
    next(err);
  }
};

// GET /api/reports/payment-schedule/export
export const exportPaymentScheduleReport = async (req, res, next) => {
  try {
    const report = await getPaymentScheduleReport(req.query.contractId);
    return sendWorkbook(
      res,
      createPaymentScheduleWorkbook(report),
      `payment-schedule-${report.contract.id}.xlsx`,
    );
  } catch (err) {
    if (sendReportError(res, err)) return;
    next(err);
  }
};

// GET /api/reports/project/:id/summary
export const projectSummaryReport = async (req, res, next) => {
  try {
    const report = await getProjectSummaryReport(req.params.id);
    return res.json(report);
  } catch (err) {
    if (sendReportError(res, err)) return;
    next(err);
  }
};

// GET /api/reports/project/:id/summary/export
export const exportProjectSummaryReport = async (req, res, next) => {
  try {
    const report = await getProjectSummaryReport(req.params.id);
    return sendWorkbook(
      res,
      createProjectSummaryWorkbook(report),
      `project-summary-${report.contract.id}.xlsx`,
    );
  } catch (err) {
    if (sendReportError(res, err)) return;
    next(err);
  }
};
