import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDraft } from './ruleEngine.ts';
import type { BrandRule } from '../types/index.ts';

describe('Deterministic Rule Engine Tests', () => {
  const baseClaimsRule: BrandRule = {
    id: 'rule-claims-01',
    brandId: 'brand-01',
    title: 'Unsupported Marketing Claims',
    category: 'Claims & Restrictions',
    severity: 'Critical',
    description:
      'Absolute claims and unsubstantiated superlatives (e.g. "most trusted", "fastest", "first in market", "100% immunity", "outperforming all") must not be made without citing registered third-party audit benchmarks.',
    example: '"BrandGuard AI is the most trusted and fastest brand platform, guaranteeing 100% immunity."',
    exampleViolation: '"guarantees 100% immunity from PR disasters"',
    remedyRecommendation: 'Replace with specific, verifiable performance metrics and cite audited third-party benchmarks.',
    enabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  const prohibitedTermsRule: BrandRule = {
    id: 'rule-prohibited-01',
    brandId: 'brand-01',
    title: 'Prohibited Jargon',
    category: 'Prohibited Terms',
    severity: 'High',
    description: 'Avoid hollow tech cliches including "revolutionary", "game-changing", and "next-gen magic".',
    exampleViolation: '"Our revolutionary AI creates magic."',
    remedyRecommendation: 'Use concrete action verbs and measurable outcomes.',
    enabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  const requiredTermsRule: BrandRule = {
    id: 'rule-required-01',
    brandId: 'brand-01',
    title: 'Brand Nomenclature & Trademark Symbols',
    category: 'Required Terms',
    severity: 'Warning',
    description: 'The company name must always appear as "BrandGuard™".',
    remedyRecommendation: 'Format as "BrandGuard™".',
    enabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  // Test 1: A configured prohibited claim is detected
  test('1. Configured prohibited claim is detected', () => {
    const draft = 'Our enterprise platform is the most trusted solution and guarantees 100% immunity.';
    const result = evaluateDraft(draft, [baseClaimsRule]);

    assert.equal(result.isCompliant, false);
    assert.ok(result.findings.length >= 2, 'Should flag "most trusted" and "100% immunity"');

    const matchedTexts = result.findings.map((f) => f.matchedText?.toLowerCase());
    assert.ok(matchedTexts.includes('most trusted'));
    assert.ok(matchedTexts.includes('100% immunity'));
  });

  // Test 2: A compliant draft produces no findings
  test('2. A compliant draft produces no findings', () => {
    const compliantDraft =
      'BrandGuard™ helps marketing and legal teams review public-facing copy prior to distribution. Certified SOC 2 compliant.';
    const result = evaluateDraft(compliantDraft, [baseClaimsRule, prohibitedTermsRule, requiredTermsRule]);

    assert.equal(result.isCompliant, true);
    assert.equal(result.findings.length, 0);
    assert.equal(result.score, 100);
    assert.equal(result.checkedRulesCount, 3);
  });

  // Test 3: A rule that is disabled is not checked
  test('3. A rule that is disabled is not checked', () => {
    const disabledRule: BrandRule = {
      ...prohibitedTermsRule,
      id: 'rule-prohibited-disabled',
      enabled: false,
      isActive: false
    };

    const draftWithJargon = 'This revolutionary feature changes everything.';
    const result = evaluateDraft(draftWithJargon, [disabledRule]);

    assert.equal(result.findings.length, 0);
    assert.equal(result.checkedRulesCount, 0);
    assert.equal(result.rulesEvaluated[0].status, 'skipped');
  });

  // Test 4: Editing a saved rule changes subsequent results
  test('4. Editing a saved rule changes subsequent results', () => {
    const draft = 'Our automated tool streamlines team workflows efficiently.';

    // Initial rule does not prohibit "streamlines"
    const initialRule: BrandRule = {
      id: 'rule-custom-terms',
      brandId: 'brand-01',
      title: 'Restricted Verbs',
      category: 'Prohibited Terms',
      severity: 'Medium',
      description: 'Do not use "magic" or "disrupt".',
      enabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };

    const firstResult = evaluateDraft(draft, [initialRule]);
    assert.equal(firstResult.findings.length, 0, 'Initially draft should pass');

    // Edited rule now prohibits "streamlines"
    const editedRule: BrandRule = {
      ...initialRule,
      description: 'Do not use "magic", "disrupt", or "streamlines".',
      updatedAt: '2026-01-02T00:00:00.000Z'
    };

    const secondResult = evaluateDraft(draft, [editedRule]);
    assert.equal(secondResult.findings.length, 1, 'Edited rule should detect "streamlines"');
    assert.equal(secondResult.findings[0].matchedText?.toLowerCase(), 'streamlines');
  });

  // Test 5: Findings reference the correct saved rule ID
  test('5. Findings reference the correct saved rule ID', () => {
    const customId = 'rule-unique-uuid-9876';
    const ruleWithSpecificId: BrandRule = {
      ...prohibitedTermsRule,
      id: customId
    };

    const draft = 'We have built a revolutionary approach.';
    const result = evaluateDraft(draft, [ruleWithSpecificId]);

    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].ruleId, customId);
    assert.equal(result.findings[0].ruleTitle, 'Prohibited Jargon');
    assert.equal(result.findings[0].ruleCategory, 'Prohibited Terms');
  });

  // Test 6: Punctuation and letter casing do not bypass appropriate matching
  test('6. Punctuation and letter casing do not bypass appropriate matching', () => {
    // Uppercase with exclamation mark
    const draftUppercase = 'This is REVOLUTIONARY!';
    const result1 = evaluateDraft(draftUppercase, [prohibitedTermsRule]);
    assert.equal(result1.findings.length, 1);
    assert.equal(result1.findings[0].matchedText, 'REVOLUTIONARY');

    // In quotes and with comma
    const draftPunctuation = 'They claimed it was "revolutionary", but evidence was lacking.';
    const result2 = evaluateDraft(draftPunctuation, [prohibitedTermsRule]);
    assert.equal(result2.findings.length, 1);
    assert.equal(result2.findings[0].matchedText, 'revolutionary');

    // Word boundary: "evolutionary" should NOT match "revolutionary"
    const draftUnrelatedWord = 'We study evolutionary biology.';
    const result3 = evaluateDraft(draftUnrelatedWord, [prohibitedTermsRule]);
    assert.equal(result3.findings.length, 0, 'Should not match substring inside another word');
  });

  // Test 7: Duplicate findings are avoided
  test('7. Duplicate findings are avoided', () => {
    // Rule having the phrase in both description and example
    const duplicateRule: BrandRule = {
      id: 'rule-fastest-dup',
      brandId: 'brand-01',
      title: 'No Fastest Claims',
      category: 'Claims & Restrictions',
      severity: 'Critical',
      description: 'Never claim to be "fastest" in marketing communications.',
      example: '"fastest deployment on Earth"',
      exampleViolation: '"fastest"',
      enabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };

    const draft = 'We offer the fastest solution.';
    const result = evaluateDraft(draft, [duplicateRule]);

    // The single word "fastest" should only produce 1 finding, not 3 duplicate findings
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].location?.startIndex, 13);
  });

  // Test 8: Empty or invalid drafts are handled safely
  test('8. Empty or invalid drafts are handled safely', () => {
    assert.doesNotThrow(() => {
      const emptyResult = evaluateDraft('', [baseClaimsRule]);
      assert.equal(emptyResult.isCompliant, true);
      assert.equal(emptyResult.findings.length, 0);
      assert.equal(emptyResult.checkedRulesCount, 0);
    });

    assert.doesNotThrow(() => {
      const whitespaceResult = evaluateDraft('     \n\t   ', [baseClaimsRule]);
      assert.equal(whitespaceResult.isCompliant, true);
      assert.equal(whitespaceResult.findings.length, 0);
    });

    assert.doesNotThrow(() => {
      // @ts-expect-error testing null safety
      const nullResult = evaluateDraft(null, [baseClaimsRule]);
      assert.equal(nullResult.isCompliant, true);
      assert.equal(nullResult.findings.length, 0);
    });
  });
});
