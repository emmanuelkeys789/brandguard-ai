import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateImageFile,
  evaluateAuthorAltText
} from './multimodalReview.ts';
import {
  handleMultimodalReview,
  validateAndFormatVisualFindings,
  buildMultimodalSystemPrompt,
  buildMultimodalUserPrompt,
  type MultimodalReviewRequest
} from './multimodalServerHandler.ts';
import { evaluateDraft } from './ruleEngine.ts';
import type { BrandRule, BrandProfile } from '../types/index.ts';

describe('Multimodal Brand Compliance & Accessibility Tests', () => {
  const sampleProfile: BrandProfile = {
    id: 'brand_test_01',
    name: 'BrandGuard AI',
    communicationTone: 'Professional',
    industry: 'Enterprise Brand Governance',
    targetAudience: 'Marketing & Legal Executives',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  const sampleVisualRule: BrandRule = {
    id: 'rule-visual-logo-01',
    brandId: 'brand_test_01',
    title: 'Logo Isolation & Minimum Clear Space',
    category: 'Visual Guidelines',
    severity: 'High',
    description: 'The primary brand logo must maintain a clear zone equal to 50% of the emblem width, free of overlapping typography or busy graphical elements.',
    enabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  describe('File Validation (Type and Size)', () => {
    test('1. Accepts valid PNG, JPEG, and WEBP files under 4 MB', () => {
      const pngResult = validateImageFile({
        type: 'image/png',
        size: 1.5 * 1024 * 1024,
        name: 'campaign-hero.png'
      });
      assert.equal(pngResult.valid, true);

      const jpegResult = validateImageFile({
        type: 'image/jpeg',
        size: 3.2 * 1024 * 1024,
        name: 'banner.jpg'
      });
      assert.equal(jpegResult.valid, true);

      const webpResult = validateImageFile({
        type: 'image/webp',
        size: 500 * 1024,
        name: 'logo.webp'
      });
      assert.equal(webpResult.valid, true);
    });

    test('2. Rejects unsupported MIME types (GIF, SVG, PDF, TIFF)', () => {
      const gifResult = validateImageFile({
        type: 'image/gif',
        size: 500 * 1024,
        name: 'animated.gif'
      });
      assert.equal(gifResult.valid, false);
      assert.ok(gifResult.error?.includes('PNG, JPEG, and WEBP'));

      const svgResult = validateImageFile({
        type: 'image/svg+xml',
        size: 50 * 1024,
        name: 'vector.svg'
      });
      assert.equal(svgResult.valid, false);
      assert.ok(svgResult.error?.includes('PNG, JPEG, and WEBP'));

      const pdfResult = validateImageFile({
        type: 'application/pdf',
        size: 100 * 1024,
        name: 'brochure.pdf'
      });
      assert.equal(pdfResult.valid, false);
    });

    test('3. Rejects oversized files exceeding the 4 MB limit', () => {
      const oversizedResult = validateImageFile({
        type: 'image/png',
        size: 4.5 * 1024 * 1024, // 4.5 MB
        name: 'huge-render.png'
      });
      assert.equal(oversizedResult.valid, false);
      assert.ok(oversizedResult.error?.includes('exceeds the 4 MB limit'));
      assert.ok(oversizedResult.error?.includes('4.5 MB'));
    });

    test('4. Rejects empty files (0 bytes)', () => {
      const emptyResult = validateImageFile({
        type: 'image/png',
        size: 0,
        name: 'empty.png'
      });
      assert.equal(emptyResult.valid, false);
      assert.ok(emptyResult.error?.includes('empty'));
    });
  });

  describe('Author Alt-Text Evaluation', () => {
    test('5. Reports "No alt-text provided by author" when alt text is omitted', () => {
      const emptyCheck = evaluateAuthorAltText('');
      assert.equal(emptyCheck.hasAltText, false);
      assert.ok(emptyCheck.missingAltTextFinding);
      assert.equal(emptyCheck.missingAltTextFinding.title, 'Missing Alt Text for Creative Asset');
      assert.ok(emptyCheck.missingAltTextFinding.description.includes('No alt-text provided by author'));
      assert.equal(emptyCheck.missingAltTextFinding.observableEvidence, 'Alt-text input field was left blank by author during draft submission.');
      assert.equal(emptyCheck.missingAltTextFinding.isUncertain, false);
      assert.equal(emptyCheck.missingAltTextFinding.confidence, 'High');

      const undefinedCheck = evaluateAuthorAltText(undefined);
      assert.equal(undefinedCheck.hasAltText, false);
      assert.ok(undefinedCheck.missingAltTextFinding?.description.includes('No alt-text provided by author'));

      const whitespaceCheck = evaluateAuthorAltText('    ');
      assert.equal(whitespaceCheck.hasAltText, false);
      assert.ok(whitespaceCheck.missingAltTextFinding?.description.includes('No alt-text provided by author'));
    });

    test('6. Accepts descriptive alt text provided by author', () => {
      const result = evaluateAuthorAltText('BrandGuard AI shield emblem with vibrant neon lime accent on carbon background');
      assert.equal(result.hasAltText, true);
      assert.equal(result.trimmedAltText, 'BrandGuard AI shield emblem with vibrant neon lime accent on carbon background');
      assert.equal(result.missingAltTextFinding, undefined);
    });
  });

  describe('Server-Side Validation & Handler Enforcement', () => {
    const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    test('7. Server-side handler rejects unsupported file formats', async () => {
      const req: MultimodalReviewRequest = {
        imageBase64: validBase64,
        mimeType: 'image/bmp',
        fileName: 'creative.bmp',
        fileSizeBytes: 2048,
        brandProfile: sampleProfile,
        brandRules: [sampleVisualRule]
      };

      const res = await handleMultimodalReview(req);
      assert.equal(res.status, 'error');
      assert.ok(res.error?.includes('unsupported image format'));
    });

    test('8. Server-side handler rejects oversized files (> 4 MB)', async () => {
      const req: MultimodalReviewRequest = {
        imageBase64: validBase64,
        mimeType: 'image/png',
        fileName: 'oversized.png',
        fileSizeBytes: 5 * 1024 * 1024,
        brandProfile: sampleProfile,
        brandRules: [sampleVisualRule]
      };

      const res = await handleMultimodalReview(req);
      assert.equal(res.status, 'error');
      assert.ok(res.error?.includes('rejected oversized creative'));
    });

    test('9. Server-side handler rejects empty image data', async () => {
      const req: MultimodalReviewRequest = {
        imageBase64: '',
        mimeType: 'image/png',
        fileName: 'empty.png',
        fileSizeBytes: 1024,
        brandProfile: sampleProfile
      };

      const res = await handleMultimodalReview(req);
      assert.equal(res.status, 'error');
      assert.ok(res.error?.includes('payload is missing or empty'));
    });

    test('10. Reports honest "unavailable" status when no AI credentials are configured', async () => {
      const req: MultimodalReviewRequest = {
        imageBase64: validBase64,
        mimeType: 'image/png',
        fileName: 'sample.png',
        fileSizeBytes: 1024,
        altText: '',
        brandProfile: sampleProfile,
        brandRules: [sampleVisualRule]
      };

      const res = await handleMultimodalReview(req, {
        openaiApiKey: '',
        geminiApiKey: ''
      });

      assert.equal(res.status, 'unavailable');
      assert.ok(res.error?.includes('No AI provider credentials configured'));
      // Deterministic missing alt-text finding is included even in unavailable mode
      assert.equal(res.visualFindings.length, 1);
      assert.ok(res.visualFindings[0].description.includes('No alt-text provided by author'));
    });
  });

  describe('Structured Findings & Observable Evidence Schema', () => {
    test('11. Distinguishes observable evidence from uncertain visual judgments', () => {
      const rawLlmFindings = [
        {
          id: 'vis_test_1',
          category: 'Logo & Visual Identity',
          severity: 'High',
          title: 'Logo Clearance Zone Infringed',
          description: 'Headline typography encroaches into the designated logo clear space.',
          observableEvidence: 'Top edge of headline text "Accelerate Growth" is located 4px below the BrandGuard emblem base.',
          isUncertain: false,
          confidence: 'High',
          suggestedRemedy: 'Increase vertical padding between logo emblem and headline to at least 24px.',
          relatedRuleId: 'rule-visual-logo-01',
          relatedRuleTitle: 'Logo Isolation & Minimum Clear Space'
        },
        {
          id: 'vis_test_2',
          category: 'Colors & Typography',
          severity: 'Low',
          title: 'Potential Unregistered Accent Green',
          description: 'The green hue in the background graphic may differ from the brand neon token.',
          observableEvidence: 'Background contains a radial gradient ranging from dark teal to yellowish green.',
          isUncertain: true,
          confidence: 'Uncertain',
          suggestedRemedy: 'Verify color hex values against the approved digital palette in design tokens.',
          relatedRuleId: 'rule-nonexistent',
          relatedRuleTitle: null
        }
      ];

      const formatted = validateAndFormatVisualFindings(rawLlmFindings, [sampleVisualRule]);
      assert.equal(formatted.length, 2);

      // Verified observable finding
      assert.equal(formatted[0].isUncertain, false);
      assert.equal(formatted[0].confidence, 'High');
      assert.equal(formatted[0].hasVerifiedPolicyEvidence, true);
      assert.equal(formatted[0].relatedRuleId, 'rule-visual-logo-01');
      assert.ok(formatted[0].citationLabel.includes('Logo Isolation'));

      // Uncertain finding
      assert.equal(formatted[1].isUncertain, true);
      assert.equal(formatted[1].confidence, 'Uncertain');
      assert.equal(formatted[1].hasVerifiedPolicyEvidence, false);
      assert.ok(formatted[1].citationLabel.includes('Uncertain Visual Assessment'));
    });

    test('12. Multimodal system prompt strictly instructs model not to fabricate rules', () => {
      const prompt = buildMultimodalSystemPrompt();
      assert.ok(prompt.includes('STRICT EVIDENCE DISTINCTION'));
      assert.ok(prompt.includes('observableEvidence'));
      assert.ok(prompt.includes('NEVER fabricate brand rules'));
      assert.ok(prompt.includes('UNTRUSTED DATA'));
    });

    test('13. Multimodal user prompt includes author alt-text and configured visual rules', () => {
      const prompt = buildMultimodalUserPrompt(
        'hero-campaign.png',
        'Company executives reviewing analytics dashboard',
        sampleProfile,
        [sampleVisualRule],
        'Product Landing Page'
      );

      assert.ok(prompt.includes('hero-campaign.png'));
      assert.ok(prompt.includes('Company executives reviewing analytics dashboard'));
      assert.ok(prompt.includes('Logo Isolation & Minimum Clear Space'));
      assert.ok(prompt.includes('BrandGuard AI'));
    });
  });

  describe('Regression - Text-Only Review Workflow Remains Fully Intact', () => {
    test('14. Draft review without image attachment continues to run deterministic rule checks cleanly', () => {
      const draft = 'BrandGuard AI is the most trusted and fastest platform, guaranteeing 100% immunity from brand disasters.';
      const claimsRule: BrandRule = {
        id: 'rule-claims-01',
        brandId: 'brand_test_01',
        title: 'Unsupported Marketing Claims',
        category: 'Claims & Restrictions',
        severity: 'Critical',
        description: 'Absolute claims (e.g. "most trusted", "fastest", "100% immunity") must cite third-party audit benchmarks.',
        exampleViolation: '100% immunity',
        enabled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      };

      const result = evaluateDraft(draft, [claimsRule]);
      assert.equal(result.isCompliant, false);
      assert.ok(result.findings.length > 0);
      assert.ok(result.score < 100);
      assert.equal(result.checkedRulesCount, 1);
    });
  });
});
