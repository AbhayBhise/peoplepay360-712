import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Attendance } from '../../types';
import { Play, Square } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, differenceInSeconds } from 'date-fns';
import { useAttendanceList, useCheckIn, useCheckOut } from '../../hooks/useAttendance';

export const AttendanceWidget: React.FC = () => {
  const { user } = useAuth();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { data: attendanceData, isLoading: isFetching } = useAttendanceList(
    { employee_id: user?.employee_id, limit: 10 },
    { enabled: !!user?.employee_id }
  );

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const isLoading = isFetching || checkInMutation.isPending || checkOutMutation.isPending;

  const items = Array.isArray(attendanceData) ? attendanceData : (attendanceData as any)?.items || [];
  const currentAttendance = items.find((a: Attendance) => !(a as any).checkOut && !a.check_out);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentAttendance) {
      const checkInTime = new Date((currentAttendance as any).checkIn || currentAttendance.check_in || '');
      const updateElapsed = () => {
        const diff = differenceInSeconds(new Date(), checkInTime);
        setElapsedSeconds(diff > 0 ? diff : 0);
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentAttendance]);

  const handleToggle = async () => {
    if (!user?.employee_id) {
      toast.error('No employee profile linked to your user.');
      return;
    }

    try {
      if (currentAttendance) {
        // Check out
        await checkOutMutation.mutateAsync({
          id: currentAttendance.id,
          data: { checkOut: new Date().toISOString() },
        });
        toast.success('Successfully checked out.');
      } else {
        // Check in
        await checkInMutation.mutateAsync({
          employeeId: user.employee_id,
          checkIn: new Date().toISOString(),
        });
        toast.success('Successfully checked in.');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error updating attendance');
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user?.employee_id) return null;

  const isActive = !!currentAttendance;

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div
        className={`w-2 h-2 rounded-full animate-pulse ${
          isActive ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />
      <div className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 w-16 text-center">
        {isActive ? formatTime(elapsedSeconds) : '00:00:00'}
      </div>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-2xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50
          ${
            isActive
              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50 dark:hover:bg-rose-900/50'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 dark:hover:bg-emerald-900/50'
          }
        `}
      >
        {isActive ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        {isActive ? 'CHECK OUT' : 'CHECK IN'}
      </button>
    </div>
  );
};
