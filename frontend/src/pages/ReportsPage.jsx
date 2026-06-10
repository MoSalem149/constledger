/**
 * ReportsPage — consolidated reports with tabs.
 *
 * Sprint 4 builds the full screen with tabs for:
 *   - Monthly reports
 *   - Quarterly reports
 *   - Performance KPIs
 *   - Penalties
 *
 * Using tabs avoids 5 near-identical page files per CPMS-105 decision.
 * Replaces the old standalone PerformancePage.
 */
export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
      <p className="text-text-secondary mt-2">Reports with tabs coming in Sprint 4</p>
    </div>
  );
}
