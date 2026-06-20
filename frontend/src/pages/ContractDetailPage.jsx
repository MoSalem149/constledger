import { useState, useEffect } from "react";
import { ContarctDetailsSections } from "../components/contractDetails/ContarctDetailsSections";
import { ContarctCard } from "../components/contractDetails/ContractCard";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import { Link, useParams } from "react-router-dom";
import { contractService } from "../services/contractService";

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

  useEffect(() => {
    async function fetchContract() {
      try {
        setLoading(true);
        const data = await contractService.getContractById(id);
        if (data.status == "active") set_read_only(true);
        else set_read_only(false);
        setContractData(data);
        console.log(data);
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
    <div>
      <div className="project bg-bg-main pr-10">
        <Link
          to="/contracts"
          className="flex items-center gap-2 text-text-secondary"
        >
          <ArrowLeftIcon />
          <div className="text-sm sm:text-base">All Projects</div>
        </Link>

        <ContarctCard contractData={contractData} />
        <ContarctDetailsSections
          contractData={contractData}
          readOnly={read_only}
        />
      </div>
    </div>
  );
}
