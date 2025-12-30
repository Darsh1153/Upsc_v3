// Script to create an admin user for the admin panel
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!');
  console.error('Make sure .env.local exists with:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    // Get email and password from command line arguments or use defaults
    const email = process.argv[2] || 'admin@upscprep.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Admin User';

    console.log('Creating admin user...\n');
    console.log('Debug: Supabase URL configured:', supabaseUrl ? 'Yes' : 'No');
    console.log('Debug: Service role key configured:', supabaseServiceKey ? 'Yes' : 'No');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Password:', '*'.repeat(password.length));
    console.log('');

    // Create the user with admin privileges
    console.log('Debug: Attempting to create user via Supabase admin API...');
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email so they can login immediately
      user_metadata: {
        name: name,
        role: 'admin'
      }
    });

    if (error) {
      // Check if user already exists
      if (error.message && (error.message.includes('already registered') || error.message.includes('already exists') || error.message.includes('User already registered'))) {
        console.log('⚠️  User with this email already exists!');
        console.log('\nTo update the password, you can:');
        console.log('1. Use Supabase Dashboard to reset it');
        console.log('2. Or delete the user and run this script again');
        console.log('\nYou can still login with the existing credentials.');
        process.exit(0);
      }
      console.error('❌ Error creating user:', error.message);
      process.exit(1);
    }

    if (data && data.user) {
      console.log('Debug: User creation successful, user ID:', data.user.id);
      console.log('✅ Admin user created successfully!\n');
      console.log('User Details:');
      console.log('  ID:', data.user.id);
      console.log('  Email:', data.user.email);
      console.log('  Name:', data.user.user_metadata?.name || name);
      console.log('  Role:', data.user.user_metadata?.role || 'admin');
      console.log('  Email Confirmed: Yes\n');
      console.log('📝 Login Credentials:');
      console.log('  Email:', email);
      console.log('  Password:', password);
      console.log('\n🚀 You can now login at: http://localhost:3000');
      console.log('⚠️  Remember to change the password after first login!');
    } else {
      console.error('❌ Failed to create user: No user data returned');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Run the script
createAdminUser();

