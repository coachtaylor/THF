/**
 * Supabase Edge Function: Send Push Notifications
 *
 * This function sends push notifications to users via the Expo Push API.
 * It can be triggered:
 * - Via pg_cron for scheduled reminders
 * - Directly via HTTP for immediate notifications
 *
 * Environment variables required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (set in Supabase dashboard, not in client)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface NotificationSettings {
  workoutReminders: boolean;
  reminderTime: string;
  reminderMinutesBefore: number;
  restDayMotivation: boolean;
  streakReminders: boolean;
}

interface PushToken {
  user_id: string;
  token: string;
  platform: string;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  categoryId?: string;
}

interface ExpoPushReceipt {
  status: "ok" | "error";
  message?: string;
  details?: {
    error?: string;
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for notification type
    const body = await req.json().catch(() => ({}));
    const notificationType = body.type || "workout_reminder";

    // Get all users with push tokens and enabled notifications
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("user_id, token, platform");

    if (tokensError) {
      throw new Error(`Failed to fetch push tokens: ${tokensError.message}`);
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No push tokens registered" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get notification settings for each user
    const { data: settings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("user_id, settings");

    if (settingsError) {
      console.error("Failed to fetch notification settings:", settingsError);
    }

    const settingsMap = new Map<string, NotificationSettings>();
    settings?.forEach((s) => {
      try {
        settingsMap.set(s.user_id, JSON.parse(s.settings));
      } catch {
        // Use default settings if parsing fails
      }
    });

    // Filter tokens based on notification type and user settings
    const eligibleTokens = tokens.filter((t: PushToken) => {
      const userSettings = settingsMap.get(t.user_id);
      if (!userSettings) return true; // Default is enabled

      switch (notificationType) {
        case "workout_reminder":
          return userSettings.workoutReminders;
        case "streak_reminder":
          return userSettings.streakReminders;
        case "rest_day":
          return userSettings.restDayMotivation;
        default:
          return true;
      }
    });

    if (eligibleTokens.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No eligible users for this notification type",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build notification message based on type
    const message = buildNotificationMessage(notificationType, body);

    // Prepare Expo push messages
    const messages: ExpoPushMessage[] = eligibleTokens.map((t: PushToken) => ({
      to: t.token,
      title: message.title,
      body: message.body,
      data: { type: notificationType, ...body.data },
      sound: "default",
    }));

    // Send to Expo Push API in batches of 100
    const results = await sendPushNotifications(messages);

    // Log results
    const successCount = results.filter((r) => r.status === "ok").length;
    const failureCount = results.filter((r) => r.status === "error").length;

    console.log(
      `Push notifications sent: ${successCount} successful, ${failureCount} failed`
    );

    // Clean up invalid tokens
    const invalidTokens = results
      .filter(
        (r, i) =>
          r.status === "error" &&
          r.details?.error === "DeviceNotRegistered"
      )
      .map((_, i) => eligibleTokens[i].token);

    if (invalidTokens.length > 0) {
      await supabase
        .from("push_tokens")
        .delete()
        .in("token", invalidTokens);
      console.log(`Cleaned up ${invalidTokens.length} invalid tokens`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        cleaned: invalidTokens.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending push notifications:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildNotificationMessage(
  type: string,
  body: Record<string, unknown>
): { title: string; body: string } {
  switch (type) {
    case "workout_reminder":
      return {
        title: "Time to Train! \u{1F3CB}",
        body: "Your workout is waiting for you. Let's make today count!",
      };
    case "streak_reminder":
      const streak = body.streak || 0;
      return {
        title: `Don't Break Your ${streak} Day Streak! \u{1F525}`,
        body: "You haven't logged a workout today. Keep the momentum going!",
      };
    case "rest_day":
      return {
        title: "Rest Day Reminder \u{1F31F}",
        body: "Recovery is part of the process. Enjoy your rest day!",
      };
    case "custom":
      return {
        title: (body.title as string) || "TransFitness",
        body: (body.body as string) || "You have a new notification",
      };
    default:
      return {
        title: "TransFitness",
        body: "You have a new notification",
      };
  }
}

async function sendPushNotifications(
  messages: ExpoPushMessage[]
): Promise<ExpoPushReceipt[]> {
  const results: ExpoPushReceipt[] = [];

  // Expo allows up to 100 messages per request
  const BATCH_SIZE = 100;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        throw new Error(`Expo Push API error: ${response.status}`);
      }

      const data = await response.json();
      results.push(...data.data);
    } catch (error) {
      console.error("Batch send error:", error);
      // Mark all messages in this batch as failed
      batch.forEach(() =>
        results.push({ status: "error", message: "Batch send failed" })
      );
    }
  }

  return results;
}
