-- Create notification_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{
    "emailNotifications": true,
    "pushNotifications": true,
    "smsNotifications": false,
    "notificationTypes": {
      "newCustomer": true,
      "newReservation": true,
      "newComplaint": true,
      "lowInventory": false
    },
    "notificationSchedule": {
      "start": "09:00",
      "end": "22:00",
      "daysEnabled": {
        "sunday": true,
        "monday": true,
        "tuesday": true,
        "wednesday": true,
        "thursday": true,
        "friday": true,
        "saturday": true
      }
    },
    "recipients": []
  }',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_restaurant_notification_settings UNIQUE (restaurant_id)
);

-- Add trigger to update the updated_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_settings_modtime'
  ) THEN
    CREATE TRIGGER update_notification_settings_modtime
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create a new one
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow anonymous access to notification_settings" ON notification_settings;
  
  CREATE POLICY "Allow anonymous access to notification_settings"
    ON notification_settings
    FOR ALL
    USING (true);
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS notification_settings_restaurant_id_idx ON notification_settings(restaurant_id);