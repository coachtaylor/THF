// src/services/videoCache.ts
// Using legacy API to avoid deprecation warnings in expo-file-system v54
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const CACHE_DIR = `${FileSystem.cacheDirectory}exercise-videos/`;

/**
 * Initialize the cache directory if it doesn't exist
 */
async function ensureCacheDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

/**
 * Get the cached video URI for an exercise, if it exists
 * @param exerciseId - The exercise ID
 * @returns The local file URI if cached, null otherwise
 */
export async function getCachedVideo(exerciseId: string): Promise<string | null> {
  try {
    await ensureCacheDir();
    const fileUri = `${CACHE_DIR}${exerciseId}.mp4`;
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (fileInfo.exists) {
      // On iOS, we need to use file:// prefix
      const uri = Platform.OS === 'ios' ? fileUri : fileUri;
      return uri;
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to check cached video for exercise ${exerciseId}:`, error);
    return null;
  }
}

/**
 * Download and cache a video for an exercise
 * @param exerciseId - The exercise ID
 * @param videoUrl - The remote video URL
 * @returns The local file URI of the cached video
 */
export async function cacheVideo(exerciseId: string, videoUrl: string): Promise<string> {
  try {
    await ensureCacheDir();
    const fileUri = `${CACHE_DIR}${exerciseId}.mp4`;
    
    // Check if already cached
    const existing = await getCachedVideo(exerciseId);
    if (existing) {
      return existing;
    }
    
    // Download the video
    console.log(`📥 Downloading video for exercise ${exerciseId}...`);
    const downloadResult = await FileSystem.downloadAsync(videoUrl, fileUri);
    
    if (downloadResult.status !== 200) {
      throw new Error(`Failed to download video: HTTP ${downloadResult.status}`);
    }
    
    console.log(`✅ Video cached for exercise ${exerciseId}`);
    return downloadResult.uri;
  } catch (error) {
    console.error(`Failed to cache video for exercise ${exerciseId}:`, error);
    throw error;
  }
}

/**
 * Clear all cached videos
 */
export async function clearVideoCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      console.log('🗑️ Video cache cleared');
    }
  } catch (error) {
    console.error('Failed to clear video cache:', error);
    throw error;
  }
}

/**
 * Get the total size of the video cache
 * @returns The total size in bytes
 */
export async function getVideoCacheSize(): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      return 0;
    }
    
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    let totalSize = 0;
    
    for (const file of files) {
      const fileUri = `${CACHE_DIR}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += fileInfo.size || 0;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Failed to calculate video cache size:', error);
    return 0;
  }
}

/**
 * Remove a specific cached video
 * @param exerciseId - The exercise ID
 */
export async function removeCachedVideo(exerciseId: string): Promise<void> {
  try {
    const fileUri = `${CACHE_DIR}${exerciseId}.mp4`;
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      console.log(`🗑️ Removed cached video for exercise ${exerciseId}`);
    }
  } catch (error) {
    console.error(`Failed to remove cached video for exercise ${exerciseId}:`, error);
    throw error;
  }
}

