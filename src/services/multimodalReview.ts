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
  if (typeof FileReader === 'undefined') {
    return Promise.resolve({ base64: '', dataUrl: '' });
  }
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
 * Prepares and compresses the image creative before transmitting it for multimodal AI analysis.
 * - Caps maximum dimension at 1600px (recommended resolution for modern vision LLMs like Gemini and GPT-4o).
 * - Preserves aspect ratio, crisp typography, and high contrast for brand compliance checks.
 * - Compresses high-resolution PNGs and JPEGs down from 4MB to ~200-500KB.
 * - Drastically avoids OpenAI "input_tokens_exceeded" and Netlify payload size limits.
 */
export async function prepareImageForAnalysis(
  file: File,
  maxDim = 1600,
  quality = 0.85
): Promise<{ base64: string; mimeType: string; fileSizeBytes: number }> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const raw = await readFileAsBase64(file);
    return {
      base64: raw.base64,
      mimeType: file.type || 'image/jpeg',
      fileSizeBytes: file.size
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        // If image is already moderately sized (<= 1200px and <= 600KB), transmit raw
        if (width <= 1200 && height <= 1200 && file.size <= 600 * 1024) {
          const rawResult = reader.result as string;
          const base64 = rawResult.includes(',') ? rawResult.split(',')[1] : rawResult;
          resolve({
            base64,
            mimeType: file.type || 'image/jpeg',
            fileSizeBytes: file.size
          });
          return;
        }

        let targetWidth = width;
        let targetHeight = height;

        if (width > height) {
          if (width > maxDim) {
            targetHeight = Math.round((height * maxDim) / width);
            targetWidth = maxDim;
          }
        } else {
          if (height > maxDim) {
            targetWidth = Math.round((width * maxDim) / height);
            targetHeight = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, targetWidth);
        canvas.height = Math.max(1, targetHeight);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawResult = reader.result as string;
          const base64 = rawResult.includes(',') ? rawResult.split(',')[1] : rawResult;
          resolve({ base64, mimeType: file.type || 'image/jpeg', fileSizeBytes: file.size });
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Keep PNG if original is small PNG; otherwise export as high-quality JPEG
        const isPng = file.type === 'image/png';
        const targetMime = isPng && file.size <= 1.2 * 1024 * 1024 ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(targetMime, quality);
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const estimatedBytes = Math.round((base64.length * 3) / 4);

        resolve({
          base64,
          mimeType: targetMime,
          fileSizeBytes: estimatedBytes
        });
      };

      img.onerror = () => {
        const rawResult = reader.result as string;
        const base64 = rawResult.includes(',') ? rawResult.split(',')[1] : rawResult;
        resolve({ base64, mimeType: file.type || 'image/jpeg', fileSizeBytes: file.size });
      };

      img.src = reader.result as string;
    };

    reader.onerror = () => {
      resolve({ base64: '', mimeType: file.type || 'image/jpeg', fileSizeBytes: 0 });
    };

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

/**
 * Generates an in-memory sample marketing creative asset (PNG) with the BrandGuard AI logo
 * and typography for judge evaluation with zero external dependencies.
 */
export function generateSampleCreativeFile(): Promise<File | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 315;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, 0, 600, 315);

      ctx.strokeStyle = 'rgba(214, 255, 112, 0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, 576, 291);

      // Logo Shield Icon Simulation
      ctx.fillStyle = '#D6FF70';
      ctx.beginPath();
      ctx.moveTo(300, 65);
      ctx.lineTo(340, 85);
      ctx.lineTo(340, 135);
      ctx.quadraticCurveTo(340, 180, 300, 200);
      ctx.quadraticCurveTo(260, 180, 260, 135);
      ctx.lineTo(260, 85);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0B0F19';
      ctx.beginPath();
      ctx.arc(300, 130, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BRANDGUARD AI', 300, 235);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('Enterprise Compliance & Visual Governance', 300, 260);

      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], 'brandguard_sample_creative.png', { type: 'image/png' }));
          } else {
            resolve(null);
          }
        }, 'image/png');
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        resolve(new File([ab], 'brandguard_sample_creative.png', { type: mimeString }));
      }
    } catch {
      resolve(null);
    }
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
