# WorkoutOverview Screen - Production Specification
## Today's Workout Pre-Start Screen

---

## 🎯 DESIGN PHILOSOPHY

**Current Issues:**
- Uses emojis everywhere (🔥💪🧘🎯✓⚠️)
- Basic card layout
- Exercise cards look like lists
- Section titles with emojis
- "Start Workout →" uses emoji
- Sticky button (should be part of scroll)
- No visual engagement

**New Approach:**
- NO emojis - use SVG icons or clean design
- Beautiful header with workout stats
- Visual exercise cards with thumbnails
- Clean section separators
- Prominent gradient CTA button
- Button scrolls with content
- Inspiring pre-workout screen

---

## 🔧 FUNCTIONALITY TO PRESERVE

**CRITICAL - DO NOT BREAK:**

1. **Data Loading:**
   - `loadWorkout()` - loads workout data
   - `getWorkout(workoutId, userId)`
   - Sets `workout` state with WorkoutDetailData

2. **Navigation:**
   - Back button (navigation.goBack())
   - `handleStartWorkout()` - converts data and navigates to SessionPlayer
   - Exercise card tap (currently console.log, keep for future)

3. **Data Structure:**
   - `workout.workout_name`
   - `workout.estimated_duration_minutes`
   - `workout.warm_up` (total_duration_minutes, exercises)
   - `workout.main_workout` (array of exercises)
   - `workout.cool_down` (total_duration_minutes, exercises)
   - `workout.safety_checkpoints` (array)
   - `workout.metadata` (day_focus, volume_split, hrt_adjusted)

4. **Workout Conversion:**
   - Converts WorkoutDetailData to Workout format for SessionPlayer
   - Maps main_workout to exercises array
   - Passes warmUp, coolDown, safetyCheckpoints

5. **Conditionals:**
   - Show safety checkpoints if array length > 0
   - Show binding_safe tag if ex.binding_safe
   - Show gender_emphasis if present

---

## 📐 EXACT LAYOUT SPECIFICATIONS

### HEADER

```css
Header Container {
  paddingTop: insets.top + 8
  paddingHorizontal: 20
  paddingBottom: 16
  flexDirection: 'row'
  alignItems: 'center'
  justifyContent: 'space-between'
  borderBottomWidth: 1
  borderBottomColor: #2A2F36
}

Back Button {
  width: 40
  height: 40
  borderRadius: 12
  backgroundColor: #1A1F26
  justifyContent: 'center'
  alignItems: 'center'
}

/* Ionicons arrow-back is OK */

Header Title {
  fontSize: 18
  fontWeight: '700'
  color: #FFFFFF
  flex: 1
  textAlign: 'center'
  marginHorizontal: 12
}

Menu Button (placeholder) {
  width: 40
  height: 40
  opacity: 0  /* Empty spacer for centering */
}
```

---

### HERO SECTION (Workout Summary)

```css
Hero Container {
  paddingHorizontal: 20
  paddingVertical: 24
}

Workout Name {
  fontSize: 28
  fontWeight: '800'
  color: #FFFFFF
  marginBottom: 8
  lineHeight: 34
  /* NO emoji */
}

Date Row {
  flexDirection: 'row'
  alignItems: 'center'
  gap: 12
  marginBottom: 20
}

Date Text {
  fontSize: 14
  fontWeight: '500'
  color: #9CA3AF
}

Stats Row {
  flexDirection: 'row'
  gap: 12
  marginBottom: 20
}

Stat Card {
  flex: 1
  backgroundColor: #1A1F26
  borderRadius: 12
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
  fontSize: 11
  fontWeight: '600'
  color: #6B7280
  textTransform: 'uppercase'
  letterSpacing: 0.5
}

/* Focus Badge (metadata) */
Focus Badge {
  backgroundColor: rgba(167, 139, 250, 0.12)
  paddingHorizontal: 12
  paddingVertical: 6
  borderRadius: 8
  alignSelf: 'flex-start'
}

Badge Text {
  fontSize: 12
  fontWeight: '600'
  color: #A78BFA
}
```

---

### SECTION HEADERS

