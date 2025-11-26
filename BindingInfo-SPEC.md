# BindingInfo Screen - Production Specification
## Step 3 of 8 - Profile Setup

---

## 🎯 DESIGN PHILOSOPHY

**Current Issues:**
- Large yes/no buttons (inconsistent with Step 2)
- Duration input uses text field + increment buttons (clunky)
- Warning banner uses emoji (⚠️)
- Binder type cards are too large
- No visual hierarchy between required vs optional fields

**New Approach:**
- Segmented control for yes/no (consistent with HRTStatus)
- iOS-style stepper for duration (cleaner than text input)
- Professional warning badge (no emoji)
- Compact frequency pills (like pronouns from Step 1)
- Clear "Optional" labels on non-required fields
- Modern info cards for educational content

---

## 📐 EXACT LAYOUT SPECIFICATIONS

### CONTAINER
```css
SafeAreaView {
  flex: 1
  backgroundColor: #0F1419
}

Main Container {
  flex: 1
  paddingTop: insets.top + 16
  paddingBottom: insets.bottom + 16
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

### SEGMENTED CONTROL (Yes/No)

```css
Segmented Container {
  paddingHorizontal: 24
  marginBottom: 32
}

Segment Control {
  flexDirection: 'row'
  backgroundColor: #1A1F26
  borderRadius: 12
  padding: 4
  borderWidth: 1
  borderColor: #2A2F36
}

Segment Button {
  flex: 1
  paddingVertical: 12
  paddingHorizontal: 16
  borderRadius: 10
  justifyContent: 'center'
  alignItems: 'center'
  minHeight: 44
}

Segment Button (active) {
  backgroundColor: #00D9C0
}

Segment Text {
  fontSize: 16
  fontWeight: '600'
}

Segment Text (inactive) {
  color: #9CA3AF
}

