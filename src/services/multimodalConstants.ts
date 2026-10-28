import type { VisualAnalysisFinding } from '../types/index.ts';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp'
] as const;

export type AllowedImageMimeType = typeof ALLOWED_IMAGE_MIME_TYPES[number];

export const MAX_IMAGE_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file MIME type and size (PNG, JPEG, WEBP only, max 4 MB).
 * Produces user-facing error messages with exact sizing context.
 */
export function validateImageFile(file: {
  type: string;
  size: number;
  name?: string;
}): FileValidationResult {
  if (!file) {
    return {
      valid: false,
      error: 'No file selected. Please choose a PNG, JPEG, or WEBP image.'
    };
  }

  const normalizedType = file.type?.toLowerCase().trim();
  const fileName = (file.name || '').toLowerCase();

  // Secondary extension verification
  const validExtension =
    fileName.endsWith('.png') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.webp');

  const validType =
    ALLOWED_IMAGE_MIME_TYPES.includes(normalizedType as AllowedImageMimeType) ||
    (!normalizedType && validExtension);

  if (!validType) {
    const detectedType = normalizedType || (fileName ? `.${fileName.split('.').pop()}` : 'unknown format');
    return {
      valid: false,
      error: `Invalid file type (${detectedType}). BrandGuard AI only accepts PNG, JPEG, and WEBP marketing creatives and logos.`
    };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMb} MB) exceeds the 4 MB limit. Please compress or resize your creative before uploading.`
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'The uploaded file is empty (0 bytes). Please upload a valid image creative.'
    };
  }

  return { valid: true };
}

/**
 * Evaluates author-provided alt text.
 * If omitted, generates the mandated "No alt-text provided by author" assessment.
 */
export function evaluateAuthorAltText(altText?: string): {
  hasAltText: boolean;
  trimmedAltText: string;
  missingAltTextFinding?: VisualAnalysisFinding;
} {
  const trimmed = (altText || '').trim();

  if (trimmed.length === 0) {
    return {
      hasAltText: false,
      trimmedAltText: '',
      missingAltTextFinding: {
        id: `vis_alt_missing_${Date.now()}`,
        category: 'Accessibility & Contrast',
        severity: 'Medium',
        title: 'Missing Alt Text for Creative Asset',
        description: 'No alt-text provided by author. Screen readers and assistive technologies require author-supplied alt text to convey marketing imagery to visually impaired users.',
        observableEvidence: 'Alt-text input field was left blank by author during draft submission.',
        isUncertain: false,
        confidence: 'High',
        suggestedRemedy: 'Provide concise, descriptive alternative text summarizing the logo, headline, or visual subject for accessibility compliance.',
        hasVerifiedPolicyEvidence: false,
        citationLabel: 'Accessibility Guideline (Author-Provided Alt Text)'
      }
    };
  }

  return {
    hasAltText: true,
    trimmedAltText: trimmed
  };
}
