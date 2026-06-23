import { useContext } from "react";
import { ContarctDetailsSections } from "../components/contractDetails/ContarctDetailsSections";
import { ContarctCard } from "../components/contractDetails/ContractCard";

import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
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
 */

export default function ReviewEditFormPage() {
  const { contractData } = useContext(UContractContext);
  const { data: editedData } = useContext(ContractContext);

  const mergedData = {
    ...contractData,
    ...editedData,
  };

  return (
    <div className="project min-w-0 w-full bg-bg-main">
      <Link
        to="/contracts"
        className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-primary sm:text-base"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span>All Projects</span>
      </Link>

      <ContarctCard contractData={mergedData} />
      <ContarctDetailsSections contractData={mergedData} readOnly={false} />
    </div>
  );
}