Segment Text (active) {
  color: #0F1419
}
```

---

### BINDING FREQUENCY (Conditional - Pills Pattern)

```css
Section Container {
  paddingHorizontal: 24
  marginBottom: 24
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

Required Badge (View) {
  display: inline
  backgroundColor: rgba(255, 107, 107, 0.15)
  paddingHorizontal: 6
  paddingVertical: 2
  borderRadius: 4
  marginLeft: 8
}

Required Badge Text {
  fontSize: 11
  fontWeight: '700'
  color: #FF6B6B
  textTransform: 'uppercase'
}

Section Description {
  fontSize: 13
  fontWeight: '400'
  color: #6B7280
  marginBottom: 12
  lineHeight: 18
  textAlign: 'left'
}

Pills Container {
  flexDirection: 'row'
  flexWrap: 'wrap'
  marginLeft: -8
}

Frequency Pill (TouchableOpacity) {
  paddingHorizontal: 20
  paddingVertical: 12
  borderRadius: 22
  backgroundColor: #1A1F26
  borderWidth: 2
  borderColor: #2A2F36
  marginLeft: 8
  marginBottom: 8
  minHeight: 44
  justifyContent: 'center'
  alignItems: 'center'
}

Pill (selected) {
  backgroundColor: #00D9C0
  borderColor: #00D9C0
}

Pill Text {
  fontSize: 15
  fontWeight: '500'
  color: #E0E4E8
}

Pill Text (selected) {
  fontSize: 15
  fontWeight: '600'
  color: #0F1419
}
```

---

### BINDER TYPE (Conditional - Optional Radio Cards)

```css
Section Container {
  paddingHorizontal: 24
  marginBottom: 24
}

Section Label with Optional Badge {
  flexDirection: 'row'
  alignItems: 'center'
  marginBottom: 12
}

Optional Badge {
  backgroundColor: rgba(91, 159, 255, 0.15)
  paddingHorizontal: 6
  paddingVertical: 2
  borderRadius: 4
  marginLeft: 8
}

Optional Badge Text {
  fontSize: 11
  fontWeight: '600'
  color: #5B9FFF
  textTransform: 'uppercase'
}

Binder Type Card (TouchableOpacity) {
  backgroundColor: #1A1F26
  borderRadius: 12
  padding: 14
  marginBottom: 10
  borderWidth: 2
  borderColor: #2A2F36
  flexDirection: 'row'
  alignItems: 'center'
  minHeight: 60
}

/* Last card */
Card:last-child {
  marginBottom: 0
}

Card (selected) {
  borderColor: #00D9C0
  backgroundColor: rgba(0, 217, 192, 0.08)
}

Radio Circle {
  width: 20
  height: 20
  borderRadius: 10
  borderWidth: 2
  borderColor: #2A2F36
  marginRight: 12
  justifyContent: 'center'
  alignItems: 'center'
}

Radio Circle (selected) {
  borderColor: #00D9C0
}

Radio Dot {
  width: 10
  height: 10
  borderRadius: 5
  backgroundColor: #00D9C0
}

Card Text Container {
  flex: 1
}

Card Title {
  fontSize: 15
  fontWeight: '600'
  color: #FFFFFF
  textAlign: 'left'
}

Card Title (selected) {
  color: #00D9C0
}

Card Description {
  fontSize: 13
  fontWeight: '400'
  color: #9CA3AF
  marginTop: 2
  lineHeight: 16
  textAlign: 'left'
}

Card Description (selected) {
  color: #B8C5C5
}
```

---

### BINDING DURATION (Conditional - Optional iOS Stepper)

```css
Section Container {
  paddingHorizontal: 24
  marginBottom: 24
}

Stepper Container {
  backgroundColor: #1A1F26
  borderRadius: 12
  padding: 16
  borderWidth: 2
  borderColor: #2A2F36
  flexDirection: 'row'
  justifyContent: 'space-between'
  alignItems: 'center'
  minHeight: 64
}

Stepper Left Side {
  flex: 1
}

Stepper Label {
  fontSize: 13
  fontWeight: '500'
  color: #9CA3AF
  marginBottom: 4
  textAlign: 'left'
}

Stepper Value {
  fontSize: 20
  fontWeight: '700'
  color: #FFFFFF
  textAlign: 'left'
}

Stepper Buttons Container {
  flexDirection: 'row'
  gap: 8
}

Stepper Button (TouchableOpacity) {
  width: 36
  height: 36
  borderRadius: 18
  backgroundColor: #2A2F36
  justifyContent: 'center'
  alignItems: 'center'
  borderWidth: 1
  borderColor: #3A4555
}

Stepper Button (disabled) {
  opacity: 0.3
}

Stepper Button Icon {
  fontSize: 18
  fontWeight: '600'
  color: #FFFFFF
}

/* Minus button */
Minus Icon: "−"

/* Plus button */
Plus Icon: "+"
```

---

### WARNING BADGE (Conditional - shown when hours > 8)

```css
Warning Container {
  paddingHorizontal: 24
  marginTop: 16
  marginBottom: 24
}

Warning Badge {
  backgroundColor: rgba(255, 184, 77, 0.12)
  borderRadius: 12
  padding: 16
  borderLeftWidth: 3
  borderLeftColor: #FFB84D
  flexDirection: 'row'
  alignItems: 'flex-start'
}

Warning Icon Container {
  width: 24
  height: 24
  marginRight: 12
  flexShrink: 0
}

/* Warning SVG icon - NOT emoji */
Warning Icon (SVG) {
  Triangle with exclamation
  color: #FFB84D
}

Warning Text Container {
  flex: 1
}

Warning Title {
  fontSize: 14
  fontWeight: '600'
  color: #FFB84D
  marginBottom: 4
  textAlign: 'left'
}

Warning Description {
  fontSize: 13
  fontWeight: '400'
  color: #B8C5C5
  lineHeight: 19
  textAlign: 'left'
}
```

---

### INFO CARD (Educational Context)

**Optional: Add at bottom of scroll for education**

```css
Info Card Container {
  paddingHorizontal: 24
  marginBottom: 24
}

Info Card {
  backgroundColor: rgba(91, 159, 255, 0.1)
  borderRadius: 12
  padding: 16
  borderLeftWidth: 3
  borderLeftColor: #5B9FFF
}

Info Title {
  fontSize: 14
  fontWeight: '600'
  color: #5B9FFF
  marginBottom: 6
  textAlign: 'left'
}

Info Text {
  fontSize: 13
  fontWeight: '400'
  color: #B8C5C5
  lineHeight: 19
  textAlign: 'left'
}
```

---

### FOOTER (CTA)

```css
Footer Container {
  paddingHorizontal: 24
  paddingTop: 16
  borderTopWidth: 1
  borderTopColor: #2A2F36
  backgroundColor: #0F1419
}

Primary Button {
  height: 56
  borderRadius: 28
  overflow: 'hidden'
  marginBottom: 8
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
  marginTop: 8
  lineHeight: 18
}
```

---

## 🎨 CONTENT SPECIFICATIONS

### Frequency Options
```json
[
  { "value": "daily", "label": "Every workout" },
  { "value": "sometimes", "label": "Most workouts" },
  { "value": "rarely", "label": "Occasionally" },
  { "value": "never", "label": "Testing it out" }
]
```

### Binder Type Options
```json
[
  { 
    "value": "commercial", 
    "title": "Commercial binder",
    "description": "GC2B, Underworks, Spectrum, etc."
  },
  { 
    "value": "sports_bra", 
    "title": "Sports bra",
    "description": "Compression sports bra"
  },
  { 
    "value": "diy", 
    "title": "DIY / Makeshift",
    "description": "Homemade or improvised"
  },
  { 
    "value": "other", 
    "title": "Other",
    "description": "Prefer not to say"
  }
]
```

### Duration Stepper
```
Min: 0 hours
Max: 12 hours
Step: 0.5 hours
Display format: "X.X hours" (e.g., "6.0 hours", "8.5 hours")
Warning threshold: > 8 hours
```

### Warning Message
```
Title: "Binding Safety Reminder"
Description: "Medical guidance recommends limiting binding to 8 hours per day. We'll add breathing breaks to your workouts for safety."
```

### Info Card (Optional)
```
Title: "Why we ask about binding"
Description: "Binding can restrict rib expansion and breathing. We'll exclude exercises that compress the chest, limit cardio duration, and add reminder checkpoints."
```

---

## 📊 SPACING SYSTEM (8px Grid)

```
Section margins: 24px
Pill margins: 8px (between pills)
Card margins: 10px (between cards)
Horizontal padding: 24px (consistent)
Card padding: 14-16px
Safe area: insets.top + 16, insets.bottom + 16
```

---

## 🎯 INTERACTION SPECIFICATIONS

### Segmented Control
```
Tap "Yes" or "No"
→ Haptic feedback (light)
→ Background animates (200ms)
→ If "Yes": expand frequency section (300ms)
→ If "No": collapse all sections (200ms)
```

### Frequency Pill
```
Tap pill
→ Haptic feedback (light)
→ Deselect others (single selection)
→ Color change animation (150ms)
```

### Binder Type Card (Optional)
```
Tap card
→ Haptic feedback (light)
→ Deselect others
→ Radio dot appears
→ Border color changes
```

### Duration Stepper
```
Tap "-" button
→ Decrease by 0.5 (min 0)
→ Haptic feedback (light)
→ If value > 8 → show warning badge

Tap "+" button
→ Increase by 0.5 (max 12)
→ Haptic feedback (light)
→ If value > 8 → show warning badge
```

---

## ✅ VALIDATION RULES

```typescript
canContinue = bindingAnswer !== null && 
  (bindingAnswer === 'no' || (bindingFrequency !== null))

// Frequency is REQUIRED when binding = yes
// Binder type is OPTIONAL
// Duration is OPTIONAL (defaults to 0 if not provided)
// Warning shown when duration > 8 (but doesn't block)
```

---

## 🚀 COMPONENT STRUCTURE

```tsx
<SafeAreaView>
  <View style={container}>
    
    {/* HEADER */}
    <View style={header}>
      <ProgressIndicator current={3} total={8} />
      <Text style={headline}>
        Do you bind your chest during workouts?
      </Text>
      <Text style={subheadline}>
        This helps us exclude exercises that compress your chest
      </Text>
    </View>

    {/* SCROLLABLE CONTENT */}
    <ScrollView>
      
      {/* SEGMENTED CONTROL */}
      <View style={segmentedContainer}>
        <View style={segmentControl}>
          <TouchableOpacity onPress={() => setBindingAnswer('yes')}>
            Yes, I bind
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setBindingAnswer('no')}>
            No / N/A
          </TouchableOpacity>
        </View>
      </View>

      {/* CONDITIONAL: FREQUENCY PILLS (Required) */}
      {bindingAnswer === 'yes' && (
        <View style={sectionContainer}>
          <View style={sectionLabelRow}>
            <Text style={sectionLabel}>How often?</Text>
            <View style={requiredBadge}>
              <Text style={requiredBadgeText}>Required</Text>
            </View>
          </View>
          <Text style={sectionDescription}>
            Select frequency of binding during workouts
          </Text>
          <View style={pillsContainer}>
            {FREQUENCY_OPTIONS.map(...)}
          </View>
        </View>
      )}

      {/* CONDITIONAL: BINDER TYPE (Optional) */}
      {bindingAnswer === 'yes' && (
        <View style={sectionContainer}>
          <View style={sectionLabelRow}>
            <Text style={sectionLabel}>Binder type</Text>
            <View style={optionalBadge}>
              <Text style={optionalBadgeText}>Optional</Text>
            </View>
          </View>
          {BINDER_TYPE_OPTIONS.map(...)}
        </View>
      )}

      {/* CONDITIONAL: DURATION STEPPER (Optional) */}
      {bindingAnswer === 'yes' && (
        <View style={sectionContainer}>
          <View style={sectionLabelRow}>
            <Text style={sectionLabel}>Duration per session</Text>
            <View style={optionalBadge}>
              <Text style={optionalBadgeText}>Optional</Text>
            </View>
          </View>
          <View style={stepperContainer}>
            <View style={stepperLeft}>
              <Text style={stepperLabel}>Hours bound</Text>
              <Text style={stepperValue}>{duration} hours</Text>
            </View>
            <View style={stepperButtons}>
              <TouchableOpacity onPress={decrementDuration}>−</TouchableOpacity>
              <TouchableOpacity onPress={incrementDuration}>+</TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* CONDITIONAL: WARNING BADGE */}
      {duration > 8 && (
        <View style={warningContainer}>
          <View style={warningBadge}>
            {/* Warning SVG icon */}
            <View style={warningTextContainer}>
              <Text style={warningTitle}>Binding Safety Reminder</Text>
              <Text style={warningDescription}>
                Medical guidance recommends limiting binding to 8 hours per day...
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* INFO CARD (Optional educational) */}
      <View style={infoCardContainer}>
        <View style={infoCard}>
          <Text style={infoTitle}>Why we ask about binding</Text>
          <Text style={infoText}>
            Binding can restrict rib expansion...
          </Text>
        </View>
      </View>

    </ScrollView>

    {/* FOOTER */}
    <View style={footer}>
      <TouchableOpacity
        disabled={!canContinue}
        onPress={handleContinue}
      >
        <LinearGradient>Continue</LinearGradient>
      </TouchableOpacity>
      <Text style={hintText}>
        Optional fields help us personalize your training
      </Text>
    </View>

  </View>
</SafeAreaView>
```

---

## 🎯 DESIGN COMPARISON

| Element | OLD | NEW |
|---------|-----|-----|
| **Yes/No** | Large separate buttons | Segmented control |
| **Frequency** | Large cards | Compact pills |
| **Duration** | Text input + increment buttons | iOS-style stepper |
| **Warning** | Emoji banner (⚠️) | Professional SVG badge |
| **Optional** | No visual indicator | Clear "Optional" badges |
| **Overall** | Inconsistent, cluttered | Clean, iOS-native |

---

This specification is production-ready with exact measurements and modern patterns.
