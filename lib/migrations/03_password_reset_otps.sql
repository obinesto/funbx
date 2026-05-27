CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS password_reset_otps_email_idx
ON public.password_reset_otps(email);

CREATE INDEX IF NOT EXISTS password_reset_otps_expires_at_idx
ON public.password_reset_otps(expires_at);

ALTER TABLE public.password_reset_otps DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role password reset otp access" ON public.password_reset_otps;

CREATE POLICY "Service role password reset otp access"
ON public.password_reset_otps
FOR ALL
TO public
USING (true)
WITH CHECK (true);
