// Seed data for education snippets
// Short, contextual tips about binding, HRT, and post-op recovery
// These are displayed in the "Helpful context for today" section

import { EducationSnippet } from '../services/education/types';

export const SEED_SNIPPETS: Omit<EducationSnippet, 'created_at' | 'updated_at'>[] = [
  // ============================================
  // BINDER SNIPPETS
  // ============================================

  // General binder awareness (for anyone who binds regularly)
  {
    id: 'binder-001',
    category: 'binder',
    title: 'Binding on workout days',
    text: "If you're binding today, we've adjusted your workout to reduce chest compression stress. Listen to your body—if breathing feels restricted, take a break.",
    binder_status: 'binding_today',
    is_active: true,
    priority: 10,
  },
  {
    id: 'binder-002',
    category: 'binder',
    title: 'Post-workout binder break',
    text: 'After your workout, try to remove your binder for at least 30 minutes. Your body needs recovery time, and your chest muscles will thank you.',
    binder_status: 'binding_regularly',
    is_active: true,
    priority: 20,
  },
  {
    id: 'binder-003',
    category: 'binder',
    title: 'Signs to pause',
    text: "Sharp chest pain, difficulty breathing, or rib tenderness are signals to stop and unbind. These aren't weaknesses—they're your body communicating. Honor them.",
    binder_status: 'binding_regularly',
    is_active: true,
    priority: 30,
  },
  {
    id: 'binder-004',
    category: 'binder',
    title: 'Rest day recovery',
    text: "Rest days are a great opportunity to give your ribs a break from binding. If you can, spend some unbinding time today—your body is recovering and breathing room helps.",
    binder_status: 'binding_regularly',
    is_active: true,
    priority: 40,
  },
  {
    id: 'binder-005',
    category: 'binder',
    title: 'Breathing awareness',
    text: "Binding can limit your breathing capacity during exercise. We've kept cardio moderate and included breathing check-ins. Take them seriously—they're there for you.",
    binder_status: 'binding_today',
    is_active: true,
    priority: 15,
  },

  // ============================================
  // HRT SNIPPETS - TESTOSTERONE
  // ============================================

  // Early testosterone (0-6 months)
  {
    id: 'hrt-t-001',
    category: 'hrt',
    title: 'Early T and energy',
    text: "In the first months on T, you may notice energy fluctuations. Some days you'll feel unstoppable, others more fatigued. Both are normal—train accordingly.",
    hrt_type: 'testosterone',
    hrt_phase_min: 0,
    hrt_phase_max: 6,
    is_active: true,
    priority: 10,
  },
  {
    id: 'hrt-t-002',
    category: 'hrt',
    title: 'Strength changes on T',
    text: "Around 3-6 months on T, many people notice strength gains picking up. We're adjusting your programming to take advantage of this while keeping you safe.",
    hrt_type: 'testosterone',
    hrt_phase_min: 3,
    hrt_phase_max: 6,
    is_active: true,
    priority: 20,
  },

  // Mid testosterone (6-12 months)
  {
    id: 'hrt-t-003',
    category: 'hrt',
    title: 'Building momentum',
    text: "6-12 months on T is when many people see significant strength and muscle development. We're programming to match this phase—progressive overload is your friend.",
    hrt_type: 'testosterone',
    hrt_phase_min: 6,
    hrt_phase_max: 12,
    is_active: true,
    priority: 10,
  },
  {
    id: 'hrt-t-004',
    category: 'hrt',
    title: 'Recovery on T',
    text: 'As your body adjusts to T, your recovery capacity may improve. Pay attention to how you feel between sessions—you might be able to push a bit harder over time.',
    hrt_type: 'testosterone',
    hrt_phase_min: 6,
    hrt_phase_max: 18,
    is_active: true,
    priority: 30,
  },

  // Later testosterone (12+ months)
  {
    id: 'hrt-t-005',
    category: 'hrt',
    title: 'Established on T',
    text: "A year or more on T, your hormonal landscape is more stable. Your training can follow more standard strength programming—with continued attention to your specific needs.",
    hrt_type: 'testosterone',
    hrt_phase_min: 12,
    is_active: true,
    priority: 40,
  },

  // ============================================
  // HRT SNIPPETS - ESTROGEN
  // ============================================

  // Early estrogen (0-6 months)
  {
    id: 'hrt-e-001',
    category: 'hrt',
    title: 'Early E adjustments',
    text: "In the first months on estrogen, strength levels may shift. This is normal. We're adjusting volume and intensity to match where your body is right now.",
    hrt_type: 'estrogen_blockers',
    hrt_phase_min: 0,
    hrt_phase_max: 6,
    is_active: true,
    priority: 10,
  },
  {
    id: 'hrt-e-002',
    category: 'hrt',
    title: 'Recovery changes on E',
    text: 'Estrogen can affect recovery time and muscle protein synthesis. We build in extra rest to support your body through these changes.',
    hrt_type: 'estrogen_blockers',
    hrt_phase_min: 3,
    hrt_phase_max: 12,
    is_active: true,
    priority: 20,
  },

  // Mid-later estrogen (6+ months)
  {
    id: 'hrt-e-003',
    category: 'hrt',
    title: 'Training on E long-term',
    text: 'After months on estrogen, your body composition and strength curve may have shifted. Training focused on lower body and core can support your goals effectively.',
    hrt_type: 'estrogen_blockers',
    hrt_phase_min: 6,
    is_active: true,
    priority: 30,
  },

  // ============================================
  // POST-OP SNIPPETS - TOP SURGERY
  // ============================================

  // Very early (0-2 weeks)
  {
    id: 'postop-top-001',
    category: 'post_op',
    title: 'Very early recovery',
    text: "You're in the earliest phase of recovery. Movement is limited to gentle walking and basic mobility. Your body is healing—rest is productive right now.",
    surgery_type: 'top_surgery',
    post_op_weeks_min: 0,
    post_op_weeks_max: 2,
    is_active: true,
    priority: 5,
  },

  // Early (2-6 weeks)
  {
    id: 'postop-top-002',
    category: 'post_op',
    title: 'Weeks 2-6 post-op',
    text: "We're keeping your upper body work minimal and avoiding any chest loading. Lower body and gentle movement are your focus. Patience now pays off later.",
    surgery_type: 'top_surgery',
    post_op_weeks_min: 2,
    post_op_weeks_max: 6,
    is_active: true,
    priority: 10,
  },
  {
    id: 'postop-top-003',
    category: 'post_op',
    title: 'Protecting your results',
    text: "Pushing too hard too soon can affect healing and scarring. We've blocked exercises that could stress your chest—trust the process.",
    surgery_type: 'top_surgery',
    post_op_weeks_min: 0,
    post_op_weeks_max: 6,
    is_active: true,
    priority: 15,
  },

  // Mid recovery (6-12 weeks)
  {
    id: 'postop-top-004',
    category: 'post_op',
    title: 'Returning to upper body',
    text: "Around 6-12 weeks, light upper body work can begin. We're keeping weights low and sets limited. If anything pulls or feels wrong at your incision sites, stop.",
    surgery_type: 'top_surgery',
    post_op_weeks_min: 6,
    post_op_weeks_max: 12,
    is_active: true,
    priority: 10,
  },
  {
    id: 'postop-top-005',
    category: 'post_op',
    title: 'Scar care reminder',
    text: 'Scar massage can help tissue mobility and healing. After your workout cool-down is a good time for 5 minutes of gentle scar work if your surgeon has cleared you.',
    surgery_type: 'top_surgery',
    post_op_weeks_min: 6,
    post_op_weeks_max: 24,
    is_active: true,
    priority: 20,
  },

  // Later recovery (12+ weeks)
  {
    id: 'postop-top-006',
    category: 'post_op',
    title: 'Building back strength',
    text: "You're past the critical healing window. We're gradually increasing upper body volume. Still—listen to your body and don't rush to pre-surgery weights.",
    surgery_type: 'top_surgery',
    post_op_weeks_min: 12,
    post_op_weeks_max: 24,
    is_active: true,
    priority: 10,
  },

  // ============================================
  // POST-OP SNIPPETS - BOTTOM SURGERY
  // ============================================

  {
    id: 'postop-bottom-001',
    category: 'post_op',
    title: 'Pelvic floor awareness',
    text: 'After bottom surgery, we avoid high-impact movements and exercises that stress the pelvic floor. Gentle strengthening and mobility are the priority.',
    surgery_type: 'bottom_surgery',
    post_op_weeks_min: 0,
    post_op_weeks_max: 12,
    is_active: true,
    priority: 10,
  },
  {
    id: 'postop-bottom-002',
    category: 'post_op',
    title: 'Gradual return to activity',
    text: "Lower body exercises are modified to protect your healing. We're focusing on upper body and gentle core work while you recover.",
    surgery_type: 'bottom_surgery',
    post_op_weeks_min: 4,
    post_op_weeks_max: 12,
    is_active: true,
    priority: 20,
  },

  // ============================================
  // GENERAL RECOVERY SNIPPETS
  // ============================================

  {
    id: 'recovery-001',
    category: 'recovery_general',
    title: 'Rest is training',
    text: "Recovery days aren't wasted days. Your muscles grow and adapt during rest, not during the workout itself. Honor the process.",
    is_active: true,
    priority: 50,
  },
  {
    id: 'recovery-002',
    category: 'recovery_general',
    title: 'Sleep and gains',
    text: 'Quality sleep is when your body does its repair work. If you can, prioritize 7-9 hours—it affects strength, mood, and recovery.',
    is_active: true,
    priority: 60,
  },
  {
    id: 'recovery-003',
    category: 'recovery_general',
    title: 'Hydration matters',
    text: 'Staying hydrated supports recovery and performance. Aim for water throughout the day, not just during workouts.',
    is_active: true,
    priority: 70,
  },
  {
    id: 'recovery-004',
    category: 'recovery_general',
    title: 'Listening to your body',
    text: "Some days your body needs more rest than the plan suggests. It's okay to scale back or take an extra recovery day. Consistency over time matters more than any single workout.",
    is_active: true,
    priority: 80,
  },
];
