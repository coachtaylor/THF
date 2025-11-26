# DysphoriaTriggers Screen - Production Specification
## Step 7 of 8 - Profile Setup (OPTIONAL)

---

## 🎯 DESIGN PHILOSOPHY

**Current Issues:**
- Checkboxes use emoji checkmark (✓)
- Cards feel cramped
- Intro text is generic
- "Skip" button doesn't feel safe/optional
- Character counter feels clinical
- Footer is sticky

**New Approach:**
- Clean checkbox SVG (no emoji)
- Spacious, empathetic design
- Clear "this is optional" messaging
- "Skip" button prominent and safe
- Gentle character counter
- Footer scrolls with content
- Supportive tone throughout

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
  marginBottom: 24
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

Optional Badge (View) {
  backgroundColor: rgba(91, 159, 255, 0.15)
  paddingHorizontal: 8
  paddingVertical: 3
  borderRadius: 6
  alignSelf: 'flex-start'
  marginBottom: 12
}

Optional Badge Text {
  fontSize: 12
  fontWeight: '700'
  color: #5B9FFF
  textTransform: 'uppercase'
  letterSpacing: 0.5
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

### INTRO SECTION (Supportive Context)

```css
Intro Container {
  paddingHorizontal: 24
  marginBottom: 32
}

Intro Card {
  backgroundColor: rgba(91, 159, 255, 0.08)
  borderRadius: 12
  padding: 16
  borderLeftWidth: 3
  borderLeftColor: #5B9FFF
}

Intro Text {
  fontSize: 14
  fontWeight: '400'
  color: #B8C5C5
  lineHeight: 21
  marginBottom: 12
  textAlign: 'left'
}

Bullet List {
  marginTop: 8
}

Bullet Point {
  fontSize: 13
  fontWeight: '400'
  color: #9CA3AF
  lineHeight: 20
  marginBottom: 6
  paddingLeft: 0
  textAlign: 'left'
}
```

---

### TRIGGER SELECTION (Multi-select Checkboxes)

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

Trigger Grid {
  /* Vertical list, not grid */
}

Trigger Checkbox Card (TouchableOpacity) {
  backgroundColor: #1A1F26
  borderRadius: 10
  padding: 14
  marginBottom: 10
  borderWidth: 2
  borderColor: #2A2F36
  flexDirection: 'row'
  alignItems: 'center'
  minHeight: 56
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

Checkbox Square {
  width: 22
  height: 22
  borderRadius: 6
  borderWidth: 2
  borderColor: #2A2F36
  marginRight: 12
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

Card Text {
  fontSize: 15
  fontWeight: '500'
  color: #E0E4E8
  flex: 1
  textAlign: 'left'
}

Card Text (selected) {
  fontWeight: '600'
  color: #00D9C0
}
```

---

### OTHER TRIGGER INPUT (Conditional)

```css
Other Input Container {
  marginTop: 16
}

Input Label {
  fontSize: 13
  fontWeight: '600'
  color: #9CA3AF
  marginBottom: 8
  textAlign: 'left'
}

Text Input (TextInput) {
  backgroundColor: #1A1F26
  borderWidth: 2
  borderColor: #2A2F36
  borderRadius: 10
  padding: 12
  fontSize: 15
  color: #FFFFFF
  minHeight: 80
  textAlignVertical: 'top'
}

Text Input (focused) {
  borderColor: #00D9C0
}

Character Counter {
  fontSize: 12
  fontWeight: '400'
  color: #6B7280
  marginTop: 6
  textAlign: 'right'
}
```

---

### ADDITIONAL NOTES SECTION (Optional)

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

Notes Input (TextInput) {
  backgroundColor: #1A1F26
  borderWidth: 2
  borderColor: #2A2F36
  borderRadius: 10
  padding: 12
  fontSize: 15
  color: #FFFFFF
  minHeight: 100
  textAlignVertical: 'top'
}

Notes Input (focused) {
  borderColor: #00D9C0
}

Character Counter {
  fontSize: 12
  fontWeight: '400'
  color: #6B7280
  marginTop: 6
  textAlign: 'right'
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

Button Container {
  marginBottom: 12
}

Primary Button {
  height: 56
  borderRadius: 28
  overflow: 'hidden'
  marginBottom: 12
}

Button Gradient {
  flex: 1
  justifyContent: 'center'
  alignItems: 'center'
  colors: ['#00D9C0', '#00B39D']
}

Button Text {
  fontSize: 17
  fontWeight: '700'
  color: #0F1419
}

/* Skip Button */
Skip Button (TouchableOpacity) {
  height: 48
  justifyContent: 'center'
  alignItems: 'center'
  marginBottom: 16
}

Skip Button Text {
  fontSize: 16
  fontWeight: '600'
  color: #9CA3AF
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

### Trigger Options
```json
[
  { "value": "looking_at_chest", "label": "Looking at chest in mirror" },
  { "value": "tight_clothing", "label": "Tight or form-fitting clothing" },
  { "value": "mirrors", "label": "Mirrors / reflective surfaces" },
  { "value": "body_contact", "label": "Body contact (spotting, partner work)" },
  { "value": "crowded_spaces", "label": "Crowded workout spaces" },
  { "value": "locker_rooms", "label": "Locker rooms / changing areas" },
  { "value": "voice", "label": "Voice (grunting, heavy breathing)" },
  { "value": "other", "label": "Other (please specify)" }
]
```

### Intro Text
```
"This information is entirely optional and private. You can skip this step or share only what feels comfortable. It helps us:"

• Suggest clothing alternatives
• Offer mirror-free exercise options
• Provide alternative cues and modifications
```

### Section Labels
```
"Do any of these trigger dysphoria for you? (Optional)"
"Anything else we should know? (Optional)"
```

### Character Limits
```
Other trigger: 500 characters
Additional notes: 500 characters
```

---

## 📊 SPACING SYSTEM (8px Grid)

```
Section margins: 32px
Card margins: 10px
Horizontal padding: 24px
Card padding: 14px
Footer padding: 32px top, 0 bottom
```

---

## 🎯 INTERACTION SPECIFICATIONS

### Trigger Checkbox
```
Tap card → Toggle selection
→ Haptic feedback (light)
→ Allow multiple selections
→ If "Other" selected → show text input below
→ If "Other" deselected → clear text input
```

### Other Input
```
Type text → Update character counter
→ Max 500 characters
→ Auto-focus when "Other" selected
```

### Notes Input
```
Type text → Update character counter
→ Max 500 characters
```

### Continue Button
```
Always enabled (everything is optional)
→ Tap → Save selections
→ Navigate to Review
```

### Skip Button
```
Tap → Clear all selections
→ Navigate to Review immediately
→ No confirmation dialog
```

---

## ✅ VALIDATION RULES

```typescript
// EVERYTHING IS OPTIONAL
canContinue = true // Always enabled

// Save only if user entered data
const hasData = selectedTriggers.length > 0 || notesText.trim().length > 0

if (hasData) {
  save dysphoria_triggers and dysphoria_notes
} else {
  save as undefined
}
```

---

## 🚀 COMPONENT STRUCTURE

```tsx
<SafeAreaView>
  <ScrollView>
    
    {/* HEADER */}
    <View style={header}>
      <ProgressIndicator current={7} total={8} />
      <Text style={headline}>Dysphoria Triggers</Text>
      <View style={optionalBadge}>
        <Text>OPTIONAL</Text>
      </View>
      <Text style={subheadline}>
        Help us create a more comfortable experience
      </Text>
    </View>

    {/* INTRO CARD */}
    <View style={introContainer}>
      <View style={introCard}>
        <Text style={introText}>
          This information is entirely optional and private...
        </Text>
        <View style={bulletList}>
          <Text>• Suggest clothing alternatives</Text>
          <Text>• Offer mirror-free exercise options</Text>
          <Text>• Provide alternative cues and modifications</Text>
        </View>
      </View>
    </View>

    {/* TRIGGER SELECTION */}
    <View style={sectionContainer}>
      <Text style={sectionLabel}>
        Do any of these trigger dysphoria? (Optional)
      </Text>
      
      {TRIGGER_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={triggerCard}
          onPress={() => toggleTrigger(option.value)}
        >
          <View style={checkboxSquare}>
            {selectedTriggers.includes(option.value) && <CheckmarkSVG />}
          </View>
          <Text style={cardText}>{option.label}</Text>
        </TouchableOpacity>
      ))}

      {/* OTHER INPUT (conditional) */}
      {selectedTriggers.includes('other') && (
        <View style={otherInputContainer}>
          <Text style={inputLabel}>Please describe: (Optional)</Text>
          <TextInput
            multiline
            placeholder="Describe your trigger..."
            maxLength={500}
          />
          <Text style={characterCounter}>{otherText.length}/500</Text>
        </View>
      )}
    </View>

    {/* ADDITIONAL NOTES */}
    <View style={sectionContainer}>
      <Text style={sectionLabel}>Anything else? (Optional)</Text>
      <Text style={sectionDescription}>
        Any additional context that would help us support you
      </Text>
      <TextInput
        multiline
        placeholder="Additional notes..."
        maxLength={500}
      />
      <Text style={characterCounter}>{notesText.length}/500</Text>
    </View>

    {/* FOOTER (SCROLLS WITH CONTENT) */}
    <View style={footerContainer}>
      <TouchableOpacity style={primaryButton} onPress={handleContinue}>
        <LinearGradient>Continue to Review</LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity style={skipButton} onPress={handleSkip}>
        <Text style={skipButtonText}>Skip this step</Text>
      </TouchableOpacity>
      
      <Text style={hintText}>
        This information is private and helps us personalize
      </Text>
    </View>

  </ScrollView>
</SafeAreaView>
```

---

## 🎯 DESIGN COMPARISON

| Element | OLD | NEW |
|---------|-----|-----|
| **Checkmarks** | Emoji (✓) | SVG checkmarks |
| **Intro** | Generic text | Supportive card with bullets |
| **Optional badge** | In title | Prominent badge |
| **Cards** | Cramped | Spacious (56px height) |
| **Skip** | Hidden/unclear | Prominent, safe button |
| **Footer** | Sticky | Scrolls with content |
| **Tone** | Clinical | Supportive, empathetic |

---

CRITICAL:
- NO emoji checkmark (✓) - use SVG
- Everything is OPTIONAL
- Skip button prominent and safe
- Supportive, empathetic tone
- Footer scrolls with content
