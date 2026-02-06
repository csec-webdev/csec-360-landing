-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with NextAuth sessions)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  auth_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for applications and departments (many-to-many)
CREATE TABLE application_departments (
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  PRIMARY KEY (application_id, department_id)
);

-- User favorites table
CREATE TABLE user_favorites (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, application_id)
);

-- User custom application lists (for "My Applications")
CREATE TABLE user_application_lists (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, application_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_application_departments_app ON application_departments(application_id);
CREATE INDEX idx_application_departments_dept ON application_departments(department_id);
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_app ON user_favorites(application_id);
CREATE INDEX idx_user_application_lists_user ON user_application_lists(user_id);
CREATE INDEX idx_user_application_lists_app ON user_application_lists(application_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_application_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own record" ON users FOR INSERT WITH CHECK (true);

-- RLS Policies for departments table
CREATE POLICY "Anyone can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Service role can manage departments" ON departments FOR ALL USING (true);

-- RLS Policies for applications table
CREATE POLICY "Anyone can view applications" ON applications FOR SELECT USING (true);
CREATE POLICY "Service role can manage applications" ON applications FOR ALL USING (true);

-- RLS Policies for application_departments table
CREATE POLICY "Anyone can view application departments" ON application_departments FOR SELECT USING (true);
CREATE POLICY "Service role can manage application departments" ON application_departments FOR ALL USING (true);

-- RLS Policies for user_favorites table
CREATE POLICY "Users can view their own favorites" ON user_favorites FOR SELECT USING (true);
CREATE POLICY "Users can insert their own favorites" ON user_favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own favorites" ON user_favorites FOR DELETE USING (true);

-- RLS Policies for user_application_lists table
CREATE POLICY "Users can view their own application lists" ON user_application_lists FOR SELECT USING (true);
CREATE POLICY "Users can insert their own application lists" ON user_application_lists FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own application lists" ON user_application_lists FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own application lists" ON user_application_lists FOR DELETE USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on applications
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for application images
INSERT INTO storage.buckets (id, name, public) VALUES ('application-images', 'application-images', true);

-- Storage policies for application images
CREATE POLICY "Anyone can view application images" ON storage.objects FOR SELECT USING (bucket_id = 'application-images');
CREATE POLICY "Authenticated users can upload application images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'application-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update application images" ON storage.objects FOR UPDATE USING (bucket_id = 'application-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete application images" ON storage.objects FOR DELETE USING (bucket_id = 'application-images' AND auth.role() = 'authenticated');
