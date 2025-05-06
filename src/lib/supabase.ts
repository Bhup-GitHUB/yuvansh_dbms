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
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
    
    return data as User;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

export async function getStudents() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .order('name');
    
    if (error) {
      console.error('Error fetching students:', error);
      return [];
    }
    
    return data as User[];
  } catch (error) {
    console.error('Error in getStudents:', error);
    return [];
  }
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
