import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Video } from 'expo-av';

import { Exercise } from '../../types';
import { cacheVideo, getCachedVideo } from '../../services/videoCache';

interface ExerciseDisplayProps {
  exercise: Exercise;
  lowSensoryMode?: boolean;
}

const ExerciseDisplay: React.FC<ExerciseDisplayProps> = ({
  exercise,
  lowSensoryMode = false,
}) => {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadVideo = async () => {
      if (!exercise?.videoUrl || lowSensoryMode) {
        if (isMounted) {
          setVideoUri(null);
        }
        return;
      }

      try {
        setLoadingVideo(true);
        const cached = await getCachedVideo(exercise.id);
        if (!isMounted) return;

        if (cached) {
          setVideoUri(cached);
          return;
        }

        const uri = await cacheVideo(exercise.id, exercise.videoUrl);
        if (isMounted) {
          setVideoUri(uri);
        }
      } catch (error) {
        console.warn('Failed to load exercise video', error);
      } finally {
        if (isMounted) {
          setLoadingVideo(false);
        }
      }
    };

    loadVideo();

    return () => {
      isMounted = false;
    };
  }, [exercise.id, exercise.videoUrl, lowSensoryMode]);

  const renderList = (items: string[]) =>
    items.map((item, index) => (
      <Text key={`${item}-${index}`} style={styles.listItem}>
        • {item}
      </Text>
    ));

  const showTransNotes = Boolean(
    exercise.trans_notes?.binder || exercise.trans_notes?.pelvic_floor,
  );

  return (
    <View style={styles.container}>
      {!lowSensoryMode && videoUri && (
        <Video
          style={styles.video}
          source={{ uri: videoUri }}
          shouldPlay
          isLooping
          resizeMode="cover"
          useNativeControls
        />
      )}

      {lowSensoryMode && (
        <View style={styles.lowSensoryNotice}>
          <Text style={styles.lowSensoryText}>Video hidden for low-sensory mode</Text>
        </View>
      )}

      {!lowSensoryMode && loadingVideo && (
        <View style={styles.lowSensoryNotice}>
          <Text style={styles.lowSensoryText}>Loading exercise video...</Text>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>

        {exercise.neutral_cues?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Neutral Cues</Text>
            {renderList(exercise.neutral_cues)}
          </View>
        ) : null}

        {exercise.breathing_cues?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Breathing Cues</Text>
            {renderList(exercise.breathing_cues)}
          </View>
        ) : null}

        {showTransNotes && (
          <View style={styles.transNotes}>
            <Text style={styles.transNotesTitle}>Trans-Specific Notes</Text>
            {exercise.trans_notes?.binder ? (
              <Text style={styles.transNotesItem}>
                <Text style={styles.transNoteLabel}>Binder:</Text> {exercise.trans_notes.binder}
              </Text>
            ) : null}
            {exercise.trans_notes?.pelvic_floor ? (
              <Text style={styles.transNotesItem}>
                <Text style={styles.transNoteLabel}>Pelvic Floor:</Text>{' '}
                {exercise.trans_notes.pelvic_floor}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  video: {
    width: '100%',
    height: 240,
    backgroundColor: '#111827',
  },
  lowSensoryNotice: {
    padding: 16,
    backgroundColor: '#f4f4f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  lowSensoryText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  section: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 15,
    color: '#1f2937',
    marginBottom: 4,
  },
  transNotes: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  transNotesTitle: {
    fontSize: 16,
    color: '#065f46',
    fontWeight: '600',
    marginBottom: 8,
  },
  transNotesItem: {
    fontSize: 15,
    color: '#064e3b',
    marginBottom: 6,
  },
  transNoteLabel: {
    fontWeight: '600',
  },
});

export default ExerciseDisplay;
