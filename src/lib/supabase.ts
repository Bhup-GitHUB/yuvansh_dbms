import { supabase } from '@/integrations/supabase/client';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
};

export type AttendanceRecord = {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent';
};

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data?.user) {
    return null;
  }

  // Get the user's role from the profiles table
  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', data.user.id)
    .single();

  if (!profile) {
    return null;
  }

  return profile as User;
}

export async function getStudents() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('role', 'student');

  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }

  return data as User[];
}

export async function getAttendanceForStudent(studentId: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, student_id, date, status')
    .eq('student_id', studentId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }

  return data as AttendanceRecord[];
}

export async function getAttendanceForDate(date: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, student_id, date, status')
    .eq('date', date);

  if (error) {
    console.error('Error fetching attendance for date:', error);
    return [];
  }

  return data;
}

export async function markAttendance(studentId: string, date: string, status: 'present' | 'absent') {
  // First check if an attendance record already exists for this student and date
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', date)
    .single();

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('attendance')
      .update({ status })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating attendance:', error);
      return false;
    }
    return true;
  }

  // Create new record
  const { error } = await supabase
    .from('attendance')
    .insert([{ student_id: studentId, date, status }]);

  if (error) {
    console.error('Error marking attendance:', error);
    return false;
  }
  return true;
}

export async function calculateAttendancePercentage(studentId: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId);

  if (error || !data) {
    console.error('Error calculating attendance:', error);
    return 0;
  }

  if (data.length === 0) return 0;

  const presentDays = data.filter(record => record.status === 'present').length;
  return (presentDays / data.length) * 100;
}

export { supabase };
