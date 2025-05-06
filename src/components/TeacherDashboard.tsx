
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents, getCurrentUser, supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/supabase';
import AttendanceMarker from './AttendanceMarker';
import StudentAttendanceView from './StudentAttendanceView';
import { useToast } from '@/hooks/use-toast';

const TeacherDashboard = () => {
  const [teacher, setTeacher] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      
      if (!user) {
        navigate('/login');
        return;
      }
      
      if (user.role !== 'teacher') {
        toast({
          title: "Access denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      setTeacher(user);
      const fetchedStudents = await getStudents();
      setStudents(fetchedStudents);
      setLoading(false);
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleViewStudentAttendance = (student: User) => {
    setSelectedStudent(student);
  };

  const closeStudentView = () => {
    setSelectedStudent(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <div className="flex gap-4 items-center">
          <p>Welcome, {teacher?.name}</p>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      {selectedStudent ? (
        <div>
          <Button variant="outline" onClick={closeStudentView} className="mb-4">
            ← Back to All Students
          </Button>
          <StudentAttendanceView studentId={selectedStudent.id} studentName={selectedStudent.name} />
        </div>
      ) : (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
              <CardDescription>
                Select a date and mark attendance for all students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border rounded-md w-full max-w-xs"
                />
              </div>
              <AttendanceMarker students={students} date={selectedDate} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student List</CardTitle>
              <CardDescription>
                View and manage attendance records for individual students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {students.map((student) => (
                  <Card key={student.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <CardDescription>{student.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <Button 
                        onClick={() => handleViewStudentAttendance(student)}
                        variant="outline"
                      >
                        View Attendance
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TeacherDashboard;
