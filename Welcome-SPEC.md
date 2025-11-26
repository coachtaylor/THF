# Welcome Screen - Production Specification
## First Screen (Landing Page)

---

## 🎯 DESIGN PHILOSOPHY

**Current Issues:**
- Feature bullets use emojis (🎯💪🔒🏥)
- "TF" logo in circle feels generic
- Feature list is text-heavy
- CTAs lack visual hierarchy
- Missing hero/emotional connection
- Legal text is prominent (should be subtle)
- No visual storytelling

**New Approach:**
- NO emojis - use SVG icons or gradients
- Beautiful gradient hero section
- Mascot/character illustration (Riley Phoenix or Sam Chameleon)
- Emotional headline that resonates
- Visual feature cards (not just bullets)
- Strong CTA hierarchy
- Subtle legal text
- Professional, inspiring aesthetic

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

### HERO SECTION

```css
Hero Container {
  paddingHorizontal: 24
  paddingTop: 32
  paddingBottom: 48
  alignItems: 'center'
}

/* Gradient Background */
Hero Background (View) {
  position: 'absolute'
  top: 0
  left: 0
  right: 0
  height: 400
  background: LinearGradient
  colors: [rgba(0, 217, 192, 0.08), transparent]
  start: {x: 0, y: 0}
  end: {x: 0, y: 1}
}

Logo Container {
  marginBottom: 40
  alignItems: 'center'
}

/* Modern Logo - NOT "TF" in circle */
Logo {
  width: 80
  height: 80
  marginBottom: 16
}

/* Could be SVG illustration or gradient shape */
Logo Gradient Circle {
  width: 80
  height: 80
  borderRadius: 40
  background: LinearGradient
  colors: ['#00D9C0', '#A78BFA']
  justifyContent: 'center'
  alignItems: 'center'
  shadowColor: #00D9C0
  shadowOpacity: 0.3
  shadowRadius: 20
}

App Name {
  fontSize: 32
  fontWeight: '800'
  color: #FFFFFF
  letterSpacing: -0.5
  marginBottom: 8
  textAlign: 'center'
}

Tagline {
  fontSize: 16
  fontWeight: '500'
  color: #9CA3AF
  textAlign: 'center'
  lineHeight: 24
}

/* Headline */
Headline Container {
  marginTop: 24
  marginBottom: 40
}

Headline {
  fontSize: 36
  fontWeight: '800'
  color: #FFFFFF
  textAlign: 'center'
  lineHeight: 44
  letterSpacing: -1
  marginBottom: 12
}

/* Gradient text effect */
Headline Gradient {
  /* "for trans bodies" in gradient */
  background: LinearGradient
  colors: ['#00D9C0', '#A78BFA']
  backgroundClip: 'text'
  /* Note: May need react-native-linear-gradient-text library */
}

Subheadline {
  fontSize: 18
  fontWeight: '500'
  color: #B8C5C5
  textAlign: 'center'
  lineHeight: 28
}
```

---

### MASCOT ILLUSTRATION (Optional but recommended)

```css
Mascot Container {
  marginVertical: 32
  alignItems: 'center'
}

Mascot Illustration {
  width: 280
  height: 280
  /* SVG or PNG illustration */
  /* Riley Phoenix (MTF) or Sam Chameleon (non-binary) */
}

Mascot Caption {
  fontSize: 13
  fontWeight: '600'
  color: #6B7280
  marginTop: 12
  textAlign: 'center'
}
```

---

### FEATURE CARDS (Visual, NOT bullets)

