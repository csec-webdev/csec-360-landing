-- Create application_requests table
CREATE TABLE application_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  auth_type VARCHAR(50) NOT NULL DEFAULT 'username_password',
  requested_by UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for requested application departments
CREATE TABLE application_request_departments (
  request_id UUID REFERENCES application_requests(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  PRIMARY KEY (request_id, department_id)
);

-- Create indexes
CREATE INDEX idx_application_requests_status ON application_requests(status);
CREATE INDEX idx_application_requests_user ON application_requests(requested_by);
CREATE INDEX idx_application_request_departments_request ON application_request_departments(request_id);
CREATE INDEX idx_application_request_departments_dept ON application_request_departments(department_id);

-- Enable Row Level Security
ALTER TABLE application_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_request_departments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_requests
CREATE POLICY "Users can view all requests" ON application_requests FOR SELECT USING (true);
CREATE POLICY "Users can create their own requests" ON application_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own pending requests" ON application_requests FOR UPDATE USING (requested_by = auth.uid() AND status = 'pending');

-- RLS Policies for application_request_departments
CREATE POLICY "Users can view request departments" ON application_request_departments FOR SELECT USING (true);
CREATE POLICY "Users can add departments to their requests" ON application_request_departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update departments on their requests" ON application_request_departments FOR UPDATE USING (true);
CREATE POLICY "Users can delete departments from their requests" ON application_request_departments FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_application_requests_updated_at
  BEFORE UPDATE ON application_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
