import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

import { Exercise } from '../../types';
import { cacheVideo, getCachedVideo } from '../../services/videoCache';
import { palette, spacing, typography } from '../../theme';

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
          resizeMode={ResizeMode.COVER}
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
    backgroundColor: palette.deepBlack,
  },
  video: {
    width: '100%',
    height: 180,
    backgroundColor: palette.darkerCard,
  },
  lowSensoryNotice: {
    padding: spacing.s,
    backgroundColor: palette.darkCard,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  lowSensoryText: {
    ...typography.bodySmall,
    color: palette.midGray,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.m,
    gap: spacing.s,
  },
  exerciseName: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  section: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    padding: spacing.s,
    backgroundColor: palette.darkCard,
  },
  sectionTitle: {
    ...typography.bodyLarge,
    color: palette.tealPrimary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  listItem: {
    ...typography.bodySmall,
    color: palette.lightGray,
    marginBottom: spacing.xxs,
    marginLeft: spacing.xs,
  },
  transNotes: {
    borderRadius: 8,
    padding: spacing.s,
    backgroundColor: palette.darkerCard,
    borderWidth: 1,
    borderColor: palette.tealPrimary,
  },
  transNotesTitle: {
    ...typography.bodyLarge,
    color: palette.tealPrimary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  transNotesItem: {
    ...typography.bodySmall,
    color: palette.lightGray,
    marginBottom: spacing.xxs,
  },
  transNoteLabel: {
    fontWeight: '600',
    color: palette.tealPrimary,
  },
});

export default ExerciseDisplay;