```css
Features Container {
  paddingHorizontal: 24
  marginBottom: 48
}

Feature Card (View) {
  backgroundColor: #1A1F26
  borderRadius: 16
  padding: 20
  marginBottom: 16
  borderWidth: 1
  borderColor: #2A2F36
  flexDirection: 'row'
  alignItems: 'center'
}

/* Icon Container - NO emoji */
Icon Container {
  width: 56
  height: 56
  borderRadius: 28
  backgroundColor: rgba(0, 217, 192, 0.12)
  justifyContent: 'center'
  alignItems: 'center'
  marginRight: 16
}

/* SVG Icons */
Icon SVG {
  width: 28
  height: 28
  /* Different icon per feature */
}

Feature Content {
  flex: 1
}

Feature Title {
  fontSize: 16
  fontWeight: '700'
  color: #FFFFFF
  marginBottom: 4
  lineHeight: 22
}

Feature Description {
  fontSize: 14
  fontWeight: '400'
  color: #9CA3AF
  lineHeight: 20
}
```

---

### CTA SECTION

```css
CTA Container {
  paddingHorizontal: 24
  marginBottom: 32
}

Primary Button {
  height: 60
  borderRadius: 30
  overflow: 'hidden'
  marginBottom: 16
  shadowColor: #00D9C0
  shadowOpacity: 0.4
  shadowRadius: 16
  shadowOffset: {width: 0, height: 8}
}

Button Gradient {
  flex: 1
  justifyContent: 'center'
  alignItems: 'center'
  flexDirection: 'row'
  colors: ['#00D9C0', '#00B39D']
}

Button Icon Container {
  width: 32
  height: 32
  borderRadius: 16
  backgroundColor: rgba(15, 20, 25, 0.15)
  marginRight: 12
  justifyContent: 'center'
  alignItems: 'center'
}

/* Sparkle or Star SVG - NOT emoji */
Button Icon SVG {
  width: 18
  height: 18
}

Button Text {
  fontSize: 18
  fontWeight: '700'
  color: #0F1419
}

/* Secondary Button */
Secondary Button {
  height: 56
  borderRadius: 28
  borderWidth: 2
  borderColor: #2A2F36
  backgroundColor: transparent
  justifyContent: 'center'
  alignItems: 'center'
  marginBottom: 16
}

Secondary Button Text {
  fontSize: 17
  fontWeight: '600'
  color: #E0E4E8
}

/* Continue as Guest */
Guest Link {
  paddingVertical: 12
  alignItems: 'center'
}

Guest Text {
  fontSize: 15
  fontWeight: '600'
  color: #9CA3AF
}
```

---

### SOCIAL PROOF (Optional)

```css
Social Proof Container {
  paddingHorizontal: 24
  marginBottom: 32
  alignItems: 'center'
}

Stats Row {
  flexDirection: 'row'
  gap: 24
  marginBottom: 16
}

Stat Item {
  alignItems: 'center'
}

Stat Value {
  fontSize: 24
  fontWeight: '800'
  color: #00D9C0
  marginBottom: 2
}

Stat Label {
  fontSize: 12
  fontWeight: '500'
  color: #6B7280
}

Testimonial Card {
  backgroundColor: rgba(0, 217, 192, 0.05)
  borderRadius: 12
  padding: 16
  borderLeftWidth: 3
  borderLeftColor: #00D9C0
}

Testimonial Text {
  fontSize: 14
  fontWeight: '500'
  color: #B8C5C5
  fontStyle: 'italic'
  marginBottom: 8
  lineHeight: 21
}

Testimonial Author {
  fontSize: 13
  fontWeight: '600'
  color: #00D9C0
}
```

---

### FOOTER

```css
Footer Container {
  paddingHorizontal: 24
  paddingBottom: 0
  alignItems: 'center'
}

Legal Text {
  fontSize: 11
  fontWeight: '400'
  color: #6B7280
  textAlign: 'center'
  lineHeight: 16
}

Legal Link {
  color: #9CA3AF
  textDecorationLine: 'underline'
}
```

---

## 🎨 CONTENT SPECIFICATIONS

### Headline Options
```
Option 1: "Safety-first workouts for trans bodies"
Option 2: "Fitness that understands your journey"
Option 3: "Train with confidence. Move with pride."
```

