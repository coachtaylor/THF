# HRTStatus Screen - Production Specification
## Step 2 of 8 - Profile Setup

---

## 🎯 DESIGN PHILOSOPHY

**Current Issues:**
- Large yes/no buttons look clunky
- Dropdown menus are outdated UI pattern
- Date selection is cumbersome (month + year dropdowns)
- Duration calculation uses emoji (💡)
- Conditional sections appear with no transition

**New Approach:**
- Modern segmented control for yes/no (iOS style)
- Card-based HRT type selection (like gender identity)
- Native date picker (wheel style on iOS, calendar on Android)
- Clean info badge for duration (no emoji)
- Smooth expansion animations for conditional sections

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

Headline (Text) {
  fontSize: 28
  fontWeight: '700'
  color: #FFFFFF
  lineHeight: 34
  letterSpacing: -0.4
  marginBottom: 8
  textAlign: 'left'
}

Subheadline (Text) {
  fontSize: 15
  fontWeight: '400'
  color: #9CA3AF
  lineHeight: 22
  textAlign: 'left'
}
```

---

### SEGMENTED CONTROL (Yes/No)

**Modern iOS-style toggle**

```css
Segmented Container (View) {
  paddingHorizontal: 24
  marginBottom: 32
}

Segment Control (View) {
  flexDirection: 'row'
  backgroundColor: #1A1F26
  borderRadius: 12
  padding: 4
  borderWidth: 1
  borderColor: #2A2F36
}

Segment Button (TouchableOpacity) {
  flex: 1
  paddingVertical: 12
  paddingHorizontal: 16
  borderRadius: 10
  justifyContent: 'center'
  alignItems: 'center'
  minHeight: 44
}

/* Default state */
Segment Button (inactive) {
  backgroundColor: transparent
}

/* Selected state */
Segment Button (active) {
  backgroundColor: #00D9C0
}

Segment Text (Text) {
  fontSize: 16
  fontWeight: '600'
}

/* Default state */
Segment Text (inactive) {
  color: #9CA3AF
}

