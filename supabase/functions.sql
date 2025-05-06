-- Advanced SQL functions and stored procedures for attendance management

-- Function to check if a student's attendance is below threshold
CREATE OR REPLACE FUNCTION check_attendance_below_threshold(
  student_id UUID,
  course_id UUID,
  threshold NUMERIC DEFAULT 75.0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  attendance_percentage NUMERIC;
BEGIN
  SELECT 
    CASE 
      WHEN COUNT(a.id) > 0 
      THEN ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::NUMERIC / COUNT(a.id)) * 100, 2)
      ELSE 0
    END INTO attendance_percentage
  FROM attendance a
  WHERE 
    a.student_id = check_attendance_below_threshold.student_id
    AND a.course_id = check_attendance_below_threshold.course_id;
    
  RETURN attendance_percentage < threshold;
END;
$$;

-- Function to get students with low attendance
CREATE OR REPLACE FUNCTION get_students_with_low_attendance(
  p_course_id UUID,
  p_threshold NUMERIC DEFAULT 75.0
)
RETURNS TABLE(
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  attendance_percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS student_id,
    u.name AS student_name,
    u.email AS student_email,
    CASE 
      WHEN COUNT(a.id) > 0 
      THEN ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::NUMERIC / COUNT(a.id)) * 100, 2)
      ELSE 0
    END AS attendance_percentage
  FROM 
    users u
  LEFT JOIN 
    attendance a ON u.id = a.student_id AND a.course_id = p_course_id
  WHERE 
    u.role = 'student'
  GROUP BY 
    u.id, u.name, u.email
  HAVING 
    CASE 
      WHEN COUNT(a.id) > 0 
      THEN ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::NUMERIC / COUNT(a.id)) * 100, 2)
      ELSE 0
    END < p_threshold;
END;
$$;

-- Stored procedure to mark attendance for multiple students at once
CREATE OR REPLACE PROCEDURE bulk_mark_attendance(
  p_date DATE,
  p_course_id UUID,
  p_student_ids UUID[],
  p_status TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  student_id UUID;
BEGIN
  FOREACH student_id IN ARRAY p_student_ids
  LOOP
    -- Check if record already exists
    IF EXISTS (
      SELECT 1 FROM attendance 
      WHERE student_id = student_id 
        AND date = p_date 
        AND course_id = p_course_id
    ) THEN
      -- Update existing record
      UPDATE attendance 
      SET status = p_status
      WHERE student_id = student_id 
        AND date = p_date 
        AND course_id = p_course_id;
    ELSE
      -- Insert new record
      INSERT INTO attendance (student_id, date, status, course_id)
      VALUES (student_id, p_date, p_status, p_course_id);
    END IF;
  END LOOP;
END;
$$;

-- Function to get attendance statistics for a teacher
CREATE OR REPLACE FUNCTION get_teacher_attendance_stats(
  p_teacher_id UUID
)
RETURNS TABLE(
  course_id UUID,
  course_name TEXT,
  total_students INT,
  avg_attendance_percentage NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS course_id,
    c.name AS course_name,
    COUNT(DISTINCT ce.student_id) AS total_students,
    COALESCE(
      (SELECT 
        ROUND(AVG(
          CASE 
            WHEN sub.total_classes > 0 
            THEN (sub.classes_attended::NUMERIC / sub.total_classes) * 100 
            ELSE 0 
          END
        ), 2)
      FROM (
        SELECT 
          s.id AS student_id,
          COUNT(a.id) AS total_classes,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS classes_attended
        FROM 
          users s
        JOIN 
          course_enrollments ce2 ON s.id = ce2.student_id AND ce2.course_id = c.id
        LEFT JOIN 
          attendance a ON s.id = a.student_id AND a.course_id = c.id
        GROUP BY 
          s.id
      ) sub
    ), 0) AS avg_attendance_percentage,
    MAX(a.created_at) AS last_updated
  FROM 
    courses c
  JOIN 
    course_teachers ct ON c.id = ct.course_id AND ct.teacher_id = p_teacher_id
  LEFT JOIN 
    course_enrollments ce ON c.id = ce.course_id
  LEFT JOIN 
    attendance a ON c.id = a.course_id
  GROUP BY 
    c.id, c.name;
END;
$$;

-- Function to update user attendance with RLS security
CREATE OR REPLACE FUNCTION update_attendance(
  p_attendance_id UUID,
  p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_student_id UUID;
  v_teacher_id UUID;
  v_course_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get attendance record details
  SELECT
    a.student_id,
    ct.teacher_id,
    a.course_id
  INTO
    v_student_id,
    v_teacher_id,
    v_course_id
  FROM
    attendance a
  LEFT JOIN
    course_teachers ct ON a.course_id = ct.course_id
  WHERE
    a.id = p_attendance_id;
  
  -- Only allow teachers or the student themselves to update
  IF v_user_id = v_teacher_id OR v_user_id = v_student_id THEN
    UPDATE attendance
    SET status = p_status
    WHERE id = p_attendance_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Function to search students by name, email or ID
CREATE OR REPLACE FUNCTION search_students(
  search_term TEXT
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  role TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    u.role
  FROM 
    users u
  WHERE 
    u.role = 'student'
    AND (
      u.name ILIKE '%' || search_term || '%'
      OR u.email ILIKE '%' || search_term || '%'
      OR u.id::TEXT ILIKE '%' || search_term || '%'
    );
END;
$$;

-- Create a materialized view for attendance summaries
CREATE MATERIALIZED VIEW IF NOT EXISTS attendance_summary AS
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

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_attendance_summary_student_id ON attendance_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_course_id ON attendance_summary(course_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_attendance_summary()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW attendance_summary;
END;
$$;

-- Create a trigger to refresh the materialized view after attendance changes
CREATE OR REPLACE FUNCTION refresh_attendance_summary_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM refresh_attendance_summary();
  RETURN NULL;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS refresh_attendance_summary_trigger ON attendance;

-- Create the trigger
CREATE TRIGGER refresh_attendance_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON attendance
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_attendance_summary_trigger(); 