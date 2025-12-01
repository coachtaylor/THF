# PlanView (My Plan) Screen - Production Specification

---

## 🎯 DESIGN PHILOSOPHY

**Current Issues:**
- Settings button uses emoji (⚙️)
- Weekly calendar feels cramped
- Day cards are basic
- Time variant selector lacks visual polish
- "Start Workout" button is generic
- Exercise list is functional but not inspiring
- No clear visual hierarchy
- Missing motivational elements

**New Approach:**
- Clean hamburger menu icon (3 lines, NO emoji)
- Spacious weekly calendar with clear "today" indicator
- Beautiful day cards with gradients
- Sleek time variant selector (segmented control)
- Prominent "Start Workout" CTA with gradient
- Rich exercise cards with previews
- Clear visual hierarchy
- Motivational stats and progress indicators
- Professional, fitness-app aesthetic

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

Header Title {
  fontSize: 32
  fontWeight: '700'
  color: #FFFFFF
  letterSpacing: -0.5
  textAlign: 'left'
}

Menu Button (TouchableOpacity) {
  width: 40
  height: 40
  borderRadius: 12
  backgroundColor: #1A1F26
  justifyContent: 'center'
  alignItems: 'center'
}

/* NO EMOJI - Hamburger Icon with 3 lines */
Menu Line (View) {
  width: 18
  height: 2
  backgroundColor: #E0E4E8
  marginVertical: 2
  borderRadius: 1
}
```

---

### WEEKLY CALENDAR

```css
Calendar Container {
  paddingVertical: 16
  paddingHorizontal: 20
  marginBottom: 20
}

Calendar ScrollView {
  horizontal: true
  showsHorizontalScrollIndicator: false
}

Calendar Content {
  gap: 10
}

Day Card (TouchableOpacity) {
  width: 56
  height: 72
  borderRadius: 14
  backgroundColor: #1A1F26
  borderWidth: 2
  borderColor: #2A2F36
  padding: 8
  justifyContent: 'space-between'
  alignItems: 'center'
}

/* Today indicator */
Day Card (today) {
  borderColor: #00D9C0
  backgroundColor: rgba(0, 217, 192, 0.08)
}

/* Selected state */
Day Card (selected) {
  borderColor: #00D9C0
  backgroundColor: rgba(0, 217, 192, 0.12)
  shadowColor: #00D9C0
  shadowOpacity: 0.3
  shadowRadius: 8
  shadowOffset: {width: 0, height: 4}
}

Day Name {
  fontSize: 11
  fontWeight: '600'
  color: #9CA3AF
  textTransform: 'uppercase'
  letterSpacing: 0.5
}

Day Name (today/selected) {
  color: #00D9C0
}

Day Number {
  fontSize: 20
  fontWeight: '700'
  color: #FFFFFF
}

Day Number (today/selected) {
  color: #00D9C0
}

Workout Indicator (View) {
  position: 'absolute'
  bottom: 6
  width: 5
  height: 5
  borderRadius: 2.5
  backgroundColor: #00D9C0
}
```

---

### TIME VARIANT SELECTOR (Segmented Control)

```css
Selector Container {
  paddingHorizontal: 20
  marginBottom: 20
}

Segmented Control Container {
  backgroundColor: #1A1F26
  borderRadius: 12
  padding: 4
  flexDirection: 'row'
  gap: 4
}

Segment Button (TouchableOpacity) {
  flex: 1
  height: 40
  borderRadius: 8
  justifyContent: 'center'
  alignItems: 'center'
  backgroundColor: 'transparent'
}

Segment Button (selected) {
  backgroundColor: #00D9C0
}

Segment Text {
  fontSize: 14
  fontWeight: '600'
  color: #9CA3AF
}

Segment Text (selected) {
  color: #0F1419
  fontWeight: '700'
}
```

---

### WORKOUT SUMMARY CARD (Top Card)

```css
Summary Card Container {
  paddingHorizontal: 20
  marginBottom: 20
}

Summary Card {
  backgroundColor: #1A1F26
  borderRadius: 16
  padding: 20
  borderWidth: 1
  borderColor: #2A2F36
}

Card Header {
  marginBottom: 16
}

Workout Title {
  fontSize: 20
  fontWeight: '700'
  color: #FFFFFF
  marginBottom: 4
}

Workout Subtitle {
  fontSize: 14
  fontWeight: '500'
  color: #9CA3AF
}

