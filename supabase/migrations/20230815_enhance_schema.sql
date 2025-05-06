-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create academic_periods table (semesters/terms)
CREATE TABLE IF NOT EXISTS academic_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (start_date < end_date)
);

-- Create course_enrollments table to associate students with courses
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, academic_period_id)
);

-- Create course_teachers table to associate teachers with courses
CREATE TABLE IF NOT EXISTS course_teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, course_id, academic_period_id)
);

-- Add course_id to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS academic_period_id UUID REFERENCES academic_periods(id);

-- Create views for easy querying
-- View for student attendance percentage by course
CREATE OR REPLACE VIEW student_attendance_by_course AS
SELECT 
  s.id AS student_id,
  s.name AS student_name,
  c.id AS course_id,
  c.name AS course_name,
  ap.id AS academic_period_id,
  ap.name AS academic_period_name,
  COUNT(a.id) AS total_attendance_records,
  SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
  CASE 
    WHEN COUNT(a.id) > 0 
    THEN ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::NUMERIC / COUNT(a.id)) * 100, 2)
    ELSE 0
  END AS attendance_percentage
FROM 
  users s
JOIN 
  course_enrollments ce ON s.id = ce.student_id
JOIN 
  courses c ON ce.course_id = c.id
JOIN 
  academic_periods ap ON ce.academic_period_id = ap.id
LEFT JOIN 
  attendance a ON s.id = a.student_id AND a.course_id = c.id AND a.academic_period_id = ap.id
WHERE 
  s.role = 'student'
GROUP BY 
  s.id, s.name, c.id, c.name, ap.id, ap.name;

-- View for daily attendance report
CREATE OR REPLACE VIEW daily_attendance_report AS
SELECT 
  a.date,
  c.id AS course_id,
  c.name AS course_name,
  COUNT(a.id) AS total_students,
  SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
  SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
  CASE 
    WHEN COUNT(a.id) > 0 
    THEN ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::NUMERIC / COUNT(a.id)) * 100, 2)
    ELSE 0
  END AS attendance_percentage
FROM 
  attendance a
JOIN 
  courses c ON a.course_id = c.id
GROUP BY 
  a.date, c.id, c.name
ORDER BY 
  a.date DESC, c.name;

-- Create a function to set default academic period for attendance
CREATE OR REPLACE FUNCTION set_default_academic_period()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.academic_period_id IS NULL THEN
    NEW.academic_period_id := (
      SELECT id FROM academic_periods 
      WHERE is_active = TRUE 
      ORDER BY start_date DESC 
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set default academic period
DROP TRIGGER IF EXISTS set_academic_period_trigger ON attendance;
CREATE TRIGGER set_academic_period_trigger
BEFORE INSERT ON attendance
FOR EACH ROW
EXECUTE FUNCTION set_default_academic_period();

-- Create a function to validate attendance date is within academic period
CREATE OR REPLACE FUNCTION validate_attendance_date()
RETURNS TRIGGER AS $$
DECLARE
  period_start DATE;
  period_end DATE;
BEGIN
  SELECT start_date, end_date INTO period_start, period_end
  FROM academic_periods
  WHERE id = NEW.academic_period_id;
  
  IF NEW.date < period_start OR NEW.date > period_end THEN
    RAISE EXCEPTION 'Attendance date must be within the academic period (% to %)', period_start, period_end;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate attendance date
DROP TRIGGER IF EXISTS validate_attendance_date_trigger ON attendance;
CREATE TRIGGER validate_attendance_date_trigger
BEFORE INSERT OR UPDATE ON attendance
FOR EACH ROW
WHEN (NEW.academic_period_id IS NOT NULL)
EXECUTE FUNCTION validate_attendance_date(); 