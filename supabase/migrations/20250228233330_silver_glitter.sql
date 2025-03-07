-- Create AI Settings Table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  personality TEXT NOT NULL DEFAULT 'friendly',
  settings JSONB NOT NULL DEFAULT '{
    "defaultResponses": {
      "greeting": "Olá! Bem-vindo ao restaurante. Como posso ajudar?",
      "farewell": "Obrigado por seu contato! Esperamos vê-lo em breve!",
      "busy": "No momento estamos com todas as mesas ocupadas. Gostaria de entrar na lista de espera?",
      "outOfHours": "Estamos fechados no momento. Nosso horário de funcionamento é..."
    },
    "behavior": {
      "transferToHuman": true,
      "transferThreshold": 3,
      "proactivityLevel": "medium"
    },
    "restrictions": {
      "canDiscussPrice": true,
      "canMakeReservations": true,
      "canHandleComplaints": false,
      "maxInteractionsPerUser": 10
    }
  }',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_restaurant_ai_settings UNIQUE (restaurant_id)
);

-- Add trigger to update the updated_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_settings_modtime'
  ) THEN
    CREATE TRIGGER update_ai_settings_modtime
    BEFORE UPDATE ON ai_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create a new one
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow anonymous access to ai_settings" ON ai_settings;
  
  CREATE POLICY "Allow anonymous access to ai_settings"
    ON ai_settings
    FOR ALL
    USING (true);
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS ai_settings_restaurant_id_idx ON ai_settings(restaurant_id);