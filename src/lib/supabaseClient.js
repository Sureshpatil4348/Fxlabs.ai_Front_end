import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://hyajwhtkwldrmlhfiuwg.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5YWp3aHRrd2xkcm1saGZpdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTY1MzQsImV4cCI6MjA3MTg3MjUzNH0.-Rm0TQekc0Qyxt6ItznAZ0XjRJ_ZgUtxxejbZdYkVzI"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
