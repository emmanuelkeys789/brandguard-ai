import type { ReviewItem, BrandRule, CarouselSlide, WorkflowStage, MetricItem } from '../types';

export const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: 'brand-intelligence',
    badge: '01 / CORE INGESTION',
    title: 'Brand Intelligence',
    tagline: 'Translates brand bibles into active real-time guardrails.',
    description:
      'BrandGuard continuously ingests brand positioning, tone-of-voice playbooks, verified facts, and legal disclosures. It parses organizational nuance into computable governance policies that watch every sentence as it is written.',
    keyPoints: [
      'Multi-modal guideline parsing (tone, claims, trademarks, and syntax)',
      'Deterministic rule enforcement paired with contextual LLM reasoning',
      'Dynamic versioning synchronized with corporate brand refreshes'
    ],
    mockCard: {
      title: 'Guideline Synthesizer v4.1',
      status: 'Active Synchronization',
      highlight: 'Rule §4.8 Applied: Prohibit unqualified global superlatives',
      pill: '99.4% Policy Alignment',
      stats: [
        { label: 'Active Rules', val: '142 rules' },
        { label: 'Tone Vector', val: 'Direct & Empathetic' },
        { label: 'Latency', val: '18ms' }
      ]
    }
  },
  {
    id: 'evidence-review',
    badge: '02 / FORENSIC VERIFICATION',
    title: 'Evidence-Backed Review',
    tagline: 'Every claim has a source. Every correction has a reason.',
    description:
      'Unlike generic grammar checkers, BrandGuard audits factual claims and product statements against your verified knowledge repository. If an unverified assertion is detected, the exact clause and missing citation are highlighted.',
    keyPoints: [
      'Sentence-level citation mapping against verified corporate sources',
      'Categorized risk ratings: Critical, Warning, or Stylistic Drift',
      'Transparent reasoning trace with line-by-line guideline citations'
    ],
    mockCard: {
      title: 'Evidence Trace Engine',
      status: 'Claim Analysis Complete',
      highlight: 'Flagged: "The fastest enterprise deployment on Earth"',
      pill: 'Requires Third-Party Audit',
      stats: [
        { label: 'Unverified Claims', val: '1 Detected' },
        { label: 'Source Match', val: 'No audit record' },
        { label: 'Suggested Edit', val: 'Provided' }
      ]
    }
  },
  {
    id: 'human-approval',
    badge: '03 / GOVERNANCE SIGN-OFF',
    title: 'Human-in-the-Loop Approval',
    tagline: 'Empowering editorial teams, never overriding human judgment.',
    description:
      'BrandGuard recommends intelligent, brand-compliant rewrites while leaving full control in the hands of marketing leads and legal reviewers. One-click acceptance, inline adjustments, and auditable sign-off chains ensure zero friction.',
    keyPoints: [
      'Side-by-side revision diffs with 1-click replacement',
      'Comprehensive sign-off audit trail and review history',
      'Collaborative annotations for cross-functional marketing teams'
    ],
    mockCard: {
      title: 'Pre-Publication Gatekeeper',
      status: 'Ready for Reviewer Sign-Off',
      highlight: 'Editorial review approved by S. Chen (Head of Brand)',
      pill: 'Compliance Signed & Verified',
      stats: [
        { label: 'Revisions Accepted', val: '3 of 3' },
        { label: 'Audit Trail', val: 'SHA-256 Logged' },
        { label: 'Publication State', val: 'Unlocked' }
      ]
    }
  }
];

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    step: '01',
    title: 'Ingest Guidelines',
    subtitle: 'Brand Rules & Knowledge Base',
    description:
      'Connect tone guidelines, product factsheets, trademark rules, and legal constraints into a unified, version-controlled knowledge graph.',
    tag: 'Configuration',
    deliverable: 'Active Policy Engine'
  },
  {
    step: '02',
    title: 'Submit Content',
    subtitle: 'Pre-Publish Draft Input',
    description:
      'Paste campaign copy, sync pending press releases, or connect directly to your CMS and marketing automation pipelines before distribution.',
    tag: 'Input',
    deliverable: 'Draft Snapshot'
  },
  {
    step: '03',
    title: 'Audit & Evidence',
    subtitle: 'Sentence-Level Verification',
    description:
      'BrandGuard scans for voice drift, unbacked superlatives, prohibited terms, and missing disclosures with cited source clauses.',
    tag: 'Analysis',
    deliverable: 'Evidence Report'
  },
  {
    step: '04',
    title: 'Review & Sign-Off',
    subtitle: 'Human Governance Gate',
    description:
      'Reviewers inspect suggested edits, accept or adjust corrections with full context, and unlock verified publishing certification.',
    tag: 'Resolution',
    deliverable: 'Approved Release'
  }
];

