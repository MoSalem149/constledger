/**
 * ReviewProgressPage — approve or reject a submitted progress entry.
 *
 * Sprint 4 builds the full screen: view the submitted progress data,
 * add approval comments, and approve/reject the entry.
 *
 * Role: contract_manager only (enforced by RoleGuard in App.jsx).
 * Path: /finance/:contractId/progress/:entryId/review
 */
export default function ReviewProgressPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Review Progress</h1>
      <p className="text-text-secondary mt-2">Progress review &amp; approval coming in Sprint 4</p>
    </div>
  );
}
