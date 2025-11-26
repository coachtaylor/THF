# Experience Screen - Production Specification
## Step 6 of 8 - Profile Setup

---

## 🎯 DESIGN PHILOSOPHY

**Current Issues:**
- Experience cards use checkmark emoji (✓)
- Equipment displayed as cramped chips in grid
- Frequency shown as "X days/week" buttons
- Duration shown as "X minutes" buttons
- Guidance box uses emoji (💡)
- Dividers create visual clutter
- Footer is sticky

**New Approach:**
- Radio button pattern for experience (consistent with other screens)
- Equipment as multi-select checkboxes (clean, organized)
- Frequency as segmented number selector (1-7 days)
- Duration as clean radio buttons with time format
- Professional info badges (no emoji)
- Clean section spacing (no dividers)
- Footer scrolls with content

---

## 📐 EXACT LAYOUT SPECIFICATIONS

### CONTAINER
```css
SafeAreaView {
  flex: 1
  backgroundColor: #0F1419
}

ScrollView {
  flex: 1
}

Content Container {
  paddingTop: insets.top + 16
  paddingBottom: insets.bottom + 24
  paddingHorizontal: 0
}
```

---

### HEADER SECTION
```css
Header Container {
  paddingHorizontal: 24
  marginBottom: 32
}

Progress Indicator {
  marginBottom: 24
}

Headline {
  fontSize: 28
  fontWeight: '700'
  color: #FFFFFF
  lineHeight: 34
  letterSpacing: -0.4
  marginBottom: 8
  textAlign: 'left'
}

Subheadline {
  fontSize: 15
  fontWeight: '400'
  color: #9CA3AF
  lineHeight: 22
  textAlign: 'left'
}
```

---

### SECTION A: EXPERIENCE LEVEL (Radio Cards)

```css
Section Container {
  paddingHorizontal: 24
  marginBottom: 32
}

Section Label {
  fontSize: 14
  fontWeight: '600'
  color: #9CA3AF
  marginBottom: 12
  textTransform: 'uppercase'
  letterSpacing: 0.5
  textAlign: 'left'
}

Experience Card (TouchableOpacity) {
  backgroundColor: #1A1F26
  borderRadius: 12
  padding: 16
  marginBottom: 12
  borderWidth: 2
  borderColor: #2A2F36
  flexDirection: 'row'
  alignItems: 'center'
  minHeight: 72
}

/* Last card */
Card:last-child {
  marginBottom: 0
}

/* Selected state */
Card (selected) {
  borderColor: #00D9C0
  backgroundColor: rgba(0, 217, 192, 0.08)
}

Radio Circle {
  width: 24
  height: 24
  borderRadius: 12
  borderWidth: 2
  borderColor: #2A2F36
  marginRight: 16
  justifyContent: 'center'
  alignItems: 'center'
}

Radio Circle (selected) {
  borderColor: #00D9C0
}

Radio Dot {
  width: 12
  height: 12
  borderRadius: 6
  backgroundColor: #00D9C0
}

Text Container {
  flex: 1
}

Card Title {
  fontSize: 16
  fontWeight: '600'
  color: #FFFFFF
  lineHeight: 22
  marginBottom: 2
  textAlign: 'left'
}

Card Title (selected) {
  color: #00D9C0
}

Card Description {
  fontSize: 14
  fontWeight: '400'
  color: #9CA3AF
  lineHeight: 20
  textAlign: 'left'
}

Card Description (selected) {
  color: #B8C5C5
}
```

---

### SECTION B: EQUIPMENT SELECTION (Multi-select Checkboxes)

