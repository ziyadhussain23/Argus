// Argus Frontend - Main Application Entry Point
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AnimatedBackground } from "@/components/AnimatedBackground";

// Lazy-loaded page components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Servers = lazy(() => import("./pages/Servers"));
const AddServer = lazy(() => import("./pages/AddServer"));
const ServerDetail = lazy(() => import("./pages/ServerDetail"));
const Alerts = lazy(() => import("./pages/Alerts"));
const AlertRules = lazy(() => import("./pages/AlertRules"));
const Settings = lazy(() => import("./pages/Settings"));
const History = lazy(() => import("./pages/History"));
const NotFound = lazy(() => import("./pages/NotFound"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const EmailVerificationSent = lazy(() => import("./pages/EmailVerificationSent"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Status = lazy(() => import("./pages/Status"));
const GettingStarted = lazy(() => import("./pages/docs/GettingStarted"));
const CoreFeatures = lazy(() => import("./pages/docs/CoreFeatures"));
const APIReference = lazy(() => import("./pages/docs/APIReference"));
const SecurityCompliance = lazy(() => import("./pages/docs/SecurityCompliance"));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
    <Route path="/" element={<Index />} />
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      }
    />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="/email-sent" element={<EmailVerificationSent />} />
    <Route
      path="/forgot-password"
      element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      }
    />
    <Route
      path="/reset-password"
      element={
        <PublicRoute>
          <ResetPassword />
        </PublicRoute>
      }
    />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/servers"
      element={
        <ProtectedRoute>
          <Servers />
        </ProtectedRoute>
      }
    />
    <Route
      path="/servers/new"
      element={
        <ProtectedRoute>
          <AddServer />
        </ProtectedRoute>
      }
    />
    <Route
      path="/servers/:id"
      element={
        <ProtectedRoute>
          <ServerDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/alerts"
      element={
        <ProtectedRoute>
          <Alerts />
        </ProtectedRoute>
      }
    />
    <Route
      path="/rules"
      element={
        <ProtectedRoute>
          <AlertRules />
        </ProtectedRoute>
      }
    />
    <Route
      path="/history"
      element={
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      }
    />
    <Route path="/about" element={<About />} />
    <Route path="/faq" element={<FAQ />} />
    <Route path="/help" element={<HelpSupport />} />
    <Route path="/docs" element={<Documentation />} />
    <Route path="/docs/getting-started" element={<GettingStarted />} />
    <Route path="/docs/features" element={<CoreFeatures />} />
    <Route path="/docs/api" element={<APIReference />} />
    <Route path="/docs/security" element={<SecurityCompliance />} />
    <Route path="/status" element={<Status />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/cookies" element={<Cookies />} />
    <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AnimatedBackground />
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
