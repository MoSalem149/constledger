import { useState, useEffect, useContext } from "react";
import { ContarctDetailsSections } from "../components/contractDetails/ContarctDetailsSections";
import { ContarctCard } from "../components/contractDetails/ContractCard";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import { Link, useParams } from "react-router-dom";
import { contractService } from "../services/contractService";
import { ContractContext } from "../context/EditContaractContext";

/**
 * ContractDetailPage — read-only contract view.
 *
 * Fetches contract by :id from the URL.
 * Same layout as ReviewEditFormPage but all fields are read-only.
 * No edit/delete/add actions are available.
 *
 * Path: /contracts/:id
 * Accessible by all authenticated roles.
 */
export default function ContractDetailPage() {
  const { id } = useParams();
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
        if (data.status == "active") set_read_only(true);
        else set_read_only(false);
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
        <p className="text-text-secondary text-sm">Loading contract...</p>
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
    <div className="project min-w-0 w-full bg-bg-main">
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
