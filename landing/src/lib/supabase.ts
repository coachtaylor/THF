import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create client only if env vars are set (avoids build errors)
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export interface BetaApplication {
  name: string;
  pronouns?: string;
  email: string;
  self_description?: string;
  status_hrt: boolean;
  status_binding: boolean;
  status_pre_surgery: boolean;
  status_post_surgery: boolean;
  status_none: boolean;
  help_with?: string;
  interested_in_beta: boolean;
  agrees_to_guidelines: boolean;
}

export async function submitBetaApplication(
  application: BetaApplication
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return {
      success: false,
      error: "Application submission is not configured. Please try again later.",
    };
  }

  try {
    const { error } = await supabase
      .from("beta_applications")
      .insert([application]);

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "This email has already applied." };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "An unexpected error occurred." };
  }
}
