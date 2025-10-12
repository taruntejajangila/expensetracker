/**
 * Image URL Helper
 * Handles both Cloudinary URLs and local storage paths
 */

import { SERVER_BASE_URL } from '../config/api.config';

/**
 * Get the full image URL
 * - If the URL already starts with http:// or https://, return it as-is (Cloudinary)
 * - Otherwise, prepend the server base URL (local storage)
 * 
 * @param imageUrl - The image URL from the API (can be full URL or relative path)
 * @returns Full image URL ready to use in img src
 */
export function getFullImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '';
  }

  // Check if it's already a full URL (Cloudinary or external)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // For relative paths (local storage fallback)
  return `${SERVER_BASE_URL}${imageUrl}`;
}

/**
 * Check if an image URL is from Cloudinary
 * @param imageUrl - The image URL to check
 * @returns true if the URL is from Cloudinary
 */
export function isCloudinaryUrl(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) {
    return false;
  }

  return imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary.com');
}

/**
 * Check if an image URL is a local/relative path
 * @param imageUrl - The image URL to check
 * @returns true if the URL is a relative path
 */
export function isLocalImageUrl(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) {
    return false;
  }

  return !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://');
}

