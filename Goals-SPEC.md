# Goals Screen - Production Specification
## Step 5 of 8 - Profile Setup

---

## 🎯 DESIGN PHILOSOPHY

**Current Issues:**
- Large goal cards with emojis (💪🏃🧘✨) look childish
- Grid layout wastes space
- Body focus chips are cluttered
- "Primary" and "Secondary" badges look amateurish
- Footer is sticky (should scroll)
- No clear visual hierarchy

**New Approach:**
- Clean icon-free cards with modern styling
- List layout instead of grid (better mobile UX)
- Clear primary/secondary selection indicators
- Compact body region pills (optional section)
- Professional badge design
- Footer scrolls with content
- Gender-specific goals based on Step 1

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

### GOAL SELECTION CARDS

**Pattern: Vertical list of large tap targets**

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
  marginBottom: 16
  lineHeight: 19
  textAlign: 'left'
}

Goal Card (TouchableOpacity) {
  backgroundColor: #1A1F26
  borderRadius: 14
  padding: 20
  marginBottom: 12
  borderWidth: 2
  borderColor: #2A2F36
  minHeight: 88
}

/* Last card */
Card:last-child {
  marginBottom: 0
}

/* Unselected state */
Card (default) {
  borderColor: #2A2F36
  backgroundColor: #1A1F26
}

/* Primary selected state */
Card (primary) {
  borderColor: #00D9C0
  backgroundColor: rgba(0, 217, 192, 0.1)
}

/* Secondary selected state */
Card (secondary) {
  borderColor: #A78BFA
  backgroundColor: rgba(167, 139, 250, 0.1)
}

/* Card Layout */
Card Inner {
  flexDirection: 'row'
  alignItems: 'center'
  justifyContent: 'space-between'
}

Card Left Side {
  flex: 1
  flexDirection: 'row'
  alignItems: 'center'
}

/* NO EMOJI - Use colored indicator instead */
Color Indicator (View) {
  width: 4
  height: 48
  borderRadius: 2
  marginRight: 16
  backgroundColor: #2A2F36 (default)
}

Color Indicator (primary) {
  backgroundColor: #00D9C0
}

Color Indicator (secondary) {
  backgroundColor: #A78BFA
}

Text Container {
  flex: 1
}

Card Title {
  fontSize: 18
  fontWeight: '700'
  color: #FFFFFF
  lineHeight: 24
  marginBottom: 4
  textAlign: 'left'
}

Card Title (primary) {
  color: #00D9C0
}

Card Title (secondary) {
  color: #A78BFA
}

Card Description {
  fontSize: 14
  fontWeight: '400'
  color: #9CA3AF
  lineHeight: 20
  textAlign: 'left'
}

Card Description (primary) {
  color: #B8C5C5
}

Card Description (secondary) {
  color: #D4C9FF
}

/* Selection Badge */
Selection Badge (View) {
  paddingHorizontal: 10
  paddingVertical: 4
  borderRadius: 6
  marginLeft: 12
}

Badge (primary) {
  backgroundColor: #00D9C0
}

Badge (secondary) {
  backgroundColor: #A78BFA
}

Badge Text {
  fontSize: 11
  fontWeight: '700'
  color: #0F1419
  textTransform: 'uppercase'
  letterSpacing: 0.5
}
```

---

### BODY FOCUS SECTION (Optional)

```css
Body Focus Container {
  paddingHorizontal: 24
  marginBottom: 32
}

Section Header {
  marginBottom: 20
}

Section Title {
  fontSize: 18
  fontWeight: '700'
  color: #FFFFFF
  marginBottom: 4
  textAlign: 'left'
}

Section Subtitle {
  fontSize: 14
  fontWeight: '400'
  color: #6B7280
  lineHeight: 20
  textAlign: 'left'
}

Optional Badge {
  backgroundColor: rgba(91, 159, 255, 0.15)
  paddingHorizontal: 6
  paddingVertical: 2
  borderRadius: 4
  marginLeft: 8
  alignSelf: 'flex-start'
}

Optional Badge Text {
  fontSize: 11
  fontWeight: '600'
  color: #5B9FFF
  textTransform: 'uppercase'
}

/* Subsections */
Subsection {
  marginBottom: 24
}

Subsection Label {
  fontSize: 14
  fontWeight: '600'
  color: #E0E4E8
  marginBottom: 12
  textAlign: 'left'
}

/* Body Region Pills */
Pills Container {
  flexDirection: 'row'
  flexWrap: 'wrap'
  marginLeft: -8
}

