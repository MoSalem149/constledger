import projectImage from "../assets/projectImage.png";

export const projectCard = {
  projectImage: projectImage,
  projectId: "CT-2026-0165",
  projectTitle: "Aswan Solar Park",
  NREAContracting: "Elsewedy Electric T&D",
  TotalBudget: "30200000",
  Progress: 40,
  Timeline: {
    from: "12 Oct 2026",
    to: "12 Oct 2027 ",
  },
  NextMilestone: "Site Preparation",
};

export const overviewData = {
  budget: { spent: 244, total: 312.8, percentDone: 78 },
  schedule: { daysLate: 42 },
  attention: "A new progress report for May was submitted yesterday.",
  kpis: [
    { label: "On Schedule?", value: "0.84", sub: "Behind Plan" },
    { label: "On Budget?", value: "0.89", sub: "Over Budget" },
    { label: "Days vs Plan", value: "-42d", sub: "Need More Attention" },
    {
      label: "Penalty Exposure",
      value: "9.4M EGP",
      sub: "If completion slips past Dec 15",
    },
  ],
  activities: [
    {
      type: "upload",
      name: "Tarek Saleh",
      action: "submitted May progress report",
      time: "Yesterday, 2:32 PM",
    },
    {
      type: "warning",
      name: "AI Engine",
      action: "flagged a cost variance over 10%",
      time: "3 days ago",
    },
    {
      type: "check",
      name: "Hussein Khaled",
      action: "approved April progress report",
      time: "2 weeks ago",
    },
    {
      type: "check",
      name: "Yasmin Adel",
      action: "edited 2 milestone dates in the contract",
      time: "3 weeks ago",
    },
  ],
};

// =================== DATA ===================
export const contractData = {
  file: "NREA-Elsewedy-Aswan-Prep . 47 pages",
  stats: { total: 13, needReview: 7 },
  parties: [
    {
      label: "Owner",
      status: "green",
      value: "New and Renewable Energy Authority (NREA)",
    },
    { label: "Contractor", status: "green", value: "Elsewedy Electric T&D" },
    { label: "Subcontractor", status: "green", value: "" },
  ],
  fields: [
    { label: "Contract Value", status: "green", value: "28,900,000" },
    { label: "Currency", status: "green", value: "EGP" },
    { label: "Duration", status: "green", value: "356d" },
    { label: "Reporting Period", status: "green", value: "Weekly" },
  ],
  innerTabs: [
    { name: "Basic Info", badge: null },
    { name: "Financial Terms", badge: 4 },
    { name: "Schedule and Milestones", badge: 2 },
    { name: "Penalties", badge: 1 },
  ],
  payment: {
    advance: {
      percentage: "10 %",
      note: "Paid once after contract signing and submission of the required bond.",
    },
    progress: {
      basis: "Monthly IPC",
      frequency: "Monthly",
      paymentDue: "Net 30 days from approval of IPC",
    },
    retention: {
      percentage: "5 %",
      note: "The retention amount will be released after the defects liability period.",
    },
  },
};
