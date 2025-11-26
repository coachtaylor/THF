# HomeScreen (Main Dashboard) - Production Specification
## Welcome Back Dashboard

---

## 🎯 DESIGN PHILOSOPHY

**Current Issues:**
- Uses emojis everywhere (👋🔥📅📊🎯)
- Menu icon is Ionicons (should be hamburger)
- Streak card is basic text
- Today's workout card is text-heavy
- Stats cards lack visual interest
- Quick actions feel tacked on
- No motivational elements
- Missing visual hierarchy

**New Approach:**
- NO emojis - use SVG icons or gradients
- Clean hamburger menu icon
- Beautiful gradient streak card
- Rich workout card with visual elements
- Engaging stats with circular progress
- Integrated quick actions
- Motivational messaging
- Professional fitness dashboard aesthetic

---

## 🔧 FUNCTIONALITY TO PRESERVE

**CRITICAL - DO NOT BREAK:**

1. **Data Loading:**
   - `loadDashboardData()` - loads workout, stats, streak
   - `getTodaysWorkout(userId)`
   - `getWeeklyStats(userId)`
   - `getCurrentStreak(userId)`

2. **Navigation:**
   - `handleStartWorkout()` - navigate to WorkoutOverview
   - `handleProfilePress()` - navigate to Settings
   - Menu button (currently unused, keep for future)

3. **Plan Generation:**
   - `handleGeneratePlan()` - generates new plan
   - Shows Alert on success/failure
   - Reloads dashboard data after generation

4. **User Personalization:**
   - `getUserName()` - gets name from pronouns or "friend"

5. **Safety Indicators:**
   - Show binding-safe if `profile.binds_chest`
   - Show post-op cleared if `profile.surgeries.length > 0`

6. **Conditionals:**
   - Show workout card if `todaysWorkout` exists
   - Show "no workout" card if null
   - Show safety checkpoints if present

---

## 📐 EXACT LAYOUT SPECIFICATIONS

### CONTAINER & HEADER

```css
SafeAreaView {
  flex: 1
  backgroundColor: #0F1419
}

Header Container {
  paddingTop: insets.top + 8
  paddingHorizontal: 20
  paddingBottom: 16
  flexDirection: 'row'
  justifyContent: 'space-between'
  alignItems: 'center'
}

/* Hamburger Menu - NOT Ionicons */
Menu Button {
  width: 40
  height: 40
  borderRadius: 12
  backgroundColor: #1A1F26
  justifyContent: 'center'
  alignItems: 'center'
}

Menu Icon (3 lines) {
  width: 18
  height: 2
  backgroundColor: #E0E4E8
  marginVertical: 2
  borderRadius: 1
}

Header Title {
  fontSize: 18
  fontWeight: '700'
  color: #FFFFFF
}

Header Icons Row {
  flexDirection: 'row'
  gap: 8
}

Icon Button {
  width: 40
  height: 40
  borderRadius: 12
  backgroundColor: #1A1F26
  justifyContent: 'center'
  alignItems: 'center'
}

/* Use Ionicons for notifications and profile - these are OK */
```

---

### WELCOME MESSAGE

```css
Welcome Container {
  paddingHorizontal: 20
  marginBottom: 20
}

Welcome Text {
  fontSize: 28
  fontWeight: '700'
  color: #FFFFFF
  lineHeight: 36
  /* NO emoji 👋 */
}

Welcome Subtext {
  fontSize: 15
  fontWeight: '400'
  color: #9CA3AF
  marginTop: 4
}
```

---

### STREAK CARD (Gradient)

