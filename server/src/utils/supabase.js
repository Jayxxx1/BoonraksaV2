import { createClient } from "@supabase/supabase-js";
import config from "../config/config.js";

// Initialize Supabase Client
const supabaseUrl = config.SUPABASE_URL; // Add to config.js
const supabaseKey = config.SUPABASE_KEY; // Add to config.js

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "⚠️ Supabase Storage is not fully configured (Missing URL or Key in env).",
  );
}

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export default supabase;
