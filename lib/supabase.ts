import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Customer {
  id: string
  name: string
  pin: string
  points: number
  rewards: number
  qr_code: string
  created_at: string
}

export interface Item {
  id: number
  name: string
  description: string
  points_value: number
  price: number
  is_active: boolean
  created_at: string
}

export interface CustomerItemPoint {
  id: number
  customer_id: string
  item_id: number
  points: number
  created_at: string
}

export interface Settings {
  id: number
  store_pin: string
  points_for_reward: number
  admin_username: string
  admin_password: string
  updated_at: string
}

export interface PointTransaction {
  id: number
  customer_id: string
  item_id: number
  points_added: number
  reward_earned: boolean
  created_at: string
}
