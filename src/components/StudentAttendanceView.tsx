
import { useState, useEffect } from 'react';
import { getAttendanceForStudent, AttendanceRecord } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface StudentAttendanceViewProps {
  studentId: string;
  studentName: string;
}

const StudentAttendanceView = ({ studentId, studentName }: StudentAttendanceViewProps) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const records = await getAttendanceForStudent(studentId);
        setAttendanceRecords(records);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast({
          title: "Error",
          description: "Failed to load attendance records.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendance();
  }, [studentId]);

  const calculatePercentage = () => {
    if (attendanceRecords.length === 0) return 0;
    
    const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
    return (presentDays / attendanceRecords.length) * 100;
  };

  const attendancePercentage = calculatePercentage();

  if (loading) {
    return <p>Loading attendance records...</p>;
  }

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{studentName}'s Attendance</CardTitle>
          <CardDescription>
            Attendance summary and detailed records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-lg font-medium">Attendance Rate: {attendancePercentage.toFixed(2)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className={`h-2.5 rounded-full ${
                  attendancePercentage >= 75 ? 'bg-green-600' : 'bg-red-600'
                }`}
                style={{ width: `${attendancePercentage}%` }}
              ></div>
            </div>
            
            {attendancePercentage < 75 && (
              <div className="attendance-warning mt-4">
                <p className="font-medium">Warning: Attendance Below 75%</p>
                <p className="text-sm">The student needs to improve attendance to meet requirements.</p>
              </div>
            )}
            
            {attendancePercentage >= 75 && (
              <div className="attendance-good mt-4">
                <p className="font-medium">Good Standing</p>
                <p className="text-sm">The student's attendance meets requirements.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>
            Detailed attendance records by date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <p>No attendance records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendanceRecords
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => (
                      <tr key={record.id}>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === 'present' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendanceView;
