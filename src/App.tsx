import React, { useState } from 'react';
import { Users, Calendar, Clock } from 'lucide-react';
import ShiftMaker from './assets/ShiftMaker';
import AvailabilityTable from './assets/AvailabilityTable';
import ScheduleDisplay from './assets/ScheduleDisplay';

export type Employee = {
  id: string;
  name: string;
  availability: Record<string, boolean[]>; // Key is date string
  hoursWorked: number;
  maxHours: number;
};

export type Shift = {
  hour: number;
  employeeId: string;
  shiftNumber: number;
  date: string; // Added date to track shifts across days
};

export type ShiftTime = {
  start: number;
  end: number;
};

function App() {
  const [step, setStep] = useState(1);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workersPerShift, setWorkersPerShift] = useState(1);
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]);
  const [shiftsPerDay, setShiftsPerDay] = useState(1);
  const [shiftTimes, setShiftTimes] = useState<ShiftTime[]>([
    { start: 9, end: 17 }
  ]);

  const generateSchedule = () => {
    const newShifts: Shift[] = [];
    const employeeShiftCounts = new Map<string, number>();
    
    // Initialize shift counts
    employees.forEach(emp => employeeShiftCounts.set(emp.id, 0));

    // Sort dates to ensure chronological order
    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());

    // For each day
    for (const date of sortedDates) {
      const dateString = date.toISOString().split('T')[0];

      // For each shift in the day
      for (let shiftNumber = 0; shiftNumber < shiftsPerDay; shiftNumber++) {
        const shiftTime = shiftTimes[shiftNumber];
        const totalHours = shiftTime.end - shiftTime.start;
        
        // For each hour in the shift
        for (let hour = 0; hour < totalHours; hour++) {
          const currentHour = hour + shiftTime.start;
          const availabilityIndex = hour + (shiftNumber * 24);

          // Get currently assigned workers for this hour
          const currentWorkers = newShifts.filter(
            s => s.hour === currentHour && s.shiftNumber === shiftNumber && s.date === dateString
          ).map(s => s.employeeId);

          // Try to fill remaining positions
          while (currentWorkers.length < workersPerShift) {
            // First, try to find someone who's already working in adjacent hours
            let selectedEmployee = null;
            
            // Check previous hour assignments
            if (hour > 0) {
              const prevHourWorkers = newShifts.filter(
                s => s.hour === currentHour - 1 && s.shiftNumber === shiftNumber && s.date === dateString
              ).map(s => s.employeeId);

              for (const workerId of prevHourWorkers) {
                const worker = employees.find(e => e.id === workerId);
                if (worker && 
                    worker.availability[dateString]?.[availabilityIndex] && 
                    !currentWorkers.includes(workerId) &&
                    (employeeShiftCounts.get(workerId) || 0) < worker.maxHours) {
                  selectedEmployee = worker;
                  break;
                }
              }
            }

            // If no continuing worker found, find any available worker
            if (!selectedEmployee) {
              const availableEmployees = employees.filter(emp => 
                emp.availability[dateString]?.[availabilityIndex] && 
                !currentWorkers.includes(emp.id) &&
                (employeeShiftCounts.get(emp.id) || 0) < emp.maxHours
              );

              if (availableEmployees.length === 0) break;

              // Sort by hours worked (ascending)
              availableEmployees.sort((a, b) => 
                (employeeShiftCounts.get(a.id) || 0) - (employeeShiftCounts.get(b.id) || 0)
              );

              selectedEmployee = availableEmployees[0];
            }

            if (selectedEmployee) {
              newShifts.push({
                hour: currentHour,
                employeeId: selectedEmployee.id,
                shiftNumber,
                date: dateString
              });

              currentWorkers.push(selectedEmployee.id);
              employeeShiftCounts.set(
                selectedEmployee.id,
                (employeeShiftCounts.get(selectedEmployee.id) || 0) + 1
              );
            } else {
              break;
            }
          }
        }
      }
    }

    // Update employees with their total hours worked across all days
    const updatedEmployees = employees.map(emp => ({
      ...emp,
      hoursWorked: employeeShiftCounts.get(emp.id) || 0
    }));

    setEmployees(updatedEmployees);
    setShifts(newShifts);
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">ShiftMaker</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <Users className="h-5 w-5" />
                <span className="ml-1">Setup</span>
              </div>
              <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <Clock className="h-5 w-5" />
                <span className="ml-1">Availability</span>
              </div>
              <div className={`flex items-center ${step >= 4 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <Calendar className="h-5 w-5" />
                <span className="ml-1">Schedule</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 1 && (
          <ShiftMaker
            onNext={(dates, shifts, times, emps, workers) => {
              setSelectedDates(dates);
              setShiftsPerDay(shifts);
              setShiftTimes(times);
              setEmployees(emps);
              setWorkersPerShift(workers);
              setStep(2);
            }}
          />
        )}
        
        {step === 2 && (
          <AvailabilityTable
            employees={employees}
            shiftTimes={shiftTimes}
            shiftsPerDay={shiftsPerDay}
            selectedDates={selectedDates}
            onUpdateAvailability={(updatedEmployees) => {
              setEmployees(updatedEmployees);
            }}
            onNext={() => generateSchedule()}
          />
        )}

        {step === 4 && (
          <ScheduleDisplay
            shifts={shifts}
            employees={employees}
            workersPerShift={workersPerShift}
            selectedDates={selectedDates}
            shiftTimes={shiftTimes}
            shiftsPerDay={shiftsPerDay}
            onReset={() => {
              setStep(1);
              setSelectedDates([new Date()]);
              setShiftsPerDay(1);
              setShiftTimes([{ start: 9, end: 17 }]);
              setEmployees([]);
              setShifts([]);
              setWorkersPerShift(1);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;