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
  -- Drop existing triggers first to avoid conflicts
  DROP TRIGGER IF EXISTS update_waiting_list_modtime ON waiting_list;
  DROP TRIGGER IF EXISTS waiting_list_status_change ON waiting_list;
  
  -- Create triggers
  CREATE TRIGGER update_waiting_list_modtime
  BEFORE UPDATE ON waiting_list
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
  
  CREATE TRIGGER waiting_list_status_change
  AFTER UPDATE ON waiting_list
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION record_waiting_list_status_change();
END $$;

-- Enable Row Level Security
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous access to waiting_list" ON waiting_list;
DROP POLICY IF EXISTS "Allow anonymous access to waiting_list_history" ON waiting_list_history;

-- Create policies for anonymous access during development
CREATE POLICY "Allow anonymous access to waiting_list"
  ON waiting_list
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to waiting_list_history"
  ON waiting_list_history
  FOR ALL
  USING (true);

-- Create indexes for better performance if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'waiting_list_restaurant_id_idx'
  ) THEN
    CREATE INDEX waiting_list_restaurant_id_idx ON waiting_list(restaurant_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'waiting_list_status_idx'
  ) THEN
    CREATE INDEX waiting_list_status_idx ON waiting_list(status);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'waiting_list_created_at_idx'
  ) THEN
    CREATE INDEX waiting_list_created_at_idx ON waiting_list(created_at);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'waiting_list_history_entry_id_idx'
  ) THEN
    CREATE INDEX waiting_list_history_entry_id_idx ON waiting_list_history(entry_id);
  END IF;
END $$;