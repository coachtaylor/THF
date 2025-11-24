#!/bin/bash

# Cleanup script for old onboarding files
# This script safely deletes files that have been replaced in the new 8-step workflow

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 Cleanup: Old Onboarding Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Files to delete
FILES_TO_DELETE=(
  "src/screens/onboarding/intake/HRTAndBinding.tsx"
  "src/screens/onboarding/intake/Constraints.tsx"
  "src/screens/onboarding/intake/Preferences.tsx"
  "src/screens/onboarding/intake/GoalsAndPreferences.tsx"
  "src/components/onboarding/ConstraintCheckbox.tsx"
  "src/components/onboarding/SurgeonClearanceBanner.tsx"
)

# Test files to delete (if they exist)
TEST_FILES_TO_DELETE=(
  "src/__tests__/screens/HRTAndBinding.test.tsx"
  "src/__tests__/screens/Constraints.test.tsx"
  "src/__tests__/screens/Preferences.test.tsx"
)

# Check which files exist
EXISTING_FILES=()
for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    EXISTING_FILES+=("$file")
  else
    echo "⚠️  File not found: $file (may already be deleted)"
  fi
done

# Check which test files exist
EXISTING_TEST_FILES=()
for file in "${TEST_FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    EXISTING_TEST_FILES+=("$file")
  fi
done

if [ ${#EXISTING_FILES[@]} -eq 0 ] && [ ${#EXISTING_TEST_FILES[@]} -eq 0 ]; then
  echo "✅ All files already deleted or don't exist."
  exit 0
fi

echo "📋 Files to be deleted:"
echo ""
if [ ${#EXISTING_FILES[@]} -gt 0 ]; then
  echo "   Source files:"
  for file in "${EXISTING_FILES[@]}"; do
    echo "   • $file"
  done
  echo ""
fi

if [ ${#EXISTING_TEST_FILES[@]} -gt 0 ]; then
  echo "   Test files:"
  for file in "${EXISTING_TEST_FILES[@]}"; do
    echo "   • $file"
  done
  echo ""
fi

# Check for imports/references
echo "🔍 Checking for references to deleted files..."
echo ""

FOUND_REFERENCES=false

for file in "${EXISTING_FILES[@]}"; do
  filename=$(basename "$file" .tsx)
  # Search for imports (excluding the file itself and test files)
  references=$(grep -r "from.*$filename\|import.*$filename" src --exclude-dir=node_modules --exclude="$(basename "$file")" 2>/dev/null | grep -v "\.test\." | grep -v "\.spec\." || true)
  
  if [ ! -z "$references" ]; then
    echo "⚠️  Found references to $filename:"
    echo "$references" | sed 's/^/   /'
    echo ""
    FOUND_REFERENCES=true
  fi
done

# Also check for test files that import these components
echo "📝 Test files that may need updating:"
for file in "${EXISTING_FILES[@]}"; do
  filename=$(basename "$file" .tsx)
  test_refs=$(find src/__tests__ -name "*${filename}*" -o -name "*test*" -type f 2>/dev/null | grep -E "\.(test|spec)\.(ts|tsx)$" || true)
  if [ ! -z "$test_refs" ]; then
    echo "   • Test files found: $test_refs"
  fi
done
echo ""

if [ "$FOUND_REFERENCES" = true ]; then
  echo "⚠️  WARNING: Found references to files that will be deleted!"
  echo "   Please review and update these references before proceeding."
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted."
    exit 1
  fi
fi

# Confirmation
TOTAL_FILES=$((${#EXISTING_FILES[@]} + ${#EXISTING_TEST_FILES[@]}))
echo ""
read -p "🗑️  Delete $TOTAL_FILES file(s)? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Aborted."
  exit 0
fi

# Delete source files
echo ""
echo "🗑️  Deleting source files..."
for file in "${EXISTING_FILES[@]}"; do
  if rm "$file"; then
    echo "   ✅ Deleted: $file"
  else
    echo "   ❌ Failed to delete: $file"
    exit 1
  fi
done

# Delete test files
if [ ${#EXISTING_TEST_FILES[@]} -gt 0 ]; then
  echo ""
  echo "🗑️  Deleting test files..."
  for file in "${EXISTING_TEST_FILES[@]}"; do
    if rm "$file"; then
      echo "   ✅ Deleted: $file"
    else
      echo "   ❌ Failed to delete: $file"
      exit 1
    fi
  done
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Files deleted successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run TypeScript check
echo "🔍 Running TypeScript type check..."
if npx tsc --noEmit 2>&1 | head -50; then
  echo ""
  echo "✅ TypeScript check passed!"
else
  echo ""
  echo "⚠️  TypeScript check found errors. Please review above."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Final check for remaining references..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

REMAINING_REFS=false

for file in "${EXISTING_FILES[@]}"; do
  filename=$(basename "$file" .tsx)
  # Search for any remaining references
  refs=$(grep -r "$filename" src --exclude-dir=node_modules 2>/dev/null | grep -v "test" || true)
  
  if [ ! -z "$refs" ]; then
    echo "⚠️  Found remaining references to $filename:"
    echo "$refs" | sed 's/^/   /'
    echo ""
    REMAINING_REFS=true
  fi
done

if [ "$REMAINING_REFS" = false ]; then
  echo "✅ No remaining references found!"
else
  echo "⚠️  Please review and update remaining references (especially in test files)."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Cleanup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

