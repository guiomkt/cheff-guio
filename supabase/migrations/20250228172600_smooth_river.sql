/*
  # Create tables management schema

  1. New Tables
    - `tables`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key to restaurants)
      - `area_id` (uuid, foreign key to restaurant_areas)
      - `number` (integer, table number)
      - `name` (text, optional custom name)
      - `capacity` (integer, number of seats)
      - `shape` (text, table shape: 'round', 'square', 'rectangle')
      - `width` (integer, width in cm)
      - `height` (integer, height in cm)
      - `position_x` (integer, x coordinate in the area)
      - `position_y` (integer, y coordinate in the area)
      - `status` (text, current status: 'available', 'occupied', 'reserved', 'blocked')
      - `is_active` (boolean, whether the table is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `table_status_history`
      - `id` (uuid, primary key)
      - `table_id` (uuid, foreign key to tables)
      - `previous_status` (text)
      - `new_status` (text)
      - `changed_at` (timestamp)
      - `changed_by` (uuid, optional user reference)
      - `notes` (text, optional notes about the status change)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for anonymous access during development
*/

-- Create tables table
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  area_id UUID REFERENCES restaurant_areas(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  name TEXT,
  capacity INTEGER NOT NULL DEFAULT 2,
  shape TEXT NOT NULL DEFAULT 'square',
  width INTEGER NOT NULL DEFAULT 80,
  height INTEGER NOT NULL DEFAULT 80,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table status history table
CREATE TABLE IF NOT EXISTS table_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now(),
  changed_by UUID,
  notes TEXT
);

-- Add triggers to update the updated_at column
CREATE TRIGGER update_tables_modtime
BEFORE UPDATE ON tables
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access during development
CREATE POLICY "Allow anonymous access to tables"
  ON tables
  FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to table status history"
  ON table_status_history
  FOR ALL
  USING (true);

-- Add unique constraint for table number within a restaurant area
ALTER TABLE tables ADD CONSTRAINT unique_table_number_per_area 
  UNIQUE (restaurant_id, area_id, number);