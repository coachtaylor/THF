# Figma Icon Import Guide for React Native

## 🎯 Best Method: Manual Export + Convert

Since you already have `react-native-svg` installed and a pattern established, here's the recommended workflow:

### **Quick Steps:**

1. **In Figma:**
   - Select your icon component
   - Right-click → **Copy/Paste as** → **SVG**
   - Or: Select → Export → Choose SVG format

2. **Convert to React Native Component:**
   - Use **https://react-svgr.com/playground/** (best for React Native)
     - Select "React Native" template
     - Paste your SVG
     - Click "Transform"
     - Copy the generated component

3. **Add to Your Project:**
   - Place in `src/components/icons/[IconName].tsx`
   - Follow the pattern in `DisclaimerIcons.tsx`
   - Export from `src/components/icons/index.tsx` (create if needed)

---

## 📋 Detailed Workflow

### **Method 1: Using SVGR Playground (Recommended)**

1. Export SVG from Figma
2. Go to https://react-svgr.com/playground/
3. Select **"React Native"** template
4. Paste your SVG code
5. Click **"Transform"**
6. Copy the generated component
7. Modify to match your pattern:
   - Add `IconProps` interface
   - Make `color` and `size` props
   - Remove hardcoded colors

### **Method 2: Manual Conversion**

1. Copy SVG from Figma
2. Use `IconTemplate.tsx` as a starting point
3. Replace paths/shapes with your Figma paths
4. Update `viewBox` to match Figma frame dimensions
5. Convert attributes:
   - `fill="currentColor"` → `fill={color}`
   - `stroke="currentColor"` → `stroke={color}`
   - `stroke-width="2"` → `strokeWidth={strokeWidth}`
   - Remove `xmlns`, `x`, `y` attributes

---

## 🔧 Common Fixes Needed

### **Color Conversion:**
```tsx
// Figma SVG (before)
<path fill="#06b6d4" ... />

// React Native (after)
<Path fill={color} ... />
```

### **CurrentColor:**
```tsx
// Figma SVG (before)
<path fill="currentColor" ... />

// React Native (after)
<Path fill={color} ... />
```

### **Stroke Width:**
```tsx
// Figma SVG (before)
<path stroke-width="2" ... />

// React Native (after)
<Path strokeWidth={strokeWidth} ... />
```

### **ViewBox:**
```tsx
// Match Figma frame size
<Svg viewBox="0 0 24 24" ... /> // If Figma frame is 24x24
<Svg viewBox="0 0 32 32" ... /> // If Figma frame is 32x32
```

---

## 📁 File Structure

```
src/components/icons/
  ├── DisclaimerIcons.tsx    (existing pattern)
  ├── IconTemplate.tsx       (template for new icons)
  ├── YourNewIcon.tsx        (your new icons)
  └── index.tsx             (barrel export - create this)
```

### **Create `src/components/icons/index.tsx`:**
```tsx
export * from './DisclaimerIcons';
export * from './YourNewIcon';
// ... export all icons here
```

---

## 💡 Tips

1. **Use Component Variants in Figma**: Create different sizes/states as variants
2. **Export at 24x24 or 32x32**: Standard sizes work best
3. **Use Flatten**: If icon has multiple layers, flatten first
4. **Remove Background**: Make sure icon has transparent background
5. **Optimize Paths**: Use Figma's "Outline Stroke" if needed

---

## 🚀 Batch Export

For multiple icons at once:

1. In Figma, create a **Component Set** with all icons
2. Select all → Export → SVG
3. Export to `assets/icons/raw/` folder
4. Use online tool or script to batch convert
5. Place converted components in `src/components/icons/`

---

## 📝 Example: Converting a New Icon

```tsx
// 1. Copy SVG from Figma
// 2. Convert using SVGR Playground
// 3. Create component:

import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const CustomIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#06b6d4',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      fill={color}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 4. Use in your components:
import { CustomIcon } from '../components/icons';

<CustomIcon size={32} color={colors.cyan[500]} />
```

---

## 🔗 Useful Resources

- **SVGR Playground**: https://react-svgr.com/playground/
- **React Native SVG Docs**: https://github.com/react-native-svg/react-native-svg
- **Figma Export Guide**: https://help.figma.com/hc/en-us/articles/360040328114-Export-files

---

## ⚠️ Common Issues

1. **Icons not showing**: Check `viewBox` matches Figma frame size
2. **Wrong colors**: Make sure you're using `color` prop, not hardcoded values
3. **Paths not rendering**: Convert all `fill-rule` to `fillRule`
4. **Stroke issues**: Ensure `strokeWidth` is a number, not a string

---

## ✅ Best Practices

- ✅ Always make icons accept `size`, `color`, and `strokeWidth` props
- ✅ Use theme colors as defaults (`colors.cyan[500]`)
- ✅ Keep icons in `src/components/icons/` directory
- ✅ Export all icons from a single `index.tsx` file
- ✅ Follow existing naming convention (PascalCase)
- ✅ Test icons at different sizes (16, 24, 32, 48)

