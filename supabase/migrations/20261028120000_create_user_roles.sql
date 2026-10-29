-- ========================================================================
-- Migration: 20261028120000_create_user_roles.sql
-- Description: Create public.user_roles table with strict RLS for authoritative server-side role resolution
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Reviewer', 'Editor')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: Authenticated users can read ONLY their own assigned role
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Management Policy: ONLY trusted server-side administration (service_role) can insert, update, or delete roles.
-- Standard authenticated and anonymous clients are strictly denied write access.
-- This guarantees that users can NEVER assign, promote, or modify their own roles.
CREATE POLICY "Service role manages user roles"
  ON public.user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for efficient lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
