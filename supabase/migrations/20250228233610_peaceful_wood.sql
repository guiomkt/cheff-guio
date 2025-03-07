-- Add restaurant_id column to chat_messages table
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS chat_messages_restaurant_id_idx ON chat_messages(restaurant_id);

-- Update existing messages with restaurant_id from their conversations
UPDATE chat_messages
SET restaurant_id = conversations.restaurant_id
FROM chat_conversations conversations
WHERE chat_messages.conversation_id = conversations.id;

-- Make restaurant_id NOT NULL after updating existing records
ALTER TABLE chat_messages 
ALTER COLUMN restaurant_id SET NOT NULL;