```css
Streak Card Container {
  paddingHorizontal: 20
  marginBottom: 24
}

Streak Card {
  borderRadius: 16
  padding: 20
  overflow: 'hidden'
  position: 'relative'
}

/* Gradient Background */
Card Gradient {
  position: 'absolute'
  top: 0
  left: 0
  right: 0
  bottom: 0
  colors: ['rgba(0, 217, 192, 0.15)', 'rgba(167, 139, 250, 0.15)']
  start: {x: 0, y: 0}
  end: {x: 1, y: 1}
}

Streak Content {
  flexDirection: 'row'
  justifyContent: 'space-between'
  alignItems: 'center'
}

Streak Left {
  flex: 1
}

Streak Label {
  fontSize: 13
  fontWeight: '600'
  color: #9CA3AF
  marginBottom: 4
  textTransform: 'uppercase'
  letterSpacing: 0.5
}

Streak Value {
  fontSize: 32
  fontWeight: '800'
  color: #00D9C0
  marginBottom: 2
}

Streak Unit {
  fontSize: 14
  fontWeight: '600'
  color: #B8C5C5
}

/* Fire Icon SVG - NOT emoji 🔥 */
Fire Icon Container {
  width: 64
  height: 64
  borderRadius: 32
  backgroundColor: rgba(255, 107, 107, 0.15)
  justifyContent: 'center'
  alignItems: 'center'
}

Fire Icon SVG {
  width: 36
  height: 36
  /* Gradient fire icon */
}

Workouts Completed Text {
  fontSize: 14
  fontWeight: '500'
  color: #9CA3AF
  marginTop: 12
}
```

---

### TODAY'S WORKOUT CARD

```css
Section Container {
  paddingHorizontal: 20
  marginBottom: 20
}

Section Header {
  flexDirection: 'row'
  justifyContent: 'space-between'
  alignItems: 'center'
  marginBottom: 12
}

Section Title {
  fontSize: 18
  fontWeight: '700'
  color: #FFFFFF
  /* NO emoji 📅 */
}

Workout Card {
  backgroundColor: #1A1F26
  borderRadius: 16
  padding: 20
  borderWidth: 1
  borderColor: #2A2F36
}

Workout Header {
  marginBottom: 16
}

Workout Name {
  fontSize: 20
  fontWeight: '700'
  color: #FFFFFF
  marginBottom: 6
}

Workout Meta Row {
  flexDirection: 'row'
  alignItems: 'center'
  gap: 12
}

Meta Badge {
  backgroundColor: rgba(167, 139, 250, 0.12)
  paddingHorizontal: 10
  paddingVertical: 4
  borderRadius: 8
}

Meta Text {
  fontSize: 12
  fontWeight: '600'
  color: #A78BFA
}

/* Workout Summary */
Summary Container {
  backgroundColor: #151920
  borderRadius: 12
  padding: 16
  marginBottom: 16
}

Summary Item {
  flexDirection: 'row'
  alignItems: 'center'
  marginBottom: 8
}

Summary Item:last-child {
  marginBottom: 0
}

Summary Dot {
  width: 6
  height: 6
  borderRadius: 3
  backgroundColor: #00D9C0
  marginRight: 12
}

Summary Text {
  fontSize: 14
  fontWeight: '500'
  color: #E0E4E8
}

/* Safety Indicators */
Safety Row {
  flexDirection: 'row'
  gap: 8
  marginBottom: 16
}

Safety Badge {
  backgroundColor: rgba(0, 217, 192, 0.12)
  paddingHorizontal: 10
  paddingVertical: 6
  borderRadius: 8
  flexDirection: 'row'
  alignItems: 'center'
  gap: 6
}

/* Checkmark SVG - NOT ✓ */
Check Icon {
  width: 14
  height: 14
}

Safety Text {
  fontSize: 12
  fontWeight: '600'
  color: #00D9C0
}

/* Warning Banner (Checkpoints) */
Warning Banner {
  backgroundColor: rgba(255, 184, 77, 0.12)
  borderRadius: 10
  padding: 12
  flexDirection: 'row'
  alignItems: 'center'
  gap: 10
  marginBottom: 16
}

Warning Icon {
  width: 20
  height: 20
  /* Ionicons warning is OK */
}

Warning Text {
  fontSize: 13
  fontWeight: '500'
  color: #FFB84D
  flex: 1
}

/* Start Button */
Start Button {
  height: 56
  borderRadius: 28
  overflow: 'hidden'
}

Button Gradient {
  flex: 1
  justifyContent: 'center'
  alignItems: 'center'
  flexDirection: 'row'
  colors: ['#00D9C0', '#00B39D']
  shadowColor: #00D9C0
  shadowOpacity: 0.4
}

Button Text {
  fontSize: 17
  fontWeight: '700'
  color: #0F1419
}
```