```css
Section Container {
  paddingHorizontal: 20
  marginBottom: 20
}

Section Header {
  flexDirection: 'row'
  alignItems: 'center'
  marginBottom: 12
  gap: 10
}

/* Icon SVG - NOT emoji */
Section Icon Container {
  width: 32
  height: 32
  borderRadius: 16
  backgroundColor: rgba(0, 217, 192, 0.12)
  justifyContent: 'center'
  alignItems: 'center'
}

Section Icon {
  width: 18
  height: 18
}

Section Title {
  fontSize: 18
  fontWeight: '700'
  color: #FFFFFF
  flex: 1
}

Section Count Badge {
  backgroundColor: rgba(0, 217, 192, 0.12)
  paddingHorizontal: 8
  paddingVertical: 3
  borderRadius: 6
}

Badge Text {
  fontSize: 11
  fontWeight: '700'
  color: #00D9C0
}
```

---

### WARM-UP / COOL-DOWN LISTS

```css
Exercise Item {
  flexDirection: 'row'
  justifyContent: 'space-between'
  alignItems: 'center'
  paddingVertical: 10
  paddingHorizontal: 16
  backgroundColor: #1A1F26
  borderRadius: 10
  marginBottom: 8
}

Item Dot {
  width: 6
  height: 6
  borderRadius: 3
  backgroundColor: #00D9C0
  marginRight: 12
}

Item Name {
  fontSize: 15
  fontWeight: '500'
  color: #E0E4E8
  flex: 1
}

Item Duration {
  fontSize: 14
  fontWeight: '600'
  color: #9CA3AF
}
```

---

### MAIN WORKOUT EXERCISE CARDS

```css
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

/* Thumbnail */
Exercise Thumbnail {
  width: 64
  height: 64
  borderRadius: 10
  backgroundColor: #2A2F36
  marginRight: 14
  justifyContent: 'center'
  alignItems: 'center'
}

/* Dumbbell SVG - NOT emoji */
Thumbnail Icon {
  width: 32
  height: 32
}

Exercise Number Badge {
  position: 'absolute'
  top: 4
  left: 4
  width: 24
  height: 24
  borderRadius: 12
  backgroundColor: #00D9C0
  justifyContent: 'center'
  alignItems: 'center'
}

Number Text {
  fontSize: 12
  fontWeight: '800'
  color: #0F1419
}

/* Exercise Info */
Exercise Info {
  flex: 1
}

Exercise Name {
  fontSize: 16
  fontWeight: '600'
  color: #FFFFFF
  marginBottom: 4
  lineHeight: 22
}

Target Muscle Badge {
  backgroundColor: rgba(167, 139, 250, 0.12)
  paddingHorizontal: 8
  paddingVertical: 3
  borderRadius: 6
  alignSelf: 'flex-start'
  marginBottom: 8
}

Target Text {
  fontSize: 11
  fontWeight: '600'
  color: #A78BFA
}

Prescription Row {
  flexDirection: 'row'
  alignItems: 'center'
  gap: 12
  marginBottom: 8
}

Prescription Badge {
  backgroundColor: rgba(0, 217, 192, 0.08)
  paddingHorizontal: 8
  paddingVertical: 4
  borderRadius: 6
}

Prescription Text {
  fontSize: 12
  fontWeight: '600'
  color: #00D9C0
}

/* Tags Row */
Tags Row {
  flexDirection: 'row'
  gap: 6
  flexWrap: 'wrap'
}

Tag {
  backgroundColor: rgba(0, 217, 192, 0.08)
  paddingHorizontal: 6
  paddingVertical: 2
  borderRadius: 4
}

Tag Text {
  fontSize: 10
  fontWeight: '600'
  color: #00D9C0
}

/* Chevron */
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

### SAFETY CHECKPOINTS

```css
Checkpoint Container {
  paddingHorizontal: 20
  marginBottom: 20
}

Checkpoint Card {
  backgroundColor: rgba(255, 184, 77, 0.1)
  borderRadius: 12
  padding: 16
  borderLeftWidth: 4
  borderLeftColor: #FFB84D
}

Card Header {
  flexDirection: 'row'
  alignItems: 'center'
  marginBottom: 12
  gap: 10
}

