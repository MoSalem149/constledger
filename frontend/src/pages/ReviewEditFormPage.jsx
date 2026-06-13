import { ContarctDetailsSections } from "../components/contractDetails/ContarctDetailsSections";
import { ContarctCard } from "../components/contractDetails/ContractCard";

import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";

/**
 * ReviewEditFormPage — 13-field contract review/edit form.
 *
 * Sprint 3 builds the full form: contract metadata fields extracted
 * by the AI can be reviewed and corrected before final save.
 * Triggering "confirm" also creates the planned budget.
 *
 * Role: contractManager only (enforced by RoleGuard in App.jsx).
 * Path: /contracts/:id/edit
 */
export default function ReviewEditFormPage() {
  return (
    <div>
      <div className="project pt-6 sm:pt-10 bg-bg-main">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-text-secondary">
            <ArrowLeftIcon />

            <div className="text-sm sm:text-base">All Projects</div>
          </div>

          <ContarctCard />
          <ContarctDetailsSections />
        </div>
      </div>
    </div>
  );
}
