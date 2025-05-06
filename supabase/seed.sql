-- Seed academic periods
INSERT INTO academic_periods (name, start_date, end_date, is_active)
VALUES 
  ('Fall 2023', '2023-08-01', '2023-12-31', false),
  ('Spring 2024', '2024-01-01', '2024-05-31', false),
  ('Summer 2024', '2024-06-01', '2024-07-31', false),
  ('Fall 2024', '2024-08-01', '2024-12-31', true)
ON CONFLICT DO NOTHING;

-- Seed courses
INSERT INTO courses (id, name, description)
VALUES 
  ('d9cd3aeb-f0df-4b0a-94f3-e7ea71f81bd5', 'Database Management Systems', 'Study of database design, implementation, and management'),
  ('a5b2cdef-1234-5678-90ab-cdef01234567', 'Data Structures and Algorithms', 'Fundamental data structures and algorithms'),
  ('b6c3def1-2345-6789-01ab-cdef23456789', 'Web Development', 'Modern web application development'),
  ('c7d4f012-3456-7890-12ab-cdef45678901', 'Machine Learning', 'Introduction to machine learning concepts')
ON CONFLICT DO NOTHING;

-- Enroll existing students in courses
-- This will only work if there are students and teachers in the database already
INSERT INTO course_enrollments (student_id, course_id, academic_period_id)
SELECT 
  s.id, 
  c.id, 
  (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1)
FROM 
  users s 
CROSS JOIN 
  courses c
WHERE 
  s.role = 'student'
ON CONFLICT DO NOTHING;

-- Assign teachers to courses
INSERT INTO course_teachers (teacher_id, course_id, academic_period_id)
SELECT 
  t.id, 
  c.id, 
  (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1)
FROM 
  users t
CROSS JOIN 
  courses c
WHERE 
  t.role = 'teacher'
ON CONFLICT DO NOTHING;

-- Update existing attendance records with course_id and academic_period_id
UPDATE attendance a
SET 
  course_id = (SELECT id FROM courses ORDER BY name LIMIT 1),
  academic_period_id = (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1)
WHERE 
  a.course_id IS NULL;

-- Create a stored procedure for generating attendance reports
CREATE OR REPLACE PROCEDURE generate_attendance_report(
  IN p_course_id UUID,
  IN p_start_date DATE,
  IN p_end_date DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return attendance report for specified course and date range
  SELECT 
    u.name AS student_name,
    u.email AS student_email,
    COUNT(a.id) AS total_classes,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS classes_attended,
    ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::NUMERIC / COUNT(a.id)) * 100, 2) AS attendance_percentage
  FROM 
    users u
  LEFT JOIN 
    attendance a ON u.id = a.student_id
  WHERE 
    u.role = 'student'
    AND a.course_id = p_course_id
    AND a.date BETWEEN p_start_date AND p_end_date
  GROUP BY 
    u.name, u.email
  ORDER BY 
    attendance_percentage DESC;
END;
$$; 