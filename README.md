# TransFitness

**Safety-first, dysphoria-aware fitness app for trans and non-binary people.**

TransFitness provides personalized workout programming that accounts for binding, hormone replacement therapy (HRT), and gender-affirming surgery recovery. Built with care for the unique needs of the trans community.

**Version:** 3.1 (MVP)
**Status:** Active Development

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React Native 0.81.5 with Expo 54 |
| Language | TypeScript 5.1.3 |
| Backend | Supabase (Auth, PostgreSQL) |
| Navigation | React Navigation (Bottom Tabs, Stack) |
| UI Library | React Native Paper 5.11 |
| State | Context API, AsyncStorage |
| Animations | React Native Reanimated 3.19 |
| Icons | Lucide React, Ionicons |

**Additional Libraries:** date-fns, Expo Haptics, Expo Notifications, Expo Secure Store, Linear Gradient

---

## Current Features

### Authentication & Onboarding

- Email/password authentication via Supabase
- Email verification and password reset flows
- **13-screen onboarding intake:**
  - Gender identity (MTF, FTM, Non-binary, Questioning)
  - HRT status, type, duration, and method
  - Binding practices and frequency
  - Surgical history and recovery timeline
  - Primary and secondary fitness goals
  - Experience level (beginner/intermediate/advanced)
  - Training environment and equipment
  - Preferred workout days and session duration
  - Dysphoria triggers for exercise avoidance
  - Body focus preferences

### Home & Dashboard

- Personalized daily overview with greeting
- Today's workout card with quick-start button
- Weekly stats display (workouts completed, streak, progress)
- Upcoming workouts preview
- Today's reminder/tip card

### Workout System

- **Three-phase workouts:** warmup, main, cooldown
- Real-time set/rep tracking with weight logging
- RPE (Rate of Perceived Exertion) input per set
- Rest timer with animated countdown
- Exercise swapping mid-workout
- **Safety checkpoints** every 60 seconds
- Pain flag marking for exercises
- Pause/resume workout support
- Skip set, rest, or phase options
- Post-workout check-in (energy, body feel, mood)
- Workout summary with volume metrics

### Plan Management

- Weekly calendar with workout indicators
- Duration variants (30/45/60/90 min)
- Day selection and workout scheduling
- Plan regeneration capability

### Exercise Library

- Browse all available exercises
- Filter by muscle groups, equipment, difficulty
- **Trans-specific safety flags:**
  - Binder safe
  - Pelvic floor safe
  - Heavy binding safe
  - Post-op safe (by weeks)
- Exercise details with form cues
- Coaching points and modifications

### Safety Features

- **Binder Safety Guide** - evidence-based guidelines for binding while exercising
- **Post-Op Movement Guide** - phased recovery progression by surgery type
- **Red flag detection** - deflects unsafe advice requests
- **Safety rules engine** - constraint-based exercise filtering
- Post-operative movement restrictions by weeks post-op

### Copilot Chat

- Context-aware Q&A assistant
- Knowledge base for trans-specific fitness questions
- User profile context (binding, HRT, surgery, goals)
- Suggested questions based on user profile
- Resource links for external guidance

### Progress Tracking

- Weekly stats (volume, RPE, completion percentage)
- Current and longest streak tracking
- Saved/favorite workouts library
- Monthly completion calendar

### Settings & Profile

- View profile details (identity, HRT, binding, surgery, goals)
- Access safety guides
- Copilot chat access
- Beta survey feedback
- Account management
- Logout

---

## Pending Phases (Roadmap)

| Phase | Feature | Description |
|:-----:|---------|-------------|
| 1 | **Warm-up/Cool-down Flow Integration** | Enhanced warmup/cooldown phases with guided flows and better transitions |
| 2 | **Weight/Rep Suggestions Based on History** | Smart weight and rep suggestions using past workout performance data |
| 3 | **Progress Visualization (Charts)** | Visual charts and graphs for tracking progress over time |
| 4 | **Workout History Calendar** | Full calendar view of past workout history with completion details |
| 5 | **Exercise Library Accessible from Home** | Quick access to exercise library directly from home screen |
| 6 | **Exercise Demonstrations (Placeholders)** | Placeholder videos/images for exercise form demonstrations |
| 7 | **Rest Day Guidance** | Enhanced rest day content with recovery tips and light activity suggestions |
| 8 | **Notifications/Reminders** | Push notifications for workout reminders and motivation |
| 9 | **Workout Summary Improvements** | Enhanced post-workout summary with better insights and stats |
| 10 | **Quick-Start Options** | Fast workout start options for common scenarios |
| 11 | **Settings/Profile Editing** | Full profile editing capabilities for all onboarding fields |
| 12 | **Audio/Haptic Feedback** | Sound and haptic feedback during workouts for set completion, rest timers, etc. |

---

## Project Structure

```
src/
├── screens/           # Application screens by feature
│   ├── auth/          # Login, signup, verification
│   ├── onboarding/    # Intake flow screens
│   ├── main/          # Home, workouts, progress, settings
│   ├── workout/       # Active workout, summary, overview
│   ├── exercise/      # Exercise library
│   ├── copilot/       # Chat assistant
│   ├── guides/        # Safety guides
│   └── plan/          # Plan view
├── components/        # Reusable UI components
│   ├── common/        # Glass cards, buttons, inputs
│   ├── home/          # Home screen components
│   ├── session/       # Workout session components
│   ├── workout/       # Workout-specific components
│   ├── exercise/      # Exercise components
│   ├── onboarding/    # Onboarding components
│   ├── copilot/       # Chat components
│   └── safety/        # Safety modals
├── services/          # Business logic & data
│   ├── storage/       # Profile, plan, workout storage
│   ├── workoutGeneration/ # Plan and workout generation
│   ├── rulesEngine/   # Safety rule evaluation
│   ├── copilot/       # Chat response generation
│   └── auth/          # Authentication
├── contexts/          # React contexts (Auth, Workout)
├── hooks/             # Custom React hooks
├── types/             # TypeScript definitions
├── theme/             # Design system
└── navigation/        # Navigation configuration
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- iOS Simulator (Mac) or Android Emulator
- Expo CLI

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd transfitness-scaffold
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   ```
   Add your Supabase credentials to `.env`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Start the app:**
   ```bash
   pnpm start
   ```

5. **Run on device/simulator:**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start Expo development server |
| `pnpm ios` | Run on iOS simulator |
| `pnpm android` | Run on Android emulator |
| `pnpm test` | Run Jest test suite |
| `pnpm test:types` | Run TypeScript type checking |

---

## Development

**Current Branch:** `develop`

**Recent Updates:**
- Added WorkoutDays and RestDayOverview screens
- Added exercise library components and screens
- Added PostWorkoutCheckin component
- Added copilot, feedback, and safety features

---

## Documentation

- [PlanView-SPEC.md](./PlanView-SPEC.md) - UI specification for plan view screen
- [docs/](./docs/) - Additional documentation

---

## Contributing

This project is in active development. Please reach out before contributing.

---

## License

Proprietary - All rights reserved.
