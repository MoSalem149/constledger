import { useEffect, useState, useCallback } from "react";
import { contractService } from "../services/contractService";
import { financeService } from "../services/financeService";
import { reportService } from "../services/reportService";

export function useDashboardData() {
  const [contracts, setContracts] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Primary: fetch contracts list (works now)
      const listData = await contractService.getContracts({ limit: 100 });
      setContracts(listData || []);

      // Try reports endpoint (will work when other dev mounts routes)
      try {
        const report = await reportService.getAllContractsReport();
        setReportData(report);
      } catch (reportErr) {
        // 404 expected until routes are mounted — silently ignore
        setReportData(null);
      }

      // Fetch plans for active contracts
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
    } catch (err) {
      setError(err);
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
    error,
    refetch: fetchData,
  };
}
