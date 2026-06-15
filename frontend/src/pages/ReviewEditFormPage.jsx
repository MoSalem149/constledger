import { useContext, useEffect } from "react";
import { ContarctDetailsSections } from "../components/contractDetails/ContarctDetailsSections";
import { ContarctCard } from "../components/contractDetails/ContractCard";

import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import { contractService } from "../services/contractService";
import { Link } from "react-router-dom";
import UploadContractPage from "./UploadContractPage";
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
  const { contractData } = useContext(UploadContractPage());
  // const [contractData, setContractData] = useState(null);
  // useEffect(() => {
  //   async function fetchContract() {
  //     try {
  //       const data = await contractService.getContractById(
  //         "6a2b1a0c9734c8eae15c7841",
  //       );
  //       setContractData(data);
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   }

  //   fetchContract();
  // }, []);

  return (
    <div>
      <div className="project pt-6 sm:pt-10 bg-bg-main">
        <div className="container px-4 sm:px-6 lg:px-8">
          <Link
            to="/contracts"
            className="flex items-center gap-2 text-text-secondary"
          >
            <ArrowLeftIcon />

            <div className="text-sm sm:text-base">All Projects</div>
          </Link>

          <ContarctCard contractData={contractData} />
          <ContarctDetailsSections contractData={contractData} />
        </div>
      </div>
    </div>
  );
}