Stats Row {
  flexDirection: 'row'
  justifyContent: 'space-around'
  paddingVertical: 16
  borderTopWidth: 1
  borderTopColor: #2A2F36
  marginBottom: 16
}

Stat Item {
  alignItems: 'center'
}

Stat Value {
  fontSize: 24
  fontWeight: '700'
  color: #00D9C0
  marginBottom: 2
}

Stat Label {
  fontSize: 12
  fontWeight: '500'
  color: #6B7280
  textTransform: 'uppercase'
  letterSpacing: 0.5
}

/* Start Workout Button */
Start Button {
  height: 56
  borderRadius: 28
  overflow: 'hidden'
}

Button Gradient {
  flex: 1
  flexDirection: 'row'
  justifyContent: 'center'
  alignItems: 'center'
  colors: ['#00D9C0', '#00B39D']
  shadowColor: #00D9C0
  shadowOpacity: 0.4
  shadowRadius: 12
}

Button Icon Container {
  width: 28
  height: 28
  borderRadius: 14
  backgroundColor: rgba(15, 20, 25, 0.2)
  marginRight: 10
  justifyContent: 'center'
  alignItems: 'center'
}

/* Play icon SVG - NOT emoji */
Play Icon (SVG Path) {
  stroke: none
  fill: #0F1419
}

Button Text {
  fontSize: 17
  fontWeight: '700'
  color: #0F1419
}
```

---

### EXERCISE LIST

```css
Exercise List Container {
  paddingHorizontal: 20
}

Section Header {
  flexDirection: 'row'
  justifyContent: 'space-between'
  alignItems: 'center'
  marginBottom: 12
}

Section Title {
  fontSize: 16
  fontWeight: '700'
  color: #FFFFFF
}

Exercise Count Badge {
  backgroundColor: rgba(0, 217, 192, 0.12)
  paddingHorizontal: 10
  paddingVertical: 4
  borderRadius: 12
}

Badge Text {
  fontSize: 12
  fontWeight: '700'
  color: #00D9C0
}

Exercise Card (TouchableOpacity) {
  backgroundColor: #1A1F26
  borderRadius: 14
  padding: 16
  marginBottom: 12
  borderWidth: 1
  borderColor: #2A2F36
  flexDirection: 'row'
  alignItems: 'center'
}

/* Thumbnail placeholder */
Exercise Thumbnail {
  width: 64
  height: 64
  borderRadius: 10
  backgroundColor: #2A2F36
  marginRight: 14
  justifyContent: 'center'
  alignItems: 'center'
}

Thumbnail Icon {
  fontSize: 24
  /* SVG dumbbell icon - NOT emoji */
}

Exercise Info {
  flex: 1
}

Exercise Name {
  fontSize: 15
  fontWeight: '600'
  color: #FFFFFF
  marginBottom: 4
  lineHeight: 20
}

Exercise Details Row {
  flexDirection: 'row'
  alignItems: 'center'
  gap: 12
  marginBottom: 6
}

Detail Badge {
  backgroundColor: rgba(167, 139, 250, 0.12)
  paddingHorizontal: 8
  paddingVertical: 3
  borderRadius: 6
}

Detail Text {
  fontSize: 11
  fontWeight: '600'
  color: #A78BFA
}

Equipment Text {
  fontSize: 13
  fontWeight: '400'
  color: #6B7280
}

/* Safety tags */
Safety Tags Row {
  flexDirection: 'row'
  gap: 6
  marginTop: 6
}

Safety Tag {
  backgroundColor: rgba(0, 217, 192, 0.12)
  paddingHorizontal: 6
  paddingVertical: 2
  borderRadius: 4
}

Safety Tag Text {
  fontSize: 10
  fontWeight: '600'
  color: #00D9C0
  textTransform: 'uppercase'
}

/* Chevron icon */
Chevron Container {
  width: 24
  height: 24
  justifyContent: 'center'
  alignItems: 'center'
}

