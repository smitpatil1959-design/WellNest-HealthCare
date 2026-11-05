import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
export async function createTestDatabase(){
  const pg=new PGlite();
  await pg.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text,phone text,email_confirmed_at timestamptz,phone_confirmed_at timestamptz,raw_user_meta_data jsonb DEFAULT '{}',raw_app_meta_data jsonb DEFAULT '{}',factors jsonb DEFAULT '[]',created_at timestamptz DEFAULT now());
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
  await pg.exec(`CREATE TABLE auth.mfa_factors(id uuid DEFAULT gen_random_uuid(),user_id uuid,status text);CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;GRANT USAGE ON SCHEMA auth TO authenticated;`);
  for(const file of (await readdir('supabase/migrations')).filter(file=>file.endsWith('.sql')).sort())await pg.exec(await readFile('supabase/migrations/'+file,'utf8'));
  return pg;
}