/* Selected state */
Segment Text (active) {
  color: #0F1419
}
```

---

### HRT TYPE CARDS (Conditional - shown when Yes)

**Same pattern as Gender Identity cards**

```css
Section Container (View) {
  paddingHorizontal: 24
  marginBottom: 24
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

Cards Container (View) {
  /* No additional padding */
}

HRT Type Card (TouchableOpacity) {
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

Radio Circle (View) {
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
  color: #FFFFFF
  lineHeight: 22
  marginBottom: 4
  textAlign: 'left'
}

Card Title (selected) {
  color: #00D9C0
}

Card Description (Text) {
  fontSize: 13
  fontWeight: '400'
  color: #9CA3AF
  lineHeight: 18
  textAlign: 'left'
}

Card Description (selected) {
  color: #B8C5C5
}
```

---

### DATE SELECTION (Conditional - shown after HRT type selected)

**Modern date picker button → modal**

```css
Date Section Container (View) {
  paddingHorizontal: 24
  marginBottom: 24
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

Date Button (TouchableOpacity) {
  backgroundColor: #1A1F26
  borderRadius: 12
  padding: 16
  borderWidth: 2
  borderColor: #2A2F36
  flexDirection: 'row'
  justifyContent: 'space-between'
  alignItems: 'center'
  minHeight: 56
}

Date Button (has value) {
  borderColor: #00D9C0
}

Date Button Left Side (View) {
  flex: 1
}

Date Label (Text) {
  fontSize: 13
  fontWeight: '500'
  color: #9CA3AF
  marginBottom: 2
  textAlign: 'left'
}

Date Value (Text) {
  fontSize: 16
  fontWeight: '600'
  color: #FFFFFF
  textAlign: 'left'
}

Date Value (placeholder) {
  color: #6B7280
  fontWeight: '400'
}

Calendar Icon (View) {
  width: 24
  height: 24
  /* SVG icon */
}
```

---

### DURATION INFO BADGE (Conditional - shown after date selected)

```css
Info Badge Container (View) {
  paddingHorizontal: 24
  marginBottom: 24
}

Info Badge (View) {
  backgroundColor: rgba(0, 217, 192, 0.1)
  borderRadius: 12
  padding: 16
  borderLeftWidth: 3
  borderLeftColor: #00D9C0
  flexDirection: 'row'
  alignItems: 'flex-start'
}

Icon Container (View) {
  width: 24
  height: 24
  marginRight: 12
  flexShrink: 0
  /* Info icon SVG */
}

Text Container (View) {
  flex: 1
}

Badge Title (Text) {
  fontSize: 14
  fontWeight: '600'
  color: #00D9C0
  marginBottom: 4
  textAlign: 'left'
}

Badge Description (Text) {
  fontSize: 14
  fontWeight: '400'
  color: #B8C5C5
  lineHeight: 20
  textAlign: 'left'
}
```

---

### DATE PICKER MODAL (iOS Wheel / Android Calendar)

```css
Modal Overlay (View) {
  flex: 1
  backgroundColor: rgba(15, 20, 25, 0.9)
  justifyContent: 'flex-end'
}

Modal Container (View) {
  backgroundColor: #1A1F26
  borderTopLeftRadius: 24
  borderTopRightRadius: 24
  paddingTop: 24
  paddingHorizontal: 24
  paddingBottom: insets.bottom + 24
}

Modal Header (View) {
  flexDirection: 'row'
  justifyContent: 'space-between'
  alignItems: 'center'
  marginBottom: 16
}

Modal Title (Text) {
  fontSize: 18
  fontWeight: '600'
  color: #FFFFFF
  textAlign: 'left'
}

Close Button (TouchableOpacity) {
  padding: 8
  /* X icon */
}

Date Picker (DateTimePicker - iOS) {
  /* Native iOS wheel picker */
  /* mode: 'date' */
  /* maximumDate: today */
  /* minimumDate: 15 years ago */
}

Confirm Button (TouchableOpacity) {
  height: 56
  borderRadius: 28
  backgroundColor: #00D9C0
  justifyContent: 'center'
  alignItems: 'center'
  marginTop: 16
}

Confirm Button Text {
  fontSize: 17
  fontWeight: '700'
  color: #0F1419
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

Button Gradient (LinearGradient) {
  flex: 1
  justifyContent: 'center'
  alignItems: 'center'
}

/* Enabled */
Gradient colors: ['#00D9C0', '#00B39D']
Shadow: {
  shadowColor: #00D9C0
  shadowOffset: {width: 0, height: 4}
  shadowOpacity: 0.4
  shadowRadius: 12
}

/* Disabled */
Gradient colors: ['#2A2F36', '#1A1F26']
opacity: 0.4

Button Text (Text) {
  fontSize: 17
  fontWeight: '700'
  color: #0F1419 (enabled)
  color: #6B7280 (disabled)
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

### HRT Type Options
```json
[
  {
    "value": "estrogen_blockers",
    "title": "Estrogen + Anti-androgens",
    "description": "Estradiol, Spironolactone, Cypro, etc."
  },
  {
    "value": "testosterone",
    "title": "Testosterone",
    "description": "Injectable, gel, patch, pellet"
  }
]
```

### Duration Formatting
```
< 12 months: "X months"
≥ 12 months: "X years, Y months"
Examples:
- 6 months → "6 months"
- 18 months → "1 year, 6 months"
- 24 months → "2 years"
- 30 months → "2 years, 6 months"
```

### Date Validation
```
Maximum date: Today
Minimum date: Today - 15 years
Error message: "Please select a date within the last 15 years"
```

---

## 📊 SPACING SYSTEM (8px Grid)

```
Section margins: 24px (marginBottom)
Card margins: 12px (marginBottom on each card)
Horizontal padding: 24px (consistent)
Card padding: 16px (internal)
Safe area: insets.top + 16, insets.bottom + 16
```

---

## 🎯 INTERACTION SPECIFICATIONS

### Segmented Control Press
```
1. Tap "Yes" or "No"
2. Haptic feedback (light)
3. Background color animates (200ms)
4. If "Yes" → expand HRT type section (300ms slide down)
5. If "No" → collapse all sections (200ms slide up)
```

### HRT Type Card Press
```
1. Tap card
2. Haptic feedback (light)
3. Radio dot appears (scale animation)
4. Border color changes
5. Date section expands below (300ms)
```

### Date Button Press
```
1. Tap date button
2. Modal slides up from bottom (400ms)
3. Native date picker appears
4. User selects date
5. Tap "Confirm"
6. Modal slides down
7. Duration badge appears with calculated months
```

### Continue Button
```
Disabled when:
- hrtAnswer === null
- hrtAnswer === 'yes' && (hrtType === null || startDate === null)

Enabled when:
- hrtAnswer === 'no' (immediate)
- hrtAnswer === 'yes' && hrtType !== null && startDate !== null && no validation errors
```

---

## ✅ VALIDATION RULES

```typescript
// Date cannot be in future
if (selectedDate > new Date()) {
  error = "Start date cannot be in the future"
}

// Date cannot be > 15 years ago
const fifteenYearsAgo = new Date()
fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15)
if (selectedDate < fifteenYearsAgo) {
  error = "Please select a date within the last 15 years"
}

// Calculate duration
const months = (today.year - start.year) * 12 + (today.month - start.month)
```

---

## 🚀 COMPONENT STRUCTURE

```tsx
<SafeAreaView>
  <View style={container}>
    
    {/* HEADER */}
    <View style={header}>
      <ProgressIndicator current={2} total={8} />
      <Text style={headline}>
        Are you currently on Hormone Replacement Therapy?
      </Text>
      <Text style={subheadline}>
        This helps us adjust workout volume and recovery
      </Text>
    </View>

    {/* SCROLLABLE CONTENT */}
    <ScrollView>
      
      {/* SEGMENTED CONTROL */}
      <View style={segmentedContainer}>
        <View style={segmentControl}>
          <TouchableOpacity
            style={[segment, hrtAnswer === 'yes' && segmentActive]}
            onPress={() => setHrtAnswer('yes')}
          >
            <Text style={[
              segmentText,
              hrtAnswer === 'yes' && segmentTextActive
            ]}>
              Yes, I'm on HRT
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[segment, hrtAnswer === 'no' && segmentActive]}
            onPress={() => setHrtAnswer('no')}
          >
            <Text style={[
              segmentText,
              hrtAnswer === 'no' && segmentTextActive
            ]}>
              No HRT
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONDITIONAL: HRT TYPE CARDS */}
      {hrtAnswer === 'yes' && (
        <View style={sectionContainer}>
          <Text style={sectionLabel}>What type of HRT?</Text>
          {HRT_TYPE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                hrtTypeCard,
                hrtType === option.value && cardSelected
              ]}
              onPress={() => setHrtType(option.value)}
            >
              <View style={radioCircle}>
                {hrtType === option.value && <View style={radioDot} />}
              </View>
              <View style={textContainer}>
                <Text style={[
                  cardTitle,
                  hrtType === option.value && cardTitleSelected
                ]}>
                  {option.title}
                </Text>
                <Text style={[
                  cardDescription,
                  hrtType === option.value && cardDescriptionSelected
                ]}>
                  {option.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* CONDITIONAL: DATE SELECTION */}
      {hrtAnswer === 'yes' && hrtType && (
        <View style={dateSection}>
          <Text style={sectionLabel}>When did you start?</Text>
          <TouchableOpacity
            style={[
              dateButton,
              startDate && dateButtonWithValue
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={dateButtonLeft}>
              <Text style={dateLabel}>Start Date</Text>
              <Text style={[
                dateValue,
                !startDate && dateValuePlaceholder
              ]}>
                {startDate ? formatDate(startDate) : 'Select date'}
              </Text>
            </View>
            {/* Calendar icon */}
          </TouchableOpacity>
        </View>
      )}

      {/* CONDITIONAL: DURATION BADGE */}
      {hrtAnswer === 'yes' && startDate && (
        <View style={infoBadgeContainer}>
          <View style={infoBadge}>
            {/* Info icon */}
            <View style={badgeTextContainer}>
              <Text style={badgeTitle}>HRT Duration</Text>
              <Text style={badgeDescription}>
                Approximately {formatDuration(durationMonths)} on HRT
              </Text>
            </View>
          </View>
        </View>
      )}

    </ScrollView>

    {/* FOOTER */}
    <View style={footer}>
      <TouchableOpacity
        style={primaryButton}
        onPress={handleContinue}
        disabled={!canContinue}
      >
        <LinearGradient
          colors={canContinue ? ['#00D9C0', '#00B39D'] : ['#2A2F36', '#1A1F26']}
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
        This information helps personalize your training
      </Text>
    </View>

  </View>
</SafeAreaView>

{/* DATE PICKER MODAL */}
<Modal visible={showDatePicker} transparent animationType="slide">
  <View style={modalOverlay}>
    <View style={modalContainer}>
      <View style={modalHeader}>
        <Text style={modalTitle}>Select Start Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
          {/* Close icon */}
        </TouchableOpacity>
      </View>
      
      <DateTimePicker
        value={tempDate}
        mode="date"
        display="spinner"
        maximumDate={new Date()}
        minimumDate={fifteenYearsAgo}
        onChange={(event, date) => setTempDate(date)}
      />
      
      <TouchableOpacity
        style={confirmButton}
        onPress={handleDateConfirm}
      >
        <Text style={confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

---

## 🎯 DESIGN COMPARISON

| Element | OLD | NEW |
|---------|-----|-----|
| **Yes/No** | Large separate buttons | Segmented control (iOS style) |
| **Date** | Month + Year dropdowns | Native date picker modal |
| **HRT Type** | List checkboxes | Radio button cards |
| **Duration** | Emoji badge (💡) | Clean info badge with icon |
| **Transitions** | Instant | Smooth expand/collapse |
| **Overall** | Dated, clunky | Modern, iOS-native feel |

---

This specification is production-ready with exact measurements.
