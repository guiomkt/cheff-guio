/*
  # Waiting List System

  1. New Tables
    - `waiting_list`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key)
      - `customer_name` (text)
      - `phone_number` (text)
      - `party_size` (integer)
      - `queue_number` (integer)
      - `status` (text)
      - `priority` (text)
      - `area_preference` (uuid, foreign key)
      - `estimated_wait_time` (integer)
      - `notification_time` (timestamptz)
      - `notes` (text)
      - `table_id` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `waiting_list_history`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key)
      - `entry_id` (uuid, foreign key)
      - `previous_status` (text)
      - `new_status` (text)
      - `changed_at` (timestamptz)
      - `changed_by` (uuid)
      - `notes` (text)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for anonymous access during development
*/

-- Create waiting_list table
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

-- Create waiting_list_history table
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

-- Add triggers to update the updated_at column
CREATE TRIGGER update_waiting_list_modtime
BEFORE UPDATE ON waiting_list
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create trigger to record status changes in history
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

CREATE TRIGGER waiting_list_status_change
AFTER UPDATE ON waiting_list
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION record_waiting_list_status_change();

-- Enable Row Level Security
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list_history ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access during development
CREATE POLICY "Allow anonymous access to waiting_list"
  ON waiting_list
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to waiting_list_history"
  ON waiting_list_history
  FOR ALL
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS waiting_list_restaurant_id_idx ON waiting_list(restaurant_id);
CREATE INDEX IF NOT EXISTS waiting_list_status_idx ON waiting_list(status);
CREATE INDEX IF NOT EXISTS waiting_list_created_at_idx ON waiting_list(created_at);
CREATE INDEX IF NOT EXISTS waiting_list_history_entry_id_idx ON waiting_list_history(entry_id);