Body Region Pill (TouchableOpacity) {
  paddingHorizontal: 16
  paddingVertical: 10
  borderRadius: 20
  backgroundColor: #1A1F26
  borderWidth: 2
  borderColor: #2A2F36
  marginLeft: 8
  marginBottom: 8
  minHeight: 40
  justifyContent: 'center'
  alignItems: 'center'
}

Pill (selected) {
  backgroundColor: rgba(0, 217, 192, 0.12)
  borderColor: #00D9C0
}

Pill Text {
  fontSize: 14
  fontWeight: '500'
  color: #E0E4E8
}

Pill Text (selected) {
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
  /* NO sticky positioning */
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

### Goal Options (Base)
```json
[
  {
    "value": "strength",
    "title": "Build Strength",
    "description": "Increase muscle mass and power"
  },
  {
    "value": "endurance",
    "title": "Improve Endurance",
    "description": "Boost cardiovascular fitness"
  },
  {
    "value": "general_fitness",
    "title": "General Fitness",
    "description": "Balanced approach to health"
  }
]
```

### Gender-Specific Goals (Conditional)

**If gender_identity === 'mtf':**
```json
{
  "value": "feminization",
  "title": "Feminizing Focus",
  "description": "Emphasize lower body and curves"
}
```

**If gender_identity === 'ftm':**
```json
{
  "value": "masculinization",
  "title": "Masculinizing Focus",
  "description": "Build upper body and shoulders"
}
```

**If gender_identity === 'nonbinary' or 'questioning':**
- Show only base goals (no gender-specific)

### Body Focus Options

**Prefer (Focus more on):**
```json
["Legs", "Glutes", "Back", "Core", "Shoulders", "Arms", "Chest"]
```

**Soft Avoid (Go gently with):**
```json
["Chest", "Hips", "Glutes", "Abdomen", "Shoulders", "No preference"]
```

---

## 📊 SPACING SYSTEM (8px Grid)

```
Section margins: 32px
Card margins: 12px (between cards)
Horizontal padding: 24px (consistent)
Card padding: 20px (internal)
Pill margins: 8px (between pills)
Footer padding: 32px top, 0 bottom
Safe area: insets.top + 16, insets.bottom + 24
```

---

## 🎯 INTERACTION SPECIFICATIONS

### Goal Card Selection Logic

**First tap (no primary):**
```
Tap card → Set as PRIMARY
→ Haptic feedback (medium)
→ Border changes to teal
→ Background tint (teal 10%)
→ "PRIMARY" badge appears
→ Color indicator turns teal
```

**Second tap (has primary, no secondary):**
```
Tap different card → Set as SECONDARY
→ Haptic feedback (light)
→ Border changes to purple
→ Background tint (purple 10%)
→ "SECONDARY" badge appears
→ Color indicator turns purple
```

**Tap primary again:**
```
Tap primary card → DESELECT primary
→ Haptic feedback (light)
→ If has secondary, promote secondary to primary
→ Reset card to default state
```

**Tap secondary again:**
```
Tap secondary card → DESELECT secondary
→ Haptic feedback (light)
→ Reset card to default state
```

**Third tap (has both primary and secondary):**
```
Tap unselected card → Replace primary
→ Old primary becomes secondary
→ Old secondary removed
→ New card becomes primary
```

### Body Region Pills
```
Tap pill → Toggle selection
→ Haptic feedback (light)
→ Allow multiple selections
→ "No preference" clears all soft_avoid selections
```

---

## ✅ VALIDATION RULES

```typescript
canContinue = primaryGoal !== null

// Secondary goal is OPTIONAL
// Body focus is OPTIONAL
// At least one primary goal is REQUIRED
```

---

## 🚀 COMPONENT STRUCTURE

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: '#0F1419' }}>
  <ScrollView>
    
    {/* HEADER */}
    <View style={header}>
      <ProgressIndicator current={5} total={8} />
      <Text style={headline}>What are your fitness goals?</Text>
      <Text style={subheadline}>
        Select your main focus. You can add a secondary goal too.
      </Text>
    </View>

    {/* GOAL CARDS */}
    <View style={sectionContainer}>
      <Text style={sectionLabel}>Your Goals</Text>
      <Text style={sectionDescription}>
        Tap to select primary, tap again for secondary
      </Text>
      
      {goalOptions.map((goal) => (
        <TouchableOpacity
          key={goal.value}
          style={[
            goalCard,
            primaryGoal === goal.value && goalCardPrimary,
            secondaryGoal === goal.value && goalCardSecondary
          ]}
          onPress={() => handleGoalPress(goal.value)}
        >
          <View style={cardLeft}>
            <View style={[
              colorIndicator,
              primaryGoal === goal.value && indicatorPrimary,
              secondaryGoal === goal.value && indicatorSecondary
            ]} />
            <View style={textContainer}>
              <Text style={[
                cardTitle,
                primaryGoal === goal.value && titlePrimary,
                secondaryGoal === goal.value && titleSecondary
              ]}>
                {goal.title}
              </Text>
              <Text style={[
                cardDescription,
                primaryGoal === goal.value && descriptionPrimary,
                secondaryGoal === goal.value && descriptionSecondary
              ]}>
                {goal.description}
              </Text>
            </View>
          </View>
          
          {/* Badge */}
          {primaryGoal === goal.value && (
            <View style={[selectionBadge, badgePrimary]}>
              <Text style={badgeText}>PRIMARY</Text>
            </View>
          )}
          {secondaryGoal === goal.value && (
            <View style={[selectionBadge, badgeSecondary]}>
              <Text style={badgeText}>SECONDARY</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>

    {/* BODY FOCUS (OPTIONAL) */}
    <View style={bodyFocusContainer}>
      <View style={sectionHeader}>
        <View style={titleRow}>
          <Text style={sectionTitle}>Body Focus</Text>
          <View style={optionalBadge}>
            <Text style={optionalBadgeText}>OPTIONAL</Text>
          </View>
        </View>
        <Text style={sectionSubtitle}>
          Customize which areas get more attention
        </Text>
      </View>

      {/* Focus More On */}
      <View style={subsection}>
        <Text style={subsectionLabel}>Focus more on</Text>
        <View style={pillsContainer}>
          {BODY_FOCUS_PREFER.map((region) => (
            <TouchableOpacity
              key={region}
              style={[
                bodyPill,
                bodyFocusPrefer.includes(region) && pillSelected
              ]}
              onPress={() => toggleBodyFocusPrefer(region)}
            >
              <Text style={[
                pillText,
                bodyFocusPrefer.includes(region) && pillTextSelected
              ]}>
                {region}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Go Gently With */}
      <View style={subsection}>
        <Text style={subsectionLabel}>Go gently with</Text>
        <View style={pillsContainer}>
          {BODY_FOCUS_SOFT_AVOID.map((region) => (
            <TouchableOpacity
              key={region}
              style={[
                bodyPill,
                bodyFocusSoftAvoid.includes(region) && pillSelected
              ]}
              onPress={() => toggleBodyFocusSoftAvoid(region)}
            >
              <Text style={[
                pillText,
                bodyFocusSoftAvoid.includes(region) && pillTextSelected
              ]}>
                {region}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>

    {/* FOOTER (SCROLLS WITH CONTENT) */}
    <View style={footerContainer}>
      <TouchableOpacity
        disabled={!canContinue}
        onPress={handleContinue}
        style={primaryButton}
      >
        <LinearGradient>Continue</LinearGradient>
      </TouchableOpacity>
      <Text style={hintText}>
        Secondary goal and body focus are optional
      </Text>
    </View>

  </ScrollView>
</SafeAreaView>
```

---

## 🎯 DESIGN COMPARISON

| Element | OLD | NEW |
|---------|-----|-----|
| **Goal cards** | Grid with emojis (💪🏃) | List with color indicators |
| **Selection** | Checkmarks | PRIMARY/SECONDARY badges |
| **Layout** | 2-column grid | Vertical list |
| **Indicators** | Emoji icons | Colored left border |
| **Body focus** | Large cards | Compact pills |
| **Footer** | Sticky | Scrolls with content |
| **Overall** | Childish, cramped | Professional, spacious |

---

## 🔧 GENDER-SPECIFIC LOGIC

```typescript
const getGoalOptions = (genderIdentity: string) => {
  const baseGoals = [
    { value: 'strength', title: 'Build Strength', description: 'Increase muscle mass and power' },
    { value: 'endurance', title: 'Improve Endurance', description: 'Boost cardiovascular fitness' },
    { value: 'general_fitness', title: 'General Fitness', description: 'Balanced approach to health' }
  ];

  if (genderIdentity === 'mtf') {
    return [
      { value: 'feminization', title: 'Feminizing Focus', description: 'Emphasize lower body and curves' },
      ...baseGoals
    ];
  }

  if (genderIdentity === 'ftm') {
    return [
      { value: 'masculinization', title: 'Masculinizing Focus', description: 'Build upper body and shoulders' },
      ...baseGoals
    ];
  }

  // Non-binary and questioning: only show base goals
  return baseGoals;
};
```

---

CRITICAL: 
- NO emojis anywhere (no 💪🏃🧘✨)
- Footer scrolls with content, NOT sticky
- Color indicators instead of emoji icons
- Professional badge design
