import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EmployeesPage } from './pages/employees/EmployeesPage';
import { EmployeeDetailPage } from './pages/employees/EmployeeDetailPage';
import { DepartmentsPage } from './pages/departments/DepartmentsPage';
import { ContractsPage } from './pages/contracts/ContractsPage';
import { WorkingSchedulesPage } from './pages/working_schedules/WorkingSchedulesPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { TimeOffPage } from './pages/timeoff/TimeOffPage';
import { PayrunsPage } from './pages/payroll/PayrunsPage';
import { PayrunDetailPage } from './pages/payroll/PayrunDetailPage';
import { AllPayslipsPage } from './pages/payroll/AllPayslipsPage';
import { PayslipDetailPage } from './pages/payroll/PayslipDetailPage';
import { SalaryStructuresPage } from './pages/payroll/SalaryStructuresPage';
import { Spinner } from './components/common/Spinner';

// Route guard that checks authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner label="Verifying session..." size="lg" />
      </div>
    );
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner label="Loading..." size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />

            {/* Protected App Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="employees/:id" element={<EmployeeDetailPage />} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="contracts" element={<ContractsPage />} />
              <Route path="working-schedules" element={<WorkingSchedulesPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="time-off" element={<TimeOffPage />} />
              <Route path="payroll/payruns" element={<PayrunsPage />} />
              <Route path="payroll/payruns/:id" element={<PayrunDetailPage />} />
              <Route path="payroll/payslips" element={<AllPayslipsPage />} />
              <Route path="payroll/payslips/:id" element={<PayslipDetailPage />} />
              <Route path="payroll/salary-structures" element={<SalaryStructuresPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
