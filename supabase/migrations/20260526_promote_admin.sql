-- ============================================================================
-- PROMOTE A USER TO ADMIN
-- ============================================================================
-- After you create your auth account in Supabase Dashboard → Authentication,
-- run this in the SQL Editor with YOUR email.
-- ============================================================================

update public.users
set role = 'admin'
where email = 'learningchateau@gmail.com';   -- <-- change to your email

-- Verify it worked:
select id, email, role, created_at
from public.users
where email = 'learningchateau@gmail.com';