---

### NO WORKOUT CARD (Generate Plan)

```css
No Workout Card {
  backgroundColor: #1A1F26
  borderRadius: 16
  padding: 24
  alignItems: 'center'
  borderWidth: 1
  borderColor: #2A2F36
}

Empty State Icon Container {
  width: 80
  height: 80
  borderRadius: 40
  backgroundColor: rgba(0, 217, 192, 0.08)
  justifyContent: 'center'
  alignItems: 'center'
  marginBottom: 16
}

Empty Icon SVG {
  width: 40
  height: 40
}

No Workout Title {
  fontSize: 18
  fontWeight: '700'
  color: #FFFFFF
  marginBottom: 6
}

No Workout Text {
  fontSize: 14
  fontWeight: '400'
  color: #9CA3AF
  textAlign: 'center'
  marginBottom: 20
}

Generate Button {
  width: 100%
  height: 56
  borderRadius: 28
  backgroundColor: #00D9C0
  justifyContent: 'center'
  alignItems: 'center'
}

Generate Button (disabled) {
  opacity: 0.5
}

Generate Button Text {
  fontSize: 17
  fontWeight: '700'
  color: #0F1419
}

Loading Container {
  flexDirection: 'row'
  alignItems: 'center'
  gap: 10
}
```

---

### WEEKLY STATS (Circular Progress)

```css
Section Title {
  fontSize: 18
  fontWeight: '700'
  color: #FFFFFF
  marginBottom: 12
  /* NO emoji 📊 */
}

Stats Row {
  flexDirection: 'row'
  gap: 12
}

Stat Card {
  flex: 1
  backgroundColor: #1A1F26
  borderRadius: 14
  padding: 16
  alignItems: 'center'
  borderWidth: 1
  borderColor: #2A2F36
}

Stat Value {
  fontSize: 24
  fontWeight: '800'
  color: #00D9C0
  marginBottom: 4
}

Stat Label {
  fontSize: 12
  fontWeight: '500'
  color: #6B7280
  textAlign: 'center'
}

/* Circular Progress (Optional Enhancement) */
Progress Circle {
  width: 60
  height: 60
  marginBottom: 8
}
```

---

### QUICK ACTIONS (Integrated)

```css
Quick Actions Container {
  paddingHorizontal: 20
  marginBottom: 32
}

Section Title {
  fontSize: 18
  fontWeight: '700'
  color: #FFFFFF
  marginBottom: 12
  /* NO emoji 🎯 */
}

Actions Row {
  flexDirection: 'row'
  gap: 12
}

Action Button {
  flex: 1
  backgroundColor: #1A1F26
  borderRadius: 14
  padding: 16
  alignItems: 'center'
  borderWidth: 1
  borderColor: #2A2F36
  minHeight: 100
}

Action Button (disabled) {
  opacity: 0.5
}

Action Icon Container {
  width: 48
  height: 48
  borderRadius: 24
  backgroundColor: rgba(0, 217, 192, 0.12)
  justifyContent: 'center'
  alignItems: 'center'
  marginBottom: 10
}

Action Icon SVG {
  width: 24
  height: 24
}

Action Label {
  fontSize: 13
  fontWeight: '600'
  color: #E0E4E8
  textAlign: 'center'
}
```

---

## 🎨 CONTENT SPECIFICATIONS

### Welcome Message
```typescript
const getUserName = () => {
  if (profile?.pronouns) {
    const firstPronoun = profile.pronouns.split('/')[0];
    return firstPronoun.charAt(0).toUpperCase() + firstPronoun.slice(1);
  }
  return 'friend';
};

// Format:
"Welcome back, {name}!" (NO emoji 👋)
"Ready to crush today's workout?"
```

