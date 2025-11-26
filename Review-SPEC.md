# Review Screen - Production Specification
## Step 8 of 8 - Final Review & Generate

---

## 🎯 DESIGN PHILOSOPHY

**Current Issues:**
- Summary uses emoji checkmark (✅)
- Bullet points with • character
- "Edit" buttons are small text links
- "Generate My Plan" button uses emoji (→)
- Section cards feel cluttered
- No visual hierarchy between sections
- Footer is sticky

**New Approach:**
- Clean success badge (no emoji checkmark)
- Professional summary card at top
- Clear "Edit" buttons (tappable, visible)
- Professional CTA button (no emoji)
- Clean section cards with good spacing
- Clear visual hierarchy
- Footer scrolls with content
- Celebrate completion

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

### SUCCESS SUMMARY CARD

```css
Summary Container {
  paddingHorizontal: 24
  marginBottom: 32
}

Summary Card {
  backgroundColor: rgba(0, 217, 192, 0.08)
  borderRadius: 14
  padding: 20
  borderWidth: 1
  borderColor: #00D9C0
  borderLeftWidth: 4
}

Success Badge (View) {
  flexDirection: 'row'
  alignItems: 'center'
  marginBottom: 12
}

Success Icon Container {
  width: 32
  height: 32
  borderRadius: 16
  backgroundColor: #00D9C0
  justifyContent: 'center'
  alignItems: 'center'
  marginRight: 12
}

/* Checkmark SVG - NOT emoji */
Success Icon (SVG Path) {
  stroke: #0F1419
  strokeWidth: 3
}

Success Title {
  fontSize: 18
  fontWeight: '700'
  color: #00D9C0
}

Summary Description {
  fontSize: 14
  fontWeight: '400'
  color: #B8C5C5
  lineHeight: 21
  marginBottom: 16
  textAlign: 'left'
}

Highlight List {
  /* No bullets, clean list */
}

Highlight Item {
  flexDirection: 'row'
  alignItems: 'flex-start'
  marginBottom: 10
}

Highlight Dot {
  width: 6
  height: 6
  borderRadius: 3
  backgroundColor: #00D9C0
  marginRight: 12
  marginTop: 7
}

Highlight Text {
  fontSize: 14
  fontWeight: '500'
  color: #E0E4E8
  flex: 1
  lineHeight: 21
}
```

---

### SECTION CARDS

```css
Section Container {
  paddingHorizontal: 24
  marginBottom: 20
}

Section Card {
  backgroundColor: #1A1F26
  borderRadius: 12
  padding: 18
  borderWidth: 1
  borderColor: #2A2F36
}

Section Header {
  flexDirection: 'row'
  justifyContent: 'space-between'
  alignItems: 'center'
  marginBottom: 14
  paddingBottom: 12
  borderBottomWidth: 1
  borderBottomColor: #2A2F36
}

Section Title {
  fontSize: 16
  fontWeight: '700'
  color: #FFFFFF
  textAlign: 'left'
}

Edit Button (TouchableOpacity) {
  paddingHorizontal: 12
  paddingVertical: 6
  borderRadius: 8
  backgroundColor: rgba(0, 217, 192, 0.12)
  borderWidth: 1
  borderColor: #00D9C0
  minHeight: 32
  justifyContent: 'center'
  alignItems: 'center'
}

Edit Button Text {
  fontSize: 13
  fontWeight: '600'
  color: #00D9C0
}

Section Content {
  /* List of data items */
}

Data Item (View) {
  flexDirection: 'row'
  alignItems: 'flex-start'
  marginBottom: 10
}

/* Last item */
Data Item:last-child {
  marginBottom: 0
}

Data Dot {
  width: 5
  height: 5
  borderRadius: 2.5
  backgroundColor: #00D9C0
  marginRight: 12
  marginTop: 7
  flexShrink: 0
}

Data Label {
  fontSize: 13
  fontWeight: '600'
  color: #9CA3AF
}

Data Value {
  fontSize: 14
  fontWeight: '500'
  color: #E0E4E8
  flex: 1
  lineHeight: 21
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

Generate Button (TouchableOpacity) {
  height: 64
  borderRadius: 32
  overflow: 'hidden'
  marginBottom: 16
}

Button Gradient (LinearGradient) {
  flex: 1
  justifyContent: 'center'
  alignItems: 'center'
  colors: ['#00D9C0', '#00B39D']
  start: {x: 0, y: 0}
  end: {x: 1, y: 1}
}

Button Shadow {
  shadowColor: #00D9C0
  shadowOffset: {width: 0, height: 6}
  shadowOpacity: 0.5
  shadowRadius: 16
  elevation: 8
}

Button Content Container {
  flexDirection: 'column'
  alignItems: 'center'
}

Button Main Text {
  fontSize: 18
  fontWeight: '700'
  color: #0F1419
  marginBottom: 2
}

Button Sub Text {
  fontSize: 12
  fontWeight: '600'
  color: rgba(15, 20, 25, 0.7)
}

/* Loading State */
Button (generating) {
  opacity: 0.7
}

Loading Indicator {
  /* Spinner */
}

Loading Text {
  fontSize: 16
  fontWeight: '600'
  color: #0F1419
  marginTop: 8
}

/* Hint Text */
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

### Success Summary
```
Title: "Profile Complete!"
Description: "Your personalized program will include:"

