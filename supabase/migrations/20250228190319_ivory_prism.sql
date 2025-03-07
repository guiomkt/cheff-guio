/*
  # CRM Module Tables

  1. New Tables
    - `crm_stages` - Stages in the CRM pipeline
    - `crm_cards` - Cards representing customer opportunities
    - `crm_card_activities` - Activities/history for each card
    - `crm_card_tags` - Tags for categorizing cards
    - `crm_card_tag_relations` - Many-to-many relationship between cards and tags
  
  2. Security
    - Enable RLS on all tables
    - Add policies for anonymous access during development
  
  3. Constraints
    - Unique stage names per restaurant
    - Unique tag names per restaurant
*/

-- Check if tables already exist before creating them
DO $$
BEGIN
  -- CRM Stages Table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'crm_stages') THEN
    CREATE TABLE crm_stages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      icon TEXT,
      "order" INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    -- Add trigger to update the updated_at column
    CREATE TRIGGER update_crm_stages_modtime
    BEFORE UPDATE ON crm_stages
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    
    -- Enable Row Level Security
    ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for anonymous access
    CREATE POLICY "Allow anonymous access to crm_stages"
      ON crm_stages
      FOR ALL
      USING (true);
    
    -- Add unique constraint for stage name per restaurant
    ALTER TABLE crm_stages ADD CONSTRAINT unique_stage_name_per_restaurant 
      UNIQUE (restaurant_id, name);
  END IF;

  -- CRM Cards Table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'crm_cards') THEN
    CREATE TABLE crm_cards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
      stage_id UUID REFERENCES crm_stages(id) ON DELETE CASCADE,
      contact_id UUID REFERENCES chat_contacts(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
      status TEXT DEFAULT 'active', -- 'active', 'completed', 'archived'
      due_date TIMESTAMPTZ,
      assigned_to UUID,
      last_contact_date TIMESTAMPTZ,
      last_contact_channel TEXT,
      value NUMERIC(10, 2),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    -- Add trigger to update the updated_at column
    CREATE TRIGGER update_crm_cards_modtime
    BEFORE UPDATE ON crm_cards
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    
    -- Enable Row Level Security
    ALTER TABLE crm_cards ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for anonymous access
    CREATE POLICY "Allow anonymous access to crm_cards"
      ON crm_cards
      FOR ALL
      USING (true);
  END IF;

  -- CRM Card Activities Table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'crm_card_activities') THEN
    CREATE TABLE crm_card_activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      card_id UUID REFERENCES crm_cards(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL, -- 'note', 'stage_change', 'contact', 'reservation', 'event'
      description TEXT NOT NULL,
      performed_by UUID,
      performed_at TIMESTAMPTZ DEFAULT now()
    );
    
    -- Enable Row Level Security
    ALTER TABLE crm_card_activities ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for anonymous access
    CREATE POLICY "Allow anonymous access to crm_card_activities"
      ON crm_card_activities
      FOR ALL
      USING (true);
  END IF;

  -- CRM Card Tags Table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'crm_card_tags') THEN
    CREATE TABLE crm_card_tags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    
    -- Enable Row Level Security
    ALTER TABLE crm_card_tags ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for anonymous access
    CREATE POLICY "Allow anonymous access to crm_card_tags"
      ON crm_card_tags
      FOR ALL
      USING (true);
    
    -- Add unique constraint for tag name per restaurant
    ALTER TABLE crm_card_tags ADD CONSTRAINT unique_tag_name_per_restaurant 
      UNIQUE (restaurant_id, name);
  END IF;

  -- CRM Card-Tag Relationship Table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'crm_card_tag_relations') THEN
    CREATE TABLE crm_card_tag_relations (
      card_id UUID REFERENCES crm_cards(id) ON DELETE CASCADE,
      tag_id UUID REFERENCES crm_card_tags(id) ON DELETE CASCADE,
      PRIMARY KEY (card_id, tag_id)
    );
    
    -- Enable Row Level Security
    ALTER TABLE crm_card_tag_relations ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for anonymous access
    CREATE POLICY "Allow anonymous access to crm_card_tag_relations"
      ON crm_card_tag_relations
      FOR ALL
      USING (true);
  END IF;
END $$;