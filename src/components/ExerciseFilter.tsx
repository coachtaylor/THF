// src/components/ExerciseFilter.tsx

import React, { useState, useEffect } from 'react';
import { loadExercises as fetchExercises } from '../services/exercises';
import { Exercise } from '../types/plan';

export const ExerciseFilter: React.FC = () => {
  const [selectedEquipment, setSelectedEquipment] = useState<string>('bodyweight');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [binderAware, setBinderAware] = useState<boolean>(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExercises = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const allExercises = await fetchExercises();
        
        // Filter exercises
        let filtered = allExercises;
        
        // Filter by equipment
        if (selectedEquipment) {
          filtered = filtered.filter(ex => 
            ex.equipment.includes(selectedEquipment) || ex.equipment.length === 0
          );
        }
        
        // Filter by difficulty
        if (selectedDifficulty) {
          filtered = filtered.filter(ex => ex.difficulty === selectedDifficulty);
        }
        
        // Filter by binder aware
        if (binderAware) {
          filtered = filtered.filter(ex => ex.binder_aware);
        }
        
        setExercises(filtered);
        console.log(`Found ${filtered.length} exercises`);
      } catch (err) {
        setError('Failed to load exercises');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadExercises();
  }, [selectedEquipment, selectedDifficulty, binderAware]);

  return (
    <div className="exercise-filter">
      <h2>Filter Exercises</h2>
      
      {/* Equipment Filter */}
      <div className="filter-group">
        <label>Equipment:</label>
        <select 
          value={selectedEquipment} 
          onChange={(e) => setSelectedEquipment(e.target.value)}
        >
          <option value="bodyweight">Bodyweight</option>
          <option value="dumbbells">Dumbbells</option>
          <option value="barbells">Barbells</option>
          <option value="bands">Bands</option>
          <option value="kettlebells">Kettlebells</option>
          <option value="machine">Machine</option>
        </select>
      </div>

      {/* Difficulty Filter */}
      <div className="filter-group">
        <label>Difficulty:</label>
        <select 
          value={selectedDifficulty} 
          onChange={(e) => setSelectedDifficulty(e.target.value)}
        >
          <option value="">All</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Binder Aware Filter */}
      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={binderAware}
            onChange={(e) => setBinderAware(e.target.checked)}
          />
          Only show binder-aware exercises
        </label>
      </div>

      {/* Results */}
      {loading && <p>Loading exercises...</p>}
      {error && <p className="error">{error}</p>}
      
      <div className="exercise-list">
        <h3>Found {exercises.length} exercises</h3>
        {exercises.map((exercise) => (
          <div key={exercise.id} className="exercise-card">
            <h4>{exercise.name}</h4>
            <p>Difficulty: {exercise.difficulty}</p>
            <p>Equipment: {exercise.equipment.join(', ')}</p>
            {exercise.binder_aware && <span className="badge">Binder Aware</span>}
            {exercise.heavy_binding_safe && <span className="badge">Heavy Binding Safe</span>}
          </div>
        ))}
      </div>
    </div>
  );
};