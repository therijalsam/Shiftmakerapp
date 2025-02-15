import React, { useState } from 'react';
import { Plus, MinusCircle, CalendarPlus, CalendarX } from 'lucide-react';
import type { Employee, ShiftTime } from '../App';

interface ShiftMakerProps {
  onNext: (
    dates: Date[],
    shiftsPerDay: number,
    shiftTimes: ShiftTime[],
    employees: Employee[],
    workersPerShift: number
  ) => void;
}

interface EmployeeInput {
  name: string;
  maxHours: number;
}

export default function ShiftMaker({ onNext }: ShiftMakerProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]);
  const [shiftsPerDay, setShiftsPerDay] = useState(1);
  const [shiftTimes, setShiftTimes] = useState<ShiftTime[]>([
    { start: 9, end: 17 }
  ]);
  const [workersPerShift, setWorkersPerShift] = useState(1);
  const [employeeInputs, setEmployeeInputs] = useState<EmployeeInput[]>([{ name: '', maxHours: 40 }]);

  const addEmployee = () => {
    setEmployeeInputs([...employeeInputs, { name: '', maxHours: 40 }]);
  };

  const removeEmployee = (index: number) => {
    setEmployeeInputs(employeeInputs.filter((_, i) => i !== index));
  };

  const updateEmployeeInput = (index: number, field: keyof EmployeeInput, value: string | number) => {
    const newInputs = [...employeeInputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setEmployeeInputs(newInputs);
  };

  const addDate = () => {
    const lastDate = selectedDates[selectedDates.length - 1];
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDates([...selectedDates, nextDate]);
  };

  const removeDate = (index: number) => {
    setSelectedDates(selectedDates.filter((_, i) => i !== index));
  };

  const updateShiftTime = (index: number, field: keyof ShiftTime, value: number) => {
    const newShiftTimes = [...shiftTimes];
    newShiftTimes[index] = { ...newShiftTimes[index], [field]: value };
    setShiftTimes(newShiftTimes);
  };

  const handleShiftsPerDayChange = (newValue: number) => {
    const value = Math.min(Math.max(1, newValue), 3); // Limit to 1-3 shifts
    setShiftsPerDay(value);
    
    // Adjust shift times array
    if (value > shiftTimes.length) {
      // Add new shifts
      const newShiftTimes = [...shiftTimes];
      for (let i = shiftTimes.length; i < value; i++) {
        newShiftTimes.push({ start: 9, end: 17 });
      }
      setShiftTimes(newShiftTimes);
    } else if (value < shiftTimes.length) {
      // Remove extra shifts
      setShiftTimes(shiftTimes.slice(0, value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate shift times
    for (let i = 0; i < shiftTimes.length; i++) {
      const shift = shiftTimes[i];
      if (shift.start >= shift.end) {
        alert(`Shift ${i + 1}: End hour must be after start hour`);
        return;
      }
      if (shift.end - shift.start > 24) {
        alert(`Shift ${i + 1}: Duration cannot exceed 24 hours`);
        return;
      }
    }

    const validEmployees = employeeInputs.filter(emp => emp.name.trim() !== '');
    if (validEmployees.length < workersPerShift) {
      alert(`You need at least ${workersPerShift} employee${workersPerShift > 1 ? 's' : ''} for the shifts`);
      return;
    }

    // Calculate total availability slots needed (24 hours * number of shifts)
    const totalSlots = 24 * shiftsPerDay;
    const employees: Employee[] = validEmployees.map(input => {
      const availability: Record<string, boolean[]> = {};
      selectedDates.forEach(date => {
        availability[date.toISOString().split('T')[0]] = Array(totalSlots).fill(true);
      });
      
      return {
        id: crypto.randomUUID(),
        name: input.name,
        maxHours: input.maxHours,
        availability,
        hoursWorked: 0
      };
    });

    onNext(
      selectedDates,
      shiftsPerDay,
      shiftTimes,
      employees,
      workersPerShift
    );
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // Get tomorrow's date as min date for the date picker
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Setup Shifts</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Dates
            </label>
            <button
              type="button"
              onClick={addDate}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <CalendarPlus className="h-4 w-4 mr-1" />
              Add Date
            </button>
          </div>
          <div className="space-y-3">
            {selectedDates.map((date, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="date"
                  value={date.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDates = [...selectedDates];
                    newDates[index] = new Date(e.target.value);
                    setSelectedDates(newDates);
                  }}
                  min={tomorrow.toISOString().split('T')[0]}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {selectedDates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDate(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <CalendarX className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Shifts per Day
          </label>
          <input
            type="number"
            min="1"
            max="3"
            value={shiftsPerDay}
            onChange={(e) => handleShiftsPerDayChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            You can have up to 3 shifts per day
          </p>
        </div>

        {shiftTimes.map((shift, index) => (
          <div key={index} className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Shift {index + 1} Times
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time (24h)
                </label>
                <select
                  value={shift.start}
                  onChange={(e) => updateShiftTime(index, 'start', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{formatHour(i)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time (24h)
                </label>
                <select
                  value={shift.end}
                  onChange={(e) => updateShiftTime(index, 'end', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{formatHour(i)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workers Needed per Shift
          </label>
          <input
            type="number"
            min="1"
            value={workersPerShift}
            onChange={(e) => setWorkersPerShift(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Number of workers needed for each shift hour
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Employees
            </label>
            <button
              type="button"
              onClick={addEmployee}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Employee
            </button>
          </div>

          <div className="space-y-3">
            {employeeInputs.map((input, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={input.name}
                  onChange={(e) => updateEmployeeInput(index, 'name', e.target.value)}
                  placeholder="Employee name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="w-48">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={input.maxHours}
                    onChange={(e) => updateEmployeeInput(index, 'maxHours', parseInt(e.target.value))}
                    placeholder="Max hours"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {employeeInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmployee(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <MinusCircle className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Set maximum hours per week for each employee
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Continue to Availability
        </button>
      </form>
    </div>
  );
}