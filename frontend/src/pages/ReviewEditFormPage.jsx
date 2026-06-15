import { useEffect } from "react";
import { ContarctDetailsSections } from "../components/contractDetails/ContarctDetailsSections";
import { ContarctCard } from "../components/contractDetails/ContractCard";

import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import { contractService } from "../services/contractService";
import { Link } from "react-router-dom";
/**
 * ReviewEditFormPage — 13-field contract review/edit form.
 *
 * Sprint 3 builds the full form: contract metadata fields extracted
 * by the AI can be reviewed and corrected before final save.
 * Triggering "confirm" also creates the planned budget.
 *
 * Role: contractManager only (enforced by RoleGuard in App.jsx).
 * Path: /contracts/:id/edit
 */

const contractData = JSON.parse(`{
    "name": "توشكا - ZONE R - محطة رفع 2",
    "parties": [
        {
            "name": "شركة مدكور للمشروعات",
            "role": "main_contractor"
        },
        {
            "name": "شركة الهاشمية الدولية للمقاولات",
            "role": "subcontractor"
        },
        {
            "name": "الهيئة الهندسية للقوات المسلحة - إدارة المياه",
            "role": "owner"
        }
    ],
    "contract_value": 8750000,
    "currency": "EGP",
    "unit_prices": [
        {
            "item": "Horizontal pumps Q=2000 L/s H=22m — 18 main + 2 standby",
            "unit": "no",
            "unit_price": 135000
        },
        {
            "item": "Submersible drainage pump 20 L/s, 10m lift, IP68",
            "unit": "no",
            "unit_price": 45000
        },
        {
            "item": "Suction/discharge/gate valves and connectors",
            "unit": "no",
            "unit_price": 70000
        },
        {
            "item": "Supply-line valves, gate valves, shafts and connectors",
            "unit": "no",
            "unit_price": 61500
        },
        {
            "item": "Main header pipe Ø 2.5 m incl. intake housing",
            "unit": "no",
            "unit_price": 450000
        },
        {
            "item": "Reverse-flow gauge / drainage measurement system",
            "unit": "lump_sum",
            "unit_price": 72000
        },
        {
            "item": "Perimeter fence/grid around station",
            "unit": "no",
            "unit_price": 22500
        },
        {
            "item": "External-area drainage pump (submersible)",
            "unit": "lump_sum",
            "unit_price": 90000
        }
    ],
    "paymentProgress": {
        "basis": "Completed deliveries against BOQ unit prices",
        "frequency": 15,
        "dueTo": 15
    },
    "payment_terms": [
        {
            "name": "Advance Payment",
            "percentage": 15,
            "description": "Paid by bank check"
        },
        {
            "name": "Retention — Preliminary Acceptance",
            "percentage": 5,
            "description": "Held until preliminary acceptance"
        },
        {
            "name": "Retention — Final Acceptance",
            "percentage": 5,
            "description": "Held until final acceptance"
        },
        {
            "name": "VAT",
            "percentage": null,
            "description": "Prices exclude VAT"
        }
    ],
    "payment_schedule": [
        {
            "date": "Wed Oct 26 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
            "amount": 1312500
        }
    ],
    "start_date": "Wed Oct 26 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
    "end_date": "Sun Dec 25 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
    "duration_days": 60,
    "reporting_period": "monthly",
    "milestones": [
        {
            "name": "Contract signed",
            "dueDate": "Mon Sep 26 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
            "isDue": true
        },
        {
            "name": "Execution start",
            "dueDate": "Wed Oct 26 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
            "isDue": true
        },
        {
            "name": "Extraction #1 due",
            "dueDate": "Thu Nov 10 2022 02:00:00 GMT+0200 (Eastern European Standard Time)",
            "isDue": true
        },
        {
            "name": "Preliminary handover",
            "dueDate": "Sun Dec 25 2026 02:00:00 GMT+0200 (Eastern European Standard Time)",
            "isDue": true
        },
        {
            "name": "Final handover",
            "dueDate": "Mon Dec 25 2027 02:00:00 GMT+0200 (Eastern European Standard Time)",
            "isDue": true
        }
    ],
    "penalties": [
        {
            "condition": "Delay exceeding 1 week",
            "penalty": "1% of contract value per week"
        },
        {
            "condition": "HSE violation — failure to follow safety instructions (1st offence)",
            "penalty": "500 EGP fine"
        },
        {
            "condition": "HSE violation — same rule (2nd offence)",
            "penalty": "1000 EGP fine"
        },
        {
            "condition": "HSE violation — same rule (3rd offence)",
            "penalty": "5000 EGP fine"
        },
        {
            "condition": "Smoking in hazardous areas causing damage",
            "penalty": "Immediate termination"
        },
        {
            "condition": "Drugs or alcohol on site",
            "penalty": "Immediate termination"
        }
    ],
    "status": "active",
    "uploadedBy": {
        "id": "6a23632b7be65daa24981fc2",
        "name": "Test User",
        "email": "test@test.com"
    },
    "createdAt": "2022-09-26T00:00:00.000Z",
    "updatedAt": "2026-06-13T22:51:30.235Z",
    "contractNumber": "CPMS-LEGACY-6a2c6beebd1ac75698e9e4aa",
    "contractDocId": "6a2daf968ca59a958fc1d4fc",
    "id": "6a2c6beebd1ac75698e9e4aa",
    "pdfUrl": null
}`);

console.log(contractData);

export default function ReviewEditFormPage() {
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
