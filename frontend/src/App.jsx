import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/common/PrivateRoute";
import DashboardLayout from "./components/common/DashboardLayout";
import RoleGuard from "./components/common/RoleGuard";

/* ------------------------------------------------------------------ */
// Pages — all stubs initially, built out per sprint
/* ------------------------------------------------------------------ */

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UploadContractPage from "./pages/UploadContractPage";
import ContractDetailPage from "./pages/ContractDetailPage";
import ReviewEditFormPage from "./pages/ReviewEditFormPage";
import FinancePage from "./pages/FinancePage";
import BudgetVariancePage from "./pages/BudgetVariancePage";
import ProgressListPage from "./pages/ProgressListPage";
import ProgressFormPage from "./pages/ProgressFormPage";
import ReviewProgressPage from "./pages/ReviewProgressPage";
import ReportsPage from "./pages/ReportsPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./components/common/NotFoundPage";
import ContractsPage from "./pages/ContractsPage";
import EditContractContext from "./context/EditContaractContext";

function App() {
  return (
    /**
     * AuthProvider wraps the entire router so that auth state is available
     * to every route component (via useAuth()). It also injects its logout
     * function into the Axios instance so 401 responses are handled globally.
     */
    //! comment it out so you can work on the design without crashing
    // <AuthProvider>
    <BrowserRouter>
      <EditContractContext>
        <Routes>
          //! comment it out so you can work on the design without crashing
          {/* <Route path="/login" element={<LoginPage />} /> */}
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
          //! commented out for now so we can work on the design without
          crashing
          {/* <Route element={<PrivateRoute />}> */}
          <Route element={<DashboardLayout />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Contracts */}
            {/* NOTE: No /contracts list page per Figma — "Add Project"     */}
            {/* button on dashboard navigates directly to /contracts/upload. */}
            //* Make sure you make the role gard of this route
            <Route path="/contracts" element={<ContractsPage />} />
            <Route
              path="/contracts/upload"
              element={
                // ! commented for now so we can work on the design without crashing
                //<RoleGuard roles={["contract_manager"]}>
                <UploadContractPage />
                //! commented out for now so we can work on the design without crashing
                // </RoleGuard>
              }
            />
            <Route path="/contracts/:id" element={<ContractDetailPage />} />
            <Route
              path="/contracts/:id/edit"
              element={
                //<RoleGuard roles={["contract_manager"]}>
                <ReviewEditFormPage />
                // </RoleGuard>
              }
            />
            {/* Finance */}
            <Route path="/finance" element={<FinancePage />} />
            <Route
              path="/finance/:contractId/variance"
              element={<BudgetVariancePage />}
            />
            <Route
              path="/finance/:contractId/progress"
              element={<ProgressListPage />}
            />
            <Route
              path="/finance/:contractId/progress/new"
              element={
                <RoleGuard roles={["finance_team"]}>
                  <ProgressFormPage />
                </RoleGuard>
              }
            />
            <Route
              path="/finance/:contractId/progress/:entryId/edit"
              element={
                <RoleGuard roles={["finance_team"]}>
                  <ProgressFormPage />
                </RoleGuard>
              }
            />
            <Route
              path="/finance/:contractId/progress/:entryId/review"
              element={
                <RoleGuard roles={["contract_manager"]}>
                  <ReviewProgressPage />
                </RoleGuard>
              }
            />
            {/* Reports (tabs) */}
            <Route path="/reports" element={<ReportsPage />} />
            {/* Admin */}
            <Route path="/admin" element={<AdminPage />} />
            {/* 404 catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          //! commented out for now so we can work on the design without
          crashing
          {/* </Route> */}
        </Routes>
      </EditContractContext>
    </BrowserRouter>
    //! comment it out so you can work on the design without crashing
    // </AuthProvider>
  );
}

export default App;
