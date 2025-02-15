import { useState } from 'react';
import type { Employee, ShiftTime } from '../App';

interface AvailabilityTableProps {
  employees: Employee[];
  shiftTimes: ShiftTime[];
  shiftsPerDay: number;
  selectedDates: Date[];
  onUpdateAvailability: (employees: Employee[]) => void;
  onNext: () => void;
}

export default function AvailabilityTable({
  employees,
  shiftTimes,
  shiftsPerDay,
  selectedDates,
  onUpdateAvailability,
  onNext,
}: AvailabilityTableProps) {
  const toggleAvailability = (employeeId: string, date: string, hour: number) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        const newAvailability = { ...emp.availability };
        // Ensure the date array exists, otherwise initialize it
        if (!newAvailability[date]) {
          newAvailability[date] = [];
        }
        newAvailability[date][hour] = !newAvailability[date][hour];
        return { ...emp, availability: newAvailability };
      }
      return emp;
    });
    onUpdateAvailability(updatedEmployees);
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Set Availability</h2>
      
      {selectedDates.map((date) => {
        const dateString = date.toISOString().split('T')[0];
        
        return (
          <div key={dateString} className="mb-8">
            <h3 className="text-xl font-medium text-gray-900 mb-4">
              {formatDate(date)}
            </h3>
            
            {Array.from({ length: shiftsPerDay }).map((_, shiftIndex) => {
              const shiftTime = shiftTimes[shiftIndex];
              const totalHours = shiftTime.end - shiftTime.start;

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
                            Employee
                          </th>
                          {Array.from({ length: totalHours }).map((_, i) => (
                            <th
                              key={i}
                              className="px-4 py-2 border-b-2 border-gray-200 bg-gray-50 text-center text-sm font-semibold text-gray-700"
                            >
                              {formatHour(shiftTime.start + i)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((employee) => (
                          <tr key={`${employee.id}-${shiftIndex}`}>
                            <td className="px-4 py-2 border-b border-gray-200 text-sm font-medium text-gray-900">
                              {employee.name}
                            </td>
                            {Array.from({ length: totalHours }).map((_, hour) => {
                              const availabilityIndex = hour + (shiftIndex * 24);
                              return (
                                <td
                                  key={hour}
                                  className="px-4 py-2 border-b border-gray-200 text-center"
                                >
                                  <button
                                    onClick={() => toggleAvailability(employee.id, dateString, availabilityIndex)}
                                    className={`w-6 h-6 rounded transition-colors ${
                                      employee.availability[dateString]?.[availabilityIndex]
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : 'bg-red-500 hover:bg-red-600'
                                    }`}
                                    aria-label={employee.availability[dateString]?.[availabilityIndex] ? 'Available' : 'Not Available'}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="mt-6">
        <button
          onClick={onNext}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Generate Schedule
        </button>
      </div>
    </div>
  );
}