Highlights:
- "{X} exercises tailored to your equipment"
- "{Y} safety rules applied for your needs"
- "{Z}-day training split optimized for your goals"
- "{W}-minute sessions that fit your schedule"
```

### Section Order
```
1. Identity (if filled)
   - Gender identity
   - Pronouns

2. HRT Status (if on_hrt = true)
   - HRT type
   - Duration

3. Binding (if binds_chest = true)
   - Frequency
   - Binder type
   - Duration

4. Surgery (if surgeries.length > 0)
   - Surgery types
   - Dates
   - Recovery status

5. Goals
   - Primary goal
   - Secondary goal (if exists)
   - Body focus preferences

6. Experience & Training
   - Fitness level
   - Equipment
   - Frequency
   - Session duration

7. Dysphoria (if dysphoria_triggers.length > 0)
   - Triggers
   - Notes (truncated if long)
```

### Button States
```
Default:
"Generate Your Program"
"Personalized for your needs"

Loading:
"Generating Your Program..."
(with spinner)

Error:
"Try Again"
"Something went wrong"
```

---

## 📊 SPACING SYSTEM (8px Grid)

```
Section margins: 20px
Section card padding: 18px
Horizontal padding: 24px
Footer padding: 32px top, 0 bottom
Generate button height: 64px
Edit button height: 32px
```

---

## 🎯 INTERACTION SPECIFICATIONS

### Edit Button
```
Tap Edit → Navigate to specific screen
→ Haptic feedback (light)
→ Scale animation (0.96)
→ User can modify data
→ Return to Review with updated data
```

### Generate Button
```
Tap Generate → Start plan generation
→ Haptic feedback (medium)
→ Button shows loading state
→ Disable button during generation
→ Show spinner + "Generating..."
→ On success: Navigate to PlanView
→ On error: Show error message + "Try Again"
```

---

## ✅ VALIDATION RULES

```typescript
// No validation needed - already validated in previous screens
// Generate button always enabled (unless already generating)

