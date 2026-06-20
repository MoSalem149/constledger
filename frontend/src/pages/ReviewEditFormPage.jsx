import { useContext, useEffect } from "react";
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
 */

export default function ReviewEditFormPage() {
  const { contractData } = useContext(UContractContext);
  const { data: editedData } = useContext(ContractContext);

  const mergedData = {
    ...contractData,
    ...editedData,
  };

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
