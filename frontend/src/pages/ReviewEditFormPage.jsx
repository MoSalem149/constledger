import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ContarctDetailsSections } from "../components/contractDetails/ContarctDetailsSections";
import { ContarctCard } from "../components/contractDetails/ContractCard";

import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import { contractService } from "../services/contractService";
import { Link } from "react-router-dom";
import { UContractContext } from "../context/UploadedContractContext";
import { ContractContext } from "../context/EditContaractContext";
/**
 * ReviewEditFormPage — 13-field contract review/edit form.
 *
 * Sprint 3 builds the full form: contract metadata fields extracted
 * by the AI can be reviewed and corrected before final save.
 * Triggering "confirm" also creates the planned budget.
 *
 * Role: contract_manager only (enforced by RoleGuard in App.jsx).
 * Path: /contracts/:id/edit
 *
 * NOTE: contractData used to come ONLY from UploadedContractContext, which is
 * populated by UploadContractPage right after the (3-5 minute) AI analysis
 * finishes. That's fragile — if this page is opened directly, refreshed, or
 * the context is empty for any reason, contractData was {} and every section
 * below (e.g. ContarctCard's contractData.milestones.filter(...)) crashed.
 * We now ALWAYS fetch the canonical record by :id and treat the context value
 * purely as an optional "instant first paint" hint while the fetch is in flight.
 */

export default function ReviewEditFormPage() {
  const { id } = useParams();
  const { contractData: contextContractData } = useContext(UContractContext);
  const { data: editedData } = useContext(ContractContext);

  const [fetchedData, setFetchedData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;

    contractService
      .getContractById(id)
      .then((data) => {
        if (!cancelled) setFetchedData(data);
      })
      .catch((err) => {
        console.error("Failed to load contract:", err);
        if (!cancelled) {
          setLoadError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load contract.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Prefer the freshly-fetched record; fall back to the context value (set
  // right after upload) only until the fetch resolves, so first paint after
  // the upload flow is still instant.
  const baseData = fetchedData || contextContractData || {};

  const mergedData = {
    ...baseData,
    ...editedData,
  };

  if (loadError && !fetchedData) {
    return (
      <div className="project bg-bg-main pr-10">
        <Link
          to="/contracts"
          className="flex items-center gap-2 text-text-secondary"
        >
          <ArrowLeftIcon />
          <div className="text-sm sm:text-base">All Projects</div>
        </Link>
        <div className="bg-bg-atRisk200 text-status-risk px-4 py-3 rounded-lg text-sm mt-4">
          {loadError}
        </div>
      </div>
    );
  }

  // Don't render the form against an empty/default shape — wait for either
  // the context hint or the real fetch to land.
  if (!fetchedData && !contextContractData?.id) {
    return null;
  }

  return (
    <div>
      <div className="project bg-bg-main pr-10">
        <Link
          to="/contracts"
          className="flex items-center gap-2 text-text-secondary"
        >
          <ArrowLeftIcon />

          <div className="text-sm sm:text-base">All Projects</div>
        </Link>

        <ContarctCard contractData={mergedData} />
        <ContarctDetailsSections contractData={mergedData} readOnly={false} />
      </div>
    </div>
  );
}
