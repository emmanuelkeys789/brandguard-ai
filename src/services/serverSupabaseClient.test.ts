import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getServerSupabaseConfig,
  getServerSupabaseClient,
  verifyServerAuth,
  fetchAuthoritativeUserRole,
  fetchAuthoritativeReview,
  type AuthoritativeReview
} from './serverSupabaseClient.ts';

const validEnv = {
  SUPABASE_URL: 'https://xyzcompany.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-secret-key-12345'
};

// Mock valid 3-segment JWT
const sampleValidJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfZXhhbXBsZV8xIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQifQ.signature-segment';

describe('Server-Side Supabase Client Foundation Tests', () => {
  describe('1. Server-Only Configuration & Secret Protection', () => {
    it('reports unconfigured when SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      const config1 = getServerSupabaseConfig({});
      assert.equal(config1.configured, false);
      assert.match(config1.error || '', /Supabase server configuration is missing/i);

      const config2 = getServerSupabaseConfig({
        SUPABASE_URL: 'https://xyzcompany.supabase.co'
      });
      assert.equal(config2.configured, false);
      assert.match(config2.error || '', /SUPABASE_SERVICE_ROLE_KEY must be set/i);
    });

    it('strictly rejects dangerous VITE-prefixed service-role keys', () => {
      const config = getServerSupabaseConfig({
        ...validEnv,
        VITE_SUPABASE_SERVICE_ROLE_KEY: 'leaked-service-key-in-client'
      });

      assert.equal(config.configured, false);
      assert.match(config.error || '', /Security violation: VITE_SUPABASE_SERVICE_ROLE_KEY detected/i);
    });

    it('never leaks secret service-role key in error messages', () => {
      const config = getServerSupabaseConfig({
        SUPABASE_URL: 'invalid-url',
        SUPABASE_SERVICE_ROLE_KEY: 'super-sensitive-secret-key-xyz'
      });

      assert.equal(config.configured, false);
      assert.equal((config.error || '').includes('super-sensitive-secret-key-xyz'), false);
    });

    it('initializes configuration successfully when valid server env is supplied', () => {
      const config = getServerSupabaseConfig(validEnv);
      assert.equal(config.configured, true);
      assert.equal(config.url, validEnv.SUPABASE_URL);
      assert.equal(config.serviceRoleKey, validEnv.SUPABASE_SERVICE_ROLE_KEY);
    });

    it('getServerSupabaseClient fails closed when unconfigured', () => {
      const { client, error } = getServerSupabaseClient({ envOverrides: {} });
      assert.equal(client, null);
      assert.match(error || '', /missing/i);
    });
  });

  describe('2. Authentication Helper (verifyServerAuth)', () => {
    it('rejects missing or empty token', async () => {
      const res1 = await verifyServerAuth('');
      assert.equal(res1.success, false);
      assert.match(res1.error || '', /Missing authentication token/i);

      const res2 = await verifyServerAuth(null as any);
      assert.equal(res2.success, false);
      assert.match(res2.error || '', /Missing authentication token/i);
    });

    it('rejects malformed token not conforming to 3-segment JWT structure', async () => {
      const res1 = await verifyServerAuth('invalid_token');
      assert.equal(res1.success, false);
      assert.match(res1.error || '', /Malformed authentication token/i);

      const res2 = await verifyServerAuth('part1.part2');
      assert.equal(res2.success, false);
      assert.match(res2.error || '', /must contain exactly 3 segments/i);
    });

    it('fails closed when Supabase server client is not configured', async () => {
      const res = await verifyServerAuth(sampleValidJwt, { envOverrides: {} });
      assert.equal(res.success, false);
      assert.match(res.error || '', /configuration is missing/i);
    });

    it('successfully validates authentic token and returns verified identity', async () => {
      let passedToken = '';
      const mockSupabase = {
        auth: {
          getUser: async (token: string) => {
            passedToken = token;
            return {
              data: {
                user: {
                  id: 'usr_uuid_109283',
                  email: 'elena.rostova@axiom-governance.internal',
                  app_metadata: { provider: 'email' },
                  user_metadata: { fullName: 'Elena Rostova' }
                }
              },
              error: null
            };
          }
        }
      };

      const res = await verifyServerAuth(`Bearer ${sampleValidJwt}`, {
        supabaseClient: mockSupabase
      });

      assert.equal(res.success, true);
      assert.equal(passedToken, sampleValidJwt); // confirms 'Bearer ' prefix was stripped
      assert.equal(res.user?.userId, 'usr_uuid_109283');
      assert.equal(res.user?.email, 'elena.rostova@axiom-governance.internal');
      assert.equal(res.user?.appMetadata?.provider, 'email');
    });

    it('handles expired or invalid token rejected by Supabase Auth service', async () => {
      const mockSupabase = {
        auth: {
          getUser: async () => ({
            data: { user: null },
            error: { message: 'JWT expired: token has expired at 2026-10-28T00:00:00Z' }
          })
        }
      };

      const res = await verifyServerAuth(sampleValidJwt, {
        supabaseClient: mockSupabase
      });

      assert.equal(res.success, false);
      assert.match(res.error || '', /JWT expired/i);
      assert.equal(res.user, undefined);
    });

    it('handles unexpected network failure during auth verification safely', async () => {
      const mockSupabase = {
        auth: {
          getUser: async () => {
            throw new Error('Supabase Auth server connection timeout');
          }
        }
      };

      const res = await verifyServerAuth(sampleValidJwt, {
        supabaseClient: mockSupabase
      });

      assert.equal(res.success, false);
      assert.match(res.error || '', /connection timeout/i);
    });
  });

  describe('3. Authoritative Review Lookup (fetchAuthoritativeReview)', () => {
    it('rejects missing or empty reviewId with status 400', async () => {
      const res1 = await fetchAuthoritativeReview('');
      assert.equal(res1.success, false);
      assert.equal(res1.statusCode, 400);

      const res2 = await fetchAuthoritativeReview('   ');
      assert.equal(res2.success, false);
      assert.equal(res2.statusCode, 400);
    });

    it('fails closed with status 503 when Supabase server is unconfigured', async () => {
      const res = await fetchAuthoritativeReview('rev_123', { envOverrides: {} });
      assert.equal(res.success, false);
      assert.equal(res.statusCode, 503);
      assert.match(res.error || '', /Supabase server configuration is missing/i);
    });

    it('returns status 404 when review is not found in the database', async () => {
      const mockSupabase = {
        from: (table: string) => {
          assert.equal(table, 'brand_reviews');
          return {
            select: () => ({
              eq: (_col: string, val: string) => {
                assert.equal(val, 'rev_nonexistent');
                return {
                  maybeSingle: async () => ({ data: null, error: null })
                };
              }
            })
          };
        }
      };

      const res = await fetchAuthoritativeReview('rev_nonexistent', {
        supabaseClient: mockSupabase
      });

      assert.equal(res.success, false);
      assert.equal(res.statusCode, 404);
      assert.match(res.error || '', /was not found in the authoritative database/i);
    });

    it('returns status 500 when database query encounters an error', async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: null,
                error: { message: 'Connection terminated unexpectedly' }
              })
            })
          })
        })
      };

      const res = await fetchAuthoritativeReview('rev_err', {
        supabaseClient: mockSupabase
      });

      assert.equal(res.success, false);
      assert.equal(res.statusCode, 500);
      assert.match(res.error || '', /Connection terminated unexpectedly/i);
    });

    it('successfully fetches and maps real columns strictly from supabase/schema.sql', async () => {
      const mockDbRow = {
        id: 'rev_spring_01',
        brand_id: 'brand_axiom_01',
        title: 'Spring Campaign Announcement Draft',
        author: 'Marcus Vance',
        channel: 'Press Release',
        status: 'Approved',
        current_draft: 'BrandGuard AI delivers enterprise compliance automation across content channels.',
        original_draft: 'BrandGuard AI guarantees 100% immunity.',
        reviewed_by: 'Elena Rostova',
        decision_at: '2026-10-28T12:00:00.000Z',
        reviewer_comment: 'Approved with third-party citations verified.',
        confidence_score: 95,
        issues_count: 0,
        word_count: 55,
        rules_checked_count: 12,
        decision_history: [
          {
            id: 'dec_1',
            action: 'Approve',
            reviewerName: 'Elena Rostova',
            timestamp: '2026-10-28T12:00:00.000Z',
            previousStatus: 'Needs review',
            newStatus: 'Approved'
          }
        ],
        revisions: [],
        created_at: '2026-10-28T10:00:00.000Z',
        updated_at: '2026-10-28T12:00:00.000Z'
      };

      const mockSupabase = {
        from: (table: string) => {
          assert.equal(table, 'brand_reviews');
          return {
            select: (cols: string) => {
              assert.equal(cols, '*');
              return {
                eq: (col: string, val: string) => {
                  assert.equal(col, 'id');
                  assert.equal(val, 'rev_spring_01');
                  return {
                    maybeSingle: async () => ({ data: mockDbRow, error: null })
                  };
                }
              };
            }
          };
        }
      };

      const res = await fetchAuthoritativeReview('rev_spring_01', {
        supabaseClient: mockSupabase
      });

      assert.equal(res.success, true);
      const rev = res.review as AuthoritativeReview;
      assert.equal(rev.id, 'rev_spring_01');
      assert.equal(rev.status, 'Approved');
      assert.equal(rev.currentDraft, 'BrandGuard AI delivers enterprise compliance automation across content channels.');
      assert.equal(rev.reviewedBy, 'Elena Rostova');
      assert.equal(rev.decisionAt, '2026-10-28T12:00:00.000Z');
      assert.equal(rev.confidenceScore, 95);
      assert.equal(rev.issuesCount, 0);
      assert.equal(rev.decisionHistory?.length, 1);
      assert.equal(rev.decisionHistory?.[0].action, 'Approve');
    });
  });

  describe('4. Authoritative Role Resolution (fetchAuthoritativeUserRole)', () => {
    it('rejects missing or empty userId with status 400', async () => {
      const res1 = await fetchAuthoritativeUserRole('');
      assert.equal(res1.success, false);
      assert.equal(res1.statusCode, 400);

      const res2 = await fetchAuthoritativeUserRole('   ');
      assert.equal(res2.success, false);
      assert.equal(res2.statusCode, 400);

      const res3 = await fetchAuthoritativeUserRole(null as any);
      assert.equal(res3.success, false);
      assert.equal(res3.statusCode, 400);
    });

    it('fails closed with status 503 when Supabase server is unconfigured', async () => {
      const res = await fetchAuthoritativeUserRole('usr_123', { envOverrides: {} });
      assert.equal(res.success, false);
      assert.equal(res.statusCode, 503);
      assert.match(res.error || '', /Supabase server configuration is missing/i);
    });

    it('fails closed with status 403 when user has no assigned role in user_roles', async () => {
      const mockSupabase = {
        from: (table: string) => {
          assert.equal(table, 'user_roles');
          return {
            select: () => ({
              eq: (_col: string, val: string) => {
                assert.equal(val, 'usr_no_role');
                return {
                  maybeSingle: async () => ({ data: null, error: null })
                };
              }
            })
          };
        }
      };

      const res = await fetchAuthoritativeUserRole('usr_no_role', {
        supabaseClient: mockSupabase
      });

      assert.equal(res.success, false);
      assert.equal(res.statusCode, 403);
      assert.match(res.error || '', /No role assigned for user/i);
    });

    it('fails closed with status 403 when user_roles contains an invalid role', async () => {
      const mockSupabase = {
        from: (table: string) => {
          assert.equal(table, 'user_roles');
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { role: 'SuperAdmin' },
                  error: null
                })
              })
            })
          };
        }
      };

      const res = await fetchAuthoritativeUserRole('usr_invalid_role', {
        supabaseClient: mockSupabase
      });

      assert.equal(res.success, false);
      assert.equal(res.statusCode, 403);
      assert.match(res.error || '', /Invalid role "SuperAdmin"/i);
    });

    it('returns status 500 when database query encounters an error (e.g. missing table)', async () => {
      const mockSupabase = {
        from: (table: string) => {
          assert.equal(table, 'user_roles');
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: null,
                  error: { message: 'relation "public.user_roles" does not exist' }
                })
              })
            })
          };
        }
      };

      const res = await fetchAuthoritativeUserRole('usr_err', {
        supabaseClient: mockSupabase
      });

      assert.equal(res.success, false);
      assert.equal(res.statusCode, 500);
      assert.match(res.error || '', /relation "public.user_roles" does not exist/i);
    });

    it('successfully resolves Admin, Reviewer, and Editor roles', async () => {
      const roles: ('Admin' | 'Reviewer' | 'Editor')[] = ['Admin', 'Reviewer', 'Editor'];

      for (const expectedRole of roles) {
        const mockSupabase = {
          from: (table: string) => {
            assert.equal(table, 'user_roles');
            return {
              select: (cols: string) => {
                assert.equal(cols, 'role');
                return {
                  eq: (col: string, val: string) => {
                    assert.equal(col, 'user_id');
                    assert.equal(val, `usr_${expectedRole.toLowerCase()}`);
                    return {
                      maybeSingle: async () => ({
                        data: { role: expectedRole },
                        error: null
                      })
                    };
                  }
                };
              }
            };
          }
        };

        const res = await fetchAuthoritativeUserRole(`usr_${expectedRole.toLowerCase()}`, {
          supabaseClient: mockSupabase
        });

        assert.equal(res.success, true);
        assert.equal(res.role, expectedRole);
      }
    });
  });
});
