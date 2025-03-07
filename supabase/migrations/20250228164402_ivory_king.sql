/*
  # Add max_tables column to restaurant_areas table

  1. Changes
    - Add `max_tables` column to `restaurant_areas` table
    - Set default value to 0
    - Make column nullable
  
  2. Reason
    - Support tracking the number of tables in each restaurant area
    - Fix errors in the application that reference this column
*/

-- Add max_tables column to restaurant_areas table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_areas' AND column_name = 'max_tables'
  ) THEN
    ALTER TABLE restaurant_areas ADD COLUMN max_tables INTEGER DEFAULT 0;
  END IF;
END $$;