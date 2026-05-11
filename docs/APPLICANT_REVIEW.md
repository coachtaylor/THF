# Applicant Review Runbook (Level X — Supabase Studio only)

Workflow for accepting the first ~20 founding athletes without
building admin tooling. Uses Supabase Studio's table editor + your
email client. Scales to maybe 50-100 applicants; beyond that, build
the Level Y admin page in the landing Next.js app.

---

## Prerequisites

- Migration applied: `supabase/migrations/002_beta_applications_review.sql`
  (run once in Supabase Studio → SQL Editor)
- TestFlight runbook completed at least through Phase 4.2 so you have
  builds processing
- Access to whatever email account you're sending invites from
  (e.g., hello@transfitness.app)

---

## The state machine

Each row in `beta_applications` has a `status` column:

```
pending  ────────► approved ────────► invited
   │                  │                  
   │                  └──── (something went wrong, e.g. wrong email) ────┐
   ├────────────► rejected                                               │
   │                                                                     │
   └────────────► duplicate                                               │
                                                                         │
                                                       ┌─────────────────┘
                                                       ▼
                                                    pending again
                                                    (rare)
```

- `pending` is the default for new submissions.
- `rejected` and `duplicate` are terminal — silence on those, no email.
- `approved` → you've decided yes, but haven't sent the invite yet.
- `invited` → TestFlight invite email sent. Build distribution
  happens in App Store Connect (not in this table).

---

## Daily/weekly workflow

### 1. Triage the queue

Supabase Studio → Table Editor → `beta_applications`. Filter:

```
status = pending
ORDER BY submitted_at ASC
```

For each row:

1. Read `self_description`, `help_with`, the body-context flags
   (`status_hrt`, `status_binding`, etc.), and `social_handle` if
   provided
2. Decision:
   - **Approve** if they fit the founding-athlete profile: trans/NB
     adult, beginner-intermediate, expressed interest, agreed to
     guidelines
   - **Reject** if obvious bad-faith (test entries, hostile content)
     — no email, just move on
   - **Duplicate** if same email appears in an earlier `approved` /
     `invited` row
3. Update the row:
   - Set `status` → `approved` (or `rejected` / `duplicate`)
   - Set `reviewed_at` → click the timestamp field → "Set to now()"
   - Set `reviewed_by` → your name/initials
   - Optionally add a `notes` value (free text, never shown to applicant)
4. Save

### 2. Send TestFlight invites to approved applicants

Filter:

```
status = approved AND invite_sent_at IS NULL
```

For each:

1. Copy the `email` value
2. In App Store Connect → My Apps → TransFitness → TestFlight →
   External Testing → "Founding Athletes" group → "+" tester
3. Paste the email (use first/last from the application if you want
   personalization in TestFlight)
4. Apple sends them an automated TestFlight invite from
   noreply@email.apple.com
5. Back in Supabase Studio, on the same row:
   - Set `status` → `invited`
   - Set `invite_sent_at` → now()

### 3. Send a separate welcome email (optional but recommended)

Apple's TestFlight email is generic and confusing. A short personal
follow-up dramatically improves install conversion. Send from your
own email (template below).

---

## Email templates

### Approval / welcome email

Send AFTER you've added them in App Store Connect. Subject: "You're
in — Trans Health & Fitness founding athlete invite"

```
Hi [first name],

Thanks for applying to be a founding athlete for Trans Health & Fitness.
You're in.

What to expect over the next few minutes:
1. You'll get a separate email from Apple (subject: "Trans Health &
   Fitness — TestFlight Invitation") with a link to install via the
   TestFlight app.
2. If you don't have TestFlight installed on your iPhone, the link
   will prompt you to install it first (it's a free Apple app).
3. Once you tap "Install" in TestFlight, the app downloads in ~30
   seconds.

A few asks for the beta:

- Try to complete at least 3 workouts in the first two weeks. We
  learn the most from people who actually use the app, not just
  install it.
- If anything feels wrong, broken, or off-brand, hit the chat
  bubble in the corner of the screen — that goes straight to me.
- Your data is stored encrypted on-device and never shared. We
  collect anonymous usage analytics (which screens, which workouts)
  but no identifying health info leaves your phone.

Welcome.

— [your name]
```

### Rejection — DON'T send one

Resist the urge. Rejected applicants get silence. Sending rejection
emails to a small queue creates a support burden and rarely produces
good follow-up. The Founding Athlete program description on the
landing site already sets expectations that not everyone gets in.

---

## Tracking & weekly metrics

Once a week, run this query in Supabase Studio → SQL Editor:

```sql
SELECT
  status,
  COUNT(*) AS count,
  MIN(submitted_at) AS earliest,
  MAX(submitted_at) AS latest
FROM beta_applications
GROUP BY status
ORDER BY status;
```

Pair with this for funnel:

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'pending')             AS pending,
  COUNT(*) FILTER (WHERE status = 'approved')            AS approved_not_yet_invited,
  COUNT(*) FILTER (WHERE status = 'invited')             AS invited,
  COUNT(*) FILTER (WHERE status = 'rejected')            AS rejected,
  COUNT(*) FILTER (WHERE status = 'duplicate')           AS duplicate,
  COUNT(*)                                                AS total
FROM beta_applications;
```

Then cross-reference with `analytics_events`:

```sql
-- Of invited applicants, how many actually signed up in the app?
SELECT
  COUNT(DISTINCT ba.email) AS invited_count,
  COUNT(DISTINCT ae.user_id) AS signed_up_count
FROM beta_applications ba
LEFT JOIN analytics_events ae
  ON ae.event_type = 'signup_completed'
WHERE ba.status = 'invited';
```

(The join is loose because applicant email isn't directly tied to
analytics user_id. Useful as a rough conversion proxy. For a tighter
link, ask applicants to confirm their email in the app on first launch
and join on that — Sprint 4 work.)

---

## Privacy notes

- The `beta_applications` table contains identifying info (name,
  email, social handle) plus body-context flags. Treat it as
  personal data.
- RLS allows anon INSERT only — no anon read/update/delete. Only
  service role (Supabase Studio + service-key scripts) can read this
  table.
- If an applicant emails asking to be removed:
  1. Delete their row in Supabase Studio (Table Editor → row →
     three-dot menu → Delete)
  2. If they were invited to TestFlight, also remove them from the
     External Testing group in App Store Connect
- Never paste applicant data into other tools (Notion, Trello, etc.)
  without first reviewing whether those tools have the right privacy
  posture. The current setup keeps everything in Supabase.

---

## When you outgrow this

Signals you need the Level Y admin page:

- Queue >50 pending applications and triage is taking >30 min/week
- You want to delegate review to a second person without giving them
  the Supabase service role
- You want filters/search beyond what the Studio table editor offers
  (e.g., "approved but haven't installed in 2 weeks")

When that happens, build `/admin/applications` in the landing Next.js
app: server-side auth, paginated list, "Approve" / "Reject" buttons
that hit the Supabase service-role key from the server, and a
batch-export of approved emails to paste into App Store Connect.
Estimated effort: 1-2 days.
