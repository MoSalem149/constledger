import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/common/PrivateRoute";
import DashboardLayout from "./components/common/DashboardLayout";
import RoleGuard from "./components/common/RoleGuard";

/* ------------------------------------------------------------------ */
// Pages — all stubs initially, built out per sprint
/* ------------------------------------------------------------------ */

import EditContractContext from "./context/EditContaractContext";
import UploadedContractContext from "./context/UploadedContractContext";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const UploadContractPage = lazy(() => import("./pages/UploadContractPage"));
const ContractDetailPage = lazy(() => import("./pages/ContractDetailPage"));
const ReviewEditFormPage = lazy(() => import("./pages/ReviewEditFormPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFoundPage = lazy(() => import("./components/common/NotFoundPage"));
const ContractsPage = lazy(() => import("./pages/ContractsPage"));
const ContractsReport = lazy(() => import("./pages/ContractsReport"));
const PlannedBudgetReport = lazy(() => import("./pages/PlannedBudgetReport"));
const PlannedBudgetByIdReport = lazy(() =>
  import("./pages/PlannedBudgetByIdReport").then((module) => ({
    default: module.PlannedBudgetByIdReport,
  })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center bg-bg-main">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    /**
     * AuthProvider wraps the entire router so that auth state is available
     * to every route component (via useAuth()). It also injects its logout
     * function into the Axios instance so 401 responses are handled globally.
     */

    <AuthProvider>
      <BrowserRouter>
        <UploadedContractContext>
          <EditContractContext>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {/* ---------------------------------------------------------- */}
              {/* Protected routes — all require authentication                */}
              {/*                                                            */}
              {/* Nesting: PrivateRoute → DashboardLayout → page routes       */}
              {/*   1. PrivateRoute checks auth (loading→spinner, !auth→login) */}
              {/*   2. DashboardLayout renders sidebar + topbar + <Outlet /> */}
              {/*   3. Matched page route renders inside the outlet            */}
              {/*                                                            */}
              {/* This means every new page automatically gets auth + chrome.  */}
              {/* ---------------------------------------------------------- */}

              <Route element={<PrivateRoute />}>
                <Route element={<DashboardLayout />}>
                  {/* Dashboard */}
                  <Route
                    path="/dashboard"
                    element={
                      <RoleGuard
                        roles={[
                          "contract_manager",
                          "finance_team",
                          "top_management",
                        ]}
                      >
                        <DashboardPage />
                      </RoleGuard>
                    }
                  />
                  {/* Contracts */}
                  {/* NOTE: No /contracts list page per Figma — "Add Project"     */}
                  {/* button on dashboard navigates directly to /contracts/upload. */}
                  //* Make sure you make the role gard of this route
                  <Route
                    path="/contracts"
                    element={
                      <RoleGuard roles={["contract_manager"]}>
                        <ContractsPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/contracts/upload"
                    element={
                      <RoleGuard roles={["contract_manager"]}>
                        <UploadContractPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/contracts/:id"
                    element={<ContractDetailPage />}
                  />
                  <Route
                    path="/contracts/:id/edit"
                    element={
                      <RoleGuard roles={["contract_manager"]}>
                        <ReviewEditFormPage />
                      </RoleGuard>
                    }
                  />
                  {/* Reports (tabs) */}
                  <Route
                    path="/reports"
                    element={
                      <RoleGuard
                        roles={[
                          "top_management",
                          "contract_manager",
                          "finance_team",
                        ]}
                      >
                        <ReportsPage />
                      </RoleGuard>
                    }
                  />
                  {/* Admin — PMO only */}
                  <Route
                    path="/admin"
                    element={
                      <RoleGuard roles={["pmo"]}>
                        <AdminPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/reports/contracts"
                    element={<ContractsReport />}
                  />
                  <Route
                    path="/reports/planned-budget"
                    element={<PlannedBudgetReport />}
                  />
                  <Route
                    path="/reports/planned-budget/:id"
                    element={<PlannedBudgetByIdReport />}
                  />
                  {/* 404 catch-all */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>
              </Routes>
            </Suspense>
          </EditContractContext>
        </UploadedContractContext>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