### Streak Display
```typescript
// Format:
"{streak}-Day Streak" (NO emoji 🔥)
"{weeklyStats.totalWorkouts} workouts this week"
```

### Section Titles
```
"Today's Workout" (NO 📅)
"This Week's Progress" (NO 📊)
"Quick Actions" (NO 🎯)
```

### Safety Indicators (Conditional)
```typescript
{profile?.binds_chest && (
  <SafetyBadge>
    <CheckIconSVG />
    <Text>Binding-safe</Text>
  </SafetyBadge>
)}

{profile?.surgeries?.length > 0 && (
  <SafetyBadge>
    <CheckIconSVG />
    <Text>Post-op cleared</Text>
  </SafetyBadge>
)}
```

---

## 📊 SPACING SYSTEM (8px Grid)

```
Header padding: 20px horizontal
Section margins: 20px horizontal, 24px bottom
Card padding: 20px
Stats row gap: 12px
Quick actions gap: 12px
Icon containers: 48x48, 64x64
```

---

## 🎯 INTERACTION SPECIFICATIONS

### Start Workout
```typescript
const handleStartWorkout = () => {
  if (todaysWorkout) {
    navigation.navigate('WorkoutOverview', { workoutId: todaysWorkout.id });
  }
};
```

### Generate Plan
```typescript
const handleGeneratePlan = async () => {
  if (!profile) {
    Alert.alert('Profile Required', 'Please complete your profile in Settings first.');
    return;
  }

  setGeneratingPlan(true);
  try {
    const profileWithDefaults = {
      ...profile,
      block_length: profile.block_length || 1,
      goals: profile.goals || [profile.primary_goal || 'general_fitness'],
      goal_weighting: profile.goal_weighting || { primary: 100, secondary: 0 },
    };

    const plan = await generatePlan(profileWithDefaults);
    const userId = profile.user_id || profile.id || 'default';
    await savePlan(plan, userId);

    Alert.alert('Plan Generated!', 'Your workout plan has been created successfully.', [
      {
        text: 'OK',
        onPress: () => {
          loadDashboardData();
        },
      },
    ]);
  } catch (error) {
    console.error('Failed to generate plan:', error);
    Alert.alert(
      'Generation Failed',
      error instanceof Error ? error.message : 'Failed to generate workout plan.'
    );
  } finally {
    setGeneratingPlan(false);
  }
};
```

### Profile Navigation
```typescript
const handleProfilePress = () => {
  navigation.navigate('Settings');
};
```

---

## 🚀 COMPONENT STRUCTURE

