#!/usr/bin/env python3
"""
Import new exercise library CSV to Supabase

Converts Python list syntax ['item'] to JSON array
Handles all new fields and proper data types
"""

import csv
import json
import os
import sys
from typing import Any, Optional
from supabase import create_client, Client

def parse_python_list(value: str) -> list[str]:
    """
    Convert Python list syntax to Python list
    ['bodyweight'] -> ['bodyweight']
    ['dumbbells', 'bench'] -> ['dumbbells', 'bench']
    """
    if not value or value.strip() == '' or value.strip() == '[]':
        return []
    
    value = value.strip()
    
    # Remove outer brackets
    if value.startswith('[') and value.endswith(']'):
        value = value[1:-1]
    
    # Split by comma and clean each item
    items = []
    for item in value.split(','):
        item = item.strip().strip("'\"")
        if item:
            items.append(item)
    
    return items

def parse_boolean(value: str) -> bool:
    """Convert TRUE/FALSE strings to boolean"""
    if not value:
        return False
    return value.strip().upper() in ('TRUE', '1', 'YES')

def parse_int_or_none(value: str) -> Optional[int]:
    """Parse integer or return None if empty"""
    if not value or value.strip() == '':
        return None
    try:
        return int(value.strip())
    except ValueError:
        return None

def parse_text_or_none(value: str) -> Optional[str]:
    """Return text or None if empty"""
    if not value or value.strip() == '':
        return None
    return value.strip()

def row_to_exercise(row: dict[str, str]) -> dict[str, Any]:
    """Convert CSV row to exercise dict"""
    return {
        'id': int(row['id']),
        'slug': row['slug'],
        'name': row['name'],
        'pattern': row['pattern'],
        'goal': row['goal'],
        'difficulty': row['difficulty'],
        'equipment': parse_python_list(row['equipment']),
        
        # Safety flags
        'binder_aware': parse_boolean(row['binder_aware']),
        'pelvic_floor_safe': parse_boolean(row['pelvic_floor_safe']),
        'heavy_binding_safe': parse_boolean(row['heavy_binding_safe']),
        'contraindications': parse_python_list(row['contraindications']),
        
        # Muscle targeting
        'target_muscles': parse_text_or_none(row['target_muscles']),
        'secondary_muscles': parse_text_or_none(row['secondary_muscles']),
        
        # Trans-specific metadata
        'gender_goal_emphasis': parse_text_or_none(row['gender_goal_emphasis']),
        'dysphoria_tags': parse_text_or_none(row['dysphoria_tags']),
        'post_op_safe_weeks': parse_int_or_none(row['post_op_safe_weeks']),
        
        # Instruction metadata
        'cue_primary': parse_text_or_none(row['cue_primary']),
        'breathing': parse_text_or_none(row['breathing']),
        'rep_range_beginner': parse_text_or_none(row['rep_range_beginner']),
        'rep_range_intermediate': parse_text_or_none(row['rep_range_intermediate']),
        'rep_range_advanced': parse_text_or_none(row['rep_range_advanced']),
        
        # Quality metrics
        'effectiveness_rating': parse_int_or_none(row['effectiveness_rating']),
        'source': parse_text_or_none(row['source']),
        'notes': parse_text_or_none(row['notes']),
        
        # Metadata
        'created_at': row['created_at'] if row['created_at'] else None,
        'version': row['version'] if row['version'] else '1',
        'flags_reviewed': parse_boolean(row['flags_reviewed']),
        'reviewer': parse_text_or_none(row['reviewer']),
    }

def import_exercises(csv_path: str, supabase: Client, dry_run: bool = False):
    """Import exercises from CSV to Supabase"""
    
    exercises = []
    errors = []
    
    print(f"📖 Reading CSV from: {csv_path}")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for i, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
            try:
                exercise = row_to_exercise(row)
                exercises.append(exercise)
                
                # Print sample for verification
                if i <= 3:
                    print(f"\n📋 Row {i} preview:")
                    print(f"   Name: {exercise['name']}")
                    print(f"   Equipment: {exercise['equipment']}")
                    print(f"   Gender emphasis: {exercise['gender_goal_emphasis']}")
                    print(f"   Contraindications: {exercise['contraindications']}")
                
            except Exception as e:
                error_msg = f"Row {i} ({row.get('name', 'unknown')}): {str(e)}"
                errors.append(error_msg)
                print(f"❌ {error_msg}")
    
    print(f"\n✅ Parsed {len(exercises)} exercises from CSV")
    
    if errors:
        print(f"\n⚠️  {len(errors)} errors encountered:")
        for error in errors:
            print(f"   - {error}")
        
        response = input("\nContinue with import? (y/n): ")
        if response.lower() != 'y':
            print("❌ Import cancelled")
            return
    
    if dry_run:
        print("\n🔍 DRY RUN - No data will be inserted")
        print(f"   Would insert {len(exercises)} exercises")
        
        # Show equipment distribution
        from collections import Counter
        equipment_counts = Counter()
        for ex in exercises:
            for eq in ex['equipment']:
                equipment_counts[eq] += 1
        
        print("\n📊 Equipment distribution:")
        for eq, count in equipment_counts.most_common():
            print(f"   {eq}: {count} exercises")
        
        return
    
    # Confirm before inserting
    print(f"\n⚠️  About to insert {len(exercises)} exercises into Supabase")
    response = input("This will replace existing data. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Import cancelled")
        return
    
    # Insert in batches
    batch_size = 50
    inserted_count = 0
    
    for i in range(0, len(exercises), batch_size):
        batch = exercises[i:i+batch_size]
        
        try:
            result = supabase.table('exercises').insert(batch).execute()
            inserted_count += len(batch)
            print(f"✅ Inserted batch {i//batch_size + 1}: {len(batch)} exercises (total: {inserted_count})")
        except Exception as e:
            print(f"❌ Error inserting batch {i//batch_size + 1}: {str(e)}")
            print(f"   First exercise in batch: {batch[0]['name']}")
            raise
    
    print(f"\n🎉 Successfully imported {inserted_count} exercises!")
    
    # Verify counts
    count_result = supabase.table('exercises').select('id', count='exact').execute()
    db_count = count_result.count
    print(f"✅ Verified {db_count} exercises in database")

def main():
    """Main entry point"""
    
    # Check arguments
    if len(sys.argv) < 2:
        print("Usage: python import_new_exercise_library.py <csv_path> [--dry-run]")
        print("\nOptions:")
        print("  --dry-run    Parse CSV but don't insert to database")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    dry_run = '--dry-run' in sys.argv
    
    # Check file exists
    if not os.path.exists(csv_path):
        print(f"❌ Error: File not found: {csv_path}")
        sys.exit(1)
    
    # Get Supabase credentials
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables required")
        print("\nSet them like this:")
        print("  export SUPABASE_URL='https://your-project.supabase.co'")
        print("  export SUPABASE_ANON_KEY='your-anon-key'")
        sys.exit(1)
    
    # Initialize Supabase client
    try:
        supabase: Client = create_client(url, key)
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {str(e)}")
        sys.exit(1)
    
    # Run import
    try:
        import_exercises(csv_path, supabase, dry_run)
    except Exception as e:
        print(f"\n❌ Import failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()