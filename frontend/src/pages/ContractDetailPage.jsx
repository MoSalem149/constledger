import { ContarctDetailsSections } from "../components/contractDetails/ContarctDetailsSections";
import { ContarctCard } from "../components/contractDetails/ContractCard";

import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";

/**
 * ContractDetailPage — read-only contract view with PDF viewer + milestones.
 *
 * Sprint 2 builds the full screen: contract metadata, status badge,
 * milestone timeline, and PDF preview.
 *
 * Path: /contracts/:id
 * Accessible by all authenticated roles.
 */
export default function ContractDetailPage() {
  return (
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
  );
}
