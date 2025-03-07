/*
  # Waiting List Configuration Table

  1. New Tables
    - `waiting_list_config` - Stores configuration settings for the waiting list feature
  
  2. Security
    - Enable RLS on all tables
    - Create policies for anonymous access
*/

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

-- Add trigger to update the updated_at column
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_waiting_list_config_modtime'
  ) INTO trigger_exists;
  
  IF NOT trigger_exists THEN
    EXECUTE 'CREATE TRIGGER update_waiting_list_config_modtime
             BEFORE UPDATE ON waiting_list_config
             FOR EACH ROW EXECUTE FUNCTION update_modified_column()';
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE waiting_list_config ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous access during development
CREATE POLICY "Allow anonymous access to waiting_list_config"
  ON waiting_list_config
  FOR ALL
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS waiting_list_config_restaurant_id_idx ON waiting_list_config(restaurant_id);