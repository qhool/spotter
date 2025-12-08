/**
 * Utility functions for handling asset URLs in different deployment environments
 */

/**
 * Resolves a local asset path to the correct URL based on the current deployment environment.
 * This handles the difference between development (localhost:3000) and GitHub Pages (/spotter/).
 * 
 * @param assetPath - The local asset path starting with '/' (e.g., '/images/liked-songs.png')
 * @returns The properly resolved URL for the current environment
 */
export function resolveAssetUrl(assetPath: string): string {
  // Remove leading slash if present
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  
  // In development (Vite dev server), use the path as-is
  if (import.meta.env.DEV) {
    return `/${cleanPath}`;
  }
  
  // In production, construct the URL based on the base path
  const base = import.meta.env.BASE_URL || '/';
  
  // Ensure base ends with slash and construct the full URL
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${cleanPath}`;
}

/**
 * Check if a URL is a local asset (starts with '/' and doesn't include protocol)
 */
export function isLocalAssetUrl(url: string): boolean {
  return url.startsWith('/') && !url.includes('://');
}