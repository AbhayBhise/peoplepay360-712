import React, { useState, useEffect } from 'react';
import { CalendarCheck, Plus, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { schedulesApi } from '../../api/schedules';
import { WorkingSchedule, WorkingScheduleLine } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { extractItems } from '../../utils/pagination';

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const WorkingSchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Full Time' | 'Part Time' | 'Flexible'>('All');

  // Inspect schedule details modal
  const [selectedSchedule, setSelectedSchedule] = useState<WorkingSchedule | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Full Time');
  const [lines, setLines] = useState<WorkingScheduleLine[]>(
    DEFAULT_DAYS.map((day) => ({
      day,
      start_time: '09:00',
      end_time: '17:00',
      break: 60, // 60 minutes
    }))
  );
  const [submitting, setSubmitting] = useState(false);

  const { isHRMPlus } = useAuth();
  const { success, error } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = extractItems(await schedulesApi.getSchedules());
      setSchedules(data || []);
    } catch (err: any) {
      error(err.message || 'Failed to load working schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const filtered = schedules.filter((s) => {
    if (typeFilter !== 'All' && s.type !== typeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || String(s.id).toLowerCase().includes(q) || s.type.toLowerCase().includes(q);
  });

  // Compute live weekly hours client-side for feedback
  const computeLiveWeeklyHours = () => {
    let totalMinutes = 0;
    for (const line of lines) {
      if (line.start_time && line.end_time) {
        const [startH, startM] = line.start_time.split(':').map(Number);
        const [endH, endM] = line.end_time.split(':').map(Number);
        const diffMinutes = endH * 60 + endM - (startH * 60 + startM) - (line.break || 0);
        if (diffMinutes > 0) {
          totalMinutes += diffMinutes;
        }
      }
    }
    return (totalMinutes / 60).toFixed(1);
  };

  const handleOpenCreate = () => {
    setName('');
    setType('Full Time');
    setLines(
      DEFAULT_DAYS.map((day) => ({
        day,
        start_time: '09:00',
        end_time: '17:00',
        break: 60,
      }))
    );
    setIsModalOpen(true);
  };

  const handleUpdateLine = (index: number, field: keyof WorkingScheduleLine, val: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: val };
    setLines(updated);
  };

  const handleAddDay = () => {
    setLines([...lines, { day: 'Saturday', start_time: '09:00', end_time: '14:00', break: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Schedule name is required.');
      return;
    }

    for (const line of lines) {
      if (line.end_time <= line.start_time) {
        error(`On ${line.day}: End time (${line.end_time}) must be later than Start time (${line.start_time}).`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await schedulesApi.createSchedule({
        name: name.trim(),
        type,
        lines,
      });

      success(`Working schedule "${name}" created.`);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save working schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const fullTimeCount = schedules.filter((s) => s.type === 'Full Time').length;
  const partTimeCount = schedules.filter((s) => s.type === 'Part Time').length;
  const flexCount = schedules.filter((s) => s.type !== 'Full Time' && s.type !== 'Part Time').length;
  const avgHours = schedules.length > 0 ? (schedules.reduce((sum, s) => sum + (Number(s.weekly_hours) || 0), 0) / schedules.length).toFixed(1) : '0';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Working Schedules</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure shift calendars, daily working hours, and weekly standard duration
          </p>
        </div>

        {isHRMPlus() && (
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
            New Schedule
          </Button>
        )}
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setTypeFilter('All')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer ${
            typeFilter === 'All'
              ? 'border-indigo-600 ring-2 ring-indigo-500/20 dark:border-indigo-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Schedules</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{schedules.length}</div>
          <div className="text-2xs text-slate-400 mt-1">Active company shifts</div>
        </div>

        <div
          onClick={() => setTypeFilter('Full Time')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer ${
            typeFilter === 'Full Time'
              ? 'border-teal-600 ring-2 ring-teal-500/20 dark:border-teal-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Full Time</div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{fullTimeCount}</div>
          <div className="text-2xs text-teal-500/80 mt-1">Standard weekly rosters</div>
        </div>

        <div
          onClick={() => setTypeFilter('Part Time')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer ${
            typeFilter === 'Part Time'
              ? 'border-blue-600 ring-2 ring-blue-500/20 dark:border-blue-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Part Time</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{partTimeCount}</div>
          <div className="text-2xs text-blue-500/80 mt-1">Partial shift allocations</div>
        </div>

        <div
          onClick={() => setTypeFilter('Flexible')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer ${
            typeFilter === 'Flexible'
              ? 'border-purple-600 ring-2 ring-purple-500/20 dark:border-purple-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Flexible / Other</div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{flexCount}</div>
          <div className="text-2xs text-purple-500/80 mt-1">Avg: {avgHours} hrs/week</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search schedules by name, type, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {(['All', 'Full Time', 'Part Time', 'Flexible'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  typeFilter === t
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <Spinner label="Loading working schedules..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Schedules Found"
          description={search || typeFilter !== 'All' ? 'No schedules match your search filters.' : "Create your company's standard weekly schedule (e.g. Standard 40h/week)."}
          actionLabel={isHRMPlus() ? 'Create Schedule' : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSchedule(s)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{s.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-2xs font-bold border border-indigo-100 dark:border-indigo-800">
                      {s.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs mt-3">
                    <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>
                      Standard weekly duration:{' '}
                      <strong className="text-slate-900 dark:text-white font-bold">{s.weekly_hours} hrs/week</strong>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-2xs flex items-center justify-between text-slate-400 dark:text-slate-500">
                  <span>Schedule #{s.id}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">View Shift Breakdown →</span>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(filtered.length / itemsPerPage))}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Inspect Shifts Modal */}
      <Modal
        isOpen={!!selectedSchedule}
        onClose={() => setSelectedSchedule(null)}
        title={selectedSchedule ? `${selectedSchedule.name} — Shift Details` : 'Schedule Details'}
        description={`Type: ${selectedSchedule?.type || 'Standard'} • Total Weekly Duration: ${selectedSchedule?.weekly_hours || 0} Hours`}
      >
        <div className="space-y-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {selectedSchedule?.lines && selectedSchedule.lines.length > 0 ? (
              selectedSchedule.lines.map((line, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{line.day}</span>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {line.start_time} - {line.end_time}
                    </span>
                    {line.break ? <span className="text-2xs text-slate-400">({line.break}m break)</span> : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                Default shift line configurations apply (Monday to Friday, 9:00 AM – 5:00 PM).
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setSelectedSchedule(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Working Schedule"
        description="Define day shifts. Weekly hours will be auto-calculated in real time."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Schedule Name"
              placeholder="e.g. Standard 40h (Mon-Fri)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Select
              label="Schedule Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: 'Full Time', label: 'Full Time' },
                { value: 'Part Time', label: 'Part Time' },
                { value: 'Flexible', label: 'Flexible Shift' },
              ]}
            />
          </div>

          {/* Schedule Lines */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Daily Shift Lines
              </label>
              <button
                type="button"
                onClick={handleAddDay}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Day
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="col-span-3 font-semibold text-slate-800 dark:text-slate-200">{line.day}</div>
                  <div className="col-span-3">
                    <input
                      type="time"
                      value={line.start_time}
                      onChange={(e) => handleUpdateLine(idx, 'start_time', e.target.value)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded text-2xs"
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="time"
                      value={line.end_time}
                      onChange={(e) => handleUpdateLine(idx, 'end_time', e.target.value)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded text-2xs"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Break (m)"
                      value={line.break}
                      onChange={(e) => handleUpdateLine(idx, 'break', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded text-2xs"
                      title="Break in minutes"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Computed Total Badge */}
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-xs flex items-center justify-between text-teal-900 dark:text-teal-200 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Live Calculated Weekly Total:
              </span>
              <span className="font-bold font-mono text-sm">{computeLiveWeeklyHours()} Hours / Week</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Save Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
