import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoader, RouteFallbackLoader } from './components/common/PageLoader';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy-loaded route components for high performance and code-splitting
const LandingPage = lazy(() => import('./pages/landing/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const EmployeesPage = lazy(() => import('./pages/employees/EmployeesPage').then((m) => ({ default: m.EmployeesPage })));
const EmployeeDetailPage = lazy(() => import('./pages/employees/EmployeeDetailPage').then((m) => ({ default: m.EmployeeDetailPage })));
const DepartmentsPage = lazy(() => import('./pages/departments/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage })));
const ContractsPage = lazy(() => import('./pages/contracts/ContractsPage').then((m) => ({ default: m.ContractsPage })));
const WorkingSchedulesPage = lazy(() => import('./pages/working_schedules/WorkingSchedulesPage').then((m) => ({ default: m.WorkingSchedulesPage })));
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage').then((m) => ({ default: m.AttendancePage })));
const TimeOffPage = lazy(() => import('./pages/timeoff/TimeOffPage').then((m) => ({ default: m.TimeOffPage })));
const PayrunsPage = lazy(() => import('./pages/payroll/PayrunsPage').then((m) => ({ default: m.PayrunsPage })));
const PayrunDetailPage = lazy(() => import('./pages/payroll/PayrunDetailPage').then((m) => ({ default: m.PayrunDetailPage })));
const AllPayslipsPage = lazy(() => import('./pages/payroll/AllPayslipsPage').then((m) => ({ default: m.AllPayslipsPage })));
const PayslipDetailPage = lazy(() => import('./pages/payroll/PayslipDetailPage').then((m) => ({ default: m.PayslipDetailPage })));
const SalaryStructuresPage = lazy(() => import('./pages/payroll/SalaryStructuresPage').then((m) => ({ default: m.SalaryStructuresPage })));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })));
const UsersPage = lazy(() => import('./pages/admin/UsersPage').then((m) => ({ default: m.UsersPage })));
const SignupPage = lazy(() => import('./pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })));

// Route guard that checks authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteFallbackLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Route guard for public login route
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteFallbackLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Route guard for role-based access
const RoleProtectedRoute: React.FC<{
  children: React.ReactNode;
  isAllowed?: (auth: ReturnType<typeof useAuth>) => boolean;
  role?: string | string[];
}> = ({ children, isAllowed, role }) => {
  const auth = useAuth();
  const { error: toastError } = useToast();
  const allowed = isAllowed ? isAllowed(auth) : role ? auth.hasRole(role as any) : true;

  React.useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && !allowed) {
      const roleMsg = role
        ? `Access restricted. Requires ${Array.isArray(role) ? role.join(' / ') : role} role permissions.`
        : "You don't have access to that page";
      toastError(roleMsg, 'Unauthorized Access');
    }
  }, [auth.isLoading, auth.isAuthenticated, allowed, toastError, role]);

  if (auth.isLoading) {
    return <RouteFallbackLoader />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Landing Page */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Public Login Route */}
                  <Route
                    path="/login"
                    element={
                      <PublicOnlyRoute>
                        <LoginPage />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <PublicOnlyRoute>
                        <ForgotPasswordPage />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route
                    path="/reset-password"
                    element={
                      <PublicOnlyRoute>
                        <ResetPasswordPage />
                      </PublicOnlyRoute>
                    }
                  />

                  {/* Public Signup Route */}
                  <Route
                    path="/signup"
                    element={
                      <PublicOnlyRoute>
                        <SignupPage />
                      </PublicOnlyRoute>
                    }
                  />

                  {/* Protected App Routes */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/employees" element={<EmployeesPage />} />
                    <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                    <Route path="/departments" element={<RoleProtectedRoute isAllowed={(a) => a.isHRMPlus()}><DepartmentsPage /></RoleProtectedRoute>} />
                    <Route path="/contracts" element={<RoleProtectedRoute isAllowed={(a) => a.isHRMPlus() || a.hasRole('Employee')}><ContractsPage /></RoleProtectedRoute>} />
                    <Route path="/working-schedules" element={<RoleProtectedRoute isAllowed={(a) => a.isHRMPlus()}><WorkingSchedulesPage /></RoleProtectedRoute>} />
                    <Route path="/attendance" element={<AttendancePage />} />
                    <Route path="/time-off" element={<TimeOffPage />} />
                    <Route path="/payroll/payruns" element={<RoleProtectedRoute isAllowed={(a) => a.isHRPUPlus()}><PayrunsPage /></RoleProtectedRoute>} />
                    <Route path="/payroll/payruns/:id" element={<RoleProtectedRoute isAllowed={(a) => a.isHRPUPlus()}><PayrunDetailPage /></RoleProtectedRoute>} />
                    <Route path="/payroll/payslips" element={<AllPayslipsPage />} />
                    <Route path="/payroll/payslips/:id" element={<PayslipDetailPage />} />
                    <Route path="/payroll/salary-structures" element={<RoleProtectedRoute isAllowed={(a) => a.isHRPUPlus()}><SalaryStructuresPage /></RoleProtectedRoute>} />
                    <Route path="/reports" element={<RoleProtectedRoute isAllowed={(a) => a.isHRPUPlus()}><ReportsPage /></RoleProtectedRoute>} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/admin/users" element={<RoleProtectedRoute isAllowed={(a) => a.isAdmin()}><UsersPage /></RoleProtectedRoute>} />
                    <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
                  </Route>

                  {/* Catch-all fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
