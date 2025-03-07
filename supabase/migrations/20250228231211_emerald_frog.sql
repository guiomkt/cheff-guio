/*
  # Settings Module Schema

  1. New Tables
    - `ai_settings`: Stores AI personality and behavior settings
    - `notification_settings`: Stores notification preferences and recipients
    - `knowledge_base`: Stores Q&A for the knowledge base
    - `backup_settings`: Stores backup configuration and history
    
  2. Security
    - Enable RLS on all tables
    - Add policies for anonymous access during development
*/

-- AI Settings Table
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  personality TEXT NOT NULL DEFAULT 'friendly',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_restaurant_ai_settings UNIQUE (restaurant_id)
);

-- Notification Settings Table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_restaurant_notification_settings UNIQUE (restaurant_id)
);

-- Knowledge Base Table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Backup Settings Table
CREATE TABLE IF NOT EXISTS backup_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_restaurant_backup_settings UNIQUE (restaurant_id)
);

-- Backups Table
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  file_url TEXT,
  size INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  type TEXT NOT NULL DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Add triggers to update the updated_at column
CREATE TRIGGER update_ai_settings_modtime
BEFORE UPDATE ON ai_settings
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_notification_settings_modtime
BEFORE UPDATE ON notification_settings
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_knowledge_base_modtime
BEFORE UPDATE ON knowledge_base
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_backup_settings_modtime
BEFORE UPDATE ON backup_settings
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access during development
CREATE POLICY "Allow anonymous access to ai_settings"
  ON ai_settings
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to notification_settings"
  ON notification_settings
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to knowledge_base"
  ON knowledge_base
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to backup_settings"
  ON backup_settings
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to backups"
  ON backups
  FOR ALL
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS knowledge_base_restaurant_category_idx ON knowledge_base(restaurant_id, category);
CREATE INDEX IF NOT EXISTS backups_restaurant_status_idx ON backups(restaurant_id, status);