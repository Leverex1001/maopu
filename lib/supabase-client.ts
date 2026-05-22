import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function hasPlaceholderConfig(value: string | undefined, token: string) {
  return !value || value.includes(token);
}

export function hasSupabaseBrowserConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      !hasPlaceholderConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, "your-project") &&
      !hasPlaceholderConfig(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, "your-key")
  );
}

export function getSupabaseBrowserClient() {
  if (!hasSupabaseBrowserConfig()) return null;

  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }

  return browserClient;
}