```tsx
<SafeAreaView style={container}>
  
  {/* HEADER */}
  <View style={header}>
    <TouchableOpacity style={menuButton}>
      <HamburgerIcon />
    </TouchableOpacity>
    <Text style={headerTitle}>TransFitness</Text>
    <View style={headerIcons}>
      <TouchableOpacity style={iconButton}>
        <Ionicons name="notifications-outline" size={24} />
      </TouchableOpacity>
      <TouchableOpacity style={iconButton} onPress={handleProfilePress}>
        <Ionicons name="person-circle-outline" size={28} />
      </TouchableOpacity>
    </View>
  </View>

  <ScrollView>
    
    {/* WELCOME MESSAGE */}
    <View style={welcomeContainer}>
      <Text style={welcomeText}>Welcome back, {getUserName()}!</Text>
      <Text style={welcomeSubtext}>Ready to crush today's workout?</Text>
    </View>

    {/* STREAK CARD */}
    <View style={streakCardContainer}>
      <View style={streakCard}>
        <LinearGradient style={cardGradient} />
        <View style={streakContent}>
          <View style={streakLeft}>
            <Text style={streakLabel}>Current Streak</Text>
            <Text style={streakValue}>{streak}</Text>
            <Text style={streakUnit}>days</Text>
          </View>
          <View style={fireIconContainer}>
            <FireIconSVG />
          </View>
        </View>
        <Text style={workoutsCompletedText}>
          {weeklyStats?.totalWorkouts || 0} workouts this week
        </Text>
      </View>
    </View>

    {/* TODAY'S WORKOUT */}
    <View style={sectionContainer}>
      <View style={sectionHeader}>
        <Text style={sectionTitle}>Today's Workout</Text>
      </View>

      {todaysWorkout ? (
        <View style={workoutCard}>
          <View style={workoutHeader}>
            <Text style={workoutName}>{todaysWorkout.workout_name}</Text>
            <View style={workoutMetaRow}>
              <View style={metaBadge}>
                <Text style={metaText}>{todaysWorkout.estimated_duration_minutes} min</Text>
              </View>
              <View style={metaBadge}>
                <Text style={metaText}>{todaysWorkout.total_sets} sets</Text>
              </View>
            </View>
          </View>

          <View style={summaryContainer}>
            <View style={summaryItem}>
              <View style={summaryDot} />
              <Text style={summaryText}>
                Warm-up ({todaysWorkout.warm_up?.total_duration_minutes || 5} min)
              </Text>
            </View>
            <View style={summaryItem}>
              <View style={summaryDot} />
              <Text style={summaryText}>
                {todaysWorkout.main_workout?.length || 0} exercises
              </Text>
            </View>
            <View style={summaryItem}>
              <View style={summaryDot} />
              <Text style={summaryText}>
                Cool-down ({todaysWorkout.cool_down?.total_duration_minutes || 5} min)
              </Text>
            </View>
          </View>

          {/* Safety Indicators */}
          {(profile?.binds_chest || profile?.surgeries?.length > 0) && (
            <View style={safetyRow}>
              {profile.binds_chest && (
                <View style={safetyBadge}>
                  <CheckIconSVG />
                  <Text style={safetyText}>Binding-safe</Text>
                </View>
              )}
              {profile.surgeries?.length > 0 && (
                <View style={safetyBadge}>
                  <CheckIconSVG />
                  <Text style={safetyText}>Post-op cleared</Text>
                </View>
              )}
            </View>
          )}

          {/* Warning Banner (Checkpoints) */}
          {todaysWorkout.safety_checkpoints?.length > 0 && (
            <View style={warningBanner}>
              <Ionicons name="warning" size={20} color="#FFB84D" />
              <Text style={warningText}>
                {todaysWorkout.safety_checkpoints[0].message}
              </Text>
            </View>
          )}

          <TouchableOpacity style={startButton} onPress={handleStartWorkout}>
            <LinearGradient style={buttonGradient}>
              <Text style={buttonText}>Start Workout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={noWorkoutCard}>
          <View style={emptyStateIconContainer}>
            <CalendarIconSVG />
          </View>
          <Text style={noWorkoutTitle}>No workout scheduled</Text>
          <Text style={noWorkoutText}>
            Generate a new workout plan to get started
          </Text>
          <TouchableOpacity
            style={[generateButton, generatingPlan && generateButtonDisabled]}
            onPress={handleGeneratePlan}
            disabled={generatingPlan}
          >
            {generatingPlan ? (
              <View style={loadingContainer}>
                <ActivityIndicator size="small" color="#0F1419" />
                <Text style={generateButtonText}>Generating...</Text>
              </View>
            ) : (
              <Text style={generateButtonText}>Generate Workout Plan</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>

    {/* WEEKLY STATS */}
    <View style={sectionContainer}>
      <Text style={sectionTitle}>This Week's Progress</Text>
      <View style={statsRow}>
        <View style={statCard}>
          <Text style={statValue}>
            {weeklyStats?.completedWorkouts || 0}/{weeklyStats?.scheduledWorkouts || 4}
          </Text>
          <Text style={statLabel}>Workouts</Text>
        </View>
        <View style={statCard}>
          <Text style={statValue}>
            {(weeklyStats?.totalVolume || 0).toLocaleString()}
          </Text>
          <Text style={statLabel}>Total lbs</Text>
        </View>
        <View style={statCard}>
          <Text style={statValue}>
            {(weeklyStats?.averageRPE || 0).toFixed(1)}
          </Text>
          <Text style={statLabel}>Avg RPE</Text>
        </View>
      </View>
    </View>

    {/* QUICK ACTIONS */}
    <View style={sectionContainer}>
      <Text style={sectionTitle}>Quick Actions</Text>
      <View style={actionsRow}>
        <TouchableOpacity
          style={[actionButton, generatingPlan && actionButtonDisabled]}
          onPress={handleGeneratePlan}
          disabled={generatingPlan}
        >
          <View style={actionIconContainer}>
            <RefreshIconSVG />
          </View>
          <Text style={actionLabel}>New Plan</Text>
        </TouchableOpacity>
        
        {/* Add more quick actions as needed */}
      </View>
    </View>

  </ScrollView>

</SafeAreaView>
```

