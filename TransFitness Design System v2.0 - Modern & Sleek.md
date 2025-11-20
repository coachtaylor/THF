# TransFitness Design System v2.0 - Modern & Sleek

**Inspired by modern fitness app design trends (Dark mode, gradients, glass morphism)**

---

## 🎨 Updated Color Palette (Dark Mode First)

### Dark Theme (Primary)

**Background Colors**
- **Deep Black**: `#0A0E0E` (main background)
- **Dark Card**: `#1A1F1F` (elevated surfaces, cards)
- **Darker Card**: `#141818` (nested cards, inputs)
- **Border**: `#2A2F2F` (subtle borders, dividers)

**Accent Colors**
- **Teal Primary**: `#00D9C0` (primary actions, highlights)
- **Teal Dark**: `#00B39D` (hover states)
- **Teal Glow**: `rgba(0, 217, 192, 0.15)` (glow effects, shadows)

**Text Colors**
- **White**: `#FFFFFF` (primary text, headings)
- **Light Gray**: `#B8C5C5` (secondary text)
- **Mid Gray**: `#7A8585` (tertiary text, captions)
- **Disabled**: `#4A5050` (disabled text)

**Semantic Colors**
- **Success**: `#00D9C0` (completed, achievements)
- **Warning**: `#FFB84D` (alerts, cautions)
- **Error**: `#FF6B6B` (errors, pain flags)
- **Info**: `#5B9FFF` (tips, information)

### Light Theme (Secondary)

**Background Colors**
- **Off White**: `#F8FAFA` (main background)
- **White**: `#FFFFFF` (cards, surfaces)
- **Light Gray**: `#F0F4F4` (nested surfaces)
- **Border**: `#E0E8E8` (borders, dividers)

**Accent Colors**
- **Teal Primary**: `#00B39D` (slightly darker for contrast)
- **Teal Light**: `#00D9C0` (hover states)
- **Teal Subtle**: `rgba(0, 179, 157, 0.1)` (backgrounds)

**Text Colors**
- **Dark**: `#0A0E0E` (primary text)
- **Mid Dark**: `#3A4545` (secondary text)
- **Gray**: `#7A8585` (tertiary text)

---

## 📝 Typography (Modern & Clean)

### Font Family

**Primary: SF Pro / Roboto (System Fonts)**
- iOS: SF Pro Display (headings), SF Pro Text (body)
- Android: Roboto (all text)
- Why: Native performance, modern, clean

**Alternative: Inter** (if custom font needed)
- Modern, neutral, excellent readability
- Variable font support

### Type Scale (Larger, Bolder)

```
Display:        34px / 700 / White (Dark) or Dark (Light)
H1:             28px / 700 / White or Dark
H2:             24px / 600 / White or Dark
H3:             20px / 600 / White or Dark
H4:             18px / 600 / White or Dark
Body Large:     17px / 400 / Light Gray or Mid Dark
Body:           15px / 400 / Light Gray or Mid Dark
Body Small:     13px / 400 / Mid Gray or Gray
Caption:        12px / 500 / Mid Gray or Gray
Button:         16px / 600 / White
```

### Line Heights
- Display/Headings: 1.2x (tight, impactful)
- Body: 1.5x (readable)
- Captions: 1.4x (compact)

---

## 🎨 Modern Design Elements

### Gradients

**Primary Gradient** (Teal to Blue)
```
linear-gradient(135deg, #00D9C0 0%, #00B3D9 100%)
```

**Card Gradient** (Subtle depth)
```
linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)
```

**Glow Gradient** (Behind cards)
```
radial-gradient(circle at 50% 0%, rgba(0,217,192,0.15), transparent 70%)
```

### Glass Morphism

**Glass Card** (Modern elevated look)
```
background: rgba(26, 31, 31, 0.7)
backdrop-filter: blur(20px)
border: 1px solid rgba(255, 255, 255, 0.1)
```

### Shadows (Subtle & Layered)

**Small Shadow** (Cards)
```
shadow: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 3,
}
```

**Medium Shadow** (Elevated cards)
```
shadow: {
  shadowColor: '#00D9C0',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 16,
  elevation: 6,
}
```

**Glow Shadow** (Active/Selected)
```
shadow: {
  shadowColor: '#00D9C0',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.4,
  shadowRadius: 20,
  elevation: 8,
}
```

### Border Radius (Larger, More Modern)

```
Small:    12px  (buttons, small cards)
Medium:   16px  (cards, inputs)
Large:    24px  (large cards, modals)
XLarge:   32px  (hero cards, images)
Round:    9999px (pills, avatars)
```

