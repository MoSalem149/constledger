/**
 * AIExtractsPanel — side panel showing what the AI extracts from a contract.
 *
 * Renders a title + 5 extraction items with icon, label, and description.
 */
import PartiesIcon from "../icons/PartiesIcon";
import ValueIcon from "../icons/ValueIcon";
import ScheduleIcon from "../icons/ScheduleIcon";
import PaymentIcon from "../icons/PaymentIcon";
import PenaltiesIcon from "../icons/PenaltiesIcon";

const extractItems = [
  {
    key: "parties",
    label: "Parties",
    description: "Owner, contractor, subcontractors",
    Icon: PartiesIcon,
  },
  {
    key: "value",
    label: "Value",
    description: "Contract value, currency, unit prices",
    Icon: ValueIcon,
  },
  {
    key: "schedule",
    label: "Schedule",
    description: "Start, end, milestones",
    Icon: ScheduleIcon,
  },
  {
    key: "payment",
    label: "Payment",
    description: "Terms, retention, schedule",
    Icon: PaymentIcon,
  },
  {
    key: "penalties",
    label: "Penalties",
    description: "Conditions and formulas",
    Icon: PenaltiesIcon,
  },
];

export default function AIExtractsPanel() {
  return (
    <div
      className="
        min-h-[428px] bg-bg-cards1 rounded-lg
        shadow-[0_2px_8px_rgba(136,136,136,0.1)]
        p-6 flex flex-col justify-center items-center
      "
    >
      <div className="w-full max-w-[381px] flex flex-col font-sans gap-4">
        {/* Title */}
        <h3 className="text-lg  font-medium text-text-primary leading-5">
          What AI Extracts
        </h3>

        {/* Items list */}
        <div className="flex flex-col gap-4 pb-4 border-b border-gray-100">
          {extractItems.map((item) => {
            const Icon = item.Icon;
            return (
              <div key={item.key} className="flex items-center gap-6">
                {/* Icon container */}
                <div className="w-10 h-10 rounded-lg bg-bg-grey flex items-center justify-center shrink-0">
                  <Icon className="text-text-secondary" />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-text-secondary">
                    {item.label}
                  </span>
                  <span className="text-xs text-text-primary">
                    {item.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-xs text-text-primary leading-[18px]">
          AI-highlighted fields must be reviewed before activation
        </p>
      </div>
    </div>
  );
}
