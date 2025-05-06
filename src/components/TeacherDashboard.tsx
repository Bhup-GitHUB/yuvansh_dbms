import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents, getCurrentUser, supabase, getAttendanceForDate } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/supabase';
import AttendanceMarker from './AttendanceMarker';
import StudentAttendanceView from './StudentAttendanceView';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TeacherDashboard = () => {
  const [teacher, setTeacher] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [recentDates, setRecentDates] = useState<Date[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
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

      // Create array of recent dates (5 days ago to today)
      const today = new Date();
      const dates = [];
      for (let i = 4; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        dates.push(date);
      }
      setRecentDates(dates);

      // Fetch dates where attendance was already marked
      await fetchAttendanceDates();
      
      setLoading(false);
    };
    
    checkAuth();
  }, [navigate]);

  const fetchAttendanceDates = async () => {
    // Get the first student to check which dates have attendance
    if (students.length === 0) return;
    
    const firstStudentId = students[0]?.id;
    if (!firstStudentId) return;
    
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('date')
        .eq('student_id', firstStudentId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      setAttendanceDates(data.map(item => item.date));
    } catch (error) {
      console.error('Error fetching attendance dates:', error);
    }
  };

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

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleRecentDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateMarked = (date: Date) => {
    const dateString = formatDateString(date);
    return attendanceDates.includes(dateString);
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
                Select any date to mark or update attendance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="calendar" className="mb-6">
                <TabsList>
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="recent">Recent Dates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="calendar" className="space-y-4">
                  <div className="flex items-center mb-4">
                    <p className="text-sm text-muted-foreground mr-2">Selected Date:</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={`justify-start text-left font-normal ${
                            isDateMarked(selectedDate) ? "bg-green-50 border-green-200" : ""
                          }`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(selectedDate, 'PPP')}
                          {isDateMarked(selectedDate) && 
                            <span className="ml-2 text-xs text-green-600">
                              (Attendance marked)
                            </span>
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </TabsContent>
                
                <TabsContent value="recent">
                  <div className="flex flex-wrap gap-3 mb-4">
                    {recentDates.map((date, index) => (
                      <Button
                        key={index}
                        variant={selectedDate.toDateString() === date.toDateString() ? "default" : "outline"}
                        onClick={() => handleRecentDateClick(date)}
                        className={isDateMarked(date) ? "border-green-500" : ""}
                      >
                        {format(date, 'MMM dd')}
                        {isDateMarked(date) && 
                          <span className="ml-1 text-xs">✓</span>
                        }
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mb-2 text-sm text-muted-foreground">
                Marking attendance for: <span className="font-medium">{format(selectedDate, 'PPP')}</span>
              </div>
              
              <AttendanceMarker 
                students={students} 
                date={formatDateString(selectedDate)} 
                onComplete={fetchAttendanceDates}
              />
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
