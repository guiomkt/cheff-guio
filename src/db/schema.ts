export type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  opening_hours: { [key: string]: { open: string; close: string } } | null;
  max_capacity: number | null;
  created_at: string;
  updated_at: string;
  onboarding_completed: boolean;
  onboarding_step: number;
};

export type RestaurantArea = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  max_capacity: number | null;
  max_tables: number | null;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
};

export type MenuCategory = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OnboardingStep = {
  id: string;
  restaurant_id: string;
  step_name: string;
  step_number: number;
  is_completed: boolean;
  completed_at: string | null;
  data_collected: any;
  created_at: string;
  updated_at: string;
};

export type WhatsappIntegration = {
  id: string;
  restaurant_id: string;
  instance_name: string;
  phone_number: string;
  status: 'connected' | 'disconnected' | 'pending';
  qr_code_url: string | null;
  last_connected: string | null;
  connection_token: string | null;
  created_at: string;
  updated_at: string;
};

export type Table = {
  id: string;
  restaurant_id: string;
  area_id: string;
  number: number;
  name: string | null;
  capacity: number;
  shape: 'round' | 'square' | 'rectangle';
  width: number;
  height: number;
  position_x: number;
  position_y: number;
  status: 'available' | 'occupied' | 'reserved' | 'blocked';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TableStatusHistory = {
  id: string;
  table_id: string;
  previous_status: string;
  new_status: string;
  changed_at: string;
  changed_by: string | null;
  notes: string | null;
};

// Chat module types
export type ChatContact = {
  id: string;
  restaurant_id: string;
  phone_number: string;
  name: string;
  profile_image_url: string | null;
  status: 'new' | 'active' | 'inactive';
  customer_type: 'new' | 'returning' | 'vip';
  last_message_at: string;
  unread_count: number;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatConversation = {
  id: string;
  restaurant_id: string;
  contact_id: string;
  status: 'open' | 'closed' | 'archived';
  intent: 'general' | 'reservation' | 'menu' | 'complaint' | 'feedback' | 'other';
  sentiment: 'positive' | 'neutral' | 'negative';
  ai_enabled: boolean;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'restaurant' | 'ai';
  sender_id: string | null;
  content: string;
  content_type: 'text' | 'image' | 'file' | 'location' | 'contact';
  media_url: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatTemplate = {
  id: string;
  restaurant_id: string;
  name: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
};

export type ChatAnalytics = {
  id: string;
  restaurant_id: string;
  date: string;
  total_conversations: number;
  new_conversations: number;
  ai_handled_conversations: number;
  human_handled_conversations: number;
  avg_response_time: number;
  avg_resolution_time: number;
  popular_topics: { [key: string]: number };
  created_at: string;
  updated_at: string;
};

// CRM module types
export type CrmStage = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CrmCard = {
  id: string;
  restaurant_id: string;
  stage_id: string;
  contact_id: string | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'archived';
  due_date: string | null;
  assigned_to: string | null;
  last_contact_date: string | null;
  last_contact_channel: string | null;
  value: number | null;
  created_at: string;
  updated_at: string;
};

export type CrmCardActivity = {
  id: string;
  card_id: string;
  activity_type: 'note' | 'stage_change' | 'contact' | 'reservation' | 'event';
  description: string;
  performed_by: string | null;
  performed_at: string;
};

export type CrmCardTag = {
  id: string;
  restaurant_id: string;
  name: string;
  color: string | null;
  created_at: string;
};

export type CrmCardWithDetails = CrmCard & {
  contact?: ChatContact;
  tags: CrmCardTag[];
  activities: CrmCardActivity[];
};