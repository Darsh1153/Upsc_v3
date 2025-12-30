require('dotenv').config({ path: '.env.local' });

// Try using the existing working Supabase project for database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl ? supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] : null;

if (projectRef) {
  console.log('Found working Supabase project:', projectRef);
  console.log('\nTry this DATABASE_URL format:');
  console.log(`postgresql://postgres.${projectRef}:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`);
  console.log('\nOr direct connection:');
  console.log(`postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`);
  console.log('\nGet your database password from: Supabase Dashboard > Settings > Database');
} else {
  console.log('Could not extract project reference from Supabase URL');
}
