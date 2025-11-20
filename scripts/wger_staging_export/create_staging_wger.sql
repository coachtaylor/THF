
create table if not exists staging_wger (
  slug text,
  name text,
  equipment text[],     -- normalized tokens
  media_thumb text,
  media_video text,
  source_url text,
  external_id text
);
