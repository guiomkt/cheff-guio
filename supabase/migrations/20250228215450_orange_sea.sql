/*
  # Waiting List Setup

  1. New Tables
    - `waiting_list` - Stores waiting list entries
    - `waiting_list_history` - Stores history of status changes
    - `waiting_list_config` - Stores configuration settings
  
  2. Security
    - Enable RLS on all tables
    - Create policies for anonymous access
    
  3. Triggers
    - Add triggers for updated_at columns
    - Add trigger for status change history
*/

-- Create waiting_list table if it doesn't exist
CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 1,
  queue_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  priority TEXT NOT NULL DEFAULT 'low',
  area_preference UUID REFERENCES restaurant_areas(id) ON DELETE SET NULL,
  estimated_wait_time INTEGER,
  notification_time TIMESTAMPTZ,
  notes TEXT,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create waiting_list_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS waiting_list_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES waiting_list(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now(),
  changed_by UUID,
  notes TEXT
);

-- Create waiting_list_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS waiting_list_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  auto_notification BOOLEAN DEFAULT true,
  notification_message TEXT DEFAULT 'Olá {{name}}, sua mesa está pronta! Por favor, dirija-se à recepção do restaurante.',
  default_wait_time INTEGER DEFAULT 15,
  max_party_size INTEGER DEFAULT 20,
  enable_customer_form BOOLEAN DEFAULT true,
  customer_form_url TEXT,
  priority_enabled BOOLEAN DEFAULT true,
  collect_phone BOOLEAN DEFAULT true,
  collect_email BOOLEAN DEFAULT false,
  confirmation_message TEXT DEFAULT 'Olá {{name}}, você foi adicionado à fila de espera! Seu número é {{queue_number}} e o tempo estimado de espera é de {{wait_time}} minutos.',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_restaurant_config UNIQUE (restaurant_id)
);

-- Create or replace function for status change history
CREATE OR REPLACE FUNCTION record_waiting_list_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO waiting_list_history (
      restaurant_id,
      entry_id,
      previous_status,
      new_status,
      changed_at,
      changed_by,
      notes
    ) VALUES (
      NEW.restaurant_id,
      NEW.id,
      OLD.status,
      NEW.status,
      now(),
      NULL,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DO $$
BEGIN
  -- Trigger for waiting_list updated_at
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_waiting_list_modtime'
  ) THEN
    CREATE TRIGGER update_waiting_list_modtime
    BEFORE UPDATE ON waiting_list
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;

  -- Trigger for waiting_list_config updated_at
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_waiting_list_config_modtime'
  ) THEN
    CREATE TRIGGER update_waiting_list_config_modtime
    BEFORE UPDATE ON waiting_list_config
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;

  -- Trigger for status change history
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'waiting_list_status_change'
  ) THEN
    CREATE TRIGGER waiting_list_status_change
    AFTER UPDATE ON waiting_list
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION record_waiting_list_status_change();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous access to waiting_list" ON waiting_list;
DROP POLICY IF EXISTS "Allow anonymous access to waiting_list_history" ON waiting_list_history;
DROP POLICY IF EXISTS "Allow anonymous access to waiting_list_config" ON waiting_list_config;

-- Create policies for anonymous access during development
CREATE POLICY "Allow anonymous access to waiting_list"
  ON waiting_list
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to waiting_list_history"
  ON waiting_list_history
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to waiting_list_config"
  ON waiting_list_config
  FOR ALL
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS waiting_list_restaurant_id_idx ON waiting_list(restaurant_id);
CREATE INDEX IF NOT EXISTS waiting_list_status_idx ON waiting_list(status);
CREATE INDEX IF NOT EXISTS waiting_list_created_at_idx ON waiting_list(created_at);
CREATE INDEX IF NOT EXISTS waiting_list_history_entry_id_idx ON waiting_list_history(entry_id);
CREATE INDEX IF NOT EXISTS waiting_list_config_restaurant_id_idx ON waiting_list_config(restaurant_id);