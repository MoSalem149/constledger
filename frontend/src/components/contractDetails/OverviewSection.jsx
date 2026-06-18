import { useState } from "react";
import { BudgetAndProgressSection } from "./BudgetAndProgressSection";
import { ApprovalsSection } from "./ApprovalsSection";
import ContractSection from "./ContractSection";
import { ChartIcon } from "../icons/ChartIcon";
import { ClockIcon } from "../icons/ClockIcon";
import { AlertIcon } from "../icons/AlertIcon";
import { UploadIcon } from "../icons/UploadIcon";
import { CheckIcon } from "../icons/CheckIcon";

// =================== INSIGHT CARD ===================
const InsightCard = ({ icon, title, children }) => {
  const icons = {
    chart: <ChartIcon />,
    clock: <ClockIcon />,
    warning: <AlertIcon />,
  };
  return (
    <div className="flex-1 bg-bg-main shadow rounded-lg p-3.5">
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 rounded-lg bg-bg-grey text-text-secondary flex items-center justify-center flex-shrink-0">
          {icons[icon]}
        </div>
        <div>
          <p className="text-[13px] font-medium text-text-primary mb-1">
            {title}
          </p>
          <p className="text-[12px] text-text-secondary leading-relaxed">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
};

// =================== WHATS HAPPENING ===================
const WhatsHappeningSection = ({ data }) => (
  <div className="bg-bg-cards1 shadow rounded-lg p-5">
    <p className="text-[17px] font-medium mb-1">What's happening</p>
    <p className="text-xs text-text-secondary mb-3.5">
      A plain-English snapshot of this project right now
    </p>

    <div className="flex flex-col md:flex-row gap-2.5">
      <InsightCard icon="chart" title="Where the money is">
        You've spent about EGP {data.budget.spent}M of your EGP{" "}
        {data.budget.total}M budget — that's {data.budget.percentDone}% done.{" "}
        <span className="text-red-600 font-medium">
          You're spending faster than planned.
        </span>
      </InsightCard>
      <InsightCard icon="clock" title="Is it on time?">
        No the team is{" "}
        <span className="text-red-600 font-medium">
          {data.schedule.daysLate} days behind plan.
        </span>{" "}
        Talk to the contractor about recovery.
      </InsightCard>
      <InsightCard icon="warning" title="What needs your attention">
        {data.attention}
      </InsightCard>
    </div>
  </div>
);

// =================== KPI CARD ===================
const KPICard = ({ label, value, sub }) => (
  <div className="flex-1 bg-bg-cards1 shadow rounded-lg p-5">
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-xs text-text-secondary">{label}</span>
      <div className="w-[7px] h-[7px] rounded-full bg-red-600" />
    </div>
    <p className="text-lg font-medium mb-1 text-text-primary">{value}</p>
    <p className="text-xs text-text-secondary">{sub}</p>
  </div>
);

// =================== KPI SECTION ===================
const KPIMetricsSection = ({ kpis }) => (
  <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3.5">
    {kpis.map((k, i) => (
      <KPICard key={i} {...k} />
    ))}
  </div>
);

// =================== ACTIVITY ITEM ===================
const activityCfg = {
  upload: { bg: "bg-orange-50", color: "text-orange-600", Icon: UploadIcon },
  warning: { bg: "bg-bg-grey", color: "text-text-secondary", Icon: AlertIcon },
  check: { bg: "bg-green-50", color: "text-green-700", Icon: CheckIcon },
};

const ActivityItem = ({ type, name, action, time, isLast }) => {
  const { bg, color, Icon } = activityCfg[type];
  return (
    <div
      className={`flex items-center gap-3 py-3.5 ${!isLast ? "border-b border-border" : ""}`}
    >
      <div
        className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center flex-shrink-0`}
      >
        <Icon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-text-primary">
          <span className="font-medium">{name}</span> {action}
        </p>
        <p className="text-xs text-text-secondary mt-0.5">{time}</p>
      </div>
    </div>
  );
};

// =================== RECENT ACTIVITY ===================
const RecentActivitySection = ({ activities }) => (
  <div className="bg-bg-cards1 shadow rounded-lg p-5">
    <p className="text-[15px] font-medium mb-0.5">
      Recent activity on this project
    </p>
    <p className="text-xs text-text-secondary mb-0.5">Last 14 days</p>
    {activities.map((a, i) => (
      <ActivityItem key={i} {...a} isLast={i === activities.length - 1} />
    ))}
  </div>
);

// =================== OVERVIEW SECTION ===================
export const OverviewSection = ({ data }) => (
  <div className="flex flex-col gap-3.5">
    <WhatsHappeningSection data={data} />
    <KPIMetricsSection kpis={data.kpis} />
    <RecentActivitySection activities={data.activities} />
  </div>
);
