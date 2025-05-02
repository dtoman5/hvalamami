import { supabase } from './supabaseClient';

export async function cleanupExpiredStories() {
  try {
    const response = await fetch('/api/cleanup-stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Cleanup failed');
    
    const data = await response.json();
    console.log('Cleaned up stories:', data.deletedCount);
    return data;
  } catch (error) {
    console.error('Error cleaning up stories:', error);
    return null;
  }
}

export function setupStoryCleanup() {
  if (typeof window === 'undefined') return;
  
  // Initial cleanup
  cleanupExpiredStories();
  
  // Set up hourly cleanup
  const interval = setInterval(cleanupExpiredStories, 60 * 60 * 1000);
  
  // Return cleanup function
  return () => clearInterval(interval);
}