import dotenv from "dotenv"
dotenv.config()

console.log("URL:", process.env.SUPABASE_URL)
console.log("KEY:", process.env.SUPABASE_KEY?.slice(0, 10))

import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)