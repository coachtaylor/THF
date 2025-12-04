# Converting Figma Icons to React Native Components

## Quick Method (Recommended)

### Step 1: Export SVG from Figma
1. Select your icon component in Figma
2. Right-click → **Copy/Paste as** → **SVG** (or Export → SVG)
3. Paste into a temporary `.svg` file

### Step 2: Use Online Converter
Use this tool to convert SVG to React Native component:
- **https://react-svgr.com/playground/** (select "React Native" template)
- Paste your SVG code
- Copy the generated component code

### Step 3: Add to Your Project
Place converted components in `src/components/icons/[IconName].tsx`

## Alternative: Manual Conversion

### Basic Template:
```tsx
import React from 'react';
import Svg, { Path, Circle, Rect, G, etc } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const YourIconName: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Paste Figma SVG paths here */}
    <Path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      fill={color}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);
```

### Key Differences to Fix:
- Replace `fill="currentColor"` → `fill={color}`
- Replace `stroke="currentColor"` → `stroke={color}`
- Remove `xmlns` attributes
- Make `viewBox` match Figma's frame size
- Convert hardcoded colors to `color` prop

## Batch Export from Figma

### Using Figma's Export Settings:
1. Create a **Component Set** for all icons
2. Select all icons → Right-click → **Export**
3. Choose **SVG** format
4. Export to `assets/icons/raw/` folder
5. Use a script to batch convert (see below)

## Automation Script (Future)

You can create a Node script to batch convert multiple SVGs:

```javascript
// scripts/batch-convert-icons.js
const fs = require('fs');
const path = require('path');
const { transform } = require('@svgr/core');

async function convertSVG(filePath) {
  const svgCode = fs.readFileSync(filePath, 'utf8');
  const componentName = path.basename(filePath, '.svg')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  const jsCode = await transform(svgCode, {
    plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
    template: (variables, { tpl }) => {
      return tpl`
import React from 'react';
import Svg, { ${variables.jsx.svgProps} } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const ${variables.componentName}: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  ...props
}) => (
  <Svg width={size} height={size} viewBox="${variables.jsx.viewBox}" fill="none" {...props}>
    ${variables.jsx.children}
  </Svg>
);
      `;
    },
  });
  
  return jsCode;
}
```

