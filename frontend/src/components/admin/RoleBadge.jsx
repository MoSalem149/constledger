const ROLE_MAP = {
  pmo: { label: "PMO", bg: "bg-bg-mainColor", text: "text-primary" },
  contract_manager: {
    label: "Contract Manager",
    bg: "bg-bg-mainColor",
    text: "text-primary",
  },
  finance_team: {
    label: "Finance Team",
    bg: "bg-bg-processing",
    text: "text-status-processing",
  },
  top_management: {
    label: "Top Management",
    bg: "bg-bg-grey",
    text: "text-text-secondary",
  },
};

const FALLBACK = {
  label: "Unknown",
  bg: "bg-bg-grey",
  text: "text-text-secondary",
};

export default function RoleBadge({ role }) {
  const config = ROLE_MAP[role] || FALLBACK;

  return (
    <span
      className={`inline-flex rounded-xs px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