### Subheadline
```
"Binder-aware exercises. HRT-informed programming. Built by trans people, for trans people."
```

### Feature Cards (4 cards)
```json
[
  {
    "title": "Binder-Aware Exercises",
    "description": "Safe alternatives for chest compression",
    "icon": "shield-check"
  },
  {
    "title": "Flexible Workouts",
    "description": "5-45 minute options for any energy level",
    "icon": "clock"
  },
  {
    "title": "Privacy-First",
    "description": "Your data stays on your device",
    "icon": "lock"
  },
  {
    "title": "Recovery Support",
    "description": "Post-surgery modifications included",
    "icon": "heart"
  }
]
```

### CTAs
```
Primary: "Get Started Free" or "Start Your Journey"
Secondary: "Sign In"
Guest: "Continue as Guest"
```

### Social Proof (Optional)
```
Stats:
- "10K+" downloads
- "4.8★" rating
- "500+" reviews

Testimonial:
"Finally, a fitness app that gets it. The binder-aware exercises are a game-changer."
— Alex, 27
```

---

## 📊 SPACING SYSTEM (8px Grid)

```
Hero padding: 24px horizontal, 32px top
Feature card margins: 16px bottom
CTA margins: 16px bottom
Icon container: 56x56
Button height: 60px (primary), 56px (secondary)
```

---

## 🎯 INTERACTION SPECIFICATIONS

### Get Started Button
```
Tap → Navigate to Signup screen
→ Haptic feedback (medium)
→ Scale animation (0.95)
→ Gradient pulse effect
```

### Sign In Button
```
Tap → Navigate to Login screen
→ Haptic feedback (light)
→ Border pulse effect
```

### Continue as Guest
```
Tap → Skip auth, navigate to Onboarding
→ Haptic feedback (light)
→ Create anonymous session
```

### Feature Card
```
(Optional) Tap → Show feature detail modal
→ Haptic feedback (light)
```

---

## 🚀 COMPONENT STRUCTURE

```tsx
<SafeAreaView style={container}>
  <ScrollView>
    
    {/* HERO SECTION */}
    <View style={heroContainer}>
      <LinearGradient style={heroBackground} />
      
      <View style={logoContainer}>
        <View style={logoGradientCircle}>
          {/* SVG logo or gradient shape */}
        </View>
        <Text style={appName}>TransFitness</Text>
        <Text style={tagline}>Affirming Fitness for Every Body</Text>
      </View>

      <View style={headlineContainer}>
        <Text style={headline}>
          Safety-first workouts{'\n'}
          <Text style={headlineGradient}>for trans bodies</Text>
        </Text>
        <Text style={subheadline}>
          Binder-aware exercises. HRT-informed programming.
          Built by trans people, for trans people.
        </Text>
      </View>
    </View>

    {/* MASCOT ILLUSTRATION (Optional) */}
    <View style={mascotContainer}>
      <Image source={require('./assets/riley-phoenix.png')} style={mascotIllustration} />
      <Text style={mascotCaption}>Meet Riley, your workout companion</Text>
    </View>

    {/* FEATURE CARDS */}
    <View style={featuresContainer}>
      {FEATURES.map((feature) => (
        <View key={feature.title} style={featureCard}>
          <View style={iconContainer}>
            <FeatureIconSVG name={feature.icon} />
          </View>
          <View style={featureContent}>
            <Text style={featureTitle}>{feature.title}</Text>
            <Text style={featureDescription}>{feature.description}</Text>
          </View>
        </View>
      ))}
    </View>

    {/* SOCIAL PROOF (Optional) */}
    <View style={socialProofContainer}>
      <View style={statsRow}>
        <View style={statItem}>
          <Text style={statValue}>10K+</Text>
          <Text style={statLabel}>Downloads</Text>
        </View>
        <View style={statItem}>
          <Text style={statValue}>4.8★</Text>
          <Text style={statLabel}>Rating</Text>
        </View>
        <View style={statItem}>
          <Text style={statValue}>500+</Text>
          <Text style={statLabel}>Reviews</Text>
        </View>
      </View>

      <View style={testimonialCard}>
        <Text style={testimonialText}>
          "Finally, a fitness app that gets it. The binder-aware exercises are a game-changer."
        </Text>
        <Text style={testimonialAuthor}>— Alex, 27</Text>
      </View>
    </View>

    {/* CTA SECTION */}
    <View style={ctaContainer}>
      <TouchableOpacity style={primaryButton} onPress={handleGetStarted}>
        <LinearGradient style={buttonGradient}>
          <View style={buttonIconContainer}>
            <SparkleIconSVG />
          </View>
          <Text style={buttonText}>Get Started Free</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={secondaryButton} onPress={handleSignIn}>
        <Text style={secondaryButtonText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity style={guestLink} onPress={handleContinueAsGuest}>
        <Text style={guestText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>

    {/* FOOTER */}
    <View style={footerContainer}>
      <Text style={legalText}>
        By continuing, you agree to our{' '}
        <Text style={legalLink} onPress={handleTerms}>Terms</Text>
        {' '}and{' '}
        <Text style={legalLink} onPress={handlePrivacy}>Privacy Policy</Text>
      </Text>
    </View>

  </ScrollView>
</SafeAreaView>
```

