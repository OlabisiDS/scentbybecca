import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const configured = Boolean(url && anon);
let c: SupabaseClient | null = null;
export const sb = () => (c ??= createClient(url, anon));