export const RECENT_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-01',
    title: 'Spring campaign announcement',
    author: 'Elena Rostova',
    channel: 'Global PR & Newsroom',
    status: 'Needs review',
    updatedAt: '12 minutes ago',
    wordCount: 840,
    issuesCount: 3,
    confidenceScore: 82,
    summary: 'Detected 2 unverified superlatives and 1 deprecated product name.'
  },
  {
    id: 'rev-02',
    title: 'Product landing page (v2.4 refresh)',
    author: 'Marcus Vance',
    channel: 'Marketing Website',
    status: 'In review',
    updatedAt: '2 hours ago',
    wordCount: 1420,
    issuesCount: 1,
    confidenceScore: 94,
    summary: 'Single phrasing variance regarding enterprise SLA guarantees.'
  },
  {
    id: 'rev-03',
    title: 'Customer newsletter Q2',
    author: 'Aria Takahashi',
    channel: 'Email Distribution',
    status: 'Approved',
    updatedAt: 'Yesterday',
    wordCount: 650,
    issuesCount: 0,
    confidenceScore: 99,
    summary: 'Full compliance verified against Q2 messaging framework.'
  },
  {
    id: 'rev-04',
    title: 'Partner press release: AI Cloud',
    author: 'David O’Connor',
    channel: 'Joint Syndicate',
    status: 'Rejected',
    updatedAt: '2 days ago',
    wordCount: 1100,
    issuesCount: 5,
    confidenceScore: 68,
    summary: 'Partner logo trademark violations and unreleased feature claims.'
  },
  {
    id: 'rev-05',
    title: 'Executive LinkedIn post (CEO vision)',
    author: 'Kavita Menon',
    channel: 'Executive Comms',
    status: 'Approved',
    updatedAt: '3 days ago',
    wordCount: 380,
    issuesCount: 0,
    confidenceScore: 98,
    summary: 'Thought leadership copy verified with legal team approval.'
  }
];

export const BRAND_RULES: BrandRule[] = [
  {
    id: 'rule-01',
    brandId: 'brand-axiom-01',
    code: '§4.2',
    title: 'Superlative Claim Substantiation',
    category: 'Claims & Evidence',
    severity: 'Critical',
    description:
      'Absolute claims (e.g. "most trusted", "fastest", "first in market") must cite an audited third-party benchmark with explicit year and methodology.',
    exampleViolation: '"BrandGuard is the undisputed #1 brand platform in the world."',
    remedyRecommendation: 'Replace with specific, verifiable metrics such as customer volume or benchmark results.',
    sourceDocument: 'Corporate Legal Policy 2026-B',
    enabled: true,
    isActive: true,
    createdAt: '2026-04-01T12:00:00.000Z',
    updatedAt: '2026-10-22T08:00:00.000Z'
  },
  {
    id: 'rule-02',
    brandId: 'brand-axiom-01',
    code: '§2.1',
    title: 'Brand Nomenclature & Trademark Symbols',
    category: 'Legal & Trademarks',
    severity: 'Warning',
    description:
      'The company name must always appear in camel-case "BrandGuard™" upon first mention in headlines or formal press announcements.',
    exampleViolation: '"brandguard is expanding to new regions."',
    remedyRecommendation: 'Format as "BrandGuard™" on first occurrence, followed by "BrandGuard" thereafter.',
    sourceDocument: 'Brand Identity Standards v3.0',
    enabled: true,
    isActive: true,
    createdAt: '2026-04-02T14:30:00.000Z',
    updatedAt: '2026-10-22T08:00:00.000Z'
  },
  {
    id: 'rule-03',
    brandId: 'brand-axiom-01',
    code: '§3.5',
    title: 'Prohibited Hyperbolic Jargon',
    category: 'Tone of Voice',
    severity: 'Advisory',
    description:
      'Avoid hollow tech cliches including "revolutionary", "game-changing", "next-gen magic", and "paradigm shift". Maintain precise, confident, and direct language.',
    exampleViolation: '"Our revolutionary AI creates magical brand synergies."',
    remedyRecommendation: 'Use concrete action verbs and measurable outcomes.',
    sourceDocument: 'Editorial Tone Guide',
    enabled: true,
    isActive: true,
    createdAt: '2026-04-05T10:15:00.000Z',
    updatedAt: '2026-10-22T08:00:00.000Z'
  },
  {
    id: 'rule-04',
    brandId: 'brand-axiom-01',
    code: '§5.3',
    title: 'Data Privacy & Security Assurances',
    category: 'Claims & Evidence',
    severity: 'Critical',
    description:
      'Statements regarding data isolation and model training must specify that customer drafts are never ingested into public models.',
    exampleViolation: '"Your data is completely safe in the cloud."',
    remedyRecommendation: 'Cite exact zero-data-retention architecture clause.',
    sourceDocument: 'Information Security Whitepaper',
    enabled: true,
    isActive: true,
    createdAt: '2026-05-12T11:00:00.000Z',
    updatedAt: '2026-10-22T08:00:00.000Z'
  }
];

export const OVERVIEW_METRICS: MetricItem[] = [
  {
    label: 'Total Reviews',
    value: '148',
    change: '+14% this month',
    isPositive: true,
    subtext: 'across 6 publishing channels'
  },
  {
    label: 'Active Issues Found',
    value: '23',
    change: '-18% drift reduction',
    isPositive: true,
    subtext: 'caught before publication'
  },
  {
    label: 'Pending Approvals',
    value: '7',
    change: '3 urgent priority',
    isPositive: false,
    subtext: 'awaiting editorial sign-off'
  },
  {
    label: 'Brand Integrity Score',
    value: '94.2%',
    change: '+3.8 pts vs last quarter',
    isPositive: true,
    subtext: 'organizational alignment rate'
  }
];

export const SAMPLE_DRAFTS = {
  unverified: {
    title: 'Global Spring 2026 Announcement Draft',
    channel: 'Press Release',
    text: `BrandGuard AI is unquestionably the most trusted and fastest brand governance platform in the world today. Our revolutionary magic algorithm guarantees 100% immunity from PR disasters for every enterprise on Earth. With zero effort, brandguard instantly fixes any communication problem while outperforming all traditional marketing agencies combined.`
  },
  compliant: {
    title: 'Enterprise Brand Governance Overview Draft',
    channel: 'Product Overview',
    text: `BrandGuard™ helps cross-functional marketing and legal teams review public-facing copy prior to release. By auditing draft statements against your verified knowledge repository and established brand guidelines, the system surfaces missing citations, terminology variances, and unsupported superlatives. Reviewers retain complete editorial authority with full audit traceability.`
  }
};
