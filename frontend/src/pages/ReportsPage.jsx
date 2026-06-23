/**
 * ReportsPage — hub page for available reports.
 *
 * Currently provides two report types:
 *   - All Contracts: aggregated contract stats and export
 *   - Planned Budget: per-contract planned budget with period breakdown
 *
 * Additional report types (monthly, quarterly, KPIs, penalties) are
 * planned for future sprints.
 */
import { useNavigate } from "react-router-dom";

import { ArrowRightIcon } from "../components/icons/ArrowRightIcon";
import ScheduleIcon from "../components/icons/ScheduleIcon";
import ReportsIcon from "../components/icons/ReportsIcon";

export default function ReportsPage() {
  const navigate = useNavigate();

  const reportsCards = [
    {
      id: 1,
      title: "All Contracts",
      description:
        "Overview of all contracts, including progress, budget status, and key contract details",
      route: "/reports/contracts",
      icon: (
        <div className="w-10 h-10 rounded-lg bg-bg-mainColor flex items-center justify-center">
          <ReportsIcon className="size-4 text-primary" />
        </div>
      ),
    },

    {
      id: 2,
      title: "Planned Budget",
      description:
        "Track planned budgets across projects and compare allocations over different periods",
      route: "/reports/planned-budget",
      icon: (
        <div className="w-10 h-10 rounded-lg bg-bg-mainColor flex items-center justify-center">
          <ScheduleIcon className="size-4 text-primary" />
        </div>
      ),
    },
  ];

  return (
    <section className="min-h-[calc(100vh-116px)] bg-bg-main lg:pr-10 pr-0 ">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-medium text-text-primary">
          Available Reports
        </h1>

        <p className="text-[14px] mt-2 text-text-secondary">
          Aggregated views across all projects • export to Excel
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
        {reportsCards.map((card) => (
          <div
            key={card.id}
            onClick={() => navigate(card.route)}
            className="
                bg-bg-cards1
                rounded-lg
                shadow
                border border-gray-100
                p-7
                min-h-[230px]
                cursor-pointer
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-lg
                flex
                flex-col
                justify-between
              "
          >
            <div>
              {/* Icon + Title */}
              <div className="flex items-center gap-4">
                {card.icon}

                <div>
                  <h2 className="text-[18px] font-semibold text-text-primary">
                    {card.title}
                  </h2>
                </div>
              </div>

              {/* Description */}
              <p className="mt-6 text-text-secondary leading-8 text-[14px]">
                {card.description}
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end mt-8">
              <button
                className="
                    flex items-center gap-2
                    text-primary
                    font-semibold
                    text-[14px]
                  "
              >
                Open
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
