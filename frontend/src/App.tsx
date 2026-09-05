/**
 * Top-level route table for the app.
 *
 * /login and /signup are public. Everything else is nested under
 * <ProtectedRoute> + <AppLayout>, so a single auth check and a single
 * shared nav bar cover every logged-in page automatically.
 */

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AboutPage } from "./pages/AboutPage";
import { BudgetsPage } from "./pages/BudgetsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { YearlyPage } from "./pages/YearlyPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/yearly" element={<YearlyPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
