const currencyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatEGP(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return currencyFormatter.format(Number(n));
}

export function formatShortEGP(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const num = Number(n);
  if (Math.abs(num) >= 1_000_000) {
    const millions = num / 1_000_000;
    return `${millions.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}M`;
  }
  if (Math.abs(num) >= 1_000) {
    const thousands = num / 1_000;
    return `${thousands.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return num.toFixed(0);
}

export function formatPct(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${Math.round(Number(n) * 100)}%`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
