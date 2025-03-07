import type { Restaurant } from '@/db/schema'
import { supabase } from '@/lib/supabase'

export const getRestaurants = async () => {
  const { data, error } = await supabase.from('restaurants').select('*')

  if (error) {
    throw error
  }

  return data
}

export const getRestaurantById = async (id: string) => {
  const { data, error } = await supabase.from('restaurants').select('*').eq('id', id).single()

  if (error) {
    throw error
  }

  return data as Restaurant
}