```css
Section Container {
  paddingHorizontal: 24
  marginBottom: 32
}

Section Label {
  fontSize: 14
  fontWeight: '600'
  color: #9CA3AF
  marginBottom: 4
  textTransform: 'uppercase'
  letterSpacing: 0.5
  textAlign: 'left'
}

Section Description {
  fontSize: 13
  fontWeight: '400'
  color: #6B7280
  marginBottom: 12
  lineHeight: 19
  textAlign: 'left'
}

Equipment Grid {
  flexDirection: 'row'
  flexWrap: 'wrap'
  marginLeft: -8
  marginTop: 0
}

Equipment Checkbox (TouchableOpacity) {
  width: calc((100% - 24px) / 2)  /* Two columns with 8px gap */
  marginLeft: 8
  marginBottom: 8
  backgroundColor: #1A1F26
  borderRadius: 10
  padding: 12
  borderWidth: 2
  borderColor: #2A2F36
  flexDirection: 'row'
  alignItems: 'center'
  minHeight: 48
}

/* Special: Bodyweight always selected */
Checkbox (bodyweight) {
  borderColor: #00D9C0
  backgroundColor: rgba(0, 217, 192, 0.08)
  opacity: 1
}

/* Selected state */
Checkbox (selected) {
  borderColor: #00D9C0
  backgroundColor: rgba(0, 217, 192, 0.08)
}

Checkbox Square {
  width: 20
  height: 20
  borderRadius: 5
  borderWidth: 2
  borderColor: #2A2F36
  marginRight: 10
  justifyContent: 'center'
  alignItems: 'center'
}

Checkbox Square (selected) {
  borderColor: #00D9C0
  backgroundColor: #00D9C0
}

Checkmark SVG {
  stroke: #0F1419
  strokeWidth: 2.5
}

Checkbox Label {
  fontSize: 14
  fontWeight: '500'
  color: #E0E4E8
  flex: 1
}

Checkbox Label (selected) {
  fontWeight: '600'
  color: #00D9C0
}
```

---

### SECTION C: WORKOUT FREQUENCY (Number Selector)

```css
Section Container {
  paddingHorizontal: 24
  marginBottom: 32
}

Section Label {
  fontSize: 14
  fontWeight: '600'
  color: #9CA3AF
  marginBottom: 12
  textTransform: 'uppercase'
  letterSpacing: 0.5
  textAlign: 'left'
}

/* Number selector: 3-6 days */
Frequency Selector Container {
  flexDirection: 'row'
  gap: 8
}

Frequency Button (TouchableOpacity) {
  flex: 1
  backgroundColor: #1A1F26
  borderRadius: 12
  padding: 16
  borderWidth: 2
  borderColor: #2A2F36
  justifyContent: 'center'
  alignItems: 'center'
  minHeight: 64
}

Button (selected) {
  borderColor: #00D9C0
  backgroundColor: rgba(0, 217, 192, 0.08)
}

Frequency Number {
  fontSize: 24
  fontWeight: '700'
  color: #FFFFFF
  marginBottom: 4
}

Frequency Number (selected) {
  color: #00D9C0
}

Frequency Label {
  fontSize: 12
  fontWeight: '500'
  color: #9CA3AF
}

Frequency Label (selected) {
  color: #B8C5C5
}

/* Info Badge */
Info Badge Container {
  marginTop: 16
}

Info Badge {
  backgroundColor: rgba(91, 159, 255, 0.1)
  borderRadius: 10
  padding: 12
  flexDirection: 'row'
  alignItems: 'center'
}

Info Icon {
  width: 20
  height: 20
  marginRight: 10
  /* SVG info icon - NOT emoji */
}

Info Text {
  fontSize: 13
  fontWeight: '400'
  color: #B8C5C5
  lineHeight: 18
  flex: 1
}
```

---

### SECTION D: SESSION DURATION (Radio Buttons)

