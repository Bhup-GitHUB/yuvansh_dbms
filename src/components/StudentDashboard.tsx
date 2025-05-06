
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, calculateAttendancePercentage, getAttendanceForStudent, User, supabase, AttendanceRecord } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const StudentDashboard = () => {
  const [student, setStudent] = useState<User | null>(null);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      
      if (!user) {
        navigate('/login');
        return;
      }
      
      if (user.role !== 'student') {
        toast({
          title: "Access denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      setStudent(user);
      
      try {
        const percentage = await calculateAttendancePercentage(user.id);
        setAttendancePercentage(percentage);
        
        const records = await getAttendanceForStudent(user.id);
        setAttendanceRecords(records);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        toast({
          title: "Error",
          description: "Failed to load attendance data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <div className="flex gap-4 items-center">
          <p>Welcome, {student?.name}</p>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Attendance Summary</CardTitle>
          <CardDescription>
            View your current attendance percentage and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium">Overall Attendance: {attendancePercentage.toFixed(2)}%</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className={`h-2.5 rounded-full ${
                  attendancePercentage >= 75 ? 'bg-green-600' : 'bg-red-600'
                }`}
                style={{ width: `${attendancePercentage}%` }}
              ></div>
            </div>
          </div>
          
          {attendancePercentage < 75 ? (
            <div className="attendance-warning">
              <p className="font-medium">Warning: Your attendance is below 75%</p>
              <p className="text-sm">Please improve your attendance to avoid academic consequences.</p>
            </div>
          ) : (
            <div className="attendance-good">
              <p className="font-medium">Good Standing</p>
              <p className="text-sm">Your attendance meets the required threshold.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
          <CardDescription>
            Your attendance for the past days
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
                    .slice(0, 10) // Show only the 10 most recent records
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

export default StudentDashboard;