---

## 🔧 SVG ICONS NEEDED

### Hamburger Menu
```tsx
const HamburgerIcon = () => (
  <View>
    <View style={{width: 18, height: 2, backgroundColor: '#E0E4E8', marginVertical: 2, borderRadius: 1}} />
    <View style={{width: 18, height: 2, backgroundColor: '#E0E4E8', marginVertical: 2, borderRadius: 1}} />
    <View style={{width: 18, height: 2, backgroundColor: '#E0E4E8', marginVertical: 2, borderRadius: 1}} />
  </View>
);
```

### Fire Icon (Streak)
```tsx
const FireIconSVG = () => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Path d="M18 4 C14 8, 12 12, 14 16 C12 14, 10 16, 10 20 C10 26, 14 30, 18 32 C22 30, 26 26, 26 20 C26 16, 24 14, 22 16 C24 12, 22 8, 18 4 Z" fill="url(#fireGradient)" />
    <Defs>
      <LinearGradient id="fireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF6B6B" />
        <Stop offset="100%" stopColor="#FFB84D" />
      </LinearGradient>
    </Defs>
  </Svg>
);
```

### Checkmark (Safety)
```tsx
const CheckIconSVG = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path d="M2 7 L5.5 10.5 L12 4" stroke="#00D9C0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
```

### Calendar (Empty State)
```tsx
const CalendarIconSVG = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
    <Rect x="6" y="10" width="28" height="24" rx="4" stroke="#00D9C0" strokeWidth="2" />
    <Path d="M6 16 L34 16" stroke="#00D9C0" strokeWidth="2" />
    <Path d="M12 6 L12 10 M28 6 L28 10" stroke="#00D9C0" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);
```

### Refresh (Quick Action)
```tsx
const RefreshIconSVG = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12 C4 16.4 7.6 20 12 20 C16.4 20 20 16.4 20 12 C20 7.6 16.4 4 12 4 L12 8 L8 4 L12 0 L12 4" stroke="#00D9C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
```

---

## 🎯 DESIGN COMPARISON

| Element | OLD | NEW |
|---------|-----|-----|
| **Emojis** | 👋🔥📅📊🎯 | SVG icons |
| **Menu** | Ionicons menu | Hamburger (3 lines) |
| **Streak** | Basic text card | Gradient card with fire icon |
| **Workout card** | Text-heavy | Visual with badges |
| **Stats** | Plain cards | Engaging with color |
| **Quick actions** | Separate section | Integrated, visual |
| **Overall** | Functional | Inspiring dashboard |

---

CRITICAL REMINDERS:
1. **DO NOT BREAK** existing functionality
2. **PRESERVE** all data loading functions
3. **PRESERVE** all navigation handlers
4. **PRESERVE** plan generation logic
5. **PRESERVE** safety indicator conditionals
6. NO emojis (👋🔥📅📊🎯) - use SVG
7. Hamburger menu (NOT Ionicons menu)
8. Keep Ionicons for notifications/profile (OK)
