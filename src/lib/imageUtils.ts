/**
 * Array of runner images for the background
 * These URLs should point to images in the public/images directory
 */
export const runnerImages = [
  // Replace these URLs with actual images you've added to public/images
  '/images/runner1.jpg',
  '/images/runner2.jpg',
  '/images/runner3.jpg',
  '/images/runner4.jpg',
];

/**
 * Get a random runner image URL
 */
export function getRandomRunnerImage(): string {
  const index = Math.floor(Math.random() * runnerImages.length);
  return runnerImages[index];
}

/**
 * Get multiple random runner images
 */
export function getRandomRunnerImages(count: number): string[] {
  const images = [...runnerImages];
  const shuffled = images.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
} 