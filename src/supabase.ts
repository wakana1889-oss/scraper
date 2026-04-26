import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

console.log("DEBUG URL:", supabaseUrl);
console.log("DEBUG KEY:", supabaseKey?.slice(0, 10));

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);