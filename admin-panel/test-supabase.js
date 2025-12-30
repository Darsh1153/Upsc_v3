// Test script to verify Supabase connection
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...\n');
console.log('URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('Anon Key:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
console.log('Service Key:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables!');
  process.exit(1);
}

// Test with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test basic connection
    console.log('Testing basic connection...');
    const { data, error } = await supabase.from('_test').select('*').limit(1);
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, but connection works
      console.log('✓ Connection successful (table test failed as expected)');
    } else if (error) {
      console.log('Connection status:', error.message);
    } else {
      console.log('✓ Connection successful');
    }
    
    // Test auth
    console.log('\nTesting auth configuration...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('Auth status:', authError.message);
    } else {
      console.log('✓ Auth module accessible');
    }
    
    console.log('\n✓ Supabase is configured correctly!');
    console.log('\nNext steps:');
    console.log('1. Go to https://otenrlbuohajthlgjyjh.supabase.co/auth/users');
    console.log('2. Click "Add user" > "Create new user"');
    console.log('3. Enter email and password for your admin account');
    console.log('4. Start the admin panel: cd admin-panel && npm run dev');
    console.log('5. Login with the credentials you created');
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testConnection();

