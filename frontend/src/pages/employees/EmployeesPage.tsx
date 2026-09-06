import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  LayoutGrid,
  List,
  Plus,
  Search,
  Building2,
  UserCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { employeesApi } from '../../api/employees';
import { departmentsApi } from '../../api/departments';
import { Employee, Department } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { EmployeeFormModal } from './EmployeeFormModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Select } from '../../components/common/Select';
import { extractItems } from '../../utils/pagination';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const navigate = useNavigate();
  const { isHRMPlus } = useAuth();
  const { error: toastError } = useToast();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedDept) params.department_id = selectedDept;
      if (selectedStatus) params.status = selectedStatus;
      if (searchQuery) params.search = searchQuery;

      const data = extractItems(await employeesApi.getEmployees(params));
      setEmployees(extractItems(data) || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = extractItems(await departmentsApi.getDepartments());
      setDepartments(data || []);
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchEmployees();
    setCurrentPage(1);
  }, [selectedDept, selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees();
    setCurrentPage(1);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      !searchQuery ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.job_position?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = !selectedDept || emp.department_id === selectedDept;
    const matchesStatus = !selectedStatus || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Employees Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your organization's workforce, organizational hierarchy, and contract profiles
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {isHRMPlus() && (
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              New Employee
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4! shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 items-end">
          <form onSubmit={handleSearchSubmit} className="sm:col-span-2 relative">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search employee by name, position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </form>

          <div>
            <Select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
              placeholder="All Departments"
            />
          </div>

          <div>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              placeholder="All Statuses"
            />
          </div>
        </div>
      </Card>

      {/* Employee Content */}
      {loading ? (
        <Spinner label="Loading employees from live database..." />
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          title="No Employees Found"
          description={
            searchQuery || selectedDept || selectedStatus
              ? 'No employees match the applied filter criteria.'
              : 'No employees recorded in the system yet. Click "New Employee" to create the first record.'
          }
          actionLabel={isHRMPlus() ? 'Create Employee' : undefined}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : viewMode === 'kanban' ? (
        /* KANBAN VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-indigo-600 to-teal-500 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <Badge variant={emp.status === 'active' ? 'active' : 'inactive'} size="sm">
                      {emp.status}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                    {emp.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{emp.job_position}</p>

                  <div className="mt-3.5 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-2xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.department_name || `Department #${emp.department_id || '—'}`}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Manager: {emp.manager_name || 'None'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between text-2xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredEmployees.length / itemsPerPage)}
              totalItems={filteredEmployees.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Job Position</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                          <div className="text-2xs text-slate-400 dark:text-slate-500">ID: #{emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-200">{emp.job_position}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {emp.department_name || `Dept #${emp.department_id || '—'}`}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{emp.manager_name || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={emp.status === 'active' ? 'active' : 'inactive'} size="sm">
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                        View Hub →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredEmployees.length / itemsPerPage)}
            totalItems={filteredEmployees.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Create Employee Modal */}
      <EmployeeFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newEmp) => {
          setEmployees((prev) => [newEmp, ...prev]);
        }}
      />
    </div>
  );
};
