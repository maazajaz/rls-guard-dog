-- Migration: Add enrollment requests table for student self-enrollment with teacher approval
-- This allows students to request to join classes and teachers to approve/reject them

-- Create enrollment_requests table
CREATE TABLE enrollment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_message TEXT,
  teacher_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a student can only have one request per classroom
  UNIQUE(student_id, classroom_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_enrollment_requests_student_id ON enrollment_requests(student_id);
CREATE INDEX idx_enrollment_requests_teacher_id ON enrollment_requests(teacher_id);
CREATE INDEX idx_enrollment_requests_classroom_id ON enrollment_requests(classroom_id);
CREATE INDEX idx_enrollment_requests_status ON enrollment_requests(status);

-- Enable Row Level Security
ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can create enrollment requests for themselves
CREATE POLICY "Students can create enrollment requests" ON enrollment_requests
  FOR INSERT WITH CHECK (
    auth.uid() = student_id AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- RLS Policy: Students can view their own enrollment requests
CREATE POLICY "Students can view their own requests" ON enrollment_requests
  FOR SELECT USING (
    auth.uid() = student_id AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- RLS Policy: Teachers can view enrollment requests for their classes
CREATE POLICY "Teachers can view requests for their classes" ON enrollment_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classroom_teachers ct
      JOIN profiles p ON p.id = ct.teacher_id
      WHERE ct.classroom_id = enrollment_requests.classroom_id 
      AND ct.teacher_id = auth.uid()
      AND p.role = 'teacher'
    )
  );

-- RLS Policy: Teachers can update enrollment requests for their classes
CREATE POLICY "Teachers can update requests for their classes" ON enrollment_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM classroom_teachers ct
      JOIN profiles p ON p.id = ct.teacher_id
      WHERE ct.classroom_id = enrollment_requests.classroom_id 
      AND ct.teacher_id = auth.uid()
      AND p.role = 'teacher'
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_enrollment_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enrollment_requests_updated_at
  BEFORE UPDATE ON enrollment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_requests_updated_at();

-- Add function to automatically enroll student when request is approved
CREATE OR REPLACE FUNCTION handle_enrollment_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to 'approved', add student to the classroom
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO student_classrooms (student_id, classroom_id, enrolled_at)
    VALUES (NEW.student_id, NEW.classroom_id, NOW())
    ON CONFLICT (student_id, classroom_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enrollment_approval
  AFTER UPDATE ON enrollment_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_enrollment_approval();