Chevron SVG {
  stroke: #6B7280
  strokeWidth: 2
}
```

---

## 🎨 CONTENT SPECIFICATIONS

### Workout Stats
```typescript
{
  exercises: number,  // Total exercises in workout
  duration: number,   // Estimated duration in minutes
  sets: number        // Total number of sets
}
```

### Exercise Details Format
```
Sets: "3 sets"
Reps: "8-12 reps"
Rest: "60s rest"
Equipment: "Dumbbells"
```

### Safety Tags (Conditional)
```
- "Binder Safe" (if binder_aware = true)
- "Pelvic Floor" (if pelvic_floor_aware = true)
```

---

## 📊 SPACING SYSTEM (8px Grid)

```
Header padding: 20px horizontal
Calendar padding: 20px horizontal
Card margins: 20px horizontal, 12px bottom
Card padding: 16-20px
Exercise thumbnail: 64x64
Button height: 56px
Section gaps: 20px
```

---

## 🎯 INTERACTION SPECIFICATIONS

### Day Selection
```
Tap day card → Update selectedDay
→ Haptic feedback (medium)
→ Animate border/background
→ Load workout for selected day
→ Scroll to show exercises
```

### Time Variant Selection
```
Tap segment → Update selectedVariant
→ Haptic feedback (light)
→ Animate background slide
→ Update workout display
→ Update stats (exercises, duration, sets)
```

### Start Workout Button
```
Tap button → Navigate to SessionPlayer
→ Haptic feedback (heavy)
→ Scale animation (0.95)
→ Pass workout data to SessionPlayer
```

### Exercise Card
```
Tap exercise → Show ExerciseDetailSheet
→ Haptic feedback (light)
→ Open bottom sheet modal
→ Show video, description, modifications
```

### Menu Button
```
Tap menu → Open menu/settings
→ Haptic feedback (light)
→ Navigate to settings or show menu sheet
```

---

## ✅ VALIDATION & STATES

### Loading State
```tsx
if (loading) {
  return (
    <View style={centerContent}>
      <ActivityIndicator color="#00D9C0" size="large" />
      <Text style={loadingText}>Loading your plan...</Text>
    </View>
  );
}
```

### No Plan State
```tsx
if (!plan) {
  return (
    <View style={centerContent}>
      <Text style={errorText}>No workout plan yet</Text>
      <Text style={errorSubtext}>
        Complete your profile to generate a plan
      </Text>
      <Button onPress={() => navigate('Review')}>
        Create Plan
      </Button>
    </View>
  );
}
```

### Empty Workout State
```tsx
if (!workout) {
  return (
    <View style={summaryCard}>
      <Text>No workout available for {duration} minutes</Text>
      <Text>Try a different duration</Text>
    </View>
  );
}
```

---

## 🚀 COMPONENT STRUCTURE

```tsx
<SafeAreaView style={container}>
  
  {/* HEADER */}
  <View style={header}>
    <Text style={headerTitle}>My Plan</Text>
    <TouchableOpacity style={menuButton} onPress={handleMenu}>
      <View style={hamburgerIcon}>
        <View style={menuLine} />
        <View style={menuLine} />
        <View style={menuLine} />
      </View>
    </TouchableOpacity>
  </View>

  <ScrollView>
    
    {/* WEEKLY CALENDAR */}
    <View style={calendarContainer}>
      <ScrollView horizontal>
        {days.map((day) => (
          <TouchableOpacity
            key={day.dayNumber}
            style={[
              dayCard,
              isToday && dayCardToday,
              isSelected && dayCardSelected
            ]}
            onPress={() => setSelectedDay(day.dayNumber)}
          >
            <Text style={dayName}>{formatDayName(day.date)}</Text>
            <Text style={dayNumber}>{day.date.getDate()}</Text>
            {hasWorkout && <View style={workoutIndicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>

    {/* TIME VARIANT SELECTOR */}
    <View style={selectorContainer}>
      <View style={segmentedControl}>
        {[5, 15, 30, 45].map((duration) => (
          <TouchableOpacity
            key={duration}
            style={[
              segmentButton,
              selectedVariant === duration && segmentSelected
            ]}
            onPress={() => setSelectedVariant(duration)}
          >
            <Text style={segmentText}>{duration} min</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* WORKOUT SUMMARY CARD */}
    <View style={summaryContainer}>
      <View style={summaryCard}>
        <View style={cardHeader}>
          <Text style={workoutTitle}>
            {formatWorkoutTitle(workout)}
          </Text>
          <Text style={workoutSubtitle}>
            {formatDate(day.date)}
          </Text>
        </View>

        <View style={statsRow}>
          <View style={statItem}>
            <Text style={statValue}>{workout.exercises.length}</Text>
            <Text style={statLabel}>Exercises</Text>
          </View>
          <View style={statItem}>
            <Text style={statValue}>{workout.duration}</Text>
            <Text style={statLabel}>Minutes</Text>
          </View>
          <View style={statItem}>
            <Text style={statValue}>{totalSets}</Text>
            <Text style={statLabel}>Sets</Text>
          </View>
        </View>

        <TouchableOpacity style={startButton} onPress={handleStart}>
          <LinearGradient style={buttonGradient}>
            <View style={buttonIconContainer}>
              <PlayIconSVG />
            </View>
            <Text style={buttonText}>Start Workout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>

    {/* EXERCISE LIST */}
    <View style={exerciseListContainer}>
      <View style={sectionHeader}>
        <Text style={sectionTitle}>Exercises</Text>
        <View style={exerciseCountBadge}>
          <Text style={badgeText}>{workout.exercises.length}</Text>
        </View>
      </View>

      {workout.exercises.map((exercise, index) => (
        <TouchableOpacity
          key={index}
          style={exerciseCard}
          onPress={() => handleExercisePress(exercise.exerciseId)}
        >
          <View style={exerciseThumbnail}>
            <DumbbellIconSVG />
          </View>

          <View style={exerciseInfo}>
            <Text style={exerciseName}>{exercise.name}</Text>
            
            <View style={exerciseDetailsRow}>
              <View style={detailBadge}>
                <Text style={detailText}>{exercise.sets} sets</Text>
              </View>
              <View style={detailBadge}>
                <Text style={detailText}>{exercise.reps} reps</Text>
              </View>
            </View>

            {exercise.equipment && (
              <Text style={equipmentText}>{exercise.equipment}</Text>
            )}

            {(exercise.binderSafe || exercise.pelvicFloorFriendly) && (
              <View style={safetyTagsRow}>
                {exercise.binderSafe && (
                  <View style={safetyTag}>
                    <Text style={safetyTagText}>Binder Safe</Text>
                  </View>
                )}
                {exercise.pelvicFloorFriendly && (
                  <View style={safetyTag}>
                    <Text style={safetyTagText}>Pelvic Floor</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={chevronContainer}>
            <ChevronRightSVG />
          </View>
        </TouchableOpacity>
      ))}
    </View>

    {/* Bottom padding */}
    <View style={{height: insets.bottom + 24}} />
  </ScrollView>

  {/* Exercise Detail Sheet */}
  {selectedExerciseId && (
    <ExerciseDetailSheet
      exerciseId={selectedExerciseId}
      onClose={() => setSelectedExerciseId(null)}
    />
  )}

</SafeAreaView>
```

---

## 🎯 DESIGN COMPARISON

| Element | OLD | NEW |
|---------|-----|-----|
| **Header button** | Emoji settings (⚙️) | Hamburger menu icon |
| **Calendar** | Cramped, basic | Spacious with today indicator |
| **Time selector** | Basic buttons | Sleek segmented control |
| **Workout card** | Plain card | Gradient card with stats |
| **Start button** | Generic button | Prominent CTA with gradient |
| **Exercise list** | Simple list | Rich cards with thumbnails |
| **Overall** | Functional | Inspiring, professional |

---

## 🔧 SVG ICONS NEEDED

### Hamburger Menu (3 lines)
```tsx
const HamburgerIcon = () => (
  <View>
    <View style={{width: 18, height: 2, backgroundColor: '#E0E4E8', marginVertical: 2, borderRadius: 1}} />
    <View style={{width: 18, height: 2, backgroundColor: '#E0E4E8', marginVertical: 2, borderRadius: 1}} />
    <View style={{width: 18, height: 2, backgroundColor: '#E0E4E8', marginVertical: 2, borderRadius: 1}} />
  </View>
);
```

### Play Icon
```tsx
const PlayIconSVG = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path d="M3 2 L11 7 L3 12 Z" fill="#0F1419" />
  </Svg>
);
```

### Dumbbell Icon (Exercise Thumbnail)
```tsx
const DumbbellIconSVG = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path d="M6 12 L6 20 M26 12 L26 20 M10 16 L22 16" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
    <Circle cx="6" cy="16" r="3" fill="#6B7280" />
    <Circle cx="26" cy="16" r="3" fill="#6B7280" />
  </Svg>
);
```

### Chevron Right
```tsx
const ChevronRightSVG = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M6 4 L10 8 L6 12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
```

---

CRITICAL:
- NO emoji settings button (⚙️) - use hamburger icon
- Prominent "Start Workout" CTA with gradient
- Rich exercise cards with thumbnails
- Clear visual hierarchy
- Professional fitness app aesthetic
- All SVG icons, no emojis