```css
Section Container {
  paddingHorizontal: 24
  marginBottom: 32
}

Section Label {
  fontSize: 14
  fontWeight: '600'
  color: #9CA3AF
  marginBottom: 12
  textTransform: 'uppercase'
  letterSpacing: 0.5
  textAlign: 'left'
}

Duration Options Container {
  flexDirection: 'row'
  flexWrap: 'wrap'
  gap: 8
}

Duration Radio Button (TouchableOpacity) {
  flex: 1
  minWidth: calc((100% - 8px) / 2)  /* Two columns */
  backgroundColor: #1A1F26
  borderRadius: 12
  padding: 14
  borderWidth: 2
  borderColor: #2A2F36
  flexDirection: 'row'
  alignItems: 'center'
  justifyContent: 'center'
  minHeight: 56
}

Button (selected) {
  borderColor: #00D9C0
  backgroundColor: rgba(0, 217, 192, 0.08)
}

Radio Circle {
  width: 18
  height: 18
  borderRadius: 9
  borderWidth: 2
  borderColor: #2A2F36
  marginRight: 10
  justifyContent: 'center'
  alignItems: 'center'
}

Radio Circle (selected) {
  borderColor: #00D9C0
}

Radio Dot {
  width: 8
  height: 8
  borderRadius: 4
  backgroundColor: #00D9C0
}

Duration Text {
  fontSize: 15
  fontWeight: '500'
  color: #E0E4E8
}

Duration Text (selected) {
  fontWeight: '600'
  color: #00D9C0
}
```

---

### FOOTER (SCROLLS WITH CONTENT)

```css
Footer Container {
  paddingHorizontal: 24
  paddingTop: 32
  paddingBottom: 0
}

Primary Button {
  height: 56
  borderRadius: 28
  overflow: 'hidden'
  marginBottom: 16
}

Button Gradient {
  flex: 1
  justifyContent: 'center'
  alignItems: 'center'
}

Gradient (enabled) {
  colors: ['#00D9C0', '#00B39D']
  shadowColor: #00D9C0
  shadowOpacity: 0.4
}

Gradient (disabled) {
  colors: ['#2A2F36', '#1A1F26']
  opacity: 0.4
}

Button Text {
  fontSize: 17
  fontWeight: '700'
  color: #0F1419 (enabled)
  color: #6B7280 (disabled)
}

Hint Text {
  fontSize: 12
  fontWeight: '400'
  color: #6B7280
  textAlign: 'center'
  lineHeight: 18
}
```

---

## 🎨 CONTENT SPECIFICATIONS

### Experience Level Options
```json
[
  {
    "value": "beginner",
    "title": "Beginner",
    "description": "New to fitness or returning after a break"
  },
  {
    "value": "intermediate",
    "title": "Intermediate",
    "description": "6+ months of consistent training"
  },
  {
    "value": "advanced",
    "title": "Advanced",
    "description": "2+ years of structured training"
  }
]
```

### Equipment Options (Multi-select)
```json
[
  "Bodyweight",  // Always selected, disabled
  "Dumbbells",
  "Barbell",
  "Kettlebell",
  "Resistance Bands",
  "Pull-up Bar",
  "Bench",
  "Yoga Mat",
  "Step",
  "Wall",
  "Chair"
]
```

### Workout Frequency Options
```json
[3, 4, 5, 6]  // days per week
```

### Session Duration Options
```json
[
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" }
]
```

### Info Messages
```
Frequency: "We recommend 3-5 days per week for most people"
```

---

## 📊 SPACING SYSTEM (8px Grid)

```
Section margins: 32px
Card margins: 12px
Equipment grid gap: 8px
Frequency button gap: 8px
Horizontal padding: 24px
Card padding: 12-16px
Footer padding: 32px top, 0 bottom
```

---

## 🎯 INTERACTION SPECIFICATIONS

### Experience Level
```
Tap card → Select experience level
→ Haptic feedback (medium)
→ Deselect others (single selection)
→ Radio dot appears
→ Border/background change
```

### Equipment
```
Tap checkbox → Toggle selection
→ Haptic feedback (light)
→ Allow multiple selections
→ Bodyweight always selected (disabled)
→ Checkmark animates in/out
```

### Workout Frequency
```
Tap frequency button → Select days
→ Haptic feedback (medium)
→ Deselect others
→ Number changes to teal
→ Border/background change
```

### Session Duration
```
Tap duration button → Select duration
→ Haptic feedback (light)
→ Deselect others
→ Radio dot appears
→ Border/background change
```

---

## ✅ VALIDATION RULES

```typescript
canContinue = 
  fitnessExperience !== null &&
  equipment.length > 0 &&  // At least bodyweight
  workoutFrequency !== null &&
  sessionDuration !== null

// All fields are REQUIRED
```

---

## 🚀 COMPONENT STRUCTURE

