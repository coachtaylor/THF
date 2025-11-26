# Surgery Screen - Production Specification
## Step 4 of 8 - Profile Setup

---

## 🎯 DESIGN PHILOSOPHY

**Current Issues:**
- Expandable cards are cluttered and confusing
- Month/year dropdowns are outdated
- Recovery status uses emoji (💡, ⚠️, ✅)
- Warning banner at top interrupts flow
- Validation errors are unclear
- Footer is sticky (should scroll with content)

**New Approach:**
- Segmented control for yes/no (consistent)
- Clean checkbox cards for surgery selection
- Inline expansion (not separate modals)
- Native date picker (like HRTStatus)
- Recovery timeline with visual indicator
- Professional info badges (no emoji)
- Footer scrolls with content (NOT sticky)

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

### SEGMENTED CONTROL
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

Segment Text (inactive) {
  fontSize: 16
  fontWeight: '600'
  color: #9CA3AF
}

Segment Text (active) {
  fontSize: 16
  fontWeight: '600'
  color: #0F1419
}
```

---

### SURGERY TYPE SELECTION (Multi-select Checkboxes)

```css
Section Container {
  paddingHorizontal: 24
  marginBottom: 16
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

Surgery Checkbox Card (TouchableOpacity) {
  backgroundColor: #1A1F26
  borderRadius: 12
  padding: 16
  marginBottom: 12
  borderWidth: 2
  borderColor: #2A2F36
  flexDirection: 'row'
  alignItems: 'center'
  minHeight: 64
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

Checkbox Square (View) {
  width: 24
  height: 24
  borderRadius: 6
  borderWidth: 2
  borderColor: #2A2F36
  marginRight: 16
  justifyContent: 'center'
  alignItems: 'center'
  backgroundColor: transparent
}

Checkbox Square (selected) {
  borderColor: #00D9C0
  backgroundColor: #00D9C0
}

Checkmark (SVG Path - only when selected) {
  /* Clean checkmark path */
  stroke: #0F1419
  strokeWidth: 2.5
  strokeLinecap: 'round'
  strokeLinejoin: 'round'
}

Text Container {
  flex: 1
}

Card Title {
  fontSize: 16
  fontWeight: '600'
  color: #FFFFFF
  lineHeight: 22
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
  lineHeight: 18
  textAlign: 'left'
}

Card Description (selected) {
  color: #B8C5C5
}
```

---

### INLINE EXPANSION (Per Surgery)

**Appears below each selected surgery checkbox**

```css
Expansion Container {
  paddingHorizontal: 24
  marginBottom: 24
  /* Smooth height animation on expand/collapse */
}

Expansion Card {
  backgroundColor: #151920
  borderRadius: 12
  padding: 20
  borderWidth: 1
  borderColor: #2A2F36
}

/* DATE SECTION */
Date Section {
  marginBottom: 20
}

Date Label {
  fontSize: 14
  fontWeight: '600'
  color: #9CA3AF
  marginBottom: 8
  textTransform: 'uppercase'
  letterSpacing: 0.5
  textAlign: 'left'
}

Date Button (TouchableOpacity) {
  backgroundColor: #1A1F26
  borderRadius: 10
  padding: 14
  borderWidth: 2
  borderColor: #2A2F36
  flexDirection: 'row'
  justifyContent: 'space-between'
  alignItems: 'center'
  minHeight: 52
}

Date Button (has value) {
  borderColor: #00D9C0
}

Date Text {
  fontSize: 15
  fontWeight: '600'
  color: #FFFFFF
}

Date Text (placeholder) {
  color: #6B7280
  fontWeight: '400'
}

Calendar Icon {
  width: 20
  height: 20
  color: #9CA3AF
}

/* RECOVERY TIMELINE */
Timeline Container {
  marginBottom: 20
}

Timeline Label {
  fontSize: 13
  fontWeight: '600'
  color: #9CA3AF
  marginBottom: 12
  textAlign: 'left'
}

Timeline Bar Container {
  flexDirection: 'row'
  height: 8
  borderRadius: 4
  backgroundColor: #2A2F36
  overflow: 'hidden'
  marginBottom: 12
}

Timeline Segment {
  flex: 1
  /* Three segments: 0-6 weeks, 6-12 weeks, 12+ weeks */
}

/* Early phase (0-6 weeks) - Red */
Segment 1 {
  backgroundColor: #FF6B6B
}

/* Active phase (6-12 weeks) - Orange */
Segment 2 {
  backgroundColor: #FFB84D
}

/* Late phase (12+ weeks) - Teal */
Segment 3 {
  backgroundColor: #00D9C0
}

/* Current position indicator */
Position Dot {
  width: 16
  height: 16
  borderRadius: 8
  backgroundColor: #FFFFFF
  borderWidth: 3
  borderColor: #0F1419
  position: 'absolute'
  top: -4
  /* Calculate left based on weeks_post_op */
}

Timeline Description {
  fontSize: 14
  fontWeight: '500'
  color: #B8C5C5
  lineHeight: 20
  textAlign: 'left'
}

/* RECOVERY STATUS RADIO */
Status Section {
  marginBottom: 20
}

Status Label {
  fontSize: 13
  fontWeight: '600'
  color: #9CA3AF
  marginBottom: 8
  textAlign: 'left'
}

Status Options Container {
  flexDirection: 'row'
  gap: 12
}

Status Radio Button (TouchableOpacity) {
  flex: 1
  backgroundColor: #1A1F26
  borderRadius: 10
  padding: 12
  borderWidth: 2
  borderColor: #2A2F36
  flexDirection: 'row'
  alignItems: 'center'
  justifyContent: 'center'
  minHeight: 44
}

Radio Button (selected) {
  borderColor: #00D9C0
  backgroundColor: rgba(0, 217, 192, 0.08)
}

Radio Circle {
  width: 18
  height: 18
  borderRadius: 9
  borderWidth: 2
  borderColor: #2A2F36
  marginRight: 8
  justifyContent: 'center'
  alignItems: 'center'
}

Radio Circle (selected) {
  borderColor: #00D9C0
}

Radio Dot (selected) {
  width: 8
  height: 8
  borderRadius: 4
  backgroundColor: #00D9C0
}

Radio Text {
  fontSize: 14
  fontWeight: '500'
  color: #E0E4E8
}

Radio Text (selected) {
  fontWeight: '600'
  color: #00D9C0
}

/* NOTES SECTION */
Notes Label {
  fontSize: 13
  fontWeight: '600'
  color: #9CA3AF
  marginBottom: 8
  textAlign: 'left'
}

Notes Label with Optional Badge {
  flexDirection: 'row'
  alignItems: 'center'
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

Notes Input (TextInput) {
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

Notes Input (focused) {
  borderColor: #00D9C0
}

Placeholder {
  color: #6B7280
}
```

---

### INFO BADGES (Context, not warnings)

```css
Info Badge Container {
  paddingHorizontal: 24
  marginBottom: 24
}

Info Badge {
  backgroundColor: rgba(91, 159, 255, 0.1)
  borderRadius: 12
  padding: 16
  borderLeftWidth: 3
  borderLeftColor: #5B9FFF
  flexDirection: 'row'
  alignItems: 'flex-start'
}

Badge Icon Container {
  width: 24
  height: 24
  marginRight: 12
  flexShrink: 0
}

/* Info SVG icon - NOT emoji */

Badge Text Container {
  flex: 1
}

Badge Title {
  fontSize: 14
  fontWeight: '600'
  color: #5B9FFF
  marginBottom: 4
  textAlign: 'left'
}

Badge Description {
  fontSize: 13
  fontWeight: '400'
  color: #B8C5C5
  lineHeight: 19
  textAlign: 'left'
}
```

---

### FOOTER (SCROLLS WITH CONTENT - NOT STICKY)

```css
Footer Container {
  paddingHorizontal: 24
  paddingTop: 32
  paddingBottom: 0
  /* NO position: sticky */
  /* NO borderTop */
  /* This scrolls as part of ScrollView content */
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
  marginBottom: 24
}
```

---

## 🎨 CONTENT SPECIFICATIONS

### Surgery Type Options
```json
[
  {
    "value": "top_surgery",
    "title": "Top Surgery",
    "description": "Chest reconstruction, mastectomy"
  },
  {
    "value": "bottom_surgery",
    "title": "Bottom Surgery",
    "description": "Vaginoplasty, phalloplasty, metoidioplasty"
  },
  {
    "value": "ffs",
    "title": "Facial Feminization (FFS)",
    "description": "Forehead, jaw, nose, etc."
  },
  {
    "value": "orchiectomy",
    "title": "Orchiectomy",
    "description": "Surgical removal of testes"
  },
  {
    "value": "other",
    "title": "Other surgery",
    "description": "Other gender-affirming procedure"
  }
]
```

### Recovery Timeline Phases
```javascript
// Calculate weeks post-op
const weeksPostOp = Math.floor((today - surgeryDate) / (7 * 24 * 60 * 60 * 1000))

// Phase determination
if (weeksPostOp < 6) {
  phase = "Early Recovery"
  color = "#FF6B6B" (red)
  description = "Focus on gentle movement and healing"
} else if (weeksPostOp < 12) {
  phase = "Active Recovery"
  color = "#FFB84D" (orange)
  description = "Gradually increasing activity with caution"
} else {
  phase = "Late Recovery"
  color = "#00D9C0" (teal)
  description = "Most exercises available with modifications"
}
```

### Timeline Position Calculation
```javascript
// Position dot on timeline bar based on weeks
const maxWeeks = 24 // Show up to 24 weeks on timeline
const position = Math.min(weeksPostOp / maxWeeks, 1) * 100 // Percentage
```

### Date Formatting
```
Display: "January 2024"
Calculate: Math.floor((today - date) / (7 * 24 * 60 * 60 * 1000)) weeks
```

### Status Options
```json
[
  { "value": true, "label": "Fully healed" },
  { "value": false, "label": "Still recovering" }
]
```

---

## 📊 SPACING SYSTEM (8px Grid)

```
Section margins: 24px
Card margins: 12px
Horizontal padding: 24px
Card padding: 16-20px
Expansion padding: 20px
Safe area: insets.top + 16, insets.bottom + 16
Footer NOT sticky: scrolls with content
```

---

## 🎯 INTERACTION SPECIFICATIONS

### Segmented Control
```
Tap "Yes" or "No"
→ Haptic feedback (light)
→ If "Yes": show surgery selection (300ms slide down)
→ If "No": hide all sections (200ms slide up)
```

### Surgery Checkbox
```
Tap checkbox card
→ Haptic feedback (light)
→ Toggle checkmark
→ If selected: expand inline form below (300ms)
→ If deselected: collapse inline form (200ms)
```

### Date Button
```
Tap date button
→ Open modal with native date picker
→ User selects date
→ Calculate weeks post-op
→ Update recovery timeline
→ Animate timeline indicator
```

### Recovery Status Radio
```
Tap radio button
→ Haptic feedback (light)
→ Deselect other option
→ Radio dot animates in
```

---

## ✅ VALIDATION RULES

```typescript
canContinue = hasSurgeries !== null && 
  (hasSurgeries === 'no' || 
   (selectedSurgeries.length > 0 && 
    selectedSurgeries.every(surgery => surgery.date !== null)))

// Each selected surgery MUST have a date
// Status and notes are OPTIONAL
// Maximum date: today
// Minimum date: 10 years ago
```

---

## 🚀 COMPONENT STRUCTURE

```tsx
<SafeAreaView>
  <ScrollView>
    {/* HEADER */}
    <View style={header}>
      <ProgressIndicator current={4} total={8} />
      <Text style={headline}>
        Have you had any gender-affirming surgeries?
      </Text>
      <Text style={subheadline}>
        This helps us adjust for post-surgical recovery
      </Text>
    </View>

    {/* SEGMENTED CONTROL */}
    <View style={segmentedContainer}>
      <View style={segmentControl}>
        <TouchableOpacity onPress={() => setHasSurgeries('yes')}>
          Yes
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setHasSurgeries('no')}>
          No / Not yet
        </TouchableOpacity>
      </View>
    </View>

    {/* CONDITIONAL: SURGERY SELECTION */}
    {hasSurgeries === 'yes' && (
      <>
        <View style={sectionContainer}>
          <Text style={sectionLabel}>Which surgeries? (Select all)</Text>
          
          {SURGERY_OPTIONS.map((surgery) => (
            <View key={surgery.value}>
              {/* Checkbox Card */}
              <TouchableOpacity
                style={[
                  checkboxCard,
                  selectedSurgeries.includes(surgery.value) && cardSelected
                ]}
                onPress={() => toggleSurgery(surgery.value)}
              >
                <View style={[
                  checkbox,
                  selectedSurgeries.includes(surgery.value) && checkboxSelected
                ]}>
                  {selectedSurgeries.includes(surgery.value) && (
                    <CheckmarkSVG />
                  )}
                </View>
                <View style={textContainer}>
                  <Text style={cardTitle}>{surgery.title}</Text>
                  <Text style={cardDescription}>{surgery.description}</Text>
                </View>
              </TouchableOpacity>

              {/* INLINE EXPANSION */}
              {selectedSurgeries.includes(surgery.value) && (
                <View style={expansionContainer}>
                  <View style={expansionCard}>
                    
                    {/* Date Section */}
                    <View style={dateSection}>
                      <Text style={dateLabel}>Surgery Date</Text>
                      <TouchableOpacity
                        style={[
                          dateButton,
                          surgeryData[surgery.value].date && dateButtonWithValue
                        ]}
                        onPress={() => openDatePicker(surgery.value)}
                      >
                        <Text style={dateText}>
                          {surgeryData[surgery.value].date 
                            ? formatDate(surgeryData[surgery.value].date)
                            : 'Select date'}
                        </Text>
                        <CalendarIcon />
                      </TouchableOpacity>
                    </View>

                    {/* Recovery Timeline (if date selected) */}
                    {surgeryData[surgery.value].date && (
                      <View style={timelineContainer}>
                        <Text style={timelineLabel}>Recovery Progress</Text>
                        <View style={timelineBarContainer}>
                          <View style={[timelineSegment, segment1]} />
                          <View style={[timelineSegment, segment2]} />
                          <View style={[timelineSegment, segment3]} />
                          <View style={[positionDot, {left: `${position}%`}]} />
                        </View>
                        <Text style={timelineDescription}>
                          {getPhaseDescription(weeksPostOp)}
                        </Text>
                      </View>
                    )}

                    {/* Status Radio */}
                    <View style={statusSection}>
                      <Text style={statusLabel}>Current status</Text>
                      <View style={statusOptions}>
                        <TouchableOpacity
                          style={[
                            statusRadio,
                            fullyHealed && statusRadioSelected
                          ]}
                          onPress={() => setFullyHealed(true)}
                        >
                          <View style={radioCircle}>
                            {fullyHealed && <View style={radioDot} />}
                          </View>
                          <Text style={radioText}>Fully healed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            statusRadio,
                            !fullyHealed && statusRadioSelected
                          ]}
                          onPress={() => setFullyHealed(false)}
                        >
                          <View style={radioCircle}>
                            {!fullyHealed && <View style={radioDot} />}
                          </View>
                          <Text style={radioText}>Still recovering</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Notes Input (Optional) */}
                    <View style={notesSection}>
                      <View style={notesLabelRow}>
                        <Text style={notesLabel}>Notes</Text>
                        <View style={optionalBadge}>
                          <Text style={optionalBadgeText}>OPTIONAL</Text>
                        </View>
                      </View>
                      <TextInput
                        style={notesInput}
                        value={surgeryData[surgery.value].notes}
                        onChangeText={(text) => updateNotes(surgery.value, text)}
                        placeholder="Any additional details..."
                        placeholderTextColor="#6B7280"
                        multiline
                      />
                    </View>

                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* INFO BADGE */}
        <View style={infoBadgeContainer}>
          <View style={infoBadge}>
            <InfoIcon />
            <View style={badgeTextContainer}>
              <Text style={badgeTitle}>Recovery Timeline</Text>
              <Text style={badgeDescription}>
                We'll adjust exercise selection based on your recovery phase
              </Text>
            </View>
          </View>
        </View>
      </>
    )}

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
        Your information is private and secure
      </Text>
    </View>

  </ScrollView>
</SafeAreaView>

{/* Date Picker Modal */}
<Modal visible={showDatePicker} transparent animationType="slide">
  {/* Same pattern as HRTStatus */}
</Modal>
```

---

## 🎯 DESIGN COMPARISON

| Element | OLD | NEW |
|---------|-----|-----|
| **Surgery selection** | Radio cards | Multi-select checkboxes |
| **Details** | Expandable accordion | Inline expansion |
| **Date** | Month + Year dropdowns | Native date picker |
| **Recovery** | Emoji status (💡⚠️✅) | Visual timeline bar |
| **Footer** | Sticky at bottom | Scrolls with content |
| **Overall** | Cluttered, confusing | Clean, intuitive flow |

---

CRITICAL: Footer must scroll with content, NOT sticky at bottom.
