import { cleanupExpiredStories } from '@/lib/storyCleanup';

export async function POST() {
  return cleanupExpiredStories();
}