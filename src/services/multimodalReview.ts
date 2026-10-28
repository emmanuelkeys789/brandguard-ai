import type {
  BrandProfile,
  BrandRule,
  VisualAnalysisFinding,
  VisualAnalysisStatus
} from '../types/index.ts';

export {
  ALLOWED_IMAGE_MIME_TYPES,
  type AllowedImageMimeType,
  MAX_IMAGE_FILE_SIZE_BYTES,
  type FileValidationResult,
  validateImageFile,
  evaluateAuthorAltText
} from './multimodalConstants.ts';

/**
 * Reads a File object as base64 string and data URL in browser environments.
 */
export function readFileAsBase64(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve({ base64, dataUrl: result });
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generates an optimized, low-resolution thumbnail (~120x120 JPEG, ~6-10 KB)
 * to keep persisted review history lightweight without bloating localStorage or history logs.
 */
export async function generateThumbnail(file: File, maxDim = 140): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return '';
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailDataUrl);
      };
      img.onerror = () => resolve('');
      img.src = reader.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export interface MultimodalReviewClientOptions {
  imageBase64: string;
  mimeType: string;
  fileName: string;
  fileSizeBytes: number;
  altText?: string;
  brandProfile?: BrandProfile | null;
  brandRules?: BrandRule[];
  channel?: string;
}

export interface MultimodalReviewClientResult {
  status: VisualAnalysisStatus;
  visualFindings: VisualAnalysisFinding[];
  provider?: string;
  model?: string;
  error?: string;
}

export const multimodalService = {
  /**
   * Dispatches multimodal creative analysis to the serverless review endpoint.
   */
  async requestVisualReview(
    options: MultimodalReviewClientOptions
  ): Promise<MultimodalReviewClientResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch('/api/multimodal-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: options.imageBase64,
          mimeType: options.mimeType,
          fileName: options.fileName,
          fileSizeBytes: options.fileSizeBytes,
          altText: options.altText,
          brandProfile: options.brandProfile,
          brandRules: options.brandRules || [],
          channel: options.channel || 'General Public'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `Server returned HTTP ${response.status}`;
        try {
          const errData = (await response.json()) as any;
          if (errData?.error) errorMsg = errData.error;
        } catch {
          // ignore
        }
        return {
          status: 'error',
          visualFindings: [],
          error: errorMsg
        };
      }

      const data = (await response.json()) as any;

      if (data.status === 'unavailable') {
        return {
          status: 'unavailable',
          visualFindings: data.visualFindings || [],
          error: data.error || 'AI visual analysis provider is unconfigured on the server.'
        };
      }

      if (data.status === 'error') {
        return {
          status: 'error',
          visualFindings: [],
          provider: data.provider,
          model: data.model,
          error: data.error || 'Server encountered an error analyzing marketing creative.'
        };
      }

      const findings: VisualAnalysisFinding[] = Array.isArray(data.visualFindings)
        ? data.visualFindings.map((f: any, idx: number) => ({
            id: typeof f.id === 'string' ? f.id : `vis_fnd_${idx}`,
            category: f.category || 'Logo & Visual Identity',
            severity: f.severity || 'Medium',
            title: f.title || 'Visual Guideline Consideration',
            description: f.description || 'Observable creative attribute noted.',
            observableEvidence: f.observableEvidence || 'Visual feature detected in creative.',
            isUncertain: Boolean(f.isUncertain),
            confidence: f.confidence || (f.isUncertain ? 'Uncertain' : 'Medium'),
            suggestedRemedy: f.suggestedRemedy,
            relatedRuleId: f.relatedRuleId,
            relatedRuleTitle: f.relatedRuleTitle,
            hasVerifiedPolicyEvidence: Boolean(f.hasVerifiedPolicyEvidence),
            citationLabel: f.citationLabel || 'Visual Observation'
          }))
        : [];

      return {
        status: 'completed',
        visualFindings: findings,
        provider: data.provider,
        model: data.model
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err?.name === 'AbortError';
      return {
        status: 'error',
        visualFindings: [],
        error: isAbort
          ? 'Multimodal analysis timed out after 25 seconds. Please retry with a smaller creative.'
          : (err?.message || 'Failed to connect to multimodal analysis endpoint.')
      };
    }
  }
};