---

## 🎯 DESIGN COMPARISON

| Element | OLD | NEW |
|---------|-----|-----|
| **Logo** | "TF" in circle | Gradient circle or mascot |
| **Headline** | Basic text | Large, emotional, gradient accent |
| **Features** | Emoji bullets (🎯💪) | Visual cards with SVG icons |
| **CTAs** | Plain buttons | Gradient primary with icon |
| **Mascot** | None | Riley Phoenix illustration |
| **Social proof** | None | Stats + testimonial |
| **Overall** | Functional | Inspiring, emotional connection |

---

## 🔧 SVG ICONS NEEDED

### Shield Check (Binder-Aware)
```tsx
const ShieldCheckSVG = () => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Path d="M14 2 L24 6 L24 14 C24 19 20 23 14 26 C8 23 4 19 4 14 L4 6 Z" stroke="#00D9C0" strokeWidth="2" />
    <Path d="M10 14 L13 17 L18 12" stroke="#00D9C0" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);
```

### Clock (Flexible Workouts)
```tsx
const ClockSVG = () => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Circle cx="14" cy="14" r="11" stroke="#00D9C0" strokeWidth="2" />
    <Path d="M14 8 L14 14 L18 16" stroke="#00D9C0" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);
```

### Lock (Privacy-First)
```tsx
const LockSVG = () => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Rect x="6" y="12" width="16" height="12" rx="2" stroke="#00D9C0" strokeWidth="2" />
    <Path d="M10 12 L10 8 C10 5.8 11.8 4 14 4 C16.2 4 18 5.8 18 8 L18 12" stroke="#00D9C0" strokeWidth="2" />
  </Svg>
);
```

### Heart (Recovery Support)
```tsx
const HeartSVG = () => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Path d="M14 24 L6 16 C4 14 4 10.5 6 8.5 C8 6.5 11 7 14 10 C17 7 20 6.5 22 8.5 C24 10.5 24 14 22 16 Z" stroke="#00D9C0" strokeWidth="2" />
  </Svg>
);
```

### Sparkle (Button Icon)
```tsx
const SparkleSVG = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M9 1 L10 7 L16 8 L10 9 L9 15 L8 9 L2 8 L8 7 Z" fill="#0F1419" />
  </Svg>
);
```

---

CRITICAL:
- NO emojis (🎯💪🔒🏥) - use SVG icons
- Emotional headline with gradient accent
- Visual feature cards (not bullets)
- Mascot illustration for connection
- Strong CTA hierarchy
- Professional, inspiring aesthetic
