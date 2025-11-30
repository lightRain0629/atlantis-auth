import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./components/layout";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import VerifyEmailPage from "./pages/verify-email";
import ForgotPasswordPage from "./pages/forgot-password";
import ResetPasswordPage from "./pages/reset-password";
import TodosPage from "./pages/todos";
import SessionsPage from "./pages/sessions";
import UsersPage from "./pages/users";
import HomePage from "./pages/home";
import OAuthBridgePage from "./pages/oauth-bridge";
import { RequireAdmin, RequireAuth } from "./components/protected-route";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/oauth/:provider" element={<OAuthBridgePage />} />

          <Route
            path="/todos"
            element={
              <RequireAuth>
                <TodosPage />
              </RequireAuth>
            }
          />
          <Route
            path="/sessions"
            element={
              <RequireAuth>
                <SessionsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/users"
            element={
              <RequireAdmin>
                <UsersPage />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster position="top-center" richColors closeButton />
    </BrowserRouter>
  );
}

export default App;
