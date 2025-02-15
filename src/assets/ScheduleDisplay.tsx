// import React from 'react';
import { RefreshCw } from 'lucide-react';
import type { Employee, Shift, ShiftTime } from '../App';

interface ScheduleDisplayProps {
  shifts: Shift[];
  employees: Employee[];
  workersPerShift: number;
  selectedDates: Date[];
  shiftTimes: ShiftTime[];
  shiftsPerDay: number;
  onReset: () => void;
}

export default function ScheduleDisplay({
  shifts,
  employees,
  workersPerShift,
  selectedDates,
  shiftTimes,
  shiftsPerDay,
  onReset,
}: ScheduleDisplayProps) {
  const getEmployeeName = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.name || 'Unknown';
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Sort dates chronologically
  const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Final Schedule</h2>
          <p className="text-gray-600 mt-1">
            {sortedDates.length} day{sortedDates.length > 1 ? 's' : ''} schedule
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Start Over
        </button>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Total Hours Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(employee => (
            <div
              key={employee.id}
              className={`bg-gray-50 rounded-lg p-4 ${
                employee.hoursWorked >= employee.maxHours ? 'border-2 border-yellow-500' : ''
              }`}
            >
              <div className="font-medium text-gray-900">{employee.name}</div>
              <div className="text-sm text-gray-500">
                Total Hours: {employee.hoursWorked} / {employee.maxHours}
              </div>
              {employee.hoursWorked >= employee.maxHours && (
                <div className="text-sm text-yellow-600 mt-1">
                  Maximum hours reached
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {sortedDates.map((date) => {
        const dateString = date.toISOString().split('T')[0];
        const dayShifts = shifts.filter(s => s.date === dateString);

        // Group shifts by shift number and hour
        const shiftsByNumber = dayShifts.reduce((acc, shift) => {
          if (!acc[shift.shiftNumber]) {
            acc[shift.shiftNumber] = {};
          }
          if (!acc[shift.shiftNumber][shift.hour]) {
            acc[shift.shiftNumber][shift.hour] = [];
          }
          acc[shift.shiftNumber][shift.hour].push(shift);
          return acc;
        }, {} as Record<number, Record<number, Shift[]>>);

        return (
          <div key={dateString} className="mb-12">
            <h3 className="text-xl font-medium text-gray-900 mb-4">
              {formatDate(date)}
            </h3>

            {Array.from({ length: shiftsPerDay }).map((_, shiftIndex) => {
              const shiftTime = shiftTimes[shiftIndex];
              const shiftHours = shiftsByNumber[shiftIndex] || {};

              return (
                <div key={shiftIndex} className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Shift {shiftIndex + 1} ({formatHour(shiftTime.start)} - {formatHour(shiftTime.end)})
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-50 text-left text-sm font-semibold text-gray-700">
                            Time
                          </th>
                          <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-50 text-left text-sm font-semibold text-gray-700">
                            Workers ({workersPerShift} needed)
                          </th>
                          <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-50 text-left text-sm font-semibold text-gray-700">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: shiftTime.end - shiftTime.start }).map((_, hour) => {
                          const currentHour = shiftTime.start + hour;
                          const hourShifts = shiftHours[currentHour] || [];

                          return (
                            <tr key={hour}>
                              <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-900">
                                {formatHour(currentHour)}
                              </td>
                              <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-900">
                                <div className="space-y-1">
                                  {hourShifts.map((shift, index) => (
                                    <div key={index}>{getEmployeeName(shift.employeeId)}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-2 border-b border-gray-200 text-sm">
                                {hourShifts.length === workersPerShift ? (
                                  <span className="text-green-600">Fully Staffed</span>
                                ) : (
                                  <span className="text-red-600">
                                    Understaffed ({hourShifts.length}/{workersPerShift})
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}