Warning Icon Container {
  width: 32
  height: 32
  borderRadius: 16
  backgroundColor: rgba(255, 184, 77, 0.15)
  justifyContent: 'center'
  alignItems: 'center'
}

/* Ionicons warning is OK */

Header Title {
  fontSize: 16
  fontWeight: '700'
  color: #FFB84D
  flex: 1
}

Checkpoint Item {
  flexDirection: 'row'
  alignItems: 'flex-start'
  marginBottom: 8
}

Item Dot {
  width: 6
  height: 6
  borderRadius: 3
  backgroundColor: #FFB84D
  marginRight: 10
  marginTop: 7
}

Item Text {
  fontSize: 14
  fontWeight: '500'
  color: #FFF5E6
  flex: 1
  lineHeight: 21
}
```

---

### START WORKOUT BUTTON (SCROLLS WITH CONTENT)

```css
Button Container {
  paddingHorizontal: 20
  paddingTop: 32
  paddingBottom: 24
  /* NOT position: 'absolute' */
}

Start Button {
  height: 64
  borderRadius: 32
  overflow: 'hidden'
  shadowColor: #00D9C0
  shadowOpacity: 0.5
  shadowRadius: 20
  shadowOffset: {width: 0, height: 8}
}

Button Gradient {
  flex: 1
  flexDirection: 'row'
  justifyContent: 'center'
  alignItems: 'center'
  colors: ['#00D9C0', '#00B39D']
  gap: 12
}

Button Icon Container {
  width: 32
  height: 32
  borderRadius: 16
  backgroundColor: rgba(15, 20, 25, 0.15)
  justifyContent: 'center'
  alignItems: 'center'
}

/* Play SVG - NOT emoji */
Play Icon {
  width: 14
  height: 14
}

Button Text {
  fontSize: 18
  fontWeight: '700'
  color: #0F1419
}
```

---

## 🎨 CONTENT SPECIFICATIONS

### Hero Stats
```typescript
const stats = [
  {
    value: `${workout.estimated_duration_minutes}`,
    label: 'Minutes'
  },
  {
    value: `${workout.main_workout.length}`,
    label: 'Exercises'
  },
  {
    value: calculateTotalSets(workout.main_workout),
    label: 'Sets'
  }
];
```

### Section Titles
```
"Warm-Up" (NO emoji 🔥)
"Main Workout" (NO emoji 💪)
"Cool-Down" (NO emoji 🧘)
"Safety Checkpoints" (NO emoji ⚠️)
```

### Exercise Prescription Format
```
"{sets} sets × {reps} reps"
"Rest {rest_seconds}s"
```

### Tags (Conditional)
```typescript
{ex.binding_safe && <Tag>Binding-safe</Tag>}
{ex.gender_emphasis && <Tag>{ex.gender_emphasis}</Tag>}
```

---

## 📊 SPACING SYSTEM (8px Grid)

```
Header padding: 20px horizontal
Hero padding: 24px vertical
Section margins: 20px horizontal, 20px bottom
Exercise cards: marginBottom 12px
Stats row gap: 12px
Button padding: 32px top, 24px bottom
```

---

## 🎯 INTERACTION SPECIFICATIONS

### Back Button
```typescript
<TouchableOpacity onPress={() => navigation.goBack()}>
  <Ionicons name="arrow-back" size={24} />
