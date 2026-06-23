// Shared contract validation — used by inline field blur checks and the
// Confirm Contract modal so both surfaces stay in sync.

export const VALID_REPORTING_PERIODS = ["weekly", "biweekly", "monthly"];
export const STRING_ONLY_REGEX =
  /^[A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s'.,&-]*$/;
export const CONTRACT_VALUE_MAX = 999_999_999_999;
export const DURATION_MAX_DAYS = 3650;

export const normalizeReportingPeriod = (value) => {
  if (!value) return undefined;
  const n = value.toString().trim().toLowerCase();
  if (n === "weekly") return "weekly";
  if (
    n === "biweekly" ||
    n === "2 weeks" ||
    n === "2-weekly" ||
    n === "2-weeks" ||
    n === "15 days" ||
    n === "15-day" ||
    n === "15days"
  )
    return "biweekly";
  if (n === "monthly") return "monthly";
  return undefined;
};

export const parseContractValue = (rawValue) => {
  if (rawValue === "" || rawValue == null) return NaN;
  return typeof rawValue === "number"
    ? rawValue
    : parseFloat(String(rawValue).replace(/,/g, ""));
};

export const isValidDateValue = (value) => {
  if (!value || value === "") return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

/**
 * Returns modal-ready errors: { field, label, tab, hint }[]
 * Used when the user clicks Confirm Contract.
 */
export const validateContractForConfirm = (merged) => {
  const errors = [];

  const numValue = parseContractValue(merged.contract_value);
  if (!merged.contract_value || Number.isNaN(numValue) || numValue <= 0) {
    errors.push({
      field: "contract_value",
      label: "Contract Value",
      tab: "Basic Info",
      hint: "Enter the total contract amount (e.g. 5,000,000)",
    });
  } else if (numValue > CONTRACT_VALUE_MAX) {
    errors.push({
      field: "contract_value",
      label: "Contract Value",
      tab: "Basic Info",
      hint: "Value is too large",
    });
  }

  const currency = String(merged.currency ?? "")
    .trim()
    .toUpperCase();
  if (!currency) {
    errors.push({
      field: "currency",
      label: "Currency",
      tab: "Basic Info",
      hint: "Enter a 3-letter ISO code (e.g. EGP, USD, EUR)",
    });
  } else if (!/^[A-Z]{3}$/.test(currency)) {
    errors.push({
      field: "currency",
      label: "Currency",
      tab: "Basic Info",
      hint: "Use a 3-letter ISO code (e.g. EGP, USD, EUR)",
    });
  }

  if (merged.duration_days === "" || merged.duration_days == null) {
    errors.push({
      field: "duration_days",
      label: "Duration",
      tab: "Basic Info",
      hint: "Enter the contract duration in days (e.g. 365)",
    });
  } else {
    const duration = Number(merged.duration_days);
    if (!Number.isInteger(duration) || duration < 1) {
      errors.push({
        field: "duration_days",
        label: "Duration",
        tab: "Basic Info",
        hint: "Must be a positive whole number",
      });
    } else if (duration > DURATION_MAX_DAYS) {
      errors.push({
        field: "duration_days",
        label: "Duration",
        tab: "Basic Info",
        hint: `Cannot exceed ${DURATION_MAX_DAYS} days`,
      });
    }
  }

  const normalizedPeriod = normalizeReportingPeriod(merged.reporting_period);
  if (!merged.reporting_period || !normalizedPeriod) {
    errors.push({
      field: "reporting_period",
      label: "Reporting Period",
      tab: "Basic Info",
      hint: 'Must be "weekly", "biweekly" (or "15 days"), or "monthly"',
    });
  }

  const parties = merged.parties ?? [];
  const validParties = parties.filter(
    (p) => p?.name?.trim() && STRING_ONLY_REGEX.test(p.name.trim()),
  );
  if (validParties.length === 0) {
    errors.push({
      field: "parties",
      label: "Contract Parties",
      tab: "Basic Info",
      hint: "Add at least one party with a valid name (letters only)",
    });
  }

  if (!merged.start_date || merged.start_date === "") {
    errors.push({
      field: "start_date",
      label: "Start Date",
      tab: "Schedule and Milestones",
      hint: "Enter the contract start date (e.g. 1 Jan 2026)",
    });
  } else if (!isValidDateValue(merged.start_date)) {
    errors.push({
      field: "start_date",
      label: "Start Date",
      tab: "Schedule and Milestones",
      hint: "Enter a valid start date",
    });
  }

  if (!merged.end_date || merged.end_date === "") {
    errors.push({
      field: "end_date",
      label: "End Date",
      tab: "Schedule and Milestones",
      hint: "Enter the contract end date (e.g. 31 Dec 2026)",
    });
  } else if (!isValidDateValue(merged.end_date)) {
    errors.push({
      field: "end_date",
      label: "End Date",
      tab: "Schedule and Milestones",
      hint: "Enter a valid end date",
    });
  }

  if (
    merged.start_date &&
    merged.end_date &&
    isValidDateValue(merged.start_date) &&
    isValidDateValue(merged.end_date)
  ) {
    const start = new Date(merged.start_date);
    const end = new Date(merged.end_date);
    if (end <= start) {
      errors.push({
        field: "end_date_range",
        label: "End Date",
        tab: "Schedule and Milestones",
        hint: "End date must be after the start date",
      });
    }
  }

  const unitPriceErrors = validateUnitPricesForConfirm(merged);
  errors.push(...unitPriceErrors);

  return errors;
};

/** Row counts as filled if any field has a value. */
export const isActiveUnitPriceRow = (row) => {
  const name = String(row?.item ?? row?.name ?? "").trim();
  const unit = String(row?.unit ?? "").trim();
  const qty = Number(row?.quantity);
  const price = Number(row?.unit_price);
  return Boolean(name || unit || qty > 0 || price > 0);
};

export const validateUnitPriceRowFields = (row) => {
  const fieldErrors = {};
  if (!isActiveUnitPriceRow(row)) return fieldErrors;

  if (!String(row?.item ?? row?.name ?? "").trim()) {
    fieldErrors.name = "Item is required";
  }
  if (!String(row?.unit ?? "").trim()) {
    fieldErrors.unit = "Unit is required";
  }

  const qtyRaw = row?.quantity;
  const qty =
    qtyRaw === "" || qtyRaw == null ? NaN : Number(qtyRaw);
  if (!Number.isFinite(qty) || qty <= 0) {
    fieldErrors.quantity = "Quantity must be greater than 0";
  }

  const priceRaw = row?.unit_price;
  const price =
    priceRaw === "" || priceRaw == null ? NaN : Number(priceRaw);
  if (!Number.isFinite(price) || price <= 0) {
    fieldErrors.unit_price = "Unit price must be greater than 0";
  }

  return fieldErrors;
};

/** Modal errors for incomplete unit price rows. */
export const validateUnitPricesForConfirm = (merged) => {
  const errors = [];
  const rows = merged.unit_prices ?? [];

  rows.forEach((row, index) => {
    if (!isActiveUnitPriceRow(row)) return;

    const rowNum = index + 1;
    const fieldErrors = validateUnitPriceRowFields(row);

    if (fieldErrors.name) {
      errors.push({
        field: `unit_prices[${index}].item`,
        label: `Unit Price — Item (row ${rowNum})`,
        tab: "Financial Terms",
        hint: "Enter the item description for this line",
      });
    }
    if (fieldErrors.unit) {
      errors.push({
        field: `unit_prices[${index}].unit`,
        label: `Unit Price — Unit (row ${rowNum})`,
        tab: "Financial Terms",
        hint: "Enter the unit of measure (e.g. m², lump sum)",
      });
    }
    if (fieldErrors.quantity) {
      errors.push({
        field: `unit_prices[${index}].quantity`,
        label: `Unit Price — Quantity (row ${rowNum})`,
        tab: "Financial Terms",
        hint: "Enter a quantity greater than 0",
      });
    }
    if (fieldErrors.unit_price) {
      errors.push({
        field: `unit_prices[${index}].unit_price`,
        label: `Unit Price — Price (row ${rowNum})`,
        tab: "Financial Terms",
        hint: "Enter a unit price greater than 0",
      });
    }
  });

  return errors;
};