canGenerate = !generating
```

---

## 🚀 COMPONENT STRUCTURE

```tsx
<SafeAreaView>
  <ScrollView>
    
    {/* HEADER */}
    <View style={header}>
      <ProgressIndicator current={8} total={8} />
      <Text style={headline}>Review Your Profile</Text>
      <Text style={subheadline}>
        Everything looks good? Generate your program
      </Text>
    </View>

    {/* SUCCESS SUMMARY */}
    <View style={summaryContainer}>
      <View style={summaryCard}>
        <View style={successBadge}>
          <View style={successIconContainer}>
            <SuccessCheckmarkSVG />
          </View>
          <Text style={successTitle}>Profile Complete!</Text>
        </View>
        
        <Text style={summaryDescription}>
          Your personalized program will include:
        </Text>
        
        <View style={highlightList}>
          <View style={highlightItem}>
            <View style={highlightDot} />
            <Text style={highlightText}>
              {exerciseCount} exercises tailored to your equipment
            </Text>
          </View>
          <View style={highlightItem}>
            <View style={highlightDot} />
            <Text style={highlightText}>
              {safetyRulesCount} safety rules for your needs
            </Text>
          </View>
          <View style={highlightItem}>
            <View style={highlightDot} />
            <Text style={highlightText}>
              {frequency}-day training split
            </Text>
          </View>
          <View style={highlightItem}>
            <View style={highlightDot} />
            <Text style={highlightText}>
              {duration}-minute sessions
            </Text>
          </View>
        </View>
      </View>
    </View>

    {/* SECTION CARDS */}
    
    {/* Identity */}
    {(genderIdentity || pronouns) && (
      <View style={sectionContainer}>
        <View style={sectionCard}>
          <View style={sectionHeader}>
            <Text style={sectionTitle}>Identity</Text>
            <TouchableOpacity style={editButton} onPress={() => navigate('GenderIdentity')}>
              <Text style={editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={sectionContent}>
            {genderIdentity && (
              <View style={dataItem}>
                <View style={dataDot} />
                <Text style={dataValue}>
                  <Text style={dataLabel}>Gender: </Text>
                  {formatGenderIdentity(genderIdentity)}
                </Text>
              </View>
            )}
            {pronouns && (
              <View style={dataItem}>
                <View style={dataDot} />
                <Text style={dataValue}>
                  <Text style={dataLabel}>Pronouns: </Text>
                  {pronouns}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    )}

    {/* HRT Status */}
    {onHRT && (
      <View style={sectionContainer}>
        <View style={sectionCard}>
          <View style={sectionHeader}>
            <Text style={sectionTitle}>HRT Status</Text>
            <TouchableOpacity style={editButton} onPress={() => navigate('HRTStatus')}>
              <Text style={editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={sectionContent}>
            {/* HRT data items */}
          </View>
        </View>
      </View>
    )}

    {/* ... Other sections (Binding, Surgery, Goals, Experience, Dysphoria) ... */}

    {/* FOOTER (SCROLLS WITH CONTENT) */}
    <View style={footerContainer}>
      <TouchableOpacity
        style={generateButton}
        onPress={handleGenerate}
        disabled={generating}
      >
        <LinearGradient style={buttonGradient}>
          {generating ? (
            <>
              <ActivityIndicator color="#0F1419" />
              <Text style={loadingText}>Generating Your Program...</Text>
            </>
          ) : (
            <>
              <Text style={buttonMainText}>Generate Your Program</Text>
              <Text style={buttonSubText}>Personalized for your needs</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      <Text style={hintText}>
        This will take about 10 seconds
      </Text>
    </View>

  </ScrollView>
</SafeAreaView>
```

---

## 🎯 DESIGN COMPARISON

| Element | OLD | NEW |
|---------|-----|-----|
| **Success indicator** | Emoji checkmark (✅) | SVG success badge |
| **Bullets** | • character | Clean dots (6px circles) |
| **Edit buttons** | Small text links | Tappable button badges |
| **Generate CTA** | Text with emoji (→) | Large button with sub-text |
| **Section cards** | Cluttered | Clean with clear hierarchy |
| **Footer** | Sticky | Scrolls with content |
| **Overall** | Basic list | Celebratory, professional |

---

## 🔧 DYNAMIC CONTENT

### Exercise Count Calculation
```typescript
// Calculate from filtered exercises based on profile
const exerciseCount = await getFilteredExerciseCount(profile);
```

### Safety Rules Count
```typescript
// Count applied rules from rules engine
const safetyRulesCount = calculateAppliedRules(profile);
```

### Conditional Sections
```typescript
// Only show sections that have data
if (profile.gender_identity || profile.pronouns) {
  renderIdentitySection();
}

if (profile.on_hrt) {
  renderHRTSection();
}

// etc.
```

---

CRITICAL:
- NO emoji checkmark (✅) - use SVG
- NO bullet character (•) - use dots
- NO arrow emoji (→) - text only
- Edit buttons are tappable badges, not text links
- Footer scrolls with content
- Celebrate completion!