```tsx
<SafeAreaView>
  <ScrollView>
    
    {/* HEADER */}
    <View style={header}>
      <ProgressIndicator current={6} total={8} />
      <Text>Tell us about your fitness background</Text>
      <Text>This helps us match you with the right program</Text>
    </View>

    {/* SECTION A: EXPERIENCE LEVEL */}
    <View style={sectionContainer}>
      <Text style={sectionLabel}>Experience Level</Text>
      
      {EXPERIENCE_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            experienceCard,
            fitnessExperience === option.value && cardSelected
          ]}
          onPress={() => setFitnessExperience(option.value)}
        >
          <View style={radioCircle}>
            {fitnessExperience === option.value && (
              <View style={radioDot} />
            )}
          </View>
          <View style={textContainer}>
            <Text style={cardTitle}>{option.title}</Text>
            <Text style={cardDescription}>{option.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>

    {/* SECTION B: EQUIPMENT */}
    <View style={sectionContainer}>
      <Text style={sectionLabel}>Available Equipment</Text>
      <Text style={sectionDescription}>Select all that apply</Text>
      
      <View style={equipmentGrid}>
        {EQUIPMENT_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              equipmentCheckbox,
              equipment.includes(item) && checkboxSelected,
              item === 'Bodyweight' && checkboxBodyweight
            ]}
            onPress={() => toggleEquipment(item)}
            disabled={item === 'Bodyweight'}
          >
            <View style={[
              checkboxSquare,
              equipment.includes(item) && squareSelected
            ]}>
              {equipment.includes(item) && <CheckmarkSVG />}
            </View>
            <Text style={checkboxLabel}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* SECTION C: FREQUENCY */}
    <View style={sectionContainer}>
      <Text style={sectionLabel}>Workout Frequency</Text>
      
      <View style={frequencySelector}>
        {[3, 4, 5, 6].map((days) => (
          <TouchableOpacity
            key={days}
            style={[
              frequencyButton,
              workoutFrequency === days && buttonSelected
            ]}
            onPress={() => setWorkoutFrequency(days)}
          >
            <Text style={frequencyNumber}>{days}</Text>
            <Text style={frequencyLabel}>days</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={infoBadgeContainer}>
        <View style={infoBadge}>
          <InfoIcon />
          <Text style={infoText}>
            We recommend 3-5 days per week for most people
          </Text>
        </View>
      </View>
    </View>

    {/* SECTION D: DURATION */}
    <View style={sectionContainer}>
      <Text style={sectionLabel}>Session Duration</Text>
      
      <View style={durationOptions}>
        {DURATION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              durationRadio,
              sessionDuration === option.value && radioSelected
            ]}
            onPress={() => setSessionDuration(option.value)}
          >
            <View style={radioCircle}>
              {sessionDuration === option.value && <View style={radioDot} />}
            </View>
            <Text style={durationText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* FOOTER (SCROLLS WITH CONTENT) */}
    <View style={footerContainer}>
      <TouchableOpacity disabled={!canContinue}>
        <LinearGradient>Continue</LinearGradient>
      </TouchableOpacity>
      <Text style={hintText}>
        All fields are required
      </Text>
    </View>

  </ScrollView>
</SafeAreaView>
```

---

## 🎯 DESIGN COMPARISON

| Element | OLD | NEW |
|---------|-----|-----|
| **Experience** | Cards with checkmark emoji (✓) | Radio button cards |
| **Equipment** | Cramped chip grid | Clean 2-column checkboxes |
| **Frequency** | "X days/week" buttons | Number selector (3-6) |
| **Duration** | Text buttons | Radio buttons with time |
| **Info** | Emoji guidance box (💡) | Professional info badge |
| **Dividers** | Multiple dividers | Clean section spacing |
| **Footer** | Sticky | Scrolls with content |
| **Overall** | Cluttered, emoji-heavy | Clean, professional |

---

CRITICAL:
- NO emoji checkmark (✓) - use SVG
- NO emoji info icon (💡) - use SVG
- Equipment: Bodyweight always selected and disabled
- Footer scrolls with content
- All fields are REQUIRED
