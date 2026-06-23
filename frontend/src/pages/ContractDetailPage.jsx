import { useState, useEffect, useContext } from "react";
import { ContarctDetailsSections } from "../components/contractDetails/ContarctDetailsSections";
import { ContarctCard } from "../components/contractDetails/ContractCard";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import { Link, useParams } from "react-router-dom";
import { contractService } from "../services/contractService";
import { ContractContext } from "../context/EditContaractContext";
import Spinner from "../components/common/Spinner";
import { useAuth } from "../context/AuthContext";

/**
 * ContractDetailPage — single contract view and review/edit form.
 *
 * Fetches contract by :id from the URL (reload-safe).
 * EditContractContext holds unsaved in-session edits until Confirm.
 *
 * - pending_review + contract_manager → editable, Confirm + upload stepper
 * - active → read-only for everyone
 * - top_management → always read-only
 *
 * Path: /contracts/:id  (/contracts/:id/edit redirects here)
 * Roles: contract_manager (full), top_management (read-only)
 */
export default function ContractDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [contractData, setContractData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readOnly, setReadOnly] = useState(false);

  const { data: editedData } = useContext(ContractContext);

  const mergedData = {
    ...contractData,
    ...editedData,
  };

  useEffect(() => {
    async function fetchContract() {
      try {
        setLoading(true);
        setError(null);
        const data = await contractService.getContractById(id);
        setReadOnly(
          data.status === "active" || user?.role === "top_management",
        );
        setContractData(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load contract.");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchContract();
  }, [id, user?.role]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-main">
        <Spinner size="lg" label="Loading contract..." />
      </div>
    );
  }

  if (error || !contractData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-main">
        <p className="text-sm text-status-risk">
          {error ?? "Contract not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="project min-w-0 w-full bg-bg-main lg:pr-10 pr-0">
      <Link
        to="/contracts"
        className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-primary sm:text-base"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span>All Projects</span>
      </Link>

      <ContarctCard contractData={mergedData} />
      <ContarctDetailsSections contractData={mergedData} readOnly={readOnly} />
    </div>
  );
}
