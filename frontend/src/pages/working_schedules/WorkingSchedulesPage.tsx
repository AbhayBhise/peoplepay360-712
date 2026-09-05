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
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const WorkingSchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [loading, setLoading] = useState(true);

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
      const data = await schedulesApi.getSchedules();
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#714B67]" />
            <span>Working Schedules</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure shift calendars, daily working hours, and weekly standard duration
          </p>
        </div>

        {isHRMPlus() && (
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
            New Schedule
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <Spinner label="Loading working schedules..." />
      ) : schedules.length === 0 ? (
        <EmptyState
          title="No Schedules Found"
          description="Create your company's standard weekly schedule (e.g. Standard 40h/week)."
          actionLabel={isHRMPlus() ? 'Create Schedule' : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#714B67] text-2xs font-bold border border-purple-100">
                    {s.type}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-600 text-xs mt-3">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>
                    Auto-computed weekly hours:{' '}
                    <strong className="text-slate-900 font-bold">{s.weekly_hours} hrs/week</strong>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-2xs text-slate-400">
                Schedule ID: #{s.id}
              </div>
            </div>
          ))}
        </div>
      )}

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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Daily Shift Lines
              </label>
              <button
                type="button"
                onClick={handleAddDay}
                className="text-xs font-semibold text-[#714B67] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Day
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                >
                  <div className="col-span-3 font-semibold text-slate-800">{line.day}</div>
                  <div className="col-span-3">
                    <input
                      type="time"
                      value={line.start_time}
                      onChange={(e) => handleUpdateLine(idx, 'start_time', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-2xs"
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="time"
                      value={line.end_time}
                      onChange={(e) => handleUpdateLine(idx, 'end_time', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-2xs"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Break (m)"
                      value={line.break}
                      onChange={(e) => handleUpdateLine(idx, 'break', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-2xs"
                      title="Break in minutes"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Computed Total Badge */}
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs flex items-center justify-between text-teal-900 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Live Calculated Weekly Total:
              </span>
              <span className="font-bold font-mono text-sm">{computeLiveWeeklyHours()} Hours / Week</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
