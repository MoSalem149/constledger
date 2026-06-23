import { useEffect, useState, useCallback } from "react";
import { contractService } from "../services/contractService";
import { financeService } from "../services/financeService";
import { reportService } from "../services/reportService";

export function useDashboardData() {
  const [contracts, setContracts] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const listData = await contractService.getContracts({ limit: 100 });
      setContracts(listData || []);

      try {
        const report = await reportService.getContracts();
        setReportData(report);
      } catch {
        setReportData(null);
      }

      const activeContracts = (listData || []).filter(
        (c) => c.status === "active"
      );

      if (activeContracts.length > 0) {
        const planResults = await Promise.allSettled(
          activeContracts.map((c) =>
            financeService.getPlan(c.id).then((data) => ({
              contractId: c.id,
              plan: data?.plan || null,
            }))
          )
        );

        const successfulPlans = planResults
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value)
          .filter((item) => item.plan);

        setPlans(successfulPlans);
      } else {
        setPlans([]);
      }
    } catch {
      setContracts([]);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeContracts = contracts.filter((c) => c.status === "active");

  return {
    contracts,
    activeContracts,
    reportData,
    plans,
    loading,
  };
}