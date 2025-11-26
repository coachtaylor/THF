# GenderIdentity Screen - Production Specification
## Step 1 of 8 - Profile Setup

---

## 🎯 DESIGN PHILOSOPHY

**Current Issues:**
- Generic card layout looks AI-generated
- Too much vertical spacing creates gaps
- Checkbox-style cards feel outdated
- No visual hierarchy between options

**New Approach:**
- Modern tap-to-select cards (iOS Settings style)
- Tight, efficient spacing (no wasted space)
- Clear visual feedback on selection
- Professional radio-button-style selection
- Pronouns as pills/chips (modern pattern)

---

## 📐 EXACT LAYOUT SPECIFICATIONS

### CONTAINER
```css
SafeAreaView {
  flex: 1
  backgroundColor: #0F1419
}

Main Container (View) {
  flex: 1
  paddingTop: insets.top + 16  /* CRITICAL: Addition, not Math.max */
  paddingBottom: insets.bottom + 16
  paddingHorizontal: 0  /* Cards will have their own padding */
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
  /* Component handles its own styling */
}

Headline (Text) {
  fontSize: 32
  fontWeight: '700'
  color: #FFFFFF
  lineHeight: 38
  letterSpacing: -0.5
  marginBottom: 8
  textAlign: 'left'  /* CRITICAL: Explicit alignment */
}

Subheadline (Text) {
  fontSize: 16
  fontWeight: '400'
  color: #9CA3AF
  lineHeight: 24
  textAlign: 'left'  /* CRITICAL: Explicit alignment */
}
```

---

### GENDER IDENTITY CARDS

**Layout Pattern: Vertical Stack (NOT Grid)**

```css
Cards Container (View) {
  paddingHorizontal: 24
  marginBottom: 32
  /* No gap property - use marginBottom on individual cards */
}

Single Card (TouchableOpacity) {
  backgroundColor: #1A1F26
  borderRadius: 12
  padding: 16  /* Tight padding */
  marginBottom: 12  /* CRITICAL: Explicit spacing between cards */
  borderWidth: 2
  borderColor: #2A2F36
  flexDirection: 'row'
  alignItems: 'center'  /* Vertically center content */
  minHeight: 72  /* Ensures touch target */
}

/* Last card - remove bottom margin */
Card:last-child {
  marginBottom: 0
}

/* Selected State */
Card (selected) {
  borderColor: #00D9C0
  backgroundColor: rgba(0, 217, 192, 0.08)
}

/* Card Layout */
Card Inner Layout {
  flexDirection: 'row'
  alignItems: 'center'
  flex: 1
}

Radio Circle (View) {
  width: 24
  height: 24
  borderRadius: 12
  borderWidth: 2
  borderColor: #2A2F36  /* Default */
  marginRight: 16  /* Space between radio and text */
  justifyContent: 'center'
  alignItems: 'center'
}

Radio Circle (selected) {
  borderColor: #00D9C0
}

Radio Dot (View - only when selected) {
  width: 12
  height: 12
  borderRadius: 6
  backgroundColor: #00D9C0
}

Text Container (View) {
  flex: 1
}

Card Title (Text) {
  fontSize: 16
  fontWeight: '600'
  color: #FFFFFF  /* Default */
  lineHeight: 22
  marginBottom: 2
  textAlign: 'left'  /* CRITICAL */
}

Card Title (selected) {
  color: #00D9C0
}

Card Description (Text) {
  fontSize: 14
  fontWeight: '400'
  color: #9CA3AF  /* Default */
  lineHeight: 20
  textAlign: 'left'  /* CRITICAL */
}

Card Description (selected) {
  color: #B8C5C5
}
```

---

### PRONOUNS SECTION

**Modern Pill/Chip Pattern**

```css
Pronouns Container (View) {
  paddingHorizontal: 24
  marginBottom: 32
}

Section Label (Text) {
  fontSize: 14
  fontWeight: '600'
  color: #9CA3AF
  marginBottom: 12
  textTransform: 'uppercase'
  letterSpacing: 0.5
  textAlign: 'left'
}

Pills Container (View) {
  flexDirection: 'row'
  flexWrap: 'wrap'
  marginTop: 0
  marginLeft: -8  /* Negative margin trick for consistent spacing */
}

Single Pill (TouchableOpacity) {
  paddingHorizontal: 16
  paddingVertical: 10
  borderRadius: 20
  backgroundColor: #1A1F26
  borderWidth: 2
  borderColor: #2A2F36
  marginLeft: 8  /* Horizontal spacing */
  marginBottom: 8  /* Vertical spacing for wrapping */
  minHeight: 44  /* iOS touch target */
  justifyContent: 'center'
  alignItems: 'center'
}

Pill (selected) {
  backgroundColor: #00D9C0
  borderColor: #00D9C0
}

Pill Text (Text) {
  fontSize: 15
  fontWeight: '500'
  color: #E0E4E8  /* Default */
}

Pill Text (selected) {
  fontSize: 15
  fontWeight: '600'
  color: #0F1419
}
```

---

### CUSTOM PRONOUNS INPUT

```css
Custom Input Container (View) {
  marginTop: 16
  paddingHorizontal: 24
  marginBottom: 32
}

Input Label (Text) {
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
  borderRadius: 12
  padding: 14
  fontSize: 15
  fontWeight: '400'
  color: #FFFFFF
  lineHeight: 22
  minHeight: 48
}

Text Input (focused) {
  borderColor: #00D9C0
}

Placeholder {
  color: #6B7280
}
```

---

### FOOTER (CTA)

```css
Footer Container (View) {
  paddingHorizontal: 24
  paddingTop: 16
  borderTopWidth: 1
  borderTopColor: #2A2F36
  backgroundColor: #0F1419
}

Primary Button (TouchableOpacity) {
  height: 56
  borderRadius: 28
  overflow: 'hidden'
  marginBottom: 8
}

/* Enabled State */
Button Gradient (LinearGradient) {
  flex: 1
  justifyContent: 'center'
  alignItems: 'center'
  colors: ['#00D9C0', '#00B39D']
  start: {x: 0, y: 0}
  end: {x: 1, y: 1}
}

Button Shadow (enabled) {
  shadowColor: #00D9C0
  shadowOffset: {width: 0, height: 4}
  shadowOpacity: 0.4
  shadowRadius: 12
  elevation: 6
}

/* Disabled State */
Button (disabled) {
  opacity: 0.4
}

Button Gradient (disabled) {
  colors: ['#2A2F36', '#1A1F26']
}

Button Text (Text) {
  fontSize: 17
  fontWeight: '700'
  color: #0F1419  /* Enabled */
}

Button Text (disabled) {
  color: #6B7280
}

Hint Text (Text) {
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

### Gender Options (Exact Copy)
```json
[
  {
    "value": "mtf",
    "title": "Trans woman",
    "description": "Assigned male at birth"
  },
  {
    "value": "ftm",
    "title": "Trans man",
    "description": "Assigned female at birth"
  },
  {
    "value": "nonbinary",
    "title": "Non-binary",
    "description": "Outside the gender binary"
  },
  {
    "value": "questioning",
    "title": "Questioning / Exploring",
    "description": "Still figuring things out"
  }
]
```

### Pronoun Options
```json
["he/him", "she/her", "they/them", "other"]
```

---

## 📊 SPACING SYSTEM (8px Grid)

```
4px  = xxs (micro spacing)
8px  = xs  (tight spacing)
12px = s   (card margins)
16px = m   (standard padding)
24px = l   (section padding)
32px = xl  (section margins)
```

**Critical Spacing Rules:**
- Safe area: `insets.top + 16` (not Math.max)
- Between cards: `12px` (marginBottom)
- Between sections: `32px` (marginBottom)
- Horizontal padding: `24px` (consistent)
- Card internal: `16px` (padding)

---

## 🎯 INTERACTION SPECIFICATIONS

### Card Press
```
1. User taps card
2. Haptic feedback (light)
3. Scale animation: 1.0 → 0.98 → 1.0 (100ms)
4. Border color changes to teal
5. Radio dot appears
6. Text color changes to teal
```

### Pronoun Pill Press
```
1. User taps pill
2. Haptic feedback (light)
3. Toggle selection state
4. Background color changes
5. Text color changes
6. If "other" → show custom input
```

### Continue Button
```
Disabled:
- opacity: 0.4
- Gray gradient
- No shadow
- No press feedback

Enabled:
- opacity: 1.0
- Teal gradient
- Glow shadow
- Scale on press: 0.96
- Haptic feedback (medium)
```

---

## ✅ VALIDATION RULES

```typescript
canContinue = selectedGender !== null

// Pronouns are optional (don't block Continue)
// Custom pronouns are optional
// Multiple pronouns allowed (e.g., "she/they")
```

---

## 🚀 COMPONENT STRUCTURE

```tsx
<SafeAreaView>
  <View style={container}>
    
    {/* HEADER */}
    <View style={header}>
      <ProgressIndicator current={1} total={8} />
      <Text style={headline}>How do you identify?</Text>
      <Text style={subheadline}>
        This helps us personalize your training
      </Text>
    </View>

    {/* SCROLLABLE CONTENT */}
    <ScrollView style={scroll} contentContainerStyle={scrollContent}>
      
      {/* GENDER CARDS */}
      <View style={cardsContainer}>
        {GENDER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              genderCard,
              selectedGender === option.value && genderCardSelected
            ]}
            onPress={() => handleGenderPress(option.value)}
            activeOpacity={0.8}
          >
            <View style={radioCircle}>
              {selectedGender === option.value && (
                <View style={radioDot} />
              )}
            </View>
            <View style={textContainer}>
              <Text style={[
                cardTitle,
                selectedGender === option.value && cardTitleSelected
              ]}>
                {option.title}
              </Text>
              <Text style={[
                cardDescription,
                selectedGender === option.value && cardDescriptionSelected
              ]}>
                {option.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* PRONOUNS SECTION */}
      {selectedGender && (
        <>
          <View style={pronounsContainer}>
            <Text style={sectionLabel}>Pronouns (Optional)</Text>
            <View style={pillsContainer}>
              {PRONOUN_OPTIONS.map((pronoun) => (
                <TouchableOpacity
                  key={pronoun}
                  style={[
                    pill,
                    selectedPronouns.includes(pronoun) && pillSelected
                  ]}
                  onPress={() => handlePronounPress(pronoun)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    pillText,
                    selectedPronouns.includes(pronoun) && pillTextSelected
                  ]}>
                    {pronoun}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* CUSTOM PRONOUNS */}
          {showCustomInput && (
            <View style={customInputContainer}>
              <Text style={inputLabel}>Custom Pronouns</Text>
              <TextInput
                style={textInput}
                value={customPronouns}
                onChangeText={setCustomPronouns}
                placeholder="e.g., xe/xem, fae/faer"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
              />
            </View>
          )}
        </>
      )}

    </ScrollView>

    {/* FOOTER */}
    <View style={footer}>
      <TouchableOpacity
        style={primaryButton}
        onPress={handleContinue}
        disabled={!canContinue}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={canContinue ? ['#00D9C0', '#00B39D'] : ['#2A2F36', '#1A1F26']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={buttonGradient}
        >
          <Text style={[
            buttonText,
            !canContinue && buttonTextDisabled
          ]}>
            Continue
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={hintText}>
        Pronouns are optional and help us personalize your experience
      </Text>
    </View>

  </View>
</SafeAreaView>
```

---

## 🎯 DESIGN COMPARISON

| Element | OLD | NEW |
|---------|-----|-----|
| **Cards** | Checkbox style | Radio button style |
| **Layout** | Grid with gaps | Vertical stack |
| **Spacing** | Inconsistent | 8px grid system |
| **Selection** | Checkmark | Radio dot |
| **Pronouns** | Large cards | Compact pills |
| **Overall** | Cramped/generic | Modern/efficient |

---

This specification is PIXEL-PERFECT and ready for implementation.
No vague "gaps" or alignment guesses.
Every measurement is explicit.
