import { useState, useEffect } from 'react';
import { User, markAttendance, getAttendanceForDate } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AttendanceMarkerProps {
  students: User[];
  date: string;
  onComplete?: () => void;
}

type AttendanceStatus = 'present' | 'absent' | null;

interface StudentAttendance {
  student: User;
  status: AttendanceStatus;
  existingRecord: boolean;
}

const AttendanceMarker = ({ students, date, onComplete }: AttendanceMarkerProps) => {
  const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const existingAttendance = await getAttendanceForDate(date);
        
        // Initialize attendance data for all students
        const initialAttendanceData = students.map(student => {
          const existingRecord = existingAttendance.find(
            record => record.student_id === student.id
          );
          
          return {
            student,
            status: existingRecord ? existingRecord.status as AttendanceStatus : null,
            existingRecord: !!existingRecord
          };
        });
        
        setAttendanceData(initialAttendanceData);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast({
          title: "Error",
          description: "Failed to load existing attendance data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendance();
  }, [students, date]);

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prevData => 
      prevData.map(item => 
        item.student.id === studentId 
          ? { ...item, status } 
          : item
      )
    );
  };
  
  const markAll = (status: AttendanceStatus) => {
    setAttendanceData(prevData => 
      prevData.map(item => ({ ...item, status }))
    );
  };

  const saveAllAttendance = async () => {
    setSaving(true);
    
    try {
      const promises = attendanceData
        .filter(item => item.status !== null)
        .map(item => 
          markAttendance(item.student.id, date, item.status as 'present' | 'absent')
        );
      
      await Promise.all(promises);
      
      toast({
        title: "Success",
        description: "Attendance saved successfully.",
      });
      
      // Update existingRecord flag for all saved items
      setAttendanceData(prevData => 
        prevData.map(item => 
          item.status !== null 
            ? { ...item, existingRecord: true } 
            : item
        )
      );
      
      // Call onComplete if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Error",
        description: "Failed to save attendance data.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading attendance data...</p>;
  }

  const presentCount = attendanceData.filter(item => item.status === 'present').length;
  const absentCount = attendanceData.filter(item => item.status === 'absent').length;
  const unmarkedCount = attendanceData.filter(item => item.status === null).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => markAll('present')}
            disabled={saving}
          >
            Mark All Present
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => markAll('absent')}
            disabled={saving}
          >
            Mark All Absent
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="text-green-600">{presentCount} present</span> • 
          <span className="text-red-600 mx-2">{absentCount} absent</span> • 
          <span>{unmarkedCount} unmarked</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {attendanceData.map(({ student, status, existingRecord }) => (
              <tr key={student.id}>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-500">{student.email}</div>
                  {existingRecord && (
                    <div className="text-xs text-blue-600 mt-1">
                      Record exists
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={status === 'present' ? 'default' : 'outline'}
                      onClick={() => updateStatus(student.id, 'present')}
                      className={
                        status === 'present' 
                          ? existingRecord 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-green-500 hover:bg-green-600'
                          : ''
                      }
                    >
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={status === 'absent' ? 'default' : 'outline'}
                      onClick={() => updateStatus(student.id, 'absent')}
                      className={
                        status === 'absent' 
                          ? existingRecord 
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-red-500 hover:bg-red-600'
                          : ''
                      }
                    >
                      Absent
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button 
          onClick={saveAllAttendance} 
          disabled={saving || attendanceData.every(item => item.status === null)}
        >
          {saving ? "Saving..." : "Save Attendance"}
        </Button>
      </div>
    </div>
  );
};

export default AttendanceMarker;
