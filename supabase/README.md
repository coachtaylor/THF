# TransFitness Supabase Configuration

## Edge Functions

### send-notifications

Sends push notifications to users via the Expo Push API.

#### Setup

1. **Deploy the function:**
   ```bash
   supabase functions deploy send-notifications
   ```

2. **Set environment variables in Supabase Dashboard:**
   - Go to Project Settings > Edge Functions
   - Add: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

3. **Set up pg_cron for scheduled notifications:**
   Run the SQL in `migrations/002_setup_notification_cron.sql`

#### Manual Invocation

```bash
# Send workout reminders
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "workout_reminder"}'

# Send streak reminders
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "streak_reminder", "streak": 7}'

# Send custom notification
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "custom", "title": "Hello!", "body": "This is a test notification"}'
```

## Database Tables

The following tables are used for push notifications:

### push_tokens
Stores device push tokens for each user.

| Column | Type | Description |
|--------|------|-------------|
| user_id | TEXT | Primary key, references auth.users |
| token | TEXT | Expo push token |
| platform | TEXT | 'ios' or 'android' |
| updated_at | TIMESTAMP | Last update time |

### notification_settings
Stores user notification preferences.

| Column | Type | Description |
|--------|------|-------------|
| user_id | TEXT | Primary key, references auth.users |
| settings | JSONB | User preferences (JSON) |
| updated_at | TIMESTAMP | Last update time |

## Row Level Security (RLS)

Make sure RLS policies are configured:

```sql
-- push_tokens: Users can only manage their own tokens
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own tokens"
ON push_tokens FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own tokens"
ON push_tokens FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own tokens"
ON push_tokens FOR DELETE
USING (auth.uid()::text = user_id);

-- notification_settings: Users can only manage their own settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification settings"
ON notification_settings FOR ALL
USING (auth.uid()::text = user_id);
```
