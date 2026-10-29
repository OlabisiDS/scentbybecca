import { createClient, type SupabaseClient } from "@supabase/supabase-js";
// Use only the address part, so a pasted "/rest/v1" suffix cannot break the connection.
const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let url = "";
try { url = raw ? new URL(raw).origin : ""; } catch { url = ""; }
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const configured = Boolean(url && anon);
let c: SupabaseClient | null = null;
export const sb = () => (c ??= createClient(url, anon));
