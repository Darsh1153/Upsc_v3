// Alternative script to create admin user via database connection
// This uses direct database connection instead of Supabase Auth API
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL in .env.local!');
  process.exit(1);
}

async function createAdminViaDatabase() {
  let sql;
  
  try {
    // Connect to database
    sql = postgres(databaseUrl);
    
    // Get email and password from command line arguments or use defaults
    const email = process.argv[2] || 'admin@upscprep.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Admin User';
    
    console.log('Creating admin user via database...\n');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Password:', '*'.repeat(password.length));
    console.log('');
    
    // Check if user already exists
    const existingUser = await sql`
      SELECT id, email FROM auth.users WHERE email = ${email}
    `;
    
    if (existingUser.length > 0) {
      console.log('⚠️  User with this email already exists!');
      console.log('User ID:', existingUser[0].id);
      console.log('\nTo update the password, use Supabase Dashboard or delete the user first.');
      process.exit(0);
    }
    
    // Generate a UUID for the user
    const userId = await sql`SELECT gen_random_uuid() as id`.then(r => r[0].id);
    
    // Hash the password using bcrypt (we'll need to use Supabase's method)
    // For now, we'll create the user structure but password hashing needs Supabase's method
    console.log('⚠️  Note: Direct database user creation requires password hashing.');
    console.log('This script cannot hash passwords directly.');
    console.log('\n📝 Please use one of these methods instead:');
    console.log('\n1. Via Supabase Dashboard (Recommended):');
    console.log('   - Go to: https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/auth/users');
    console.log('   - Click "Add user" → "Create new user"');
    console.log('   - Email:', email);
    console.log('   - Password:', password);
    console.log('   - Check "Auto Confirm User"');
    console.log('   - After creating, update user metadata:');
    console.log('     - Go to the user → Edit → User Metadata');
    console.log('     - Add: {"name": "' + name + '", "role": "admin"}');
    
    console.log('\n2. Via Supabase SQL Editor:');
    console.log('   - Go to: https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/sql');
    console.log('   - Run this SQL:');
    console.log(`
-- Create admin user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create user via Supabase Auth (this will handle password hashing)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    '${email}',
    crypt('${password}', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"${name}","role":"admin"}',
    false
  )
  RETURNING id INTO new_user_id;
  
  RAISE NOTICE 'Admin user created with ID: %', new_user_id;
END $$;
    `);
    
    await sql.end();
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (sql) await sql.end();
    process.exit(1);
  }
}

createAdminViaDatabase();