</TouchableOpacity>
```

### Start Workout
```typescript
const handleStartWorkout = async () => {
  if (!workout) return;

  try {
    const workoutForSession = {
      duration: workout.estimated_duration_minutes as 5 | 15 | 30 | 45,
      exercises: workout.main_workout.map((ex, index) => ({
        exerciseId: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        format: 'straight_sets' as const,
        restSeconds: ex.rest_seconds,
      })),
      totalMinutes: workout.estimated_duration_minutes,
    };

    navigation.navigate('SessionPlayer', {
      workout: workoutForSession,
      planId: workout.id,
      warmUp: workout.warm_up,
      coolDown: workout.cool_down,
      safetyCheckpoints: workout.safety_checkpoints,
    });
  } catch (error) {
    console.error('Failed to start workout:', error);
  }
};
```

### Exercise Card Tap (Future)
```typescript
// Currently console.log, preserve for future
onPress={() => {
  console.log('View exercise:', ex.exercise_id);
  // Future: navigation.navigate('ExerciseDetail', { exerciseId: ex.exercise_id });
}}
```

---

## 🚀 COMPONENT STRUCTURE

```tsx
<SafeAreaView style={container}>
  
  {/* HEADER */}
  <View style={header}>
    <TouchableOpacity style={backButton} onPress={() => navigation.goBack()}>
      <Ionicons name="arrow-back" size={24} color="#E0E4E8" />
    </TouchableOpacity>
    <Text style={headerTitle}>Today's Workout</Text>
    <View style={menuButton} />
  </View>

  <ScrollView>
    
    {/* HERO SECTION */}
    <View style={heroContainer}>
      <Text style={workoutName}>{workout.workout_name}</Text>
      
      <View style={dateRow}>
        <Text style={dateText}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      <View style={statsRow}>
        <View style={statCard}>
          <Text style={statValue}>{workout.estimated_duration_minutes}</Text>
          <Text style={statLabel}>Minutes</Text>
        </View>
        <View style={statCard}>
          <Text style={statValue}>{workout.main_workout.length}</Text>
          <Text style={statLabel}>Exercises</Text>
        </View>
        <View style={statCard}>
          <Text style={statValue}>{calculateTotalSets()}</Text>
          <Text style={statLabel}>Sets</Text>
        </View>
      </View>

      {workout.metadata?.day_focus && (
        <View style={focusBadge}>
          <Text style={badgeText}>{workout.metadata.day_focus}</Text>
        </View>
      )}
    </View>

    {/* WARM-UP */}
    <View style={sectionContainer}>
      <View style={sectionHeader}>
        <View style={sectionIconContainer}>
          <FireIconSVG />
        </View>
        <Text style={sectionTitle}>Warm-Up</Text>
        <View style={sectionCountBadge}>
          <Text style={badgeText}>{workout.warm_up.total_duration_minutes} min</Text>
        </View>
      </View>

      {workout.warm_up.exercises.map((ex, index) => (
        <View key={index} style={exerciseItem}>
          <View style={itemDot} />
          <Text style={itemName}>{ex.name}</Text>
          <Text style={itemDuration}>{ex.duration || ex.reps}</Text>
        </View>
      ))}
    </View>

    {/* MAIN WORKOUT */}
    <View style={sectionContainer}>
      <View style={sectionHeader}>
        <View style={sectionIconContainer}>
          <DumbbellIconSVG />
        </View>
        <Text style={sectionTitle}>Main Workout</Text>
        <View style={sectionCountBadge}>
          <Text style={badgeText}>{workout.main_workout.length}</Text>
        </View>
      </View>

      {workout.main_workout.map((ex, index) => (
        <TouchableOpacity
          key={index}
          style={exerciseCard}
          onPress={() => console.log('View exercise:', ex.exercise_id)}
        >
          <View style={exerciseThumbnail}>
            <DumbbellIconSVG />
            <View style={exerciseNumberBadge}>
              <Text style={numberText}>{index + 1}</Text>
            </View>
          </View>

          <View style={exerciseInfo}>
            <Text style={exerciseName}>{ex.exercise_name}</Text>
            
            {ex.target_muscle && (
              <View style={targetMuscleBadge}>
                <Text style={targetText}>{ex.target_muscle}</Text>
              </View>
            )}

            <View style={prescriptionRow}>
              <View style={prescriptionBadge}>
                <Text style={prescriptionText}>{ex.sets} sets × {ex.reps} reps</Text>
              </View>
              <View style={prescriptionBadge}>
                <Text style={prescriptionText}>Rest {ex.rest_seconds}s</Text>
              </View>
            </View>

            <View style={tagsRow}>
              {ex.binding_safe && (
                <View style={tag}>
                  <Text style={tagText}>Binding-safe</Text>
                </View>
              )}
              {ex.gender_emphasis && (
                <View style={tag}>
                  <Text style={tagText}>{ex.gender_emphasis}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={chevronContainer}>
            <ChevronRightSVG />
          </View>
        </TouchableOpacity>
      ))}
    </View>

    {/* COOL-DOWN */}
    <View style={sectionContainer}>
      <View style={sectionHeader}>
        <View style={sectionIconContainer}>
          <StretchIconSVG />
        </View>
        <Text style={sectionTitle}>Cool-Down</Text>
        <View style={sectionCountBadge}>
          <Text style={badgeText}>{workout.cool_down.total_duration_minutes} min</Text>
        </View>
      </View>

      {workout.cool_down.exercises.map((ex, index) => (
        <View key={index} style={exerciseItem}>
          <View style={itemDot} />
          <Text style={itemName}>{ex.name}</Text>
          <Text style={itemDuration}>{ex.duration || ex.reps}</Text>
        </View>
      ))}
    </View>

    {/* SAFETY CHECKPOINTS (Conditional) */}
    {workout.safety_checkpoints && workout.safety_checkpoints.length > 0 && (
      <View style={checkpointContainer}>
        <View style={checkpointCard}>
          <View style={cardHeader}>
            <View style={warningIconContainer}>
              <Ionicons name="warning" size={20} color="#FFB84D" />
            </View>
            <Text style={headerTitle}>Safety Checkpoints</Text>
          </View>

          {workout.safety_checkpoints.map((checkpoint, index) => (
            <View key={index} style={checkpointItem}>
              <View style={itemDot} />
              <Text style={itemText}>{checkpoint.message}</Text>
            </View>
          ))}
        </View>
      </View>
    )}

    {/* START BUTTON (SCROLLS WITH CONTENT) */}
    <View style={buttonContainer}>
      <TouchableOpacity style={startButton} onPress={handleStartWorkout}>
        <LinearGradient
          colors={['#00D9C0', '#00B39D']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={buttonGradient}
        >
          <View style={buttonIconContainer}>
            <PlayIconSVG />
          </View>
          <Text style={buttonText}>Start Workout</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>

  </ScrollView>

</SafeAreaView>
```

---

## 🔧 SVG ICONS NEEDED

### Fire (Warm-Up)
```tsx
const FireIconSVG = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M9 2 C7 4, 6 6, 7 8 C6 7, 5 8, 5 10 C5 13, 7 15, 9 16 C11 15, 13 13, 13 10 C13 8, 12 7, 11 8 C12 6, 11 4, 9 2 Z" fill="#00D9C0" />
  </Svg>
);
```

### Dumbbell (Main Workout)
```tsx
const DumbbellIconSVG = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path d="M6 12 L6 20 M26 12 L26 20 M10 16 L22 16" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
    <Circle cx="6" cy="16" r="3" fill="#6B7280" />
    <Circle cx="26" cy="16" r="3" fill="#6B7280" />
  </Svg>
);
```

### Stretch (Cool-Down)
```tsx
const StretchIconSVG = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="5" r="2" stroke="#00D9C0" strokeWidth="2" />
    <Path d="M9 7 L9 13 M9 13 L6 16 M9 13 L12 16 M9 9 L6 9 M9 9 L12 9" stroke="#00D9C0" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);
```

### Play (Button)
```tsx
const PlayIconSVG = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path d="M3 2 L11 7 L3 12 Z" fill="#0F1419" />
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

## 🎯 DESIGN COMPARISON

| Element | OLD | NEW |
|---------|-----|-----|
| **Emojis** | 🔥💪🧘🎯✓⚠️ | SVG icons |
| **Hero** | Basic text | Stats cards with visual |
| **Sections** | Emoji titles | Icon containers |
| **Exercises** | List items | Rich cards with thumbnails |
| **Button** | Sticky bottom | Scrolls with content |
| **Safety** | Basic warning | Beautiful alert card |
| **Overall** | Functional list | Inspiring pre-workout |

---

CRITICAL REMINDERS:
1. **PRESERVE** all data loading (`getWorkout`)
2. **PRESERVE** navigation (`handleStartWorkout`, back button)
3. **PRESERVE** data conversion for SessionPlayer
4. **PRESERVE** all conditionals (checkpoints, tags)
5. NO emojis (🔥💪🧘🎯✓⚠️) - use SVG
6. Button SCROLLS with content (NOT sticky)
7. Ionicons arrow-back and warning are OK
