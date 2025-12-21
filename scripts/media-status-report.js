/**
 * Media Status Report
 * Shows which exercises are missing media_thumb and/or video_url
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, slug, name, media_thumb, video_url')
    .order('id');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  const withBoth = [];
  const thumbOnly = [];
  const videoOnly = [];
  const neither = [];

  data.forEach(e => {
    const hasThumb = e.media_thumb && e.media_thumb.trim() !== '';
    const hasVideo = e.video_url && e.video_url.trim() !== '';

    if (hasThumb && hasVideo) {
      withBoth.push(e);
    } else if (hasThumb && !hasVideo) {
      thumbOnly.push(e);
    } else if (!hasThumb && hasVideo) {
      videoOnly.push(e);
    } else {
      neither.push(e);
    }
  });

  console.log('='.repeat(70));
  console.log('EXERCISE MEDIA STATUS REPORT');
  console.log('='.repeat(70));
  console.log('');
  console.log('SUMMARY:');
  console.log(`  Total exercises:        ${data.length}`);
  console.log(`  ✅ Has BOTH thumb+video: ${withBoth.length}`);
  console.log(`  🖼️  Has THUMB only:       ${thumbOnly.length}`);
  console.log(`  🎬 Has VIDEO only:       ${videoOnly.length}`);
  console.log(`  ❌ Has NEITHER:          ${neither.length}`);
  console.log('');

  if (videoOnly.length > 0) {
    console.log('-'.repeat(70));
    console.log(`MISSING MEDIA_THUMB (but has video): ${videoOnly.length}`);
    console.log('-'.repeat(70));
    videoOnly.forEach(e => console.log(`  ${e.id} | ${e.name}`));
    console.log('');
  }

  console.log('-'.repeat(70));
  console.log(`MISSING VIDEO_URL (but has thumb): ${thumbOnly.length}`);
  console.log('-'.repeat(70));
  thumbOnly.slice(0, 20).forEach(e => console.log(`  ${e.id} | ${e.name}`));
  if (thumbOnly.length > 20) {
    console.log(`  ... and ${thumbOnly.length - 20} more`);
  }
  console.log('');

  console.log('-'.repeat(70));
  console.log(`MISSING BOTH (no media at all): ${neither.length}`);
  console.log('-'.repeat(70));
  neither.forEach(e => console.log(`  ${e.id} | ${e.name}`));
}

main().catch(console.error);
