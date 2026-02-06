-- Migration: Add user_application_lists table for "My Applications" feature
-- Run this in your Supabase SQL editor

-- Create user_application_lists table
CREATE TABLE IF NOT EXISTS user_application_lists (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, application_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_application_lists_user ON user_application_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_application_lists_app ON user_application_lists(application_id);

-- Enable Row Level Security
ALTER TABLE user_application_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_application_lists table
CREATE POLICY "Users can view their own application lists" ON user_application_lists FOR SELECT USING (true);
CREATE POLICY "Users can insert their own application lists" ON user_application_lists FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own application lists" ON user_application_lists FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own application lists" ON user_application_lists FOR DELETE USING (true);
