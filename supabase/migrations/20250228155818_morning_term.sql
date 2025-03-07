/*
  # Create onboarding tables for ChefGuio

  1. New Tables
    - `restaurants`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `logo_url` (text)
      - `address` (text)
      - `city` (text)
      - `state` (text)
      - `postal_code` (text)
      - `phone` (text)
      - `email` (text)
      - `website` (text)
      - `opening_hours` (jsonb)
      - `max_capacity` (integer)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
      - `onboarding_completed` (boolean)
      - `onboarding_step` (integer)

    - `restaurant_areas`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key to restaurants)
      - `name` (text, not null)
      - `description` (text)
      - `max_capacity` (integer)
      - `is_active` (boolean)
      - `order` (integer)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

    - `onboarding_steps`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key to restaurants)
      - `step_name` (text, not null)
      - `step_number` (integer, not null)
      - `is_completed` (boolean)
      - `completed_at` (timestamp with time zone)
      - `data_collected` (jsonb)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

    - `whatsapp_integrations`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key to restaurants)
      - `instance_name` (text, not null)
      - `phone_number` (text)
      - `status` (text)
      - `qr_code_url` (text)
      - `last_connected` (timestamp with time zone)
      - `connection_token` (text)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Restaurants Table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  opening_hours JSONB,
  max_capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 1
);

-- Restaurant Areas Table
CREATE TABLE IF NOT EXISTS restaurant_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_capacity INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  "order" INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Onboarding Steps Table
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  data_collected JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp Integrations Table
CREATE TABLE IF NOT EXISTS whatsapp_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  phone_number TEXT,
  status TEXT DEFAULT 'pending',
  qr_code_url TEXT,
  last_connected TIMESTAMPTZ,
  connection_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurants_modtime
BEFORE UPDATE ON restaurants
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_restaurant_areas_modtime
BEFORE UPDATE ON restaurant_areas
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_onboarding_steps_modtime
BEFORE UPDATE ON onboarding_steps
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_whatsapp_integrations_modtime
BEFORE UPDATE ON whatsapp_integrations
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own restaurants"
  ON restaurants
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own restaurants"
  ON restaurants
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own restaurants"
  ON restaurants
  FOR UPDATE
  USING (auth.uid() = id);

-- Similar policies for other tables
CREATE POLICY "Users can read their own restaurant areas"
  ON restaurant_areas
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = restaurant_areas.restaurant_id
    AND restaurants.id = auth.uid()
  ));

CREATE POLICY "Users can insert their own restaurant areas"
  ON restaurant_areas
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = restaurant_areas.restaurant_id
    AND restaurants.id = auth.uid()
  ));

CREATE POLICY "Users can update their own restaurant areas"
  ON restaurant_areas
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = restaurant_areas.restaurant_id
    AND restaurants.id = auth.uid()
  ));

CREATE POLICY "Users can delete their own restaurant areas"
  ON restaurant_areas
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = restaurant_areas.restaurant_id
    AND restaurants.id = auth.uid()
  ));

-- Similar policies for onboarding_steps and whatsapp_integrations