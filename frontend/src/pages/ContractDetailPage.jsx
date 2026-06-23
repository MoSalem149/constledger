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
 * ContractDetailPage — contract view.
 *
 * Fetches contract by :id from the URL.
 * Contract Manager sees editable fields for pending_review contracts;
 * Top Management always sees read-only (can't confirm/edit).
 *
 * Path: /contracts/:id
 * Roles: contract_manager (full), top_management (read-only)
 */
export default function ContractDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [contractData, setContractData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [read_only, set_read_only] = useState(false);

  const { data: editedData } = useContext(ContractContext);

  const mergedData = {
    ...contractData,
    ...editedData,
  };

  useEffect(() => {
    async function fetchContract() {
      try {
        setLoading(true);
        const data = await contractService.getContractById(id);
        set_read_only(data.status === "active" || user?.role === "top_management");
        setContractData(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load contract.");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchContract();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-main">
        <Spinner size="lg" label="Loading contract..." />
      </div>
    );
  }

  if (error || !contractData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-main">
        <p className="text-status-risk text-sm">
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
      <ContarctDetailsSections
        contractData={mergedData}
        readOnly={read_only}
      />
    </div>
  );
}