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
        setContractData({
          name: "توشكا - ZONE R - محطة رفع 2",
          parties: [
            {
              name: "شركة مدكور للمشروعات",
              role: "main_contractor",
            },
            {
              name: "شركة الهاشمية الدولية للمقاولات",
              role: "subcontractor",
            },
            {
              name: "الهيئة الهندسية للقوات المسلحة - إدارة المياه",
              role: "owner",
            },
          ],
          contract_value: 8750000,
          currency: "EGP",
          unit_prices: [
            {
              item: "Horizontal pumps Q=2000 L/s H=22m — 18 main + 2 standby",
              unit: "no",
              unit_price: 135000,
              quantity: 20,
              total_cost: 2700000,
            },
            {
              item: "Submersible drainage pump 20 L/s, 10m lift, IP68",
              unit: "no",
              unit_price: 45000,
              quantity: 8,
              total_cost: 360000,
            },
            {
              item: "Suction/discharge/gate valves and connectors",
              unit: "no",
              unit_price: 70000,
              quantity: 20,
              total_cost: 1400000,
            },
            {
              item: "Supply-line valves, gate valves, shafts and connectors",
              unit: "no",
              unit_price: 61500,
              quantity: 20,
              total_cost: 1230000,
            },
            {
              item: "Main header pipe Ø 2.5 m incl. intake housing",
              unit: "no",
              unit_price: 450000,
              quantity: 4,
              total_cost: 1800000,
            },
            {
              item: "Reverse-flow gauge / drainage measurement system",
              unit: "lump_sum",
              unit_price: 72000,
              quantity: 1,
              total_cost: 72000,
            },
            {
              item: "Perimeter fence/grid around station",
              unit: "no",
              unit_price: 22500,
              quantity: 20,
              total_cost: 450000,
            },
            {
              item: "External-area drainage pump (submersible)",
              unit: "lump_sum",
              unit_price: 90000,
              quantity: 1,
              total_cost: 90000,
            },
            {
              item: "Miscellaneous mechanical, electrical and installation works",
              unit: "lump_sum",
              unit_price: 648000,
              quantity: 1,
              total_cost: 648000,
            },
          ],
          paymentProgress: {
            basis: "Completed deliveries against BOQ unit prices",
            frequency: 15,
            dueTo: 15,
          },
          payment_terms: [
            {
              name: "Advance Payment",
              percentage: 15,
              description: "Paid by bank check",
            },
            {
              name: "Progress Payments",
              percentage: 75,
              description: "Based on approved completed quantities",
            },
            {
              name: "Retention — Preliminary Acceptance",
              percentage: 5,
              description: "Held until preliminary acceptance",
            },
            {
              name: "Retention — Final Acceptance",
              percentage: 5,
              description: "Held until final acceptance",
            },
            {
              name: "VAT",
              percentage: null,
              description: "Prices exclude VAT",
            },
          ],
          payment_schedule: [
            {
              date: "Wed Oct 26 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
              amount: 1312500,
            },
          ],
          start_date:
            "Wed Oct 26 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
          end_date:
            "Sun Dec 25 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
          duration_days: 60,
          reporting_period: "biweekly",
          milestones: [
            {
              name: "Contract signed",
              dueDate:
                "Mon Sep 26 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
              isDue: true,
            },
            {
              name: "Execution start",
              dueDate:
                "Wed Oct 26 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
              isDue: true,
            },
            {
              name: "Extraction #1 due",
              dueDate:
                "Thu Nov 10 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
              isDue: true,
            },
            {
              name: "Preliminary handover",
              dueDate:
                "Sun Dec 25 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
              isDue: true,
            },
            {
              name: "Final Acceptance / End of Defects Liability Period",
              dueDate:
                "Mon Dec 25 2023 02:00:00 GMT+0200 (Eastern European Standard Time)",
              isDue: true,
            },
          ],
          penalties: [
            {
              condition: "Delay exceeding 1 week",
              penalty: "1% of contract value per week",
            },
            {
              condition:
                "HSE violation — failure to follow safety instructions (1st offence)",
              penalty: "500 EGP fine",
            },
            {
              condition: "HSE violation — same rule (2nd offence)",
              penalty: "1000 EGP fine",
            },
            {
              condition: "HSE violation — same rule (3rd offence)",
              penalty: "5000 EGP fine",
            },
            {
              condition: "Smoking in hazardous areas causing damage",
              penalty: "Immediate termination",
            },
            {
              condition: "Drugs or alcohol on site",
              penalty: "Immediate termination",
            },
          ],
          status: "active",
          uploadedBy: null,
          createdAt: "2022-09-26T00:00:00.000Z",
          updatedAt: "2026-06-13T22:51:30.235Z",
          contractNumber: "CPMS-LEGACY-6a34663e90ed39590754f699",
          id: "6a34663e90ed39590754f699",
          document: {
            uploadId: "6a2daf968ca59a958fc1d4fc",
            fileName: "Contract - Zone R - Ps2.pdf",
            mimeType: "application/pdf",
            sizeBytes: 7421,
            pdfUrl:
              "https://constledger-dev.s3.us-east-1.amazonaws.com/contracts/6a23632b7be65daa24981fc2/original/5986c448-4ffa-4888-8c14-a185ffdebbf4-contract-zone-r-ps2.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAWWBB3WEHAZEXNP3I%2F20260619%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260619T000928Z&X-Amz-Expires=900&X-Amz-Signature=e6a07d4b7a926b3c88bc33e070b32f6c0de51f8326ebc8720fdb936ae8d42337&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject",
          },
        });
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
          <ContarctDetailsSections
            contractData={contractData}
            readOnly={read_only}
          />
        </div>
      </div>
    </div>
  );
}