---

## 🔘 Component Styles (Modern)

### Buttons

**Primary Button** (Gradient + Glow)
```typescript
{
  background: 'linear-gradient(135deg, #00D9C0 0%, #00B3D9 100%)',
  borderRadius: 16,
  paddingVertical: 16,
  paddingHorizontal: 32,
  shadowColor: '#00D9C0',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 6,
}
// Text: 16px / 600 / White
```

**Secondary Button** (Outline + Glow on Press)
```typescript
{
  backgroundColor: 'transparent',
  borderWidth: 2,
  borderColor: '#00D9C0',
  borderRadius: 16,
  paddingVertical: 14,
  paddingHorizontal: 32,
}
// Text: 16px / 600 / #00D9C0
```

**Ghost Button** (Text only)
```typescript
{
  backgroundColor: 'transparent',
  paddingVertical: 12,
  paddingHorizontal: 24,
}
// Text: 16px / 600 / #00D9C0
```

### Cards

**Standard Card** (Dark mode)
```typescript
{
  backgroundColor: '#1A1F1F',
  borderRadius: 20,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 3,
}
```

**Glass Card** (Premium look)
```typescript
{
  backgroundColor: 'rgba(26, 31, 31, 0.7)',
  backdropFilter: 'blur(20px)', // Use react-native-blur for iOS
  borderRadius: 20,
  padding: 20,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
}
```

**Active Card** (Selected state)
```typescript
{
  backgroundColor: '#1A1F1F',
  borderRadius: 20,
  padding: 20,
  borderWidth: 2,
  borderColor: '#00D9C0',
  shadowColor: '#00D9C0',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.4,
  shadowRadius: 20,
  elevation: 8,
}
```

### Input Fields

**Modern Input** (Dark mode)
```typescript
{
  backgroundColor: '#141818',
  borderWidth: 1,
  borderColor: '#2A2F2F',
  borderRadius: 16,
  paddingVertical: 14,
  paddingHorizontal: 16,
  fontSize: 15,
  color: '#FFFFFF',
}

// Focus State
{
  borderColor: '#00D9C0',
  borderWidth: 2,
  shadowColor: '#00D9C0',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
}
```

### Progress Rings (Like Dribbble example)

**Circular Progress**
```typescript
// Use react-native-circular-progress or react-native-svg
{
  size: 120,
  width: 12,
  fill: 75, // percentage
  tintColor: '#00D9C0',
  backgroundColor: '#2A2F2F',
  rotation: 0,
  lineCap: 'round',
}
```

### Badges

**Streak Badge** (Modern)
```typescript
{
  backgroundColor: '#00D9C0',
  borderRadius: 12,
  paddingVertical: 6,
  paddingHorizontal: 12,
  shadowColor: '#00D9C0',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
}
// Text: 12px / 600 / #0A0E0E (dark text on bright bg)
```

**Plus Badge** (Gradient)
```typescript
{
  background: 'linear-gradient(135deg, #FFB84D 0%, #FF6B6B 100%)',
  borderRadius: 12,
  paddingVertical: 6,
  paddingHorizontal: 12,
}
// Text: 12px / 600 / White
```

---

## 🎯 Modern UI Patterns

### Hero Section (Onboarding)

**Full-bleed image with gradient overlay**
```typescript
<View style={{ position: 'relative' }}>
  <Image 
    source={heroImage}
    style={{
      width: '100%',
      height: 400,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    }}
    resizeMode="cover"
  />
  <LinearGradient
    colors={['transparent', 'rgba(10, 14, 14, 0.8)', '#0A0E0E']}
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 200,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    }}
  />
  <View style={{ position: 'absolute', bottom: 32, left: 24, right: 24 }}>
    <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFF' }}>
      Safety-first workouts for trans bodies
    </Text>
  </View>
</View>
```

### Stats Cards (Dashboard)

**Large number with label**
```typescript
<View style={{
  backgroundColor: '#1A1F1F',
  borderRadius: 20,
  padding: 24,
  alignItems: 'center',
}}>
  <Text style={{ fontSize: 48, fontWeight: '700', color: '#00D9C0' }}>
    6000
  </Text>
  <Text style={{ fontSize: 13, fontWeight: '500', color: '#7A8585', marginTop: 4 }}>
    steps today
  </Text>
</View>
```

### Bottom Sheet (Modern)

**Rounded top corners, handle, backdrop blur**
```typescript
{
  backgroundColor: '#1A1F1F',
  borderTopLeftRadius: 32,
  borderTopRightRadius: 32,
  paddingTop: 12,
  paddingHorizontal: 24,
  paddingBottom: 32,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
}

// Handle
{
  width: 40,
  height: 4,
  backgroundColor: '#4A5050',
  borderRadius: 2,
  alignSelf: 'center',
  marginBottom: 20,
}
```

---

## 🎨 React Native Paper Theme v2.0

```typescript
// src/theme/theme.ts
import { MD3DarkTheme } from 'react-native-paper';

export const darkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#00D9C0',
    primaryContainer: '#00B39D',
    secondary: '#5B9FFF',
    secondaryContainer: '#4A7FCC',
    tertiary: '#FFB84D',
    background: '#0A0E0E',
    surface: '#1A1F1F',
    surfaceVariant: '#141818',
    surfaceDisabled: '#2A2F2F',
    onPrimary: '#0A0E0E',
    onSecondary: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#B8C5C5',
    onSurfaceDisabled: '#4A5050',
    outline: '#2A2F2F',
    outlineVariant: '#3A4545',
    error: '#FF6B6B',
    errorContainer: '#CC5555',
    onError: '#FFFFFF',
    success: '#00D9C0',
    warning: '#FFB84D',
    info: '#5B9FFF',
    backdrop: 'rgba(10, 14, 14, 0.8)',
  },
  roundness: 16,
  fonts: {
    ...MD3DarkTheme.fonts,
    displayLarge: { fontFamily: 'System', fontSize: 34, fontWeight: '700', letterSpacing: 0 },
    displayMedium: { fontFamily: 'System', fontSize: 28, fontWeight: '700', letterSpacing: 0 },
    displaySmall: { fontFamily: 'System', fontSize: 24, fontWeight: '600', letterSpacing: 0 },
    headlineLarge: { fontFamily: 'System', fontSize: 20, fontWeight: '600', letterSpacing: 0 },
    bodyLarge: { fontFamily: 'System', fontSize: 17, fontWeight: '400', letterSpacing: 0 },
    bodyMedium: { fontFamily: 'System', fontSize: 15, fontWeight: '400', letterSpacing: 0 },
    bodySmall: { fontFamily: 'System', fontSize: 13, fontWeight: '400', letterSpacing: 0 },
    labelLarge: { fontFamily: 'System', fontSize: 16, fontWeight: '600', letterSpacing: 0 },
  },
};

export const lightTheme = {
  ...darkTheme,
  dark: false,
  colors: {
    ...darkTheme.colors,
    primary: '#00B39D',
    background: '#F8FAFA',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F4F4',
    onPrimary: '#FFFFFF',
    onSurface: '#0A0E0E',
    onSurfaceVariant: '#3A4545',
    outline: '#E0E8E8',
  },
};
```

---

## 📦 Required Dependencies

```bash
# Gradients
pnpm add react-native-linear-gradient

# Blur effects (iOS glass morphism)
pnpm add @react-native-community/blur

# Circular progress (like Dribbble example)
pnpm add react-native-circular-progress react-native-svg

# Reanimated (smooth animations)
pnpm add react-native-reanimated
```

---

## 🎯 Key Differences from v1.0

| Element | v1.0 (Soft/Pastel) | v2.0 (Modern/Sleek) |
|---------|-------------------|---------------------|
| **Theme** | Light-first, pastel | Dark-first, high contrast |
| **Colors** | Sage, lavender, peach | Teal, black, white |
| **Shadows** | Soft, subtle | Glows, layered |
| **Borders** | 12px | 16-32px (larger) |
| **Typography** | 14-16px body | 15-17px body (larger) |
| **Buttons** | Flat colors | Gradients + glows |
| **Cards** | Simple shadows | Glass morphism |
| **Overall** | Calm, approachable | Tech-forward, premium |

---

## 🚀 Implementation Priority

### Phase 1: Core Updates (Week 2)
1. Switch to dark theme
2. Update color palette
3. Increase border radius (12→16px)
4. Larger typography
5. Add linear-gradient to primary buttons

### Phase 2: Premium Polish (Week 3-4)
1. Add glass morphism cards
2. Implement circular progress rings
3. Add glow shadows to active states
4. Gradient overlays on images
5. Bottom sheet with rounded corners

### Phase 3: Animations (Week 5-6)
1. Smooth transitions with Reanimated
2. Progress ring animations
3. Button press animations
4. Card entrance animations

---

**This design system transforms TransFitness from "approachable" to "premium tech-forward" while maintaining inclusivity.** 🏳️‍⚧️💪✨
