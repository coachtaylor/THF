import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

import { Exercise } from '../../types';
import { cacheVideo, getCachedVideo } from '../../services/videoCache';
import { palette, spacing, colors } from '../../theme';

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
        <View style={styles.videoContainer}>
          <Video
            style={styles.video}
            source={{ uri: videoUri }}
            shouldPlay
            isLooping
            resizeMode={ResizeMode.COVER}
            useNativeControls
          />
        </View>
      )}

      {lowSensoryMode && (
        <View style={styles.lowSensoryNotice}>
          <LinearGradient
            colors={['rgba(25, 25, 30, 0.9)', 'rgba(18, 18, 22, 0.95)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.lowSensoryText}>Video hidden for low-sensory mode</Text>
        </View>
      )}

      {!lowSensoryMode && loadingVideo && (
        <View style={styles.lowSensoryNotice}>
          <LinearGradient
            colors={['rgba(25, 25, 30, 0.9)', 'rgba(18, 18, 22, 0.95)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.lowSensoryText}>Loading exercise video...</Text>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>

        {exercise.neutral_cues?.length ? (
          <View style={styles.section}>
            <LinearGradient
              colors={['rgba(25, 25, 30, 0.7)', 'rgba(18, 18, 22, 0.8)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.sectionGlassHighlight} />
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Neutral Cues</Text>
              {renderList(exercise.neutral_cues)}
            </View>
          </View>
        ) : null}

        {exercise.breathing_cues?.length ? (
          <View style={styles.section}>
            <LinearGradient
              colors={['rgba(25, 25, 30, 0.7)', 'rgba(18, 18, 22, 0.8)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.sectionGlassHighlight} />
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Breathing Cues</Text>
              {renderList(exercise.breathing_cues)}
            </View>
          </View>
        ) : null}

        {showTransNotes && (
          <View style={styles.transNotes}>
            <LinearGradient
              colors={['rgba(91, 206, 250, 0.1)', 'rgba(91, 206, 250, 0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.transNotesGlassHighlight} />
            <View style={styles.sectionContent}>
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
  videoContainer: {
    width: '100%',
    height: 180,
    backgroundColor: 'rgba(15, 15, 18, 0.9)',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  lowSensoryNotice: {
    padding: spacing.m,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  lowSensoryText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.m,
    gap: spacing.m,
  },
  exerciseName: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  section: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  sectionGlassHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionContent: {
    padding: spacing.m,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
    marginBottom: spacing.s,
  },
  listItem: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
    marginLeft: spacing.xs,
    lineHeight: 20,
  },
  transNotes: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 206, 250, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  transNotesGlassHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(91, 206, 250, 0.15)',
  },
  transNotesTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
    marginBottom: spacing.s,
  },
  transNotesItem: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  transNoteLabel: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: colors.accent.primary,
  },
});

export default ExerciseDisplay;
