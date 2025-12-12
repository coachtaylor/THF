# Knowledge Engine Integration Guide

## Quick Start

### 1. Load the Data

```typescript
import knowledgeEntries from './knowledge_entries.json';
import safetyGuides from './safety_guides.json';
import ruleMetadata from './rule_metadata.json';

// Access entries by category
const bindingEntries = knowledgeEntries.filter(e => e.category === 'binding');
```

### 2. Search Knowledge

```typescript
function searchKnowledge(query: string, entries: KnowledgeEntry[]) {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/);

  return entries
    .map(entry => {
      let score = 0;
      for (const keyword of entry.keywords) {
        if (queryLower.includes(keyword)) score += 2;
        else if (words.some(w => keyword.includes(w))) score += 1;
      }
      if (queryLower.includes(entry.category)) score += 1;
      return { entry, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.entry);
}
```

### 3. Context-Aware Filtering

```typescript
interface UserContext {
  binds_chest?: boolean;
  on_hrt?: boolean;
  has_surgery?: boolean;
  hrt_type?: 'estrogen_blockers' | 'testosterone';
}

function filterByContext(entries: KnowledgeEntry[], context: UserContext) {
  return entries.filter(entry => {
    if (entry.requires_binding && !context.binds_chest) return false;
    if (entry.requires_hrt && !context.on_hrt) return false;
    if (entry.hrt_type && entry.hrt_type !== context.hrt_type) return false;
    if (entry.requires_surgery && !context.has_surgery) return false;
    return true;
  });
}
```

### 4. Display Safety Guides

```typescript
function getGuide(slug: string, guides: SafetyGuide[]) {
  return guides.find(g => g.slug === slug);
}

// Guide sections are in the 'sections' array
// Each section has: icon, title, content[], iconColor, iconBg
```

## Data Categories

### Knowledge Entries

| Category | Description | Example Topics |
|----------|-------------|----------------|
| binding | Binding safety during exercise | Cardio, chest exercises, duration |
| hrt | Hormone-related fitness | Testosterone muscle gains, estrogen effects |
| post_op | Post-surgical recovery | Timeline, scar care, return to exercise |
| exercise | General exercise advice | Modifications, rest periods |
| recovery | Recovery and soreness | DOMS, rest days |
| dysphoria | Managing dysphoria | Gym strategies, rest days |
| general | Getting started | Onboarding, general tips |

### Safety Guides

| Slug | Title | Category |
|------|-------|----------|
| binder_safety | Binder Safety | binding |
| post_op_movement | Post-Op Movement | post_op |

## Support

For technical support or licensing inquiries:
- Email: support@transfitness.app
- Documentation: https://docs.transfitness.app
