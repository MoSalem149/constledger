/**
 * ProgressFormPage — submit or edit an actual progress report.
 *
 * Sprint 4 builds the full form. Same component handles both
 * create mode (/new) and edit mode (/edit) via a mode flag.
 * Only the prefill data and API endpoint differ.
 *
 * Role: financeTeam only (enforced by RoleGuard in App.jsx).
 * Paths:
 *   /finance/:contractId/progress/new          → create mode
 *   /finance/:contractId/progress/:entryId/edit → edit mode
 */
export default function ProgressFormPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Progress Report</h1>
      <p className="text-text-secondary mt-2">Progress form coming in Sprint 4</p>
    </div>
  );
}
