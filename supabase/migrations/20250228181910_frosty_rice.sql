/*
  # Chat Module Schema

  1. New Tables
    - `chat_contacts` - Stores customer contact information
    - `chat_conversations` - Stores conversation metadata
    - `chat_messages` - Stores individual messages
    - `chat_templates` - Stores message templates
    - `chat_analytics` - Stores analytics data

  2. Security
    - Enable RLS on all tables
    - Add policies for anonymous access during development
*/

-- Chat Contacts Table
CREATE TABLE IF NOT EXISTS chat_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT NOT NULL,
  profile_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  customer_type TEXT NOT NULL DEFAULT 'new',
  last_message_at TIMESTAMPTZ DEFAULT now(),
  unread_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Conversations Table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES chat_contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open',
  intent TEXT NOT NULL DEFAULT 'general',
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  ai_enabled BOOLEAN DEFAULT TRUE,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_id UUID,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Templates Table
CREATE TABLE IF NOT EXISTS chat_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Analytics Table
CREATE TABLE IF NOT EXISTS chat_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  new_conversations INTEGER DEFAULT 0,
  ai_handled_conversations INTEGER DEFAULT 0,
  human_handled_conversations INTEGER DEFAULT 0,
  avg_response_time FLOAT DEFAULT 0,
  avg_resolution_time FLOAT DEFAULT 0,
  popular_topics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add triggers to update the updated_at column
CREATE TRIGGER update_chat_contacts_modtime
BEFORE UPDATE ON chat_contacts
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_chat_conversations_modtime
BEFORE UPDATE ON chat_conversations
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_chat_messages_modtime
BEFORE UPDATE ON chat_messages
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_chat_templates_modtime
BEFORE UPDATE ON chat_templates
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_chat_analytics_modtime
BEFORE UPDATE ON chat_analytics
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE chat_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access during development
CREATE POLICY "Allow anonymous access to chat_contacts"
  ON chat_contacts
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to chat_conversations"
  ON chat_conversations
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to chat_messages"
  ON chat_messages
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to chat_templates"
  ON chat_templates
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to chat_analytics"
  ON chat_analytics
  FOR ALL
  USING (true);

-- Add unique constraint for phone number per restaurant
ALTER TABLE chat_contacts ADD CONSTRAINT unique_phone_per_restaurant 
  UNIQUE (restaurant_id, phone_number);

-- Add unique constraint for date per restaurant in analytics
ALTER TABLE chat_analytics ADD CONSTRAINT unique_date_per_restaurant 
  UNIQUE (restaurant_